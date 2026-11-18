import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  createSeedDatabase,
  hashPassword,
  verifyPassword,
  type DatabaseState,
} from './server/seedData';
import type {
  BlogPost,
  ClientAccount,
  Course,
  Enrollment,
  FaqItem,
  GalleryItem,
  ServiceItem,
  Testimonial,
  UserPublic,
  UserRecord,
} from './src/types';
import {
  getCertificateVerificationCode,
  validateContactForm,
  validateEnrollmentForm,
} from './src/utils/velanzaLogic';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'velanza-db.json');
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const SESSION_SECRET = process.env.SESSION_SECRET || 'velanza-studio-session-secret-2026-key';
const SESSION_COOKIE = 'velanza_session';

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function loadDb(): DatabaseState {
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw) as DatabaseState;
      if (parsed && parsed.settings && Array.isArray(parsed.courses)) {
        return parsed;
      }
    } catch {
      // Fall back to fresh seed if corrupted
    }
  }
  const seed = createSeedDatabase();
  fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf8');
  return seed;
}

let db: DatabaseState = loadDb();

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function toPublicUser(user: UserRecord): UserPublic {
  const { passwordHash: _h, passwordSalt: _s, ...pub } = user;
  return pub;
}

interface SessionPayload {
  userId: string;
  role: UserRecord['role'];
  exp: number;
}

function signToken(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.userId || !parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      result[key] = val;
    }
  }
  return result;
}

interface AuthedRequest extends Request {
  currentUser?: UserRecord;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const payload = verifyToken(cookies[SESSION_COOKIE] || bearer);
  if (payload) {
    const found = db.users.find((u) => u.id === payload.userId && u.status !== 'suspended');
    if (found) req.currentUser = found;
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  next();
}

function requireRole(roles: UserRecord['role'][]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.currentUser.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this workspace.' });
      return;
    }
    next();
  };
}

// Simple rate limiter for spam protection on public forms
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxPerMinute = 20): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= maxPerMinute) return false;
  bucket.count += 1;
  return true;
}

// Generates a minimal valid single-page PDF document for downloadable syllabi and client reports
function buildSimplePdf(title: string, lines: string[]): Buffer {
  const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, ' ').replace(/[()\\]/g, '\\$&');
  const textOps = [
    'BT',
    '/F1 16 Tf',
    '50 750 Td',
    `(${clean(title)}) Tj`,
    '/F1 11 Tf',
    '0 -28 Td',
    ...lines.flatMap((line) => [`(${clean(line)}) Tj`, '0 -18 Td']),
    'ET',
  ].join('\n');

  const objects: string[] = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(textOps, 'utf8')} >> stream\n${textOps}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj + '\n';
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(attachUser);
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Public Site CMS Payload (masks non-demo course lesson video URLs unless user is approved or admin)
  app.get('/api/public/site', (req: AuthedRequest, res) => {
    const user = req.currentUser;
    const approvedCourseIds = new Set(
      user
        ? db.enrollments
            .filter((e) => e.userId === user.id && e.status === 'approved')
            .map((e) => e.courseId)
        : [],
    );

    const courses = db.courses.map((course) => {
      const hasFullAccess = user?.role === 'admin' || approvedCourseIds.has(course.id);
      return {
        ...course,
        modules: course.modules.map((mod) => ({
          ...mod,
          lessons: mod.lessons.map((les) => ({
            ...les,
            videoUrl: les.isDemo || hasFullAccess ? les.videoUrl : '',
          })),
        })),
      };
    });

    res.json({
      settings: {
        ...db.settings,
        stats: {
          ...db.settings.stats,
          coursesCount: db.courses.length,
        },
      },
      courses,
      services: db.services,
      testimonials: db.testimonials,
      blogPosts: db.blogPosts,
      gallery: db.gallery,
      faqs: db.faqs,
    });
  });

  // Downloadable Syllabus / Report PDF
  app.get('/api/syllabus/:id', (req, res) => {
    const id = String(req.params.id || '');
    const course = db.courses.find((c) => c.id === id);
    if (course) {
      const lines = [
        `Velanza.co Working & Learning Studio - Official Course Syllabus`,
        `Course: ${course.title}`,
        `Duration: ${course.duration} | Fee: PKR ${course.feePkr.toLocaleString()} ($${course.feeUsd})`,
        `Lead Instructor: ${course.instructor}`,
        '----------------------------------------------------------------',
        ...course.modules.flatMap((m) => [
          m.title,
          ...m.lessons.map((l) => `  - ${l.title} (${l.durationMinutes} mins)`),
        ]),
        '----------------------------------------------------------------',
        `Easypaisa Verification: ${db.settings.easypaisaNumber} | Contact: ${db.settings.contactEmail}`,
      ];
      const buf = buildSimplePdf(`${course.title} - Syllabus`, lines);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${course.id}-syllabus.pdf"`);
      res.send(buf);
      return;
    }

    const lines = [
      'Velanza.co Working & Learning Studio - Client Operations Report',
      `Document ID: ${id}`,
      `Prepared by: ${db.settings.founderName}`,
      'Summary: Store metrics, listing optimization audit, and Q4 scaling plan.',
      `Support Desk: ${db.settings.contactEmail} | WhatsApp: ${db.settings.whatsappNumber}`,
    ];
    const buf = buildSimplePdf('Velanza.co Client Document', lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.pdf"`);
    res.send(buf);
  });

  // Binary File Upload (Payment Screenshots, Gallery Videos, PDFs, Photos)
  app.post(
    '/api/upload',
    express.raw({ type: '*/*', limit: '50mb' }),
    (req: AuthedRequest, res) => {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: 'No file payload received.' });
        return;
      }
      const rawName = String(req.headers['x-filename'] || 'upload.bin');
      const safeBase = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}-${safeBase}`;
      const targetPath = path.join(UPLOAD_DIR, fileName);
      fs.writeFileSync(targetPath, req.body);
      res.json({
        url: `/uploads/${fileName}`,
        fileName: safeBase,
        sizeBytes: req.body.length,
      });
    },
  );

  // Auth: Current Session
  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      res.json({ user: null });
      return;
    }
    res.json({ user: toPublicUser(req.currentUser) });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (user.status === 'suspended') {
      res.status(403).json({ error: 'This account has been suspended. Contact support.' });
      return;
    }
    const token = signToken({
      userId: user.id,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
    );
    res.json({ user: toPublicUser(user) });
  });

  // Auth: Student or Client Registration
  app.post('/api/auth/register', (req, res) => {
    if (!checkRateLimit(`reg:${req.ip}`, 15)) {
      res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
      return;
    }
    if (req.body?.website_hp) {
      res.status(400).json({ error: 'Spam check triggered.' });
      return;
    }
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const password = String(req.body?.password || '');
    const role = req.body?.role === 'client' ? 'client' : 'student';

    if (name.length < 2 || !email.includes('@') || password.length < 6) {
      res.status(400).json({ error: 'Provide full name, valid email, and password (6+ chars).' });
      return;
    }
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const newUser: UserRecord = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name,
      email,
      phone,
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
      attendancePercent: role === 'student' ? 100 : undefined,
    };
    db.users.push(newUser);

    if (role === 'client') {
      const clientAccount: ClientAccount = {
        id: `cli-${crypto.randomUUID().slice(0, 8)}`,
        userId: newUser.id,
        businessName: String(req.body?.businessName || `${name} Store`),
        marketplace: String(req.body?.marketplace || 'eBay / Multi-Channel'),
        accountStatus: 'Onboarding',
        monthlyFeeUsd: 450,
        revenueTotalUsd: 0,
        pendingWork: [
          {
            id: `pw-${Date.now()}`,
            title: 'Initial Account Audit & Onboarding Kickoff',
            status: 'pending',
            dueDate: new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10),
            assignee: 'Mr. Samiullah Basra',
          },
        ],
        completedWork: [],
        orders: [],
        salesHistory: [{ month: 'Nov', revenueUsd: 0, ordersCount: 0 }],
        timeline: [
          {
            id: `tl-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            title: 'Client Portal Provisioned',
            detail: 'Your dedicated Velanza.co account workspace is active.',
          },
        ],
        files: [],
        notifications: [
          {
            id: `not-${Date.now()}`,
            message: 'Welcome to Velanza.co Client Portal. Our onboarding manager will update your roadmap shortly.',
            date: new Date().toISOString().slice(0, 10),
            read: false,
          },
        ],
        internalNotes: 'Newly registered client portal.',
      };
      db.clients.push(clientAccount);
    }

    saveDb();
    const token = signToken({
      userId: newUser.id,
      role: newUser.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
    );
    res.status(201).json({ user: toPublicUser(newUser) });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    res.json({ ok: true });
  });

  // Public Enrollment Submission with Easypaisa Screenshot + Account Creation/Linking
  app.post('/api/enrollments', (req: AuthedRequest, res) => {
    if (!checkRateLimit(`enr:${req.ip}`, 15)) {
      res.status(429).json({ error: 'Too many enrollment submissions. Please wait a minute.' });
      return;
    }

    const body = req.body || {};
    const validation = validateEnrollmentForm({
      studentName: String(body.studentName || ''),
      studentEmail: String(body.studentEmail || ''),
      studentPhone: String(body.studentPhone || ''),
      courseId: String(body.courseId || ''),
      transactionRef: String(body.transactionRef || ''),
      honeypot: String(body.website_hp || ''),
    });
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const course = db.courses.find((c) => c.id === body.courseId);
    if (!course) {
      res.status(404).json({ error: 'Selected course not found.' });
      return;
    }

    const email = String(body.studentEmail).trim().toLowerCase();
    let user = req.currentUser || db.users.find((u) => u.email.toLowerCase() === email);
    let createdNewAccount = false;

    if (!user) {
      const password = String(body.password || 'Velanza@2026');
      const { hash, salt } = hashPassword(password);
      user = {
        id: `usr-${crypto.randomUUID().slice(0, 8)}`,
        name: String(body.studentName).trim(),
        email,
        phone: String(body.studentPhone).trim(),
        role: 'student',
        status: 'active',
        createdAt: new Date().toISOString(),
        passwordHash: hash,
        passwordSalt: salt,
        attendancePercent: 100,
      };
      db.users.push(user);
      createdNewAccount = true;
    }

    const enrollment: Enrollment = {
      id: `enr-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      studentName: String(body.studentName).trim(),
      studentEmail: email,
      studentPhone: String(body.studentPhone).trim(),
      courseId: course.id,
      courseTitle: course.title,
      amountPkr: course.feePkr,
      paymentMethod: body.paymentMethod === 'Bank Transfer' ? 'Bank Transfer' : 'Easypaisa',
      transactionRef: String(body.transactionRef).trim(),
      screenshotUrl: String(body.screenshotUrl || ''),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    db.enrollments.unshift(enrollment);
    saveDb();

    if (createdNewAccount && !req.currentUser) {
      const token = signToken({
        userId: user.id,
        role: user.role,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      res.setHeader(
        'Set-Cookie',
        `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`,
      );
    }

    res.status(201).json({
      enrollment,
      user: toPublicUser(user),
    });
  });

  // Public Contact Form
  app.post('/api/contact', (req, res) => {
    if (!checkRateLimit(`contact:${req.ip}`, 12)) {
      res.status(429).json({ error: 'Rate limit exceeded. Try again shortly.' });
      return;
    }
    const body = req.body || {};
    const check = validateContactForm({
      name: String(body.name || ''),
      email: String(body.email || ''),
      message: String(body.message || ''),
      honeypot: String(body.website_hp || ''),
    });
    if (!check.valid) {
      res.status(400).json({ error: check.error });
      return;
    }
    const inquiry = {
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      name: String(body.name).trim(),
      email: String(body.email).trim(),
      phone: String(body.phone || '').trim(),
      interest: String(body.interest || 'General Inquiry').trim(),
      message: String(body.message).trim(),
      createdAt: new Date().toISOString(),
    };
    db.contactInquiries.unshift(inquiry);
    saveDb();
    res.status(201).json({ inquiry });
  });

  // Student Learning Portal Endpoints
  app.get('/api/student/portal', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const myEnrollments = db.enrollments.filter(
      (e) => e.userId === user.id || e.studentEmail.toLowerCase() === user.email.toLowerCase(),
    );
    const approvedIds = new Set(
      myEnrollments.filter((e) => e.status === 'approved').map((e) => e.courseId),
    );
    const unlockedCourses = db.courses.filter(
      (c) => user.role === 'admin' || approvedIds.has(c.id),
    );
    const progress = db.studentProgress[user.id] || {
      userId: user.id,
      completedLessonIds: [],
      notesByLesson: {},
    };
    res.json({
      user: toPublicUser(user),
      enrollments: myEnrollments,
      unlockedCourses,
      progress,
    });
  });

  app.post('/api/student/progress', requireAuth, (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const existing = db.studentProgress[user.id] || {
      userId: user.id,
      completedLessonIds: [],
      notesByLesson: {},
    };

    const { lessonId, courseId, completed, note, positionSeconds } = req.body || {};
    if (typeof lessonId === 'string' && lessonId) {
      existing.lastWatchedLessonId = lessonId;
      if (typeof courseId === 'string' && courseId) {
        existing.lastWatchedCourseId = courseId;
      }
      if (typeof positionSeconds === 'number') {
        existing.lastPositionSeconds = positionSeconds;
      }
      if (typeof completed === 'boolean') {
        const set = new Set(existing.completedLessonIds);
        if (completed) set.add(lessonId);
        else set.delete(lessonId);
        existing.completedLessonIds = Array.from(set);
      }
      if (typeof note === 'string') {
        existing.notesByLesson[lessonId] = note;
      }
    }
    db.studentProgress[user.id] = existing;
    saveDb();
    res.json({ progress: existing });
  });

  // Client Isolated Portal Endpoints
  app.get('/api/client/dashboard', requireRole(['client', 'admin']), (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const requestedClientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined;
    const client =
      user.role === 'admin' && requestedClientId
        ? db.clients.find((c) => c.id === requestedClientId)
        : db.clients.find((c) => c.userId === user.id);

    if (!client) {
      res.status(404).json({ error: 'Client workspace not found for this account.' });
      return;
    }

    const support = db.supportRequests.filter((s) => s.clientId === client.id);
    // Strip internal admin-only notes when returning to client
    const { internalNotes: _notes, ...clientView } = client;
    res.json({
      client: clientView,
      supportRequests: support,
    });
  });

  app.post('/api/client/support', requireRole(['client', 'admin']), (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const client = db.clients.find((c) => c.userId === user.id) || db.clients[0];
    if (!client) {
      res.status(404).json({ error: 'Client profile not found.' });
      return;
    }
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    if (subject.length < 3 || message.length < 5) {
      res.status(400).json({ error: 'Please provide both a subject and message.' });
      return;
    }
    const requestItem = {
      id: `sup-${crypto.randomUUID().slice(0, 8)}`,
      clientId: client.id,
      clientName: client.businessName,
      subject,
      message,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    };
    db.supportRequests.unshift(requestItem);
    saveDb();
    res.status(201).json({ supportRequest: requestItem });
  });

  app.post('/api/client/notifications/read', requireRole(['client', 'admin']), (req: AuthedRequest, res) => {
    const user = req.currentUser!;
    const client = db.clients.find((c) => c.userId === user.id);
    if (client) {
      client.notifications = client.notifications.map((n) => ({ ...n, read: true }));
      saveDb();
    }
    res.json({ ok: true });
  });

  // Admin CMS & Management Endpoints
  app.get('/api/admin/overview', requireRole(['admin']), (_req, res) => {
    res.json({
      settings: db.settings,
      users: db.users.map(toPublicUser),
      courses: db.courses,
      services: db.services,
      enrollments: db.enrollments,
      clients: db.clients,
      supportRequests: db.supportRequests,
      testimonials: db.testimonials,
      blogPosts: db.blogPosts,
      gallery: db.gallery,
      faqs: db.faqs,
      contactInquiries: db.contactInquiries,
      studentProgress: db.studentProgress,
    });
  });

  app.put('/api/admin/settings', requireRole(['admin']), (req, res) => {
    const patch = req.body || {};
    db.settings = {
      ...db.settings,
      ...patch,
      stats: {
        ...db.settings.stats,
        ...(patch.stats || {}),
      },
      futureModules: {
        ...db.settings.futureModules,
        ...(patch.futureModules || {}),
      },
    };
    saveDb();
    res.json({ settings: db.settings });
  });

  // Admin Course CRUD + Video/PDF upload linking
  app.post('/api/admin/courses', requireRole(['admin']), (req, res) => {
    const body = req.body || {};
    if (!body.title || !body.description) {
      res.status(400).json({ error: 'Course title and description are required.' });
      return;
    }
    const courseId = `course-${crypto.randomUUID().slice(0, 6)}`;
    const course: Course = {
      id: courseId,
      title: String(body.title).trim(),
      category: String(body.category || 'Marketplaces').trim(),
      thumbnail: String(body.thumbnail || '/src/assets/images/course_marketplace_thumb_1795020956002.jpg'),
      description: String(body.description).trim(),
      duration: String(body.duration || '6 Weeks').trim(),
      feePkr: Number(body.feePkr || 15000),
      feeUsd: Number(body.feeUsd || 55),
      instructor: String(body.instructor || db.settings.founderName),
      demoVideoUrl: String(body.demoVideoUrl || 'demo://custom-course'),
      syllabusPdfUrl: String(body.syllabusPdfUrl || `/api/syllabus/${courseId}`),
      featured: Boolean(body.featured),
      modules: Array.isArray(body.modules) && body.modules.length > 0
        ? body.modules
        : [
            {
              id: `mod-${Date.now()}`,
              title: 'Module 1: Core Foundations',
              lessons: [
                {
                  id: `les-${Date.now()}`,
                  title: `${String(body.title).trim()} Orientation (Demo)`,
                  durationMinutes: 15,
                  videoUrl: String(body.demoVideoUrl || 'demo://custom-course'),
                  isDemo: true,
                  summary: 'Course orientation and live workspace setup.',
                },
              ],
            },
          ],
    };
    db.courses.push(course);
    saveDb();
    res.status(201).json({ course });
  });

  app.put('/api/admin/courses/:id', requireRole(['admin']), (req, res) => {
    const idx = db.courses.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    db.courses[idx] = { ...db.courses[idx], ...(req.body || {}), id: db.courses[idx].id };
    saveDb();
    res.json({ course: db.courses[idx] });
  });

  app.delete('/api/admin/courses/:id', requireRole(['admin']), (req, res) => {
    db.courses = db.courses.filter((c) => c.id !== req.params.id);
    saveDb();
    res.json({ ok: true });
  });

  // Admin: Add Video Lesson to Course (directly from gallery upload or URL)
  app.post('/api/admin/courses/:id/lessons', requireRole(['admin']), (req, res) => {
    const course = db.courses.find((c) => c.id === req.params.id);
    if (!course) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    const { moduleTitle, lessonTitle, durationMinutes, videoUrl, isDemo, summary, resourceName, resourceUrl } =
      req.body || {};
    if (!lessonTitle || !videoUrl) {
      res.status(400).json({ error: 'Lesson title and video file/URL are required.' });
      return;
    }
    let targetModule = course.modules.find(
      (m) => m.title.toLowerCase() === String(moduleTitle || '').trim().toLowerCase(),
    );
    if (!targetModule) {
      targetModule = {
        id: `mod-${crypto.randomUUID().slice(0, 6)}`,
        title: String(moduleTitle || `Module ${course.modules.length + 1}`),
        lessons: [],
      };
      course.modules.push(targetModule);
    }
    const lesson = {
      id: `les-${crypto.randomUUID().slice(0, 6)}`,
      title: String(lessonTitle).trim(),
      durationMinutes: Number(durationMinutes || 15),
      videoUrl: String(videoUrl),
      isDemo: Boolean(isDemo),
      summary: String(summary || 'Uploaded studio video lesson.'),
      resourceName: resourceName ? String(resourceName) : undefined,
      resourceUrl: resourceUrl ? String(resourceUrl) : undefined,
    };
    targetModule.lessons.push(lesson);
    saveDb();
    res.status(201).json({ course, lesson });
  });

  // Admin: Enrollment Verification (Approve / Reject Easypaisa Payments)
  app.post('/api/admin/enrollments/:id/verify', requireRole(['admin']), (req, res) => {
    const enrollment = db.enrollments.find((e) => e.id === req.params.id);
    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment record not found.' });
      return;
    }
    const status = req.body?.status === 'rejected' ? 'rejected' : 'approved';
    enrollment.status = status;
    enrollment.verifiedAt = new Date().toISOString();
    enrollment.notes = String(req.body?.notes || (status === 'approved' ? 'Payment verified' : 'Verification failed'));

    if (status === 'approved') {
      const student = db.users.find((u) => u.id === enrollment.userId);
      if (student && student.status === 'pending') {
        student.status = 'active';
      }
    }
    saveDb();
    res.json({ enrollment });
  });

  // Admin: Student Management (Add / Edit / Attendance / Certificates)
  app.post('/api/admin/students', requireRole(['admin']), (req, res) => {
    const { name, email, phone, password, attendancePercent, courseId } = req.body || {};
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'Email already exists.' });
      return;
    }
    const { hash, salt } = hashPassword(String(password || 'Student@123'));
    const user: UserRecord = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone || '').trim(),
      role: 'student',
      status: 'active',
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
      attendancePercent: Number(attendancePercent ?? 100),
      certificateIssued: false,
    };
    db.users.push(user);

    if (courseId) {
      const course = db.courses.find((c) => c.id === courseId);
      if (course) {
        db.enrollments.unshift({
          id: `enr-${crypto.randomUUID().slice(0, 8)}`,
          userId: user.id,
          studentName: user.name,
          studentEmail: user.email,
          studentPhone: user.phone,
          courseId: course.id,
          courseTitle: course.title,
          amountPkr: course.feePkr,
          paymentMethod: 'Easypaisa',
          transactionRef: 'ADMIN-GRANTED',
          screenshotUrl: '',
          status: 'approved',
          submittedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
        });
      }
    }
    saveDb();
    res.status(201).json({ student: toPublicUser(user) });
  });

  app.put('/api/admin/students/:id', requireRole(['admin']), (req, res) => {
    const user = db.users.find((u) => u.id === req.params.id && u.role === 'student');
    if (!user) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }
    const { name, phone, status, attendancePercent, certificateIssued } = req.body || {};
    if (typeof name === 'string') user.name = name.trim();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (status === 'active' || status === 'pending' || status === 'suspended') user.status = status;
    if (typeof attendancePercent === 'number') user.attendancePercent = attendancePercent;
    if (typeof certificateIssued === 'boolean') {
      user.certificateIssued = certificateIssued;
      if (certificateIssued && !user.certificateCode) {
        user.certificateCode = getCertificateVerificationCode(user.id, 'velanza');
      }
    }
    saveDb();
    res.json({ student: toPublicUser(user) });
  });

  // Admin: Client Management (Add Client, Add Work, Add Order, Add Sales, Update Status)
  app.post('/api/admin/clients', requireRole(['admin']), (req, res) => {
    const { name, email, phone, password, businessName, marketplace, monthlyFeeUsd } = req.body || {};
    if (!name || !email || !businessName) {
      res.status(400).json({ error: 'Contact name, email, and business name are required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'Account email already exists.' });
      return;
    }
    const { hash, salt } = hashPassword(String(password || 'Client@123'));
    const user: UserRecord = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name: String(name).trim(),
      email: cleanEmail,
      phone: String(phone || '').trim(),
      role: 'client',
      status: 'active',
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };
    db.users.push(user);

    const client: ClientAccount = {
      id: `cli-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      businessName: String(businessName).trim(),
      marketplace: String(marketplace || 'eBay US').trim(),
      accountStatus: 'Healthy & Active',
      monthlyFeeUsd: Number(monthlyFeeUsd || 550),
      revenueTotalUsd: 0,
      pendingWork: [],
      completedWork: [],
      orders: [],
      salesHistory: [{ month: 'Nov', revenueUsd: 0, ordersCount: 0 }],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          title: 'Account Management Activated',
          detail: 'Assigned to Velanza.co operations desk.',
        },
      ],
      files: [],
      notifications: [
        {
          id: `not-${Date.now()}`,
          message: 'Your store workspace has been provisioned by Velanza.co Admin.',
          date: new Date().toISOString().slice(0, 10),
          read: false,
        },
      ],
      internalNotes: '',
    };
    db.clients.push(client);
    saveDb();
    res.status(201).json({ client });
  });

  app.post('/api/admin/clients/:id/action', requireRole(['admin']), (req, res) => {
    const client = db.clients.find((c) => c.id === req.params.id);
    if (!client) {
      res.status(404).json({ error: 'Client not found.' });
      return;
    }
    const { action, payload } = req.body || {};
    if (action === 'add_work') {
      client.pendingWork.unshift({
        id: `pw-${Date.now()}`,
        title: String(payload.title || 'New Store Task'),
        status: 'pending',
        dueDate: String(payload.dueDate || new Date().toISOString().slice(0, 10)),
        assignee: String(payload.assignee || 'Velanza Operations'),
      });
    } else if (action === 'complete_work') {
      const idx = client.pendingWork.findIndex((w) => w.id === payload.workId);
      if (idx !== -1) {
        const [item] = client.pendingWork.splice(idx, 1);
        item.status = 'completed';
        client.completedWork.unshift(item);
        client.timeline.unshift({
          id: `tl-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          title: `Completed: ${item.title}`,
          detail: `Delivered by ${item.assignee}`,
        });
      }
    } else if (action === 'add_order') {
      const amount = Number(payload.amountUsd || 0);
      client.orders.unshift({
        id: `ord-${Date.now()}`,
        orderNumber: String(payload.orderNumber || `VLZ-${Math.floor(10000 + Math.random() * 89999)}`),
        marketplace: String(payload.marketplace || client.marketplace),
        productName: String(payload.productName || 'Catalog Item'),
        amountUsd: amount,
        status: payload.status || 'processing',
        date: new Date().toISOString().slice(0, 10),
      });
      client.revenueTotalUsd = Math.round((client.revenueTotalUsd + amount) * 100) / 100;
      const lastPoint = client.salesHistory[client.salesHistory.length - 1];
      if (lastPoint) {
        lastPoint.revenueUsd += amount;
        lastPoint.ordersCount += 1;
      }
    } else if (action === 'add_file') {
      client.files.unshift({
        id: `doc-${Date.now()}`,
        name: String(payload.name || 'Report.pdf'),
        category: String(payload.category || 'Report'),
        url: String(payload.url || '/api/syllabus/client-report'),
        uploadedAt: new Date().toISOString().slice(0, 10),
      });
      client.notifications.unshift({
        id: `not-${Date.now()}`,
        message: `New document available: ${String(payload.name || 'Report.pdf')}`,
        date: new Date().toISOString().slice(0, 10),
        read: false,
      });
    } else if (action === 'update_notes') {
      client.internalNotes = String(payload.internalNotes || '');
      if (payload.accountStatus) client.accountStatus = payload.accountStatus;
    }
    saveDb();
    res.json({ client });
  });

  app.post('/api/admin/support/:id/resolve', requireRole(['admin']), (req, res) => {
    const item = db.supportRequests.find((s) => s.id === req.params.id);
    if (item) {
      item.status = 'resolved';
      saveDb();
    }
    res.json({ supportRequest: item });
  });

  // Admin: Services, Testimonials, Blog, Gallery, FAQs CRUD
  app.post('/api/admin/services', requireRole(['admin']), (req, res) => {
    const { title, category, description, benefits, deliveryModel } = req.body || {};
    if (!title || !description) {
      res.status(400).json({ error: 'Service title and description required.' });
      return;
    }
    const item: ServiceItem = {
      id: `srv-${crypto.randomUUID().slice(0, 6)}`,
      title: String(title),
      category: String(category || 'Agency Services'),
      description: String(description),
      benefits: Array.isArray(benefits) ? benefits : String(benefits || '').split(',').map((s) => s.trim()).filter(Boolean),
      deliveryModel: String(deliveryModel || 'Dedicated Account Manager'),
    };
    db.services.push(item);
    saveDb();
    res.status(201).json({ service: item });
  });

  app.delete('/api/admin/services/:id', requireRole(['admin']), (req, res) => {
    db.services = db.services.filter((s) => s.id !== req.params.id);
    saveDb();
    res.json({ ok: true });
  });

  app.post('/api/admin/testimonials', requireRole(['admin']), (req, res) => {
    const body = req.body || {};
    const item: Testimonial = {
      id: `test-${crypto.randomUUID().slice(0, 6)}`,
      name: String(body.name || 'Student'),
      role: String(body.role || 'Graduate'),
      organization: String(body.organization || 'Velanza.co Alumni'),
      type: body.type === 'client' ? 'client' : 'student',
      rating: Number(body.rating || 5),
      outcome: String(body.outcome || 'Verified Store Growth'),
      quote: String(body.quote || ''),
    };
    db.testimonials.unshift(item);
    saveDb();
    res.status(201).json({ testimonial: item });
  });

  app.delete('/api/admin/testimonials/:id', requireRole(['admin']), (req, res) => {
    db.testimonials = db.testimonials.filter((t) => t.id !== req.params.id);
    saveDb();
    res.json({ ok: true });
  });

  app.post('/api/admin/blog', requireRole(['admin']), (req, res) => {
    const body = req.body || {};
    if (!body.title || !body.content) {
      res.status(400).json({ error: 'Blog title and content required.' });
      return;
    }
    const post: BlogPost = {
      id: `blog-${crypto.randomUUID().slice(0, 6)}`,
      title: String(body.title).trim(),
      category: String(body.category || 'eCommerce'),
      author: String(body.author || db.settings.founderName),
      publishedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
      readTime: String(body.readTime || '5 min read'),
      thumbnail: String(body.thumbnail || '/src/assets/images/course_marketplace_thumb_1795020956002.jpg'),
      excerpt: String(body.excerpt || String(body.content).slice(0, 140)),
      content: String(body.content),
    };
    db.blogPosts.unshift(post);
    saveDb();
    res.status(201).json({ post });
  });

  app.delete('/api/admin/blog/:id', requireRole(['admin']), (req, res) => {
    db.blogPosts = db.blogPosts.filter((b) => b.id !== req.params.id);
    saveDb();
    res.json({ ok: true });
  });

  app.post('/api/admin/gallery', requireRole(['admin']), (req, res) => {
    const body = req.body || {};
    if (!body.title || !body.imageUrl) {
      res.status(400).json({ error: 'Gallery title and image required.' });
      return;
    }
    const item: GalleryItem = {
      id: `gal-${crypto.randomUUID().slice(0, 6)}`,
      title: String(body.title).trim(),
      category: body.category || 'Classroom Photos',
      imageUrl: String(body.imageUrl),
      caption: String(body.caption || ''),
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
    db.gallery.unshift(item);
    saveDb();
    res.status(201).json({ item });
  });

  app.delete('/api/admin/gallery/:id', requireRole(['admin']), (req, res) => {
    db.gallery = db.gallery.filter((g) => g.id !== req.params.id);
    saveDb();
    res.json({ ok: true });
  });

  app.post('/api/admin/faqs', requireRole(['admin']), (req, res) => {
    const body = req.body || {};
    const item: FaqItem = {
      id: `faq-${crypto.randomUUID().slice(0, 6)}`,
      question: String(body.question || ''),
      answer: String(body.answer || ''),
      category: String(body.category || 'General'),
    };
    db.faqs.push(item);
    saveDb();
    res.status(201).json({ faq: item });
  });

  app.delete('/api/admin/faqs/:id', requireRole(['admin']), (req, res) => {
    db.faqs = db.faqs.filter((f) => f.id !== req.params.id);
    saveDb();
    res.json({ ok: true });
  });

  // Admin: Backup & Restore System
  app.get('/api/admin/backup', requireRole(['admin']), (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="velanza-backup-${Date.now()}.json"`);
    res.send(JSON.stringify(db, null, 2));
  });

  app.post('/api/admin/restore', requireRole(['admin']), (req, res) => {
    const candidate = req.body as DatabaseState;
    if (!candidate || !candidate.settings || !Array.isArray(candidate.courses) || !Array.isArray(candidate.users)) {
      res.status(400).json({ error: 'Invalid Velanza backup payload.' });
      return;
    }
    db = candidate;
    saveDb();
    res.json({ ok: true });
  });

  // Vite or Static Production Middleware
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Velanza.co Working & Learning Studio running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Velanza server:', err);
  process.exit(1);
});

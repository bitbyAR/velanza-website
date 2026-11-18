export type UserRole = 'admin' | 'student' | 'client';
export type LanguageCode = 'en' | 'ur' | 'ar' | 'es';

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  attendancePercent?: number;
  certificateIssued?: boolean;
  certificateCode?: string;
}

export interface UserRecord extends UserPublic {
  passwordHash: string;
  passwordSalt: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl: string;
  isDemo: boolean;
  summary: string;
  resourceName?: string;
  resourceUrl?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  description: string;
  duration: string;
  feePkr: number;
  feeUsd: number;
  instructor: string;
  demoVideoUrl: string;
  syllabusPdfUrl: string;
  modules: CourseModule[];
  featured: boolean;
}

export interface Enrollment {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseId: string;
  courseTitle: string;
  amountPkr: number;
  paymentMethod: 'Easypaisa' | 'Bank Transfer' | 'Card';
  transactionRef: string;
  screenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  verifiedAt?: string;
  notes?: string;
}

export interface StudentProgressRecord {
  userId: string;
  completedLessonIds: string[];
  lastWatchedLessonId?: string;
  lastWatchedCourseId?: string;
  lastPositionSeconds?: number;
  notesByLesson: Record<string, string>;
}

export interface ServiceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  benefits: string[];
  deliveryModel: string;
}

export interface ClientWorkItem {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  assignee: string;
}

export interface ClientOrder {
  id: string;
  orderNumber: string;
  marketplace: string;
  productName: string;
  amountUsd: number;
  status: 'processing' | 'shipped' | 'delivered';
  date: string;
}

export interface ClientSalePoint {
  month: string;
  revenueUsd: number;
  ordersCount: number;
}

export interface ClientTimelineEvent {
  id: string;
  date: string;
  title: string;
  detail: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  category: string;
  url: string;
  uploadedAt: string;
}

export interface SupportRequest {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface ClientAccount {
  id: string;
  userId: string;
  businessName: string;
  marketplace: string;
  accountStatus: 'Healthy & Active' | 'Onboarding' | 'Scaling Phase' | 'Under Review';
  monthlyFeeUsd: number;
  revenueTotalUsd: number;
  pendingWork: ClientWorkItem[];
  completedWork: ClientWorkItem[];
  orders: ClientOrder[];
  salesHistory: ClientSalePoint[];
  timeline: ClientTimelineEvent[];
  files: ClientDocument[];
  notifications: { id: string; message: string; date: string; read: boolean }[];
  internalNotes: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  organization: string;
  type: 'student' | 'client';
  rating: number;
  outcome: string;
  quote: string;
}

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
  thumbnail: string;
  excerpt: string;
  content: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Office Photos' | 'Classroom Photos' | 'Student Activities' | 'Certificates' | 'Events';
  imageUrl: string;
  caption: string;
  date: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  createdAt: string;
}

export interface SiteStats {
  studentsTrained: number;
  activeClients: number;
  coursesCount: number;
  projectsCompleted: number;
  successRatePercent: number;
}

export interface SiteSettings {
  brandName: string;
  founderName: string;
  founderTitle: string;
  founderBio: string;
  founderImage: string;
  heroHeadline: string;
  heroSubheading: string;
  announcementBanner: string;
  aboutHeadline: string;
  aboutDescription: string;
  aboutMission: string;
  aboutVision: string;
  studioImage: string;
  easypaisaNumber: string;
  easypaisaTitle: string;
  whatsappNumber: string;
  contactEmail: string;
  linkedinUrl: string;
  officeAddress: string;
  seoTitle: string;
  seoDescription: string;
  primaryAccentHex: string;
  stats: SiteStats;
  futureModules: {
    onlineExams: boolean;
    qrCertificates: boolean;
    liveClasses: boolean;
    aiAssistantReady: boolean;
    multiInstructor: boolean;
    extraGateways: boolean;
    mobileAppSync: boolean;
  };
}

export interface PublicSitePayload {
  settings: SiteSettings;
  courses: Course[];
  services: ServiceItem[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
  gallery: GalleryItem[];
  faqs: FaqItem[];
}

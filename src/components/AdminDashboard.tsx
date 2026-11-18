import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Database,
  DollarSign,
  Download,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  LogOut,
  Plus,
  Trash2,
  Upload,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import type {
  BlogPost,
  ClientAccount,
  ContactInquiry,
  Course,
  Enrollment,
  FaqItem,
  GalleryItem,
  ServiceItem,
  SiteSettings,
  SupportRequest,
  Testimonial,
  UserPublic,
} from '../types';
import { computeFinancialSummary } from '../utils/velanzaLogic';
import { ResilientImage } from './ResilientImage';

interface AdminDashboardProps {
  onBackHome: () => void;
  onSiteUpdated: () => void;
  onLogout: () => void;
}

type AdminTab =
  | 'overview'
  | 'website'
  | 'courses'
  | 'students'
  | 'clients'
  | 'finance'
  | 'content'
  | 'backup';

export function AdminDashboard({ onBackHome, onSiteUpdated, onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);

  // Course creation & video upload states
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('Marketplaces');
  const [newCourseDuration, setNewCourseDuration] = useState('6 Weeks · 18 Lessons');
  const [newCourseFeePkr, setNewCourseFeePkr] = useState('15000');
  const [newCourseFeeUsd, setNewCourseFeeUsd] = useState('55');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  const [videoCourseId, setVideoCourseId] = useState('');
  const [videoModuleTitle, setVideoModuleTitle] = useState('Module 1: Studio Walkthrough');
  const [videoLessonTitle, setVideoLessonTitle] = useState('');
  const [videoDuration, setVideoDuration] = useState('15');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoIsDemo, setVideoIsDemo] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Student form states
  const [stuName, setStuName] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuPhone, setStuPhone] = useState('');
  const [stuCourseId, setStuCourseId] = useState('');

  // Client form states
  const [cliName, setCliName] = useState('');
  const [cliEmail, setCliEmail] = useState('');
  const [cliBiz, setCliBiz] = useState('');
  const [cliMarket, setCliMarket] = useState('eBay UK');
  const [cliFee, setCliFee] = useState('650');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [orderProduct, setOrderProduct] = useState('');
  const [orderAmount, setOrderAmount] = useState('85');

  // Content CMS form states
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCat, setBlogCat] = useState('eBay');
  const [blogContent, setBlogContent] = useState('');
  const [galTitle, setGalTitle] = useState('');
  const [galCat, setGalCat] = useState<GalleryItem['category']>('Classroom Photos');
  const [galImgUrl, setGalImgUrl] = useState('');
  const [testName, setTestName] = useState('');
  const [testOutcome, setTestOutcome] = useState('');
  const [testQuote, setTestQuote] = useState('');
  const [srvTitle, setSrvTitle] = useState('');
  const [srvDesc, setSrvDesc] = useState('');
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');

  const flash = (msg: string) => {
    setNotice(msg);
    setError('');
    onSiteUpdated();
    window.setTimeout(() => setNotice(''), 4000);
  };

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (!res.ok) {
        setError('Admin authentication required.');
        return;
      }
      const data = await res.json();
      setSettings(data.settings);
      setUsers(data.users || []);
      setCourses(data.courses || []);
      setServices(data.services || []);
      setEnrollments(data.enrollments || []);
      setClients(data.clients || []);
      setSupportRequests(data.supportRequests || []);
      setTestimonials(data.testimonials || []);
      setBlogPosts(data.blogPosts || []);
      setGallery(data.gallery || []);
      setFaqs(data.faqs || []);
      setInquiries(data.contactInquiries || []);
      if (data.courses?.[0]?.id && !videoCourseId) setVideoCourseId(data.courses[0].id);
      if (data.clients?.[0]?.id && !selectedClientId) setSelectedClientId(data.clients[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const uploadBinary = async (file: File): Promise<string> => {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-Filename': file.name,
      },
      body: file,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      flash('Website, Easypaisa payment, SEO, and studio settings saved.');
    }
  };

  const handleAddCourse = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newCourseTitle,
        category: newCourseCategory,
        duration: newCourseDuration,
        feePkr: Number(newCourseFeePkr),
        feeUsd: Number(newCourseFeeUsd),
        description: newCourseDesc,
      }),
    });
    if (res.ok) {
      setNewCourseTitle('');
      setNewCourseDesc('');
      await loadOverview();
      flash('Course added to catalog.');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
    await loadOverview();
    flash('Course removed.');
  };

  const handleVideoFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const url = await uploadBinary(file);
      setVideoUrl(url);
      if (!videoLessonTitle) setVideoLessonTitle(file.name.replace(/\.[^.]+$/, ''));
    } catch {
      setError('Failed to upload video file.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleAttachLesson = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoCourseId || !videoLessonTitle || !videoUrl) {
      setError('Select course, lesson title, and upload a video or provide a URL.');
      return;
    }
    const res = await fetch(`/api/admin/courses/${videoCourseId}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleTitle: videoModuleTitle,
        lessonTitle: videoLessonTitle,
        durationMinutes: Number(videoDuration),
        videoUrl,
        isDemo: videoIsDemo,
      }),
    });
    if (res.ok) {
      setVideoLessonTitle('');
      setVideoUrl('');
      await loadOverview();
      flash('Video lesson uploaded and published to course module.');
    }
  };

  const handleVerifyEnrollment = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch(`/api/admin/enrollments/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadOverview();
      flash(`Enrollment ${status === 'approved' ? 'approved & course unlocked' : 'rejected'}.`);
    }
  };

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: stuName,
        email: stuEmail,
        phone: stuPhone,
        courseId: stuCourseId || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not add student.');
      return;
    }
    setStuName('');
    setStuEmail('');
    setStuPhone('');
    await loadOverview();
    flash('Student account created.');
  };

  const handleUpdateStudent = async (id: string, patch: Partial<UserPublic>) => {
    await fetch(`/api/admin/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    await loadOverview();
    flash('Student record updated.');
  };

  const handleAddClient = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cliName,
        email: cliEmail,
        businessName: cliBiz,
        marketplace: cliMarket,
        monthlyFeeUsd: Number(cliFee),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not create client.');
      return;
    }
    setCliName('');
    setCliEmail('');
    setCliBiz('');
    await loadOverview();
    flash('Client portal created.');
  };

  const handleClientAction = async (clientId: string, action: string, payload: Record<string, unknown>) => {
    await fetch(`/api/admin/clients/${clientId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    await loadOverview();
    flash('Client workspace updated.');
  };

  const handleRestoreFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        setError('Invalid backup JSON file.');
        return;
      }
      await loadOverview();
      flash('System database restored from backup.');
    } catch {
      setError('Could not parse backup file.');
    }
  };

  if (loading || !settings) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const students = users.filter((u) => u.role === 'student');
  const fin = computeFinancialSummary(enrollments);
  const totalPendingTasks = clients.reduce((acc, c) => acc + c.pendingWork.length, 0);
  const totalCompletedTasks = clients.reduce((acc, c) => acc + c.completedWork.length, 0);
  const totalClientRevenueUsd = clients.reduce((acc, c) => acc + c.revenueTotalUsd, 0);
  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const navItems: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'website', label: 'Website & Payment', icon: Globe },
    { id: 'courses', label: 'Courses & Videos', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'clients', label: 'Clients & Sales', icon: Briefcase },
    { id: 'finance', label: 'Easypaisa & Finance', icon: DollarSign },
    { id: 'content', label: 'CMS Content', icon: Layers },
    { id: 'backup', label: 'System Backup', icon: Database },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <p className="text-xs font-semibold text-emerald-800">Admin CMS Console</p>
            <h1 className="font-display text-lg font-bold text-slate-900">Velanza.co Studio</h1>
          </div>

          <nav className="space-y-1" aria-label="Admin sections">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-emerald-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <button
              type="button"
              onClick={onBackHome}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              View Live Website
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="lg:col-span-9 space-y-6">
          {notice && (
            <div role="status" className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
              {notice}
            </div>
          )}
          {error && (
            <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
              {error}
            </div>
          )}

          {/* 1. OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">Total Students</p>
                  <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {students.length}
                  </p>
                  <p className="text-xs text-emerald-800 mt-1">Portal active accounts</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">Active Clients</p>
                  <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {clients.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Managed agency stores</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">Pending Tasks</p>
                  <p className="font-mono text-2xl font-bold text-red-600 mt-1 tabular-nums">
                    {totalPendingTasks}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {fin.pendingCount} {fin.pendingCount === 1 ? 'payment' : 'payments'} awaiting review
                  </p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">Completed Tasks</p>
                  <p className="font-mono text-2xl font-bold text-emerald-900 mt-1 tabular-nums">
                    {totalCompletedTasks}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Client deliverables shipped</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">Verified Tuition (PKR)</p>
                  <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {fin.verifiedRevenuePkr.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{fin.approvedCount} verified enrollments</p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">Managed Store Sales (USD)</p>
                  <p className="font-mono text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    ${totalClientRevenueUsd.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Across active portfolios</p>
                </div>
              </div>

              {/* Revenue Analytics & Operations Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Monthly Agency Revenue Analytics (USD)
                  </h2>
                  <div className="grid grid-cols-5 gap-3 items-end h-36 pt-4 border-b border-slate-200 pb-2">
                    {(clients[0]?.salesHistory || []).map((pt) => {
                      const maxVal = Math.max(1, ...(clients[0]?.salesHistory || []).map((s) => s.revenueUsd));
                      const hPct = Math.max(14, Math.round((pt.revenueUsd / maxVal) * 100));
                      return (
                        <div key={pt.month} className="flex flex-col items-center justify-end h-full gap-1.5">
                          <span className="font-mono text-[10px] font-semibold text-slate-700 tabular-nums">
                            ${(pt.revenueUsd / 1000).toFixed(1)}k
                          </span>
                          <div className="w-full max-w-[36px] bg-slate-100 rounded-t h-full flex items-end overflow-hidden">
                            <div className="w-full bg-emerald-800 rounded-t" style={{ height: `${hPct}%` }} />
                          </div>
                          <span className="text-[11px] font-medium text-slate-600">{pt.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Open Support Tickets &amp; Leads
                  </h2>
                  <div className="space-y-2.5 text-xs">
                    {supportRequests.slice(0, 3).map((sr) => (
                      <div key={sr.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{sr.subject}</p>
                          <p className="text-slate-500 truncate">{sr.clientName}</p>
                        </div>
                        <span className={sr.status === 'open' ? 'text-amber-700 font-semibold shrink-0' : 'text-emerald-800 font-semibold shrink-0'}>
                          {sr.status}
                        </span>
                      </div>
                    ))}
                    {inquiries.slice(0, 2).map((inq) => (
                      <div key={inq.id} className="p-3 rounded-lg border border-slate-200">
                        <p className="font-semibold text-slate-900">{inq.name} · {inq.interest}</p>
                        <p className="text-slate-500 truncate">{inq.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Easypaisa Verification Queue ({fin.pendingCount} Pending)
                </h2>
                {enrollments.filter((e) => e.status === 'pending').length === 0 ? (
                  <p className="text-sm text-slate-500">All Easypaisa enrollments are verified.</p>
                ) : (
                  <div className="space-y-3">
                    {enrollments
                      .filter((e) => e.status === 'pending')
                      .map((enr) => (
                        <div
                          key={enr.id}
                          className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {enr.studentName} · {enr.courseTitle}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Ref: <span className="font-mono font-semibold">{enr.transactionRef}</span> · PKR{' '}
                              <span className="font-mono tabular-nums">{enr.amountPkr.toLocaleString()}</span> ·{' '}
                              {enr.studentEmail}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleVerifyEnrollment(enr.id, 'approved')}
                              className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                            >
                              Approve Access
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerifyEnrollment(enr.id, 'rejected')}
                              className="px-3.5 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. WEBSITE, PAYMENT & SEO SETTINGS */}
          {tab === 'website' && (
            <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl border border-slate-200 bg-white space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Website, Easypaisa Payment &amp; SEO Settings
                </h2>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                >
                  Save All Changes
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="set-hero-h" className="block text-xs font-semibold text-slate-700 mb-1">
                    Homepage Hero Headline
                  </label>
                  <input
                    id="set-hero-h"
                    type="text"
                    value={settings.heroHeadline}
                    onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="set-banner" className="block text-xs font-semibold text-slate-700 mb-1">
                    Top Announcement Banner
                  </label>
                  <input
                    id="set-banner"
                    type="text"
                    value={settings.announcementBanner}
                    onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="set-hero-sub" className="block text-xs font-semibold text-slate-700 mb-1">
                    Hero Subheading
                  </label>
                  <textarea
                    id="set-hero-sub"
                    rows={2}
                    value={settings.heroSubheading}
                    onChange={(e) => setSettings({ ...settings, heroSubheading: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="set-easypaisa" className="block text-xs font-semibold text-slate-700 mb-1">
                    Easypaisa Payment Number (Editable)
                  </label>
                  <input
                    id="set-easypaisa"
                    type="text"
                    value={settings.easypaisaNumber}
                    onChange={(e) => setSettings({ ...settings, easypaisaNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="set-ep-title" className="block text-xs font-semibold text-slate-700 mb-1">
                    Easypaisa Account Title
                  </label>
                  <input
                    id="set-ep-title"
                    type="text"
                    value={settings.easypaisaTitle}
                    onChange={(e) => setSettings({ ...settings, easypaisaTitle: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="set-wa" className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    id="set-wa"
                    type="text"
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="set-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    id="set-email"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="set-about" className="block text-xs font-semibold text-slate-700 mb-1">
                    About Us Description
                  </label>
                  <textarea
                    id="set-about"
                    rows={2}
                    value={settings.aboutDescription}
                    onChange={(e) => setSettings({ ...settings, aboutDescription: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="set-mission" className="block text-xs font-semibold text-slate-700 mb-1">
                    Mission Statement
                  </label>
                  <input
                    id="set-mission"
                    type="text"
                    value={settings.aboutMission}
                    onChange={(e) => setSettings({ ...settings, aboutMission: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="set-vision" className="block text-xs font-semibold text-slate-700 mb-1">
                    Vision Statement
                  </label>
                  <input
                    id="set-vision"
                    type="text"
                    value={settings.aboutVision}
                    onChange={(e) => setSettings({ ...settings, aboutVision: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="set-seo-t" className="block text-xs font-semibold text-slate-700 mb-1">
                    SEO Meta Title
                  </label>
                  <input
                    id="set-seo-t"
                    type="text"
                    value={settings.seoTitle}
                    onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="set-seo-d" className="block text-xs font-semibold text-slate-700 mb-1">
                    SEO Meta Description
                  </label>
                  <input
                    id="set-seo-d"
                    type="text"
                    value={settings.seoDescription}
                    onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-display text-sm font-bold text-slate-900 mb-3">
                  Future-Ready Architecture Modules
                </h3>
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  {(
                    [
                      ['onlineExams', 'Online Exams Engine'],
                      ['qrCertificates', 'QR Code Certificates'],
                      ['liveClasses', 'Live Cohort Classes'],
                      ['aiAssistantReady', 'AI Tutor Endpoint Ready'],
                      ['multiInstructor', 'Multi-Instructor Routing'],
                      ['extraGateways', 'Stripe / Payoneer Ready'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.futureModules[key]}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            futureModules: {
                              ...settings.futureModules,
                              [key]: e.target.checked,
                            },
                          })
                        }
                      />
                      <span className="font-medium text-slate-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* 3. COURSES & VIDEO GALLERY UPLOAD */}
          {tab === 'courses' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Create Course */}
                <form onSubmit={handleAddCourse} className="p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-red-600" />
                    <span>Add New Course</span>
                  </h2>
                  <input
                    type="text"
                    required
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="Course title (e.g. Etsy International Store)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newCourseCategory}
                      onChange={(e) => setNewCourseCategory(e.target.value)}
                      placeholder="Category"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={newCourseDuration}
                      onChange={(e) => setNewCourseDuration(e.target.value)}
                      placeholder="Duration"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <input
                      type="number"
                      value={newCourseFeePkr}
                      onChange={(e) => setNewCourseFeePkr(e.target.value)}
                      placeholder="Fee PKR"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                    <input
                      type="number"
                      value={newCourseFeeUsd}
                      onChange={(e) => setNewCourseFeeUsd(e.target.value)}
                      placeholder="Fee USD"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                    placeholder="Course description and practical outcomes..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Publish Course
                  </button>
                </form>

                {/* Upload Video from Gallery to Course Module */}
                <form onSubmit={handleAttachLesson} className="p-6 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-800" />
                    <span>Upload Video From Gallery to Course</span>
                  </h2>
                  <select
                    value={videoCourseId}
                    onChange={(e) => setVideoCourseId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={videoModuleTitle}
                      onChange={(e) => setVideoModuleTitle(e.target.value)}
                      placeholder="Module name"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <input
                      type="number"
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(e.target.value)}
                      placeholder="Minutes"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={videoLessonTitle}
                    onChange={(e) => setVideoLessonTitle(e.target.value)}
                    placeholder="Lesson title"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <label className="flex items-center gap-2 p-2.5 border border-dashed border-slate-300 rounded-lg cursor-pointer text-xs hover:bg-slate-50">
                    <Upload className="w-4 h-4 text-emerald-800" />
                    <span>{uploadingVideo ? 'Uploading video...' : 'Select video file from device gallery (MP4/WebM)'}</span>
                    <input type="file" accept="video/*" onChange={handleVideoFileSelect} className="sr-only" />
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Uploaded video path or studio URL"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={videoIsDemo}
                      onChange={(e) => setVideoIsDemo(e.target.checked)}
                    />
                    <span>Make this lesson a public Demo preview</span>
                  </label>
                  <button
                    type="submit"
                    disabled={uploadingVideo}
                    className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                  >
                    Attach Video Lesson
                  </button>
                </form>
              </div>

              {/* Existing Courses Table */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    All Courses ({courses.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-6 font-semibold">Course</th>
                        <th className="py-3 px-4 font-semibold">Category</th>
                        <th className="py-3 px-4 font-semibold">Duration</th>
                        <th className="py-3 px-4 font-semibold text-right">Fee (PKR)</th>
                        <th className="py-3 px-4 font-semibold text-right">Lessons</th>
                        <th className="py-3 px-6 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courses.map((c) => {
                        const lessonsCount = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                        return (
                          <tr key={c.id}>
                            <td className="py-3 px-6 font-medium text-slate-900">{c.title}</td>
                            <td className="py-3 px-4 text-slate-600">{c.category}</td>
                            <td className="py-3 px-4 text-xs text-slate-600">{c.duration}</td>
                            <td className="py-3 px-4 font-mono text-right tabular-nums">
                              {c.feePkr.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-mono text-right tabular-nums">{lessonsCount}</td>
                            <td className="py-3 px-6 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteCourse(c.id)}
                                aria-label={`Delete ${c.title}`}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. STUDENTS MANAGEMENT */}
          {tab === 'students' && (
            <div className="space-y-6">
              <form onSubmit={handleAddStudent} className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Add Student &amp; Grant Enrollment
                </h2>
                <div className="grid sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    value={stuName}
                    onChange={(e) => setStuName(e.target.value)}
                    placeholder="Full name"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <input
                    type="email"
                    required
                    value={stuEmail}
                    onChange={(e) => setStuEmail(e.target.value)}
                    placeholder="Email address"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <input
                    type="tel"
                    value={stuPhone}
                    onChange={(e) => setStuPhone(e.target.value)}
                    placeholder="Phone / WhatsApp"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <select
                    value={stuCourseId}
                    onChange={(e) => setStuCourseId(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">No initial course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        Unlock: {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                >
                  Create Student Account
                </button>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Registered Students ({students.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-6 font-semibold">Student</th>
                        <th className="py-3 px-4 font-semibold">Email</th>
                        <th className="py-3 px-4 font-semibold text-right">Attendance</th>
                        <th className="py-3 px-4 font-semibold">Certificate</th>
                        <th className="py-3 px-6 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((stu) => (
                        <tr key={stu.id}>
                          <td className="py-3 px-6 font-medium text-slate-900">{stu.name}</td>
                          <td className="py-3 px-4 text-xs text-slate-600">{stu.email}</td>
                          <td className="py-3 px-4 font-mono text-right tabular-nums">
                            {stu.attendancePercent ?? 100}%
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {stu.certificateIssued ? (
                              <span className="font-mono text-emerald-800 font-semibold">
                                {stu.certificateCode}
                              </span>
                            ) : (
                              <span className="text-slate-500">Not issued</span>
                            )}
                          </td>
                          <td className="py-3 px-6 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStudent(stu.id, {
                                  attendancePercent: Math.min(100, (stu.attendancePercent ?? 90) + 5),
                                })
                              }
                              className="px-2.5 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50"
                            >
                              +5% Att.
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStudent(stu.id, {
                                  certificateIssued: !stu.certificateIssued,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-900 text-white rounded hover:bg-emerald-800"
                            >
                              <Award className="w-3 h-3" />
                              <span>{stu.certificateIssued ? 'Revoke' : 'Issue Cert'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. CLIENT MANAGEMENT */}
          {tab === 'clients' && (
            <div className="space-y-6">
              <form onSubmit={handleAddClient} className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Onboard New Agency Client
                </h2>
                <div className="grid sm:grid-cols-5 gap-3">
                  <input
                    type="text"
                    required
                    value={cliName}
                    onChange={(e) => setCliName(e.target.value)}
                    placeholder="Client contact name"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <input
                    type="email"
                    required
                    value={cliEmail}
                    onChange={(e) => setCliEmail(e.target.value)}
                    placeholder="Login email"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    value={cliBiz}
                    onChange={(e) => setCliBiz(e.target.value)}
                    placeholder="Store / Business name"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={cliMarket}
                    onChange={(e) => setCliMarket(e.target.value)}
                    placeholder="Marketplace"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <input
                    type="number"
                    value={cliFee}
                    onChange={(e) => setCliFee(e.target.value)}
                    placeholder="Retainer USD"
                    className="px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                >
                  Provision Client Portal
                </button>
              </form>

              {selectedClient && (
                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <label htmlFor="cli-sel" className="text-xs font-semibold text-slate-500 block">
                        Managing Client Workspace
                      </label>
                      <select
                        id="cli-sel"
                        value={selectedClient.id}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="mt-1 px-3 py-2 text-sm font-bold border border-slate-300 rounded-lg bg-white"
                      >
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.businessName} ({c.marketplace})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Tracked Store Revenue</p>
                      <p className="font-mono text-xl font-bold text-emerald-900 tabular-nums">
                        ${selectedClient.revenueTotalUsd.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Assign Work */}
                    <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                      <h3 className="text-xs font-bold text-slate-900">Assign Pending Work</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={workTitle}
                          onChange={(e) => setWorkTitle(e.target.value)}
                          placeholder="e.g. Upload 50 Winter SKUs"
                          className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!workTitle.trim()) return;
                            handleClientAction(selectedClient.id, 'add_work', { title: workTitle });
                            setWorkTitle('');
                          }}
                          className="px-3 py-2 bg-emerald-900 text-white text-xs font-semibold rounded-lg"
                        >
                          Assign
                        </button>
                      </div>
                      <div className="space-y-2">
                        {selectedClient.pendingWork.map((w) => (
                          <div key={w.id} className="flex items-center justify-between gap-2 text-xs p-2 bg-slate-50 rounded-lg">
                            <span className="truncate">{w.title}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleClientAction(selectedClient.id, 'complete_work', { workId: w.id })
                              }
                              className="px-2 py-1 bg-white border border-emerald-300 text-emerald-800 font-semibold rounded shrink-0"
                            >
                              Complete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Log Order / Sales */}
                    <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                      <h3 className="text-xs font-bold text-slate-900">Log Client Sales Order</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={orderProduct}
                          onChange={(e) => setOrderProduct(e.target.value)}
                          placeholder="Product name"
                          className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                        />
                        <input
                          type="number"
                          value={orderAmount}
                          onChange={(e) => setOrderAmount(e.target.value)}
                          placeholder="USD"
                          className="w-20 px-2 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!orderProduct.trim()) return;
                            handleClientAction(selectedClient.id, 'add_order', {
                              productName: orderProduct,
                              amountUsd: Number(orderAmount),
                              status: 'delivered',
                            });
                            setOrderProduct('');
                          }}
                          className="px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg"
                        >
                          Log Sale
                        </button>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {selectedClient.orders.slice(0, 4).map((o) => (
                          <div key={o.id} className="flex justify-between p-2 bg-slate-50 rounded-lg">
                            <span className="truncate">{o.orderNumber} · {o.productName}</span>
                            <span className="font-mono font-semibold tabular-nums">${o.amountUsd.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Support Tickets */}
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <h3 className="text-xs font-bold text-slate-900">Client Support Requests</h3>
                    {supportRequests.map((sr) => (
                      <div key={sr.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-200 text-xs">
                        <div>
                          <p className="font-semibold text-slate-900">{sr.clientName} — {sr.subject}</p>
                          <p className="text-slate-600">{sr.message}</p>
                        </div>
                        {sr.status === 'open' ? (
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/admin/support/${sr.id}/resolve`, { method: 'POST' });
                              await loadOverview();
                              flash('Support request resolved.');
                            }}
                            className="px-3 py-1.5 bg-emerald-900 text-white font-semibold rounded-lg shrink-0"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="text-emerald-800 font-semibold">Resolved</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. FINANCIAL & EASYPAISA VERIFICATION */}
          {tab === 'finance' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">Verified Easypaisa Revenue</p>
                  <p className="font-mono text-2xl font-bold text-emerald-900 mt-1 tabular-nums">
                    PKR {fin.verifiedRevenuePkr.toLocaleString()}
                  </p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">Pending Verification</p>
                  <p className="font-mono text-2xl font-bold text-amber-700 mt-1 tabular-nums">
                    PKR {fin.pendingRevenuePkr.toLocaleString()}
                  </p>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <p className="text-xs text-slate-500">Active Receiving Account</p>
                  <p className="font-mono text-lg font-bold text-slate-900 mt-1">
                    {settings.easypaisaNumber}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    All Student Payment &amp; Screenshot Records
                  </h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {enrollments.map((enr) => (
                    <div key={enr.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                          <ResilientImage
                            src={enr.screenshotUrl}
                            alt={`Payment screenshot from ${enr.studentName}`}
                            className="w-full h-full object-cover"
                            fallbackTitle="Receipt"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {enr.studentName} · {enr.courseTitle}
                          </p>
                          <p className="text-xs text-slate-600">
                            {enr.paymentMethod} · Ref <span className="font-mono">{enr.transactionRef}</span> ·{' '}
                            <span className="font-mono font-semibold tabular-nums">
                              PKR {enr.amountPkr.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {enr.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleVerifyEnrollment(enr.id, 'approved')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerifyEnrollment(enr.id, 'rejected')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <span
                            className={`text-xs font-semibold ${
                              enr.status === 'approved' ? 'text-emerald-800' : 'text-red-700'
                            }`}
                          >
                            {enr.status === 'approved' ? 'Verified' : 'Rejected'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. CMS CONTENT (SERVICES, TESTIMONIALS, BLOG, GALLERY, FAQ, INQUIRIES) */}
          {tab === 'content' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Publish Blog */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch('/api/admin/blog', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: blogTitle, category: blogCat, content: blogContent }),
                    });
                    setBlogTitle('');
                    setBlogContent('');
                    await loadOverview();
                    flash('Blog article published.');
                  }}
                  className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3"
                >
                  <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-800" />
                    <span>Publish Blog Article ({blogPosts.length})</span>
                  </h3>
                  <input
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="Article headline"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <select
                    value={blogCat}
                    onChange={(e) => setBlogCat(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {['eCommerce', 'eBay', 'Amazon', 'Walmart', 'Shopify', 'Business Tips', 'Freelancing'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <textarea
                    rows={3}
                    required
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="Article body..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <button type="submit" className="px-4 py-2 bg-emerald-900 text-white text-xs font-semibold rounded-lg">
                    Publish Article
                  </button>
                </form>

                {/* Add Gallery Photo */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch('/api/admin/gallery', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: galTitle,
                        category: galCat,
                        imageUrl: galImgUrl || '/src/assets/images/gallery_classroom_training_1795020957219.jpg',
                        caption: galTitle,
                      }),
                    });
                    setGalTitle('');
                    setGalImgUrl('');
                    await loadOverview();
                    flash('Gallery item added.');
                  }}
                  className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3"
                >
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Add Gallery Photo ({gallery.length})
                  </h3>
                  <input
                    type="text"
                    required
                    value={galTitle}
                    onChange={(e) => setGalTitle(e.target.value)}
                    placeholder="Photo title"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <select
                    value={galCat}
                    onChange={(e) => setGalCat(e.target.value as GalleryItem['category'])}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {['Office Photos', 'Classroom Photos', 'Student Activities', 'Certificates', 'Events'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 p-2.5 border border-dashed border-slate-300 rounded-lg cursor-pointer text-xs">
                    <Upload className="w-4 h-4 text-emerald-800" />
                    <span>{galImgUrl ? 'Photo uploaded' : 'Upload photo from device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) setGalImgUrl(await uploadBinary(file));
                      }}
                      className="sr-only"
                    />
                  </label>
                  <button type="submit" className="px-4 py-2 bg-emerald-900 text-white text-xs font-semibold rounded-lg">
                    Add to Gallery
                  </button>
                </form>

                {/* Add Testimonial */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch('/api/admin/testimonials', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: testName,
                        outcome: testOutcome,
                        quote: testQuote,
                        rating: 5,
                        type: 'student',
                      }),
                    });
                    setTestName('');
                    setTestOutcome('');
                    setTestQuote('');
                    await loadOverview();
                    flash('Testimonial added.');
                  }}
                  className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3"
                >
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Add Testimonial ({testimonials.length})
                  </h3>
                  <input
                    type="text"
                    required
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="Student or Client Name"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    value={testOutcome}
                    onChange={(e) => setTestOutcome(e.target.value)}
                    placeholder="Concrete outcome (e.g. Scaled store to $15k/mo)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    required
                    value={testQuote}
                    onChange={(e) => setTestQuote(e.target.value)}
                    placeholder="Review quote..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <button type="submit" className="px-4 py-2 bg-emerald-900 text-white text-xs font-semibold rounded-lg">
                    Save Testimonial
                  </button>
                </form>

                {/* Add Service & FAQ */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-5">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await fetch('/api/admin/services', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: srvTitle,
                          description: srvDesc,
                          benefits: ['Dedicated Specialist', 'Weekly KPI Reporting'],
                        }),
                      });
                      setSrvTitle('');
                      setSrvDesc('');
                      await loadOverview();
                      flash('Service added.');
                    }}
                    className="space-y-2"
                  >
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Add Service ({services.length})
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={srvTitle}
                        onChange={(e) => setSrvTitle(e.target.value)}
                        placeholder="Service title"
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                      <button type="submit" className="px-3 py-2 bg-emerald-900 text-white text-xs font-semibold rounded-lg">
                        Add
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={srvDesc}
                      onChange={(e) => setSrvDesc(e.target.value)}
                      placeholder="Short service description"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </form>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await fetch('/api/admin/faqs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ question: faqQ, answer: faqA }),
                      });
                      setFaqQ('');
                      setFaqA('');
                      await loadOverview();
                      flash('FAQ added.');
                    }}
                    className="space-y-2 pt-3 border-t border-slate-200"
                  >
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Add FAQ ({faqs.length})
                    </h3>
                    <input
                      type="text"
                      required
                      value={faqQ}
                      onChange={(e) => setFaqQ(e.target.value)}
                      placeholder="Question"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={faqA}
                        onChange={(e) => setFaqA(e.target.value)}
                        placeholder="Answer"
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                      <button type="submit" className="px-3 py-2 bg-emerald-900 text-white text-xs font-semibold rounded-lg">
                        Add FAQ
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Contact Inquiries */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Inbound Contact Leads ({inquiries.length})
                </h3>
                {inquiries.length === 0 ? (
                  <p className="text-xs text-slate-500">No contact inquiries submitted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {inquiries.map((inq) => (
                      <div key={inq.id} className="p-3 rounded-lg border border-slate-200 text-xs">
                        <p className="font-semibold text-slate-900">
                          {inq.name} · {inq.email} · {inq.interest}
                        </p>
                        <p className="text-slate-600 mt-1">{inq.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. SYSTEM BACKUP & RESTORE */}
          {tab === 'backup' && (
            <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Database Backup &amp; Recovery System
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Download a complete JSON snapshot of courses, students, clients, Easypaisa records, and CMS content, or restore from a saved backup.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="/api/admin/backup"
                  download
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full JSON Backup</span>
                </a>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Restore From Backup JSON</span>
                  <input type="file" accept="application/json" onChange={handleRestoreFile} className="sr-only" />
                </label>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

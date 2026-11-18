import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Search,
  Star,
  X,
} from 'lucide-react';
import type { BlogPost, Course, LanguageCode, PublicSitePayload } from '../types';
import type { TranslationDictionary } from '../utils/i18n';
import { filterCatalogItems, validateContactForm } from '../utils/velanzaLogic';
import { ResilientImage } from './ResilientImage';
import { VideoPlayerSurface } from './VideoPlayerSurface';

interface PublicHomeProps {
  site: PublicSitePayload;
  lang: LanguageCode;
  t: TranslationDictionary;
  onChangeLang: (lang: LanguageCode) => void;
  onOpenEnroll: (courseId?: string) => void;
}

function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target);
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

export function PublicHome({
  site,
  lang,
  t,
  onChangeLang,
  onOpenEnroll,
}: PublicHomeProps) {
  const { settings, courses, services, testimonials, blogPosts, gallery, faqs } = site;

  const [searchQuery, setSearchQuery] = useState('');
  const [courseCategory, setCourseCategory] = useState('All');
  const [galleryCategory, setGalleryCategory] = useState('All');
  const [blogCategory, setBlogCategory] = useState('All');
  const [openFaqId, setOpenFaqId] = useState<string>(faqs[0]?.id || '');

  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [readingPost, setReadingPost] = useState<BlogPost | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactInterest, setContactInterest] = useState('eBay Account Management');
  const [contactMessage, setContactMessage] = useState('');
  const [contactHp, setContactHp] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactSending, setContactSending] = useState(false);

  const studentsCount = useCountUp(settings.stats.studentsTrained);
  const clientsCount = useCountUp(settings.stats.activeClients);
  const coursesCount = useCountUp(courses.length);
  const projectsCount = useCountUp(settings.stats.projectsCompleted);
  const successRate = useCountUp(settings.stats.successRatePercent);

  const courseCategories = ['All', ...Array.from(new Set(courses.map((c) => c.category)))];
  const filteredCourses = filterCatalogItems(courses, searchQuery, courseCategory, (c) => [
    c.title,
    c.description,
    c.category,
  ]);
  const filteredServices = filterCatalogItems(services, searchQuery, 'all', (s) => [
    s.title,
    s.description,
    s.category,
  ]);
  const filteredBlogs = filterCatalogItems(blogPosts, searchQuery, blogCategory, (b) => [
    b.title,
    b.excerpt,
    b.category,
  ]);
  const filteredGallery =
    galleryCategory === 'All'
      ? gallery
      : gallery.filter((g) => g.category === galleryCategory);
  const filteredFaqs = filterCatalogItems(faqs, searchQuery, 'all', (f) => [
    f.question,
    f.answer,
  ]);

  const handleHireService = (serviceTitle: string) => {
    setContactInterest(serviceTitle);
    const el = document.getElementById('contact');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setContactError('');
    setContactSuccess('');
    const check = validateContactForm({
      name: contactName,
      email: contactEmail,
      message: contactMessage,
      honeypot: contactHp,
    });
    if (!check.valid) {
      setContactError(check.error || 'Please check your contact form inputs.');
      return;
    }
    setContactSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          interest: contactInterest,
          message: contactMessage,
          website_hp: contactHp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setContactError(data.error || 'Failed to send inquiry.');
      } else {
        setContactSuccess('Inquiry received. Our studio team will reply via email or WhatsApp shortly.');
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setContactMessage('');
      }
    } catch {
      setContactError('Network error sending message.');
    } finally {
      setContactSending(false);
    }
  };

  const whatsappDigits = settings.whatsappNumber.replace(/[^0-9]/g, '').replace(/^0/, '92');

  return (
    <div id="top" dir={t.dir}>
      {/* Workspace Utility Strip: Global Search + Language Selector */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label="Search courses, services, articles, or FAQ"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden xl:inline text-xs text-slate-600">
              {settings.announcementBanner}
            </span>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5" role="group" aria-label="Language selector">
              <Globe className="w-3.5 h-3.5 text-emerald-800 ml-1.5 mr-0.5" aria-hidden="true" />
              {(['en', 'ur', 'ar', 'es'] as LanguageCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onChangeLang(code)}
                  className={`px-2 py-1 text-[11px] font-semibold uppercase rounded-md transition-colors ${
                    lang === code
                      ? 'bg-emerald-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 pb-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold text-emerald-800">
                {settings.brandName} · International Operations
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-slate-900 leading-[1.08] text-balance">
                {settings.heroHeadline}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                {settings.heroSubheading}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenEnroll()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {t.enrollNow}
              </button>
              <a
                href="#courses"
                className="px-5 py-3 border border-emerald-900 text-emerald-950 hover:bg-emerald-50 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {t.exploreCourses}
              </a>
              <a
                href="#services"
                className="px-5 py-3 border border-slate-300 text-slate-800 hover:bg-slate-50 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {t.hireTeam}
              </a>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
              <span>Founded by <strong className="text-slate-900">{settings.founderName}</strong></span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span>Easypaisa &amp; Global Enrollment</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span>eBay, Amazon, Walmart, Shopify &amp; TikTok Shop</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
              <ResilientImage
                src={settings.founderImage}
                alt={`${settings.founderName}, Founder and CEO of Velanza.co`}
                className="w-full h-full max-h-[480px] object-cover object-top"
                fallbackTitle={settings.founderName}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 text-white">
                <p className="font-display text-lg font-bold">{settings.founderName}</p>
                <p className="text-xs text-emerald-200 mt-0.5">{settings.founderTitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Animated KPI Statistics Strip */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 border-y border-slate-200 py-6">
          <div>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-900 tabular-nums">
              {studentsCount.toLocaleString()}+
            </p>
            <p className="text-xs font-medium text-slate-600 mt-1">{t.studentsTrained}</p>
          </div>
          <div>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-900 tabular-nums">
              {clientsCount}+
            </p>
            <p className="text-xs font-medium text-slate-600 mt-1">{t.activeClients}</p>
          </div>
          <div>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-900 tabular-nums">
              {coursesCount}
            </p>
            <p className="text-xs font-medium text-slate-600 mt-1">{t.coursesLabel}</p>
          </div>
          <div>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-900 tabular-nums">
              {projectsCount}+
            </p>
            <p className="text-xs font-medium text-slate-600 mt-1">{t.projectsCompleted}</p>
          </div>
          <div>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-red-600 tabular-nums">
              {successRate}%
            </p>
            <p className="text-xs font-medium text-slate-600 mt-1">{t.successRate}</p>
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about" className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-white">
            <ResilientImage
              src={settings.studioImage}
              alt="Velanza.co Working and Learning Studio office interior"
              className="w-full h-full object-cover"
              fallbackTitle="Velanza.co Studio"
            />
          </div>
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold text-emerald-800">{t.aboutLabel}</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {settings.aboutHeadline}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {settings.aboutDescription}
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
                <h3 className="font-display text-sm font-bold text-emerald-950">{t.missionLabel}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{settings.aboutMission}</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
                <h3 className="font-display text-sm font-bold text-emerald-950">{t.visionLabel}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{settings.aboutVision}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COURSES SECTION */}
      <section id="courses" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-emerald-800">Curriculum &amp; Video Training</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {t.coursesHeading}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg" role="group" aria-label="Filter courses by category">
            {courseCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCourseCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  courseCategory === cat
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">No courses match "{searchQuery}".</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <article
                key={course.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition-colors"
              >
                <div>
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    <ResilientImage
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      fallbackTitle={course.title}
                    />
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-xs font-medium text-slate-500">
                      {course.category} <span aria-hidden="true">·</span> {course.duration}
                    </p>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {course.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    {(() => {
                      const count = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
                      return (
                        <span className="text-slate-500">
                          {count} {count === 1 ? 'Video Lesson' : 'Video Lessons'}
                        </span>
                      );
                    })()}
                    <span className="font-mono font-bold text-emerald-950 tabular-nums">
                      PKR {course.feePkr.toLocaleString()} / ${course.feeUsd}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewCourse(course)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Demo &amp; Modules</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEnroll(course.id)}
                      className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="bg-emerald-950 text-white py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold text-emerald-300">Global Agency Operations</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-balance">
                {t.servicesHeading}
              </h2>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
            >
              <span>Request Store Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((srv, idx) => (
              <div
                key={srv.id}
                className="p-6 rounded-2xl bg-emerald-900/50 border border-emerald-800/80 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <p className="font-mono text-xs text-emerald-300">
                    {String(idx + 1).padStart(2, '0')}. {srv.category}
                  </p>
                  <h3 className="font-display text-lg font-bold text-white">{srv.title}</h3>
                  <p className="text-sm text-emerald-100/90 leading-relaxed">{srv.description}</p>
                  <ul className="space-y-1.5 pt-1">
                    {srv.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-emerald-100">
                        <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-emerald-800/70 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-emerald-200 truncate">{srv.deliveryModel}</span>
                  <button
                    type="button"
                    onClick={() => handleHireService(srv.title)}
                    className="px-3 py-1.5 bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-semibold rounded-lg shrink-0"
                  >
                    Hire Team
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold text-emerald-800">Verified Outcomes</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
            {t.testimonialsHeading}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <blockquote
              key={item.id}
              className="p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-800 capitalize">
                    {item.type} Story
                  </span>
                  <div className="flex items-center gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: item.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="font-display text-sm font-bold text-slate-900">{item.outcome}</p>
                <p className="text-sm text-slate-600 leading-relaxed">“{item.quote}”</p>
              </div>
              <footer className="pt-3 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.role} · {item.organization}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* BLOG SECTION */}
      <section id="blog" className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-emerald-800">Editorial &amp; Strategy</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                {t.blogHeading}
              </h2>
            </div>
            <div className="flex flex-wrap gap-1 p-1 bg-white border border-slate-200 rounded-lg">
              {['All', 'eBay', 'Amazon', 'Shopify', 'Freelancing'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBlogCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md ${
                    blogCategory === cat ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {filteredBlogs.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    <ResilientImage
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      fallbackTitle={post.title}
                    />
                  </div>
                  <div className="p-5 space-y-2.5">
                    <p className="text-xs text-slate-500">
                      {post.category} <span aria-hidden="true">·</span> {post.publishedAt}{' '}
                      <span aria-hidden="true">·</span> {post.readTime}
                    </p>
                    <h3 className="font-display text-lg font-bold text-slate-900">{post.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3">{post.excerpt}</p>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => setReadingPost(post)}
                    className="text-xs font-semibold text-emerald-900 hover:text-red-600 inline-flex items-center gap-1"
                  >
                    <span>Read Full Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-emerald-800">Campus &amp; Operations</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {t.galleryHeading}
            </h2>
          </div>
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
            {['All', 'Office Photos', 'Classroom Photos', 'Student Activities', 'Certificates', 'Events'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGalleryCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md ${
                    galleryCategory === cat
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGallery.map((item) => (
            <figure
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
            >
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <ResilientImage
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  fallbackTitle={item.title}
                />
              </div>
              <figcaption className="p-4 space-y-1">
                <p className="text-xs text-slate-500">
                  {item.category} <span aria-hidden="true">·</span> {item.date}
                </p>
                <p className="font-display text-sm font-bold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600">{item.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold text-emerald-800">Support &amp; Policies</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {t.faqHeading}
            </h2>
          </div>
          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const expanded = openFaqId === faq.id;
              return (
                <div key={faq.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpenFaqId(expanded ? '' : faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50"
                  >
                    <span className="font-display text-sm sm:text-base font-bold text-slate-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                        expanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expanded && (
                    <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold text-emerald-800">Direct Consultation</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            {t.contactHeading}
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Quick Contact Cards & Map Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">WhatsApp &amp; Easypaisa Desk</p>
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm font-bold text-slate-900 hover:text-emerald-800"
                  >
                    {settings.whatsappNumber}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">Official Email</p>
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="text-sm font-bold text-slate-900 hover:text-emerald-800"
                  >
                    {settings.contactEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ExternalLink className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">Founder LinkedIn</p>
                  <a
                    href={settings.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-emerald-900 hover:underline break-all"
                  >
                    {settings.linkedinUrl}
                  </a>
                </div>
              </div>
            </div>

            {/* Interactive Map Placeholder Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-emerald-950 text-white space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <MapPin className="w-4 h-4" />
                <span>Studio Location &amp; Global Operations</span>
              </div>
              <p className="text-sm text-emerald-100 leading-relaxed">{settings.officeAddress}</p>
              <div className="h-32 rounded-xl bg-emerald-900/60 border border-emerald-800 flex flex-col items-center justify-center text-center p-4">
                <MapPin className="w-6 h-6 text-red-400 mb-1" />
                <p className="text-xs font-semibold text-white">Velanza.co Learning &amp; Agency Hub</p>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  Serving UK, US, EU, UAE &amp; Pakistan Worldwide
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form
            onSubmit={handleContactSubmit}
            className="lg:col-span-7 p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white space-y-4"
          >
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={contactHp}
              onChange={(e) => setContactHp(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ct-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name
                </label>
                <input
                  id="ct-name"
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label htmlFor="ct-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  id="ct-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label htmlFor="ct-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp / Phone
                </label>
                <input
                  id="ct-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+92-330-3677175"
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label htmlFor="ct-int" className="block text-xs font-semibold text-slate-700 mb-1">
                  Inquiry Topic
                </label>
                <select
                  id="ct-int"
                  value={contactInterest}
                  onChange={(e) => setContactInterest(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-700"
                >
                  <option value="Course Enrollment">Course Enrollment &amp; Training</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="ct-msg" className="block text-xs font-semibold text-slate-700 mb-1">
                Project or Training Goals
              </label>
              <textarea
                id="ct-msg"
                rows={4}
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Tell us which marketplace course or account management service you need..."
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>

            {contactError && (
              <p role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {contactError}
              </p>
            )}
            {contactSuccess && (
              <p role="status" className="text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                {contactSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={contactSending}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {contactSending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <p className="font-display text-lg font-bold text-white">Velanza.co</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {settings.brandName}. Led by {settings.founderName} for worldwide students and eCommerce brands.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-white">Quick Links</p>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#about" className="hover:text-white">About Studio</a></li>
              <li><a href="#courses" className="hover:text-white">Courses Catalog</a></li>
              <li><a href="#services" className="hover:text-white">Agency Services</a></li>
              <li><a href="#blog" className="hover:text-white">Insights Blog</a></li>
              <li><a href="#contact" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-white">Flagship Courses</p>
            <ul className="space-y-1.5 text-xs">
              {courses.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setPreviewCourse(c)} className="hover:text-white text-left">
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-white">Contact &amp; Social</p>
            <p className="text-xs font-mono">WhatsApp: {settings.whatsappNumber}</p>
            <p className="text-xs">{settings.contactEmail}</p>
            <a
              href={settings.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs text-emerald-300 hover:underline"
            >
              LinkedIn Profile
            </a>
          </div>
        </div>
        <div className="border-t border-slate-800">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Velanza.co Working &amp; Learning Studio. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setLegalModal('privacy')} className="hover:text-white">
                Privacy Policy
              </button>
              <button type="button" onClick={() => setLegalModal('terms')} className="hover:text-white">
                Terms &amp; Conditions
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick Button */}
      <a
        href={`https://wa.me/${whatsappDigits}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-full shadow-lg"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      {/* Course Preview & Demo Video Modal */}
      {previewCourse && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-preview-title"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 sm:p-7 space-y-5 my-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-emerald-800">
                  {previewCourse.category} · {previewCourse.duration}
                </p>
                <h2 id="course-preview-title" className="font-display text-2xl font-bold text-slate-900 mt-0.5">
                  {previewCourse.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCourse(null)}
                aria-label="Close course preview"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <VideoPlayerSurface
              title={previewCourse.modules[0]?.lessons[0]?.title || `${previewCourse.title} Demo`}
              videoUrl={previewCourse.demoVideoUrl}
              durationMinutes={previewCourse.modules[0]?.lessons[0]?.durationMinutes || 15}
              summary={previewCourse.description}
            />

            <div className="space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-900">Learning Modules</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {previewCourse.modules.map((mod) => (
                  <div key={mod.id} className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <p className="text-xs font-bold text-emerald-950">{mod.title}</p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {mod.lessons.map((l) => (
                        <li key={l.id}>
                          • {l.title} ({l.durationMinutes}m)
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                Course Fee:{' '}
                <strong className="font-mono text-slate-900 tabular-nums">
                  PKR {previewCourse.feePkr.toLocaleString()} (${previewCourse.feeUsd})
                </strong>{' '}
                · Instructor: {previewCourse.instructor}
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={previewCourse.syllabusPdfUrl}
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Syllabus PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const id = previewCourse.id;
                    setPreviewCourse(null);
                    onOpenEnroll(id);
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                >
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog Reader Modal */}
      {readingPost && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 space-y-4 my-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">
                  {readingPost.category} · {readingPost.publishedAt} · {readingPost.readTime}
                </p>
                <h2 className="font-display text-2xl font-bold text-slate-900 mt-1">
                  {readingPost.title}
                </h2>
                <p className="text-xs text-emerald-800 font-medium mt-1">By {readingPost.author}</p>
              </div>
              <button
                type="button"
                onClick={() => setReadingPost(null)}
                aria-label="Close article"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {readingPost.content}
            </p>
          </div>
        </div>
      )}

      {/* Legal Modals */}
      {legalModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900">
                {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h2>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                aria-label="Close legal dialog"
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {legalModal === 'privacy'
                ? 'Velanza.co Working & Learning Studio protects student, client, and payment verification records using encrypted passwords, signed HttpOnly sessions, and strict role-based portal isolation. Uploaded payment screenshots are used solely for tuition verification.'
                : 'Course enrollments unlock full video library access upon Easypaisa verification. Client account management services operate under documented monthly retainers with confidential store data isolation inside the Client Portal.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

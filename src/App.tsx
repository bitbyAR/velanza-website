import { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { ClientPortal } from './components/ClientPortal';
import { EnrollmentModal } from './components/EnrollmentModal';
import { Navbar } from './components/Navbar';
import { PublicHome } from './components/PublicHome';
import { StudentPortal } from './components/StudentPortal';
import type { LanguageCode, PublicSitePayload, UserPublic } from './types';
import { apiUrl } from './utils/api';
import { TRANSLATIONS } from './utils/i18n';

export default function App() {
  const [site, setSite] = useState<PublicSitePayload | null>(null);
  const [user, setUser] = useState<UserPublic | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'student' | 'client' | 'admin'>(() => {
    const saved = typeof window !== 'undefined' ? window.sessionStorage.getItem('velanza_view') : null;
    if (saved === 'student' || saved === 'client' || saved === 'admin') return saved;
    return 'home';
  });
  const [lang, setLang] = useState<LanguageCode>('en');

  const [loadError, setLoadError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState<string | undefined>(undefined);

  const updateView = (next: 'home' | 'student' | 'client' | 'admin') => {
    setActiveView(next);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('velanza_view', next);
    }
  };

  const loadSiteAndSession = async () => {
    try {
      setLoadError(null);
      const [siteRes, meRes] = await Promise.all([
        fetch(apiUrl('/api/public/site'), { credentials: 'include' }),
        fetch(apiUrl('/api/auth/me'), { credentials: 'include' }),
      ]);
      if (!siteRes.ok) {
        setLoadError(`Unable to load Velanza.co studio data (HTTP ${siteRes.status}).`);
        return;
      }
      const siteData = (await siteRes.json()) as PublicSitePayload;
      setSite(siteData);
      if (siteData.settings?.seoTitle) {
        document.title = siteData.settings.seoTitle;
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        const loadedUser: UserPublic | null = meData.user || null;
        setUser(loadedUser);
        if (!loadedUser) {
          updateView('home');
        }
      }
    } catch {
      setLoadError('Unable to reach the Velanza.co API server. Please check your connection and retry.');
    }
  };

  useEffect(() => {
    loadSiteAndSession();
  }, []);

  const openRolePortal = (targetUser: UserPublic | null = user) => {
    if (!targetUser) {
      setAuthOpen(true);
      return;
    }
    if (targetUser.role === 'admin') updateView('admin');
    else if (targetUser.role === 'client') updateView('client');
    else updateView('student');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = (sectionId?: string) => {
    updateView('home');
    if (sectionId && sectionId !== 'top') {
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
    setUser(null);
    updateView('home');
    await loadSiteAndSession();
  };

  const handleAuthSuccess = async (loggedInUser: UserPublic) => {
    setUser(loggedInUser);
    await loadSiteAndSession();
    openRolePortal(loggedInUser);
  };

  const handleOpenEnroll = (courseId?: string) => {
    setEnrollCourseId(courseId || site?.courses[0]?.id);
    setEnrollOpen(true);
  };

  if (!site) {
    if (loadError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-4">
            <h1 className="font-display text-xl font-bold text-slate-900">
              Velanza.co Working &amp; Learning Studio
            </h1>
            <p className="text-sm text-slate-600">{loadError}</p>
            <button
              type="button"
              onClick={loadSiteAndSession}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-slate-100 rounded-lg animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar
        t={t}
        user={user}
        activeView={activeView}
        onNavigateHome={handleNavigateHome}
        onOpenPortal={() => openRolePortal()}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
      />

      {activeView === 'home' && (
        <PublicHome
          site={site}
          lang={lang}
          t={t}
          onChangeLang={setLang}
          onOpenEnroll={handleOpenEnroll}
        />
      )}

      {activeView === 'student' && (
        <StudentPortal
          onBackHome={() => handleNavigateHome('courses')}
          onOpenEnroll={handleOpenEnroll}
          onLogout={handleLogout}
        />
      )}

      {activeView === 'client' && (
        <ClientPortal
          onBackHome={() => handleNavigateHome()}
          onLogout={handleLogout}
        />
      )}

      {activeView === 'admin' && (
        <AdminDashboard
          onBackHome={() => handleNavigateHome()}
          onSiteUpdated={loadSiteAndSession}
          onLogout={handleLogout}
        />
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <EnrollmentModal
        open={enrollOpen}
        courses={site.courses}
        initialCourseId={enrollCourseId}
        settings={site.settings}
        currentUser={user}
        onClose={() => setEnrollOpen(false)}
        onEnrolled={async (enrolledUser) => {
          setUser(enrolledUser);
          await loadSiteAndSession();
        }}
      />
    </div>
  );
}

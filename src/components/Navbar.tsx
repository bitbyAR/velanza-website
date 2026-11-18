import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { UserPublic } from '../types';
import type { TranslationDictionary } from '../utils/i18n';

interface NavbarProps {
  t: TranslationDictionary;
  user: UserPublic | null;
  activeView: 'home' | 'student' | 'client' | 'admin';
  onNavigateHome: (sectionId?: string) => void;
  onOpenPortal: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Navbar({
  t,
  user,
  activeView,
  onNavigateHome,
  onOpenPortal,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (sectionId: string) => {
    setMobileOpen(false);
    onNavigateHome(sectionId);
  };

  const primaryLabel = user
    ? activeView === 'home'
      ? `${user.role === 'admin' ? 'Admin' : user.role === 'client' ? 'Client' : 'Learning'} Portal`
      : 'Public Website'
    : t.portalBtn;

  const handlePrimaryClick = () => {
    setMobileOpen(false);
    if (!user) {
      onOpenAuth();
    } else if (activeView === 'home') {
      onOpenPortal();
    } else {
      onNavigateHome();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigateHome('top');
          }}
          className="font-display text-xl font-bold tracking-tight text-emerald-950 whitespace-nowrap shrink-0"
        >
          Velanza.co
        </a>

        {/* Zone 2: 5 concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600" aria-label="Primary">
          <a
            href="#courses"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('courses');
            }}
            className="hover:text-emerald-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.navCourses}
          </a>
          <a
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('services');
            }}
            className="hover:text-emerald-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.navServices}
          </a>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('about');
            }}
            className="hover:text-emerald-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.navAbout}
          </a>
          <a
            href="#blog"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('blog');
            }}
            className="hover:text-emerald-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.navBlog}
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('contact');
            }}
            className="hover:text-emerald-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {t.navContact}
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrimaryClick}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            {primaryLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          {[
            { id: 'courses', label: t.navCourses },
            { id: 'services', label: t.navServices },
            { id: 'about', label: t.navAbout },
            { id: 'blog', label: t.navBlog },
            { id: 'contact', label: t.navContact },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleLinkClick(item.id)}
              className="block w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              {item.label}
            </button>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onLogout();
              }}
              className="block w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
            >
              Sign Out ({user.name})
            </button>
          )}
        </div>
      )}
    </header>
  );
}

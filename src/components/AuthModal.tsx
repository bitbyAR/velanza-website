import { useState, type FormEvent } from 'react';
import { Lock, Mail, Phone, User, X } from 'lucide-react';
import type { UserPublic } from '../types';
import { apiUrl } from '../utils/api';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: UserPublic) => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'student' | 'client'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submitAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { email, password }
          : { name, email, phone, password, role, businessName, website_hp: honeypot };

      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
      } else {
        onSuccess(data.user);
        onClose();
      }
    } catch {
      setError('Network error while connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="auth-modal-title" className="font-display text-xl font-bold text-slate-900">
              {mode === 'login' ? 'Velanza.co Portal Sign In' : 'Create Velanza.co Account'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Access your Student Learning Library, Client Store Portal, or Admin CMS.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Mode Switch */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2 text-xs font-semibold rounded-md transition-colors ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {mode === 'login' && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-950 mb-2">Quick Portal Demo Access</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemo('student@velanza.co', 'Student@123')}
                className="px-2.5 py-1.5 text-xs font-medium bg-white border border-emerald-200 text-emerald-900 rounded-md hover:bg-emerald-100"
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('client@velanza.co', 'Client@123')}
                className="px-2.5 py-1.5 text-xs font-medium bg-white border border-emerald-200 text-emerald-900 rounded-md hover:bg-emerald-100"
              >
                Client Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@velanza.co', 'Admin@123')}
                className="px-2.5 py-1.5 text-xs font-medium bg-white border border-emerald-200 text-emerald-900 rounded-md hover:bg-emerald-100"
              >
                Admin Demo
              </button>
            </div>
          </div>
        )}

        <form onSubmit={submitAuth} className="space-y-4">
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border ${
                      role === 'student'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Student Learner
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border ${
                      role === 'client'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Agency Client
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ayesha Siddiqui"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp / Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
                  <input
                    id="auth-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92-330-3677175"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              {role === 'client' && (
                <div>
                  <label htmlFor="auth-biz" className="block text-xs font-semibold text-slate-700 mb-1">
                    Store / Business Name
                  </label>
                  <input
                    id="auth-biz"
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Apex Global Retail Ltd"
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Portal' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

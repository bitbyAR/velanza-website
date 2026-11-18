import { useState, type ChangeEvent, type FormEvent } from 'react';
import { CheckCircle2, Upload, X } from 'lucide-react';
import type { Course, SiteSettings, UserPublic } from '../types';
import { validateEnrollmentForm } from '../utils/velanzaLogic';

interface EnrollmentModalProps {
  open: boolean;
  courses: Course[];
  initialCourseId?: string;
  settings: SiteSettings;
  currentUser: UserPublic | null;
  onClose: () => void;
  onEnrolled: (user: UserPublic) => void;
}

export function EnrollmentModal({
  open,
  courses,
  initialCourseId,
  settings,
  currentUser,
  onClose,
  onEnrolled,
}: EnrollmentModalProps) {
  const [courseId, setCourseId] = useState(initialCourseId || courses[0]?.id || '');
  const [studentName, setStudentName] = useState(currentUser?.name || '');
  const [studentEmail, setStudentEmail] = useState(currentUser?.email || '');
  const [studentPhone, setStudentPhone] = useState(currentUser?.phone || '');
  const [password, setPassword] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (!open) return null;

  const activeCourseId = courseId || initialCourseId || courses[0]?.id || '';
  const selectedCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-Filename': file.name,
        },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to upload screenshot.');
      } else {
        setScreenshotUrl(data.url);
        setScreenshotName(file.name);
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const check = validateEnrollmentForm({
      studentName: currentUser ? currentUser.name : studentName,
      studentEmail: currentUser ? currentUser.email : studentEmail,
      studentPhone: currentUser ? currentUser.phone || studentPhone : studentPhone,
      courseId: selectedCourse?.id || '',
      transactionRef,
      honeypot,
    });
    if (!check.valid) {
      setError(check.error || 'Please check all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse?.id,
          studentName: currentUser ? currentUser.name : studentName,
          studentEmail: currentUser ? currentUser.email : studentEmail,
          studentPhone: currentUser ? currentUser.phone || studentPhone : studentPhone,
          password: password || undefined,
          paymentMethod: 'Easypaisa',
          transactionRef,
          screenshotUrl,
          website_hp: honeypot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Enrollment failed.');
      } else {
        setSubmittedRef(data.enrollment.id);
        if (data.user) {
          onEnrolled(data.user);
        }
      }
    } catch {
      setError('Network error submitting enrollment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 shadow-xl my-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="enroll-modal-title" className="font-display text-xl font-bold text-slate-900">
              Course Enrollment &amp; Easypaisa Verification
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Submit your Easypaisa payment screenshot to unlock full video access after admin approval.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close enrollment dialog"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedRef ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
            <h3 className="font-display text-xl font-bold text-slate-900">
              Enrollment Submitted · Pending Verification
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your Easypaisa reference <span className="font-mono font-semibold text-slate-900">{transactionRef}</span> for{' '}
              <strong>{selectedCourse?.title}</strong> has been received. Once Admin verifies your screenshot, all course modules unlock inside your Student Learning Portal.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg"
            >
              Return to Studio
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />

            <div>
              <label htmlFor="enr-course" className="block text-xs font-semibold text-slate-700 mb-1">
                Selected Course
              </label>
              <select
                id="enr-course"
                value={selectedCourse?.id || ''}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-700"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} — PKR {course.feePkr.toLocaleString()} (${course.feeUsd})
                  </option>
                ))}
              </select>
            </div>

            {/* Easypaisa Payment Instructions */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-950">
                <span>Payment Method: Easypaisa</span>
                <span className="font-mono tabular-nums">
                  PKR {selectedCourse?.feePkr.toLocaleString()} (${selectedCourse?.feeUsd})
                </span>
              </div>
              <p className="text-sm text-emerald-900">
                Send course fee to Easypaisa Account:{' '}
                <strong className="font-mono text-base">{settings.easypaisaNumber}</strong>
              </p>
              <p className="text-xs text-emerald-800">Account Title: {settings.easypaisaTitle}</p>
            </div>

            {!currentUser && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="enr-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="enr-name"
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Zainab Ali"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="enr-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="enr-email"
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="zainab@example.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="enr-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    id="enr-phone"
                    type="tel"
                    required
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="enr-pass" className="block text-xs font-semibold text-slate-700 mb-1">
                    Portal Password
                  </label>
                  <input
                    id="enr-pass"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="enr-tx" className="block text-xs font-semibold text-slate-700 mb-1">
                  Easypaisa Transaction ID
                </label>
                <input
                  id="enr-tx"
                  type="text"
                  required
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="EP-7731942"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label htmlFor="enr-shot" className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Payment Screenshot
                </label>
                <label
                  htmlFor="enr-shot"
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50"
                >
                  <Upload className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="truncate text-slate-700">
                    {uploading ? 'Uploading...' : screenshotName || 'Choose screenshot image'}
                  </span>
                </label>
                <input
                  id="enr-shot"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg"
              >
                {submitting ? 'Submitting...' : 'Submit Payment for Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

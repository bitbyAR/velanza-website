import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  LogOut,
  PlayCircle,
  QrCode,
  Save,
} from 'lucide-react';
import type { Course, CourseLesson, Enrollment, StudentProgressRecord, UserPublic } from '../types';
import { calculateCourseProgress } from '../utils/velanzaLogic';
import { VideoPlayerSurface } from './VideoPlayerSurface';

interface StudentPortalProps {
  onBackHome: () => void;
  onOpenEnroll: (courseId?: string) => void;
  onLogout: () => void;
}

export function StudentPortal({ onBackHome, onOpenEnroll, onLogout }: StudentPortalProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserPublic | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [unlockedCourses, setUnlockedCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<StudentProgressRecord>({
    userId: '',
    completedLessonIds: [],
    notesByLesson: {},
  });
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteStatus, setNoteStatus] = useState('');

  const loadPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/portal');
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user);
      setEnrollments(data.enrollments || []);
      const courses: Course[] = data.unlockedCourses || [];
      setUnlockedCourses(courses);
      const prog: StudentProgressRecord = data.progress || {
        userId: data.user?.id || '',
        completedLessonIds: [],
        notesByLesson: {},
      };
      setProgress(prog);

      const defaultCourse =
        courses.find((c) => c.id === prog.lastWatchedCourseId) || courses[0];
      if (defaultCourse) {
        setActiveCourseId(defaultCourse.id);
        const allLessons = defaultCourse.modules.flatMap((m) => m.lessons);
        const defaultLesson =
          allLessons.find((l) => l.id === prog.lastWatchedLessonId) || allLessons[0];
        if (defaultLesson) {
          setActiveLessonId(defaultLesson.id);
          setNoteDraft(prog.notesByLesson?.[defaultLesson.id] || '');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortal();
  }, []);

  const activeCourse = unlockedCourses.find((c) => c.id === activeCourseId) || unlockedCourses[0];
  const allActiveLessons: CourseLesson[] = activeCourse
    ? activeCourse.modules.flatMap((m) => m.lessons)
    : [];
  const activeLesson =
    allActiveLessons.find((l) => l.id === activeLessonId) || allActiveLessons[0];

  const selectLesson = (courseId: string, lesson: CourseLesson) => {
    setActiveCourseId(courseId);
    setActiveLessonId(lesson.id);
    setNoteDraft(progress.notesByLesson?.[lesson.id] || '');
    setNoteStatus('');
  };

  const updateProgress = async (payload: {
    lessonId: string;
    courseId: string;
    completed?: boolean;
    note?: string;
    positionSeconds?: number;
  }) => {
    const res = await fetch('/api/student/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setProgress(data.progress);
    }
  };

  const handleToggleComplete = async () => {
    if (!activeCourse || !activeLesson) return;
    const isCompleted = progress.completedLessonIds.includes(activeLesson.id);
    await updateProgress({
      lessonId: activeLesson.id,
      courseId: activeCourse.id,
      completed: !isCompleted,
    });
  };

  const handleSaveNote = async () => {
    if (!activeCourse || !activeLesson) return;
    setSavingNote(true);
    setNoteStatus('');
    await updateProgress({
      lessonId: activeLesson.id,
      courseId: activeCourse.id,
      note: noteDraft,
    });
    setSavingNote(false);
    setNoteStatus('Note saved to your learning profile.');
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="h-10 w-64 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const courseStats = activeCourse
    ? calculateCourseProgress(
        progress.completedLessonIds,
        activeCourse.modules.flatMap((m) => m.lessons.map((l) => l.id)),
      )
    : { completedCount: 0, totalCount: 0, percent: 0 };

  const lastCourse = unlockedCourses.find((c) => c.id === progress.lastWatchedCourseId);
  const lastLesson = lastCourse?.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === progress.lastWatchedLessonId);

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Portal Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-emerald-800">
            Student Learning Workspace · Attendance {user?.attendancePercent ?? 100}%
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Welcome back, {user?.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenEnroll()}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg whitespace-nowrap"
          >
            Enroll Another Course
          </button>
          <button
            type="button"
            onClick={onBackHome}
            className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
          >
            Browse Catalog
          </button>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out of student portal"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Continue Watching Bar */}
      {lastCourse && lastLesson && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PlayCircle className="w-10 h-10 text-emerald-800 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-900">Continue Watching</p>
              <p className="font-display text-base font-bold text-slate-900">
                {lastCourse.title} · {lastLesson.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => selectLesson(lastCourse.id, lastLesson)}
            className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
          >
            Resume Lesson
          </button>
        </section>
      )}

      {/* Unlocked Video Library */}
      {unlockedCourses.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center space-y-4">
          <BookOpen className="w-10 h-10 text-emerald-800 mx-auto" />
          <h2 className="font-display text-xl font-bold text-slate-900">
            No Active Courses Unlocked Yet
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            {enrollments.some((e) => e.status === 'pending')
              ? 'Your Easypaisa enrollment payment is currently pending admin verification. Once approved, your full video modules appear here.'
              : 'Select any course from our catalog and verify your Easypaisa payment to unlock full video access.'}
          </p>
          <button
            type="button"
            onClick={() => onOpenEnroll()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg"
          >
            Enroll in a Course
          </button>
        </section>
      ) : (
        <div className="space-y-6">
          {/* Course Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
            {unlockedCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => {
                  const first = course.modules[0]?.lessons[0];
                  if (first) selectLesson(course.id, first);
                  else setActiveCourseId(course.id);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeCourse?.id === course.id
                    ? 'bg-emerald-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {course.title}
              </button>
            ))}
          </div>

          {activeCourse && activeLesson && (
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Main Video + Notes */}
              <div className="lg:col-span-8 space-y-6">
                <VideoPlayerSurface
                  title={activeLesson.title}
                  videoUrl={activeLesson.videoUrl}
                  durationMinutes={activeLesson.durationMinutes}
                  summary={activeLesson.summary}
                  initialPositionSeconds={
                    progress.lastWatchedLessonId === activeLesson.id
                      ? progress.lastPositionSeconds || 0
                      : 0
                  }
                  onProgressTick={(secs) =>
                    updateProgress({
                      lessonId: activeLesson.id,
                      courseId: activeCourse.id,
                      positionSeconds: secs,
                    })
                  }
                />

                {/* Lesson Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      {activeLesson.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeCourse.title} · {activeLesson.durationMinutes} min · Progress{' '}
                      <span className="font-mono font-semibold text-emerald-800 tabular-nums">
                        {courseStats.percent}%
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={activeLesson.resourceUrl || activeCourse.syllabusPdfUrl}
                      download
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Resources</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleToggleComplete}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        progress.completedLessonIds.includes(activeLesson.id)
                          ? 'bg-emerald-900 text-white hover:bg-emerald-800'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {progress.completedLessonIds.includes(activeLesson.id)
                          ? 'Completed'
                          : 'Mark Lesson Complete'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Personal Lesson Notes */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="lesson-notes" className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-800" />
                      <span>Personal Study Notes</span>
                    </label>
                    {noteStatus && (
                      <span className="text-xs font-medium text-emerald-800">{noteStatus}</span>
                    )}
                  </div>
                  <textarea
                    id="lesson-notes"
                    rows={4}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Write key product hunting criteria, supplier notes, or action items for this lesson..."
                    className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      disabled={savingNote}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingNote ? 'Saving...' : 'Save Note'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modules Sidebar + Certificate */}
              <aside className="lg:col-span-4 space-y-5">
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Course Modules
                    </h3>
                    <span className="font-mono text-xs font-semibold text-emerald-800 tabular-nums">
                      {courseStats.completedCount}/{courseStats.totalCount}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-700 transition-all"
                      style={{ width: `${courseStats.percent}%` }}
                    />
                  </div>

                  <div className="space-y-4 pt-1">
                    {activeCourse.modules.map((mod) => (
                      <div key={mod.id} className="space-y-1.5">
                        <p className="text-xs font-semibold text-slate-500">{mod.title}</p>
                        <div className="space-y-1">
                          {mod.lessons.map((lesson) => {
                            const done = progress.completedLessonIds.includes(lesson.id);
                            const current = activeLesson.id === lesson.id;
                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                onClick={() => selectLesson(activeCourse.id, lesson)}
                                className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                                  current
                                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold'
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2">{lesson.title}</p>
                                  <p className="font-mono text-[11px] text-slate-500 mt-0.5 tabular-nums">
                                    {lesson.durationMinutes} min
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificate & QR Verification Ready */}
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-emerald-800" />
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Certificate &amp; Verification
                    </h3>
                  </div>
                  {user?.certificateIssued ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-700">
                        Verified Velanza.co Graduate Certificate issued.
                      </p>
                      <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                        <div>
                          <p className="text-[11px] text-slate-500">Verification ID</p>
                          <p className="font-mono text-xs font-semibold text-slate-900">
                            {user.certificateCode}
                          </p>
                        </div>
                        <QrCode className="w-7 h-7 text-emerald-900" aria-hidden="true" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">
                      Complete your lessons and attendance milestones to receive a QR-verifiable Velanza.co certificate.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      )}

      {/* Enrollment History Table */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900">
            My Enrollment &amp; Easypaisa Payment Records
          </h2>
        </div>
        {enrollments.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No enrollments submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Course</th>
                  <th className="py-3 px-4 font-semibold">Transaction Ref</th>
                  <th className="py-3 px-4 font-semibold text-right">Fee (PKR)</th>
                  <th className="py-3 px-6 font-semibold">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6 font-medium text-slate-900">{enr.courseTitle}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">{enr.transactionRef}</td>
                    <td className="py-3 px-4 font-mono text-right tabular-nums text-slate-900">
                      {enr.amountPkr.toLocaleString()}
                    </td>
                    <td className="py-3 px-6 text-xs font-semibold">
                      <span
                        className={
                          enr.status === 'approved'
                            ? 'text-emerald-800'
                            : enr.status === 'rejected'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }
                      >
                        {enr.status === 'approved'
                          ? 'Verified & Unlocked'
                          : enr.status === 'rejected'
                          ? 'Verification Rejected'
                          : 'Pending Admin Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

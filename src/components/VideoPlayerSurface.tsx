import { useEffect, useState } from 'react';
import { Lock, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';

interface VideoPlayerSurfaceProps {
  title: string;
  videoUrl: string;
  durationMinutes: number;
  summary: string;
  locked?: boolean;
  initialPositionSeconds?: number;
  onProgressTick?: (seconds: number) => void;
}

export function VideoPlayerSurface({
  title,
  videoUrl,
  durationMinutes,
  summary,
  locked = false,
  initialPositionSeconds = 0,
  onProgressTick,
}: VideoPlayerSurfaceProps) {
  const isUploadedVideo = Boolean(videoUrl && !videoUrl.startsWith('demo://'));
  const totalSeconds = Math.max(60, durationMinutes * 60);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(initialPositionSeconds);

  useEffect(() => {
    setPlaying(false);
    setElapsed(initialPositionSeconds || 0);
  }, [title, videoUrl, initialPositionSeconds]);

  useEffect(() => {
    if (!playing || isUploadedVideo || locked) return;
    const timer = window.setInterval(() => {
      setElapsed((prev) => {
        const next = Math.min(totalSeconds, prev + 1);
        if (next % 5 === 0 && onProgressTick) {
          onProgressTick(next);
        }
        if (next >= totalSeconds) {
          setPlaying(false);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing, isUploadedVideo, locked, totalSeconds, onProgressTick]);

  const formatClock = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  if (locked || !videoUrl) {
    return (
      <div className="aspect-video w-full rounded-xl bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center border border-slate-800">
        <Lock className="w-10 h-10 text-red-400 mb-3" />
        <h4 className="font-display text-lg font-semibold">Protected Lesson Stream</h4>
        <p className="text-sm text-slate-300 max-w-md mt-2">
          This lesson unlocks automatically once your Easypaisa enrollment payment is verified by Admin.
        </p>
      </div>
    );
  }

  if (isUploadedVideo) {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-200">
        <video
          src={videoUrl}
          controls
          className="w-full h-full object-contain"
          onTimeUpdate={(e) => {
            const sec = Math.floor(e.currentTarget.currentTime);
            if (sec > 0 && sec % 10 === 0 && onProgressTick) {
              onProgressTick(sec);
            }
          }}
        >
          Your browser does not support HTML5 video playback.
        </video>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((elapsed / totalSeconds) * 100));

  return (
    <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white border border-emerald-900/60 flex flex-col justify-between p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-emerald-300">
            Velanza.co Studio Lesson · {durationMinutes} min
          </p>
          <h4 className="font-display text-lg sm:text-2xl font-semibold text-white mt-1 text-balance">
            {title}
          </h4>
        </div>
        <span className="font-mono text-xs text-emerald-200 bg-white/10 px-2.5 py-1 rounded-md shrink-0 tabular-nums">
          HD 1080p
        </span>
      </div>

      <div className="my-auto py-4">
        <div className="max-w-xl bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-emerald-200 font-medium mb-1">Lesson Briefing</p>
          <p className="text-sm text-slate-200 leading-relaxed">{summary}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Pause lesson' : 'Play lesson'}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{playing ? 'Pause' : 'Play Lesson'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setElapsed(0);
              }}
              aria-label="Restart lesson"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <Volume2 className="w-4 h-4 text-emerald-300 hidden sm:block" aria-hidden="true" />
          </div>
          <span className="font-mono text-xs text-slate-300 tabular-nums">
            {formatClock(elapsed)} / {formatClock(totalSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}

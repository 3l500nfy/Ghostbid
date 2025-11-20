import { useEffect, useState } from 'react';
import { formatDuration } from '../utils/time';

interface CountdownTimerProps {
  endTimestamp: number;
}

export const CountdownTimer = ({ endTimestamp }: CountdownTimerProps) => {
  const [remaining, setRemaining] = useState(endTimestamp - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(Math.max(endTimestamp - Date.now(), 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [endTimestamp]);

  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-center text-white">
      <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Time left</p>
      <p className="mt-2 text-3xl font-semibold text-emerald-300">{formatDuration(remaining)}</p>
    </div>
  );
};


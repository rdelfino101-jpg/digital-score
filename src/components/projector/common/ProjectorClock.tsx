import React from 'react';
import { Timer, Clock } from 'lucide-react';
import { formatTimeDisplay } from '../../../utils/gameEngineRules';

interface ProjectorClockProps {
  seconds: number;
  mode?: 'countdown' | 'stopwatch' | 'off';
  label?: string;
  isWarning?: boolean;
  isFinished?: boolean;
}

export const ProjectorClock: React.FC<ProjectorClockProps> = ({
  seconds,
  mode = 'countdown',
  label,
  isWarning = false,
  isFinished = false,
}) => {
  if (mode === 'off') return null;

  const defaultLabel = mode === 'countdown' ? 'TIEMPO' : 'CRONÓMETRO';
  const isAlert = isWarning || isFinished;

  return (
    <div
      className={`flex items-center gap-4 rounded-3xl border-2 px-6 py-2.5 shadow-md transition-all ${
        isWarning
          ? 'border-[var(--p-err)] bg-[var(--p-err-bg)] text-[var(--p-err)] animate-projector-incorrect'
          : isFinished
          ? 'border-[var(--p-err)] bg-[var(--p-err-bg)] text-[var(--p-err)]'
          : 'border-[var(--p-line)] bg-[var(--p-panel)] text-[var(--p-text)]'
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          isAlert
            ? 'bg-[var(--p-err)] text-[var(--p-err-bg)]'
            : 'bg-[var(--p-panel-2)] text-[var(--p-accent-ink)]'
        }`}
      >
        {mode === 'countdown' ? <Timer className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
      </div>

      <div className="flex flex-col items-end">
        <span
          className={`font-projector text-[20px] font-bold uppercase tracking-widest ${
            isAlert ? 'text-[var(--p-err)]' : 'text-[var(--p-text-3)]'
          }`}
        >
          {label || defaultLabel}
        </span>
        <span
          className={`font-projector tabular-numbers text-[56px] font-black leading-none tracking-tight ${
            isAlert ? 'text-[var(--p-err)]' : 'text-[var(--p-text)]'
          }`}
        >
          {formatTimeDisplay(seconds)}
        </span>
      </div>
    </div>
  );
};

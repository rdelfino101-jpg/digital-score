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

  return (
    <div
      className={`flex items-center gap-4 rounded-3xl border-2 px-6 py-2.5 backdrop-blur-xl shadow-2xl transition-all ${
        isWarning
          ? 'border-red-500 bg-[#3F1216] text-red-400 animate-projector-incorrect'
          : isFinished
          ? 'border-red-700 bg-[#25090C] text-red-400'
          : 'border-[#2A2D5C] bg-[#15173A] text-white'
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#FFC53D]">
        {mode === 'countdown' ? <Timer className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
      </div>

      <div className="flex flex-col items-end">
        <span className="font-projector text-[20px] font-bold uppercase tracking-widest text-[#B8BCE6]">
          {label || defaultLabel}
        </span>
        <span className="font-projector tabular-numbers text-[56px] font-black leading-none tracking-tight text-white drop-shadow">
          {formatTimeDisplay(seconds)}
        </span>
      </div>
    </div>
  );
};

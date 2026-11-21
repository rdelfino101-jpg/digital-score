import React from 'react';

interface TimerBarProps {
  currentSeconds: number;
  totalSeconds: number;
  className?: string;
  isUrgent?: boolean;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  currentSeconds,
  totalSeconds,
  className = '',
  isUrgent = false,
}) => {
  if (totalSeconds <= 0) return null;

  const percentage = Math.max(0, Math.min(100, (currentSeconds / totalSeconds) * 100));

  return (
    <div
      className={`relative w-full overflow-hidden rounded-full border border-[var(--p-line)] bg-[var(--p-panel-2)] ${className}`}
      style={{ height: '14px' }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-300 ease-linear"
        style={{
          width: `${percentage}%`,
          backgroundColor: isUrgent ? 'var(--p-err)' : 'var(--p-accent)',
        }}
      />
    </div>
  );
};

import React from 'react';
import { Flame } from 'lucide-react';
import { readableOn } from '../../../styles/eventBrand';

interface TurnPillProps {
  teamName: string;
  teamColor?: string;
  points?: number;
  label?: string;
}

export const TurnPill: React.FC<TurnPillProps> = ({
  teamName,
  teamColor,
  points,
  label = 'Responde',
}) => {
  const iconColor = teamColor ? readableOn(teamColor) : 'var(--p-on-accent)';

  return (
    <div
      className="inline-flex items-center gap-3 rounded-full border-2 bg-[var(--p-panel)] px-6 py-2 shadow-md animate-fade-in"
      style={{
        borderColor: teamColor || 'var(--p-accent-ink)',
      }}
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full font-black"
        style={{
          backgroundColor: teamColor || 'var(--p-accent)',
          color: iconColor,
        }}
      >
        <Flame className="h-4 w-4" />
      </div>

      <div className="flex items-center gap-2 font-projector text-[24px] font-bold tracking-wide text-[var(--p-text)]">
        <span className="text-[var(--p-text-2)]">{label}:</span>
        <span className="font-extrabold text-[var(--p-text)]">
          {teamName}
        </span>
        {points !== undefined && (
          <>
            <span className="text-[var(--p-text-3)]">·</span>
            <span className="text-[var(--p-accent-ink)] font-black">+{points} PTS</span>
          </>
        )}
      </div>
    </div>
  );
};

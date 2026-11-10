import React from 'react';
import { Flame } from 'lucide-react';

interface TurnPillProps {
  teamName: string;
  teamColor?: string;
  points?: number;
  label?: string;
}

export const TurnPill: React.FC<TurnPillProps> = ({
  teamName,
  teamColor = '#FFC53D',
  points,
  label = 'Responde',
}) => {
  return (
    <div
      className="inline-flex items-center gap-3 rounded-full border-2 px-6 py-2 shadow-2xl backdrop-blur-xl animate-fade-in"
      style={{
        borderColor: teamColor,
        backgroundColor: '#15173A',
        boxShadow: `0 0 25px ${teamColor}33`,
      }}
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-950 font-black"
        style={{ backgroundColor: teamColor }}
      >
        <Flame className="h-4 w-4" />
      </div>

      <div className="flex items-center gap-2 font-projector text-[24px] font-bold tracking-wide text-white">
        <span className="text-[#B8BCE6]">{label}:</span>
        <span className="font-extrabold uppercase" style={{ color: teamColor }}>
          {teamName}
        </span>
        {points !== undefined && (
          <>
            <span className="text-[#B8BCE6] opacity-60">·</span>
            <span className="text-[#FFC53D] font-black">+{points} PTS</span>
          </>
        )}
      </div>
    </div>
  );
};

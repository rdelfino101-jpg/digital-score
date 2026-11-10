import React from 'react';
import { Flame } from 'lucide-react';

interface ProjectorHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  showLiveBadge?: boolean;
}

export const ProjectorHeader: React.FC<ProjectorHeaderProps> = ({
  kicker,
  title,
  subtitle,
  rightSlot,
  showLiveBadge = true,
}) => {
  return (
    <header className="relative z-20 flex w-full items-center justify-between gap-6 border-b border-[#2A2D5C] pb-6">
      {/* LEFT: Kicker, Title, Subtitle */}
      <div className="flex flex-col min-w-0 max-w-[70%]">
        <div className="flex items-center gap-3">
          {showLiveBadge && (
            <span className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1 text-[20px] font-black uppercase tracking-wider text-white shadow-md">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <Flame className="h-4 w-4" />
              <span>EN VIVO</span>
            </span>
          )}
          {kicker && (
            <span className="font-projector text-[24px] font-bold uppercase tracking-[0.2em] text-[#B8BCE6]">
              {kicker}
            </span>
          )}
        </div>

        <h1 className="font-projector-title mt-1.5 text-[58px] leading-[1.05] tracking-tight text-white drop-shadow-md truncate">
          {title}
        </h1>

        {subtitle && (
          <p className="font-projector text-[24px] font-medium text-[#B8BCE6] mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* RIGHT: Clock, Chips, Status slot */}
      {rightSlot && (
        <div className="flex items-center gap-4 shrink-0">
          {rightSlot}
        </div>
      )}
    </header>
  );
};

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
  const titleLength = title?.length || 0;
  const titleFontSizeClass =
    titleLength > 40
      ? 'text-[40px]'
      : titleLength > 28
      ? 'text-[48px]'
      : 'text-[58px]';

  return (
    <header className="relative z-20 flex w-full items-center justify-between gap-6 border-b border-[var(--p-line)] pb-6">
      {/* LEFT: Kicker, Title, Subtitle */}
      <div className="flex flex-col min-w-0 max-w-[70%]">
        <div className="flex items-center gap-3">
          {showLiveBadge && (
            <span className="flex items-center gap-1.5 rounded-lg bg-[var(--p-brand)] px-3 py-1 text-[20px] font-black uppercase tracking-wider text-[var(--p-on-brand)] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[var(--p-accent)] animate-pulse" />
              <Flame className="h-4 w-4 text-[var(--p-brand-2)]" />
              <span>EN VIVO</span>
            </span>
          )}
          {kicker && (
            <span className="font-projector text-[24px] font-bold tracking-[0.12em] text-[var(--p-text-2)]">
              {kicker}
            </span>
          )}
        </div>

        <h1 className={`font-projector-title mt-1.5 ${titleFontSizeClass} leading-[1.05] text-[var(--p-text)] truncate`}>
          {title}
        </h1>

        {subtitle && (
          <p className="font-projector text-[24px] font-medium text-[var(--p-text-2)] mt-1 truncate">
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

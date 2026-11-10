import React from 'react';
import { CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { OPTION_BADGE_CONFIG, OptionBadgeKey } from '../../../styles/projectorTheme';

export type AnswerState =
  | 'normal'
  | 'selected'
  | 'correct'
  | 'incorrect'
  | 'dimmed'
  | 'fifty_fifty'
  | 'final_answer';

export interface AnswerOptionProps {
  badgeKey?: OptionBadgeKey;
  badge?: OptionBadgeKey;
  text: string;
  state?: AnswerState;
  showBadge?: boolean;
  points?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({
  badgeKey,
  badge,
  text,
  state = 'normal',
  showBadge = true,
  points,
  className = '',
  style,
}) => {
  const actualKey: OptionBadgeKey = badge || badgeKey || 'A';
  const badgeConfig = OPTION_BADGE_CONFIG[actualKey] || OPTION_BADGE_CONFIG.A;

  if (state === 'fifty_fifty') {
    return (
      <div
        style={style}
        className={`flex min-h-[96px] w-full items-center gap-5 rounded-3xl border-2 border-dashed border-[#2A2D5C] bg-[#15173A]/30 px-6 py-3 opacity-[0.32] select-none ${className}`}
      >
        <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-slate-500 font-projector text-[40px] font-black">
          {actualKey}
        </div>
        <div className="flex flex-col">
          <span className="font-projector text-[32px] font-bold uppercase tracking-wider text-slate-500 line-through">
            Eliminada · 50:50
          </span>
        </div>
      </div>
    );
  }

  // Base styling for each state
  let containerClasses = 'border-2 border-[#2A2D5C] bg-[#15173A] text-white shadow-xl';
  const badgeExtra = '';
  let rightIcon: React.ReactNode = null;

  switch (state) {
    case 'correct':
      containerClasses =
        'border-4 border-[#4ADE80] bg-[#0F5132] text-white shadow-[0_0_40px_rgba(74,222,128,0.5)] animate-projector-correct';
      rightIcon = (
        <div className="flex items-center gap-3">
          {points !== undefined && (
            <span className="shrink-0 rounded-xl bg-[#3A2A05] border border-[#FFC53D] px-3.5 py-1 text-[22px] font-black text-[#FFC53D]">
              +{points} PTS
            </span>
          )}
          <CheckCircle2 className="h-10 w-10 text-[#4ADE80] shrink-0 animate-bounce" />
        </div>
      );
      break;

    case 'incorrect':
      containerClasses =
        'border-4 border-[#EF4444] bg-[#3F1216] text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-projector-incorrect';
      rightIcon = <XCircle className="h-10 w-10 text-[#EF4444] shrink-0" />;
      break;

    case 'final_answer':
      containerClasses =
        'border-4 border-[#FFC53D] bg-[#3A2A05] text-white shadow-[0_0_35px_rgba(255,197,61,0.5)] ring-4 ring-[#FFC53D]/40';
      rightIcon = (
        <span className="shrink-0 rounded-xl bg-[#FFC53D] px-3.5 py-1 font-projector text-[20px] font-black uppercase tracking-wider text-slate-950 shadow-md">
          RESPUESTA FINAL
        </span>
      );
      break;

    case 'selected':
      containerClasses =
        'border-4 border-[#FFC53D] bg-[#3A2A05] text-white shadow-[0_0_35px_rgba(255,197,61,0.5)]';
      rightIcon = (
        <span className="shrink-0 rounded-xl bg-[#FFC53D]/20 border border-[#FFC53D] px-3.5 py-1 text-[20px] font-black uppercase tracking-wider text-[#FFC53D]">
          ELEGIDA
        </span>
      );
      break;

    case 'dimmed':
      containerClasses = 'border-2 border-[#2A2D5C]/40 bg-[#15173A]/50 text-white/40 opacity-[0.32]';
      break;

    case 'normal':
    default:
      containerClasses = 'border-2 border-[#2A2D5C] bg-[#15173A] text-white shadow-xl';
      break;
  }

  return (
    <div
      style={style}
      className={`relative flex min-h-[96px] w-full items-center justify-between gap-5 rounded-3xl px-6 py-2.5 transition-all duration-300 ${containerClasses} ${className}`}
    >
      <div className="flex items-center gap-5 min-w-0 flex-1">
        {/* 84px letter badge */}
        {showBadge && (
          <div
            className={`flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-2xl font-projector text-[42px] font-black shadow-lg ${badgeExtra}`}
            style={{
              backgroundColor: badgeConfig.bg,
              color: badgeConfig.text,
            }}
          >
            {actualKey}
          </div>
        )}

        {/* Option text in 40-48px */}
        <span className="font-projector text-[42px] font-extrabold uppercase leading-tight tracking-tight drop-shadow truncate">
          {text}
        </span>
      </div>

      {rightIcon && <div className="ml-3 shrink-0">{rightIcon}</div>}
    </div>
  );
};

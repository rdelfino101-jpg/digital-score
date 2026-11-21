import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { OptionBadgeKey } from '../../../styles/projectorTheme';

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

  if (state === 'fifty_fifty') {
    return (
      <div
        style={style}
        className={`flex min-h-[96px] w-full items-center gap-5 rounded-3xl border-2 border-dashed border-[var(--p-line)] bg-[var(--p-panel-2)] px-6 py-3 opacity-45 select-none ${className}`}
      >
        <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-2xl border border-[var(--p-line)] bg-[var(--p-bg)] text-[var(--p-text-3)] font-projector text-[40px] font-black">
          {actualKey}
        </div>
        <div className="flex flex-col">
          <span className="font-projector text-[32px] font-bold uppercase tracking-wider text-[var(--p-text-3)] line-through">
            Eliminada · 50:50
          </span>
        </div>
      </div>
    );
  }

  let containerClasses =
    'border-2 border-[var(--p-line)] bg-[var(--p-panel)] text-[var(--p-text)] shadow-sm';
  let badgeStyle: React.CSSProperties = {
    backgroundColor: 'var(--p-brand)',
    color: 'var(--p-on-brand)',
  };
  let rightIcon: React.ReactNode = null;

  switch (state) {
    case 'correct':
      containerClasses =
        'border-4 border-[var(--p-ok)] bg-[var(--p-ok-bg)] text-[var(--p-text)] shadow-md animate-projector-correct';
      badgeStyle = {
        backgroundColor: 'var(--p-ok)',
        color: 'var(--p-ok-bg)',
      };
      rightIcon = (
        <div className="flex items-center gap-3">
          {points !== undefined && (
            <span className="shrink-0 rounded-xl bg-[var(--p-accent)] px-3.5 py-1 text-[22px] font-black text-[var(--p-on-accent)]">
              +{points} PTS
            </span>
          )}
          <CheckCircle2 className="h-10 w-10 text-[var(--p-ok)] shrink-0 animate-bounce" />
        </div>
      );
      break;

    case 'incorrect':
      containerClasses =
        'border-4 border-[var(--p-err)] bg-[var(--p-err-bg)] text-[var(--p-text)] shadow-md animate-projector-incorrect';
      badgeStyle = {
        backgroundColor: 'var(--p-err)',
        color: 'var(--p-err-bg)',
      };
      rightIcon = <XCircle className="h-10 w-10 text-[var(--p-err)] shrink-0" />;
      break;

    case 'final_answer':
      containerClasses =
        'border-4 border-[var(--p-accent-ink)] bg-[var(--p-accent-soft)] text-[var(--p-text)] shadow-md';
      badgeStyle = {
        backgroundColor: 'var(--p-accent)',
        color: 'var(--p-on-accent)',
      };
      rightIcon = (
        <span className="shrink-0 rounded-xl bg-[var(--p-accent)] px-3.5 py-1 font-projector text-[20px] font-black uppercase tracking-wider text-[var(--p-on-accent)] shadow-sm">
          RESPUESTA FINAL
        </span>
      );
      break;

    case 'selected':
      containerClasses =
        'border-4 border-[var(--p-accent-ink)] bg-[var(--p-accent-soft)] text-[var(--p-text)] shadow-md';
      badgeStyle = {
        backgroundColor: 'var(--p-accent)',
        color: 'var(--p-on-accent)',
      };
      rightIcon = (
        <span className="shrink-0 rounded-xl bg-[var(--p-panel)] border-2 border-[var(--p-accent-ink)] px-3.5 py-1 text-[20px] font-black uppercase tracking-wider text-[var(--p-accent-ink)]">
          ELEGIDA
        </span>
      );
      break;

    case 'dimmed':
      containerClasses =
        'border-2 border-[var(--p-line)] bg-[var(--p-panel-2)] text-[var(--p-text-3)] opacity-40';
      badgeStyle = {
        backgroundColor: 'var(--p-line)',
        color: 'var(--p-text-2)',
      };
      break;

    case 'normal':
    default:
      break;
  }

  return (
    <div
      style={style}
      className={`relative flex min-h-[96px] w-full items-center justify-between gap-5 rounded-3xl px-6 py-2.5 transition-all duration-300 ${containerClasses} ${className}`}
    >
      <div className="flex items-center gap-5 min-w-0 flex-1">
        {showBadge && (
          <div
            className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-2xl font-projector text-[42px] font-black shadow-sm"
            style={badgeStyle}
          >
            {actualKey}
          </div>
        )}

        <span className="font-projector text-[42px] font-extrabold leading-tight tracking-tight truncate">
          {text}
        </span>
      </div>

      {rightIcon && <div className="ml-3 shrink-0">{rightIcon}</div>}
    </div>
  );
};

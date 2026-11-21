import React from 'react';
import { WhoSaidItGameState } from '../../../types/masterStudio';
import { AnswerOption } from '../common/AnswerOption';
import { Sparkles, Quote as QuoteIcon, CheckCircle2 } from 'lucide-react';

interface WhoSaidItArenaProps {
  stage: WhoSaidItGameState;
}

export const WhoSaidItArena: React.FC<WhoSaidItArenaProps> = ({ stage }) => {
  const items = stage?.items || [];
  const currentIndex = stage?.currentIndex ?? 0;
  const item = items[currentIndex];

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <QuoteIcon className="w-24 h-24 text-[var(--p-accent-ink)] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-[var(--p-text)] mb-3">¿Quién lo dijo?</h2>
        <p className="font-projector text-[28px] font-bold text-[var(--p-text-2)] uppercase tracking-wider">Competición en vivo</p>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D'] as const;

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      {/* Top row: Points & optional Hint chip */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-5 py-2 rounded-full bg-[var(--p-panel)] border border-[var(--p-line)] text-[var(--p-accent-ink)] font-black text-[22px] uppercase tracking-wide">
            {item.points} PUNTOS
          </span>
          {item.context && (
            <span className="px-5 py-2 rounded-full bg-[var(--p-panel-2)] border border-[var(--p-line)] text-[var(--p-text-2)] font-semibold text-[22px]">
              {item.context}
            </span>
          )}
        </div>

        {stage.showHint && item.hint && (
          <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-[var(--p-accent-soft)] border-2 border-[var(--p-accent-ink)] text-[var(--p-accent-ink)] font-black text-[22px] tracking-wide uppercase animate-in fade-in">
            <Sparkles className="w-6 h-6 text-[var(--p-accent-ink)]" />
            PISTA: {item.hint}
          </div>
        )}
      </div>

      {/* Main Quote area: Giant decorative quotes + 84px quote */}
      <div className="flex-1 flex flex-col items-center justify-center px-10 relative">
        <QuoteIcon className="w-24 h-24 text-[var(--p-accent-ink)] opacity-35 mb-2" />
        <blockquote className="text-center max-w-6xl">
          <p className="text-[84px] font-black leading-[1.08] text-[var(--p-text)] tracking-tight">
            “{(item.quote || '').replace(/^["“«\s]+|["”»\s]+$/g, '')}”
          </p>
        </blockquote>

        {stage.revealed && (
          <div className="mt-6 inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-[var(--p-ok-bg)] border-2 border-[var(--p-ok)] text-[var(--p-ok)] text-[32px] font-black tracking-wide uppercase animate-in zoom-in-95">
            <CheckCircle2 className="w-8 h-8 text-[var(--p-ok)]" />
            Dicho por: {item.author}
          </div>
        )}
      </div>

      {/* 4 Options in a single row of 4 columns */}
      <div className="grid grid-cols-4 gap-4 w-full">
        {item.options.map((opt, idx) => {
          const badge = optionLetters[idx] || 'A';
          const isSelected = stage.selectedOption === opt;
          const isCorrect = opt === item.author;

          let optionState: 'normal' | 'selected' | 'correct' | 'incorrect' = 'normal';
          if (stage.revealed) {
            if (isCorrect) optionState = 'correct';
            else if (isSelected) optionState = 'incorrect';
          } else if (isSelected) {
            optionState = 'selected';
          }

          return (
            <AnswerOption
              key={opt}
              badge={badge}
              text={opt}
              state={optionState}
              points={isCorrect && stage.revealed ? item.points : undefined}
              style={{ height: '110px', minHeight: '110px' }}
            />
          );
        })}
      </div>
    </div>
  );
};

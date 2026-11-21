import React from 'react';
import { FamilyFeudGameState } from '../../../types/masterStudio';
import { Trophy, HelpCircle, X } from 'lucide-react';

interface FamilyFeudArenaProps {
  stage: FamilyFeudGameState;
}

export const FamilyFeudArena: React.FC<FamilyFeudArenaProps> = ({ stage }) => {
  const items = stage?.items || [];
  const currentIndex = stage?.currentIndex ?? 0;
  const item = items[currentIndex];

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <HelpCircle className="w-24 h-24 text-[var(--p-accent-ink)] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-[var(--p-text)] mb-3">100 Personas Dijeron</h2>
        <p className="font-projector text-[28px] font-bold text-[var(--p-text-2)] uppercase tracking-wider">Competición en vivo</p>
      </div>
    );
  }

  const revealedIds = new Set(stage.revealedAnswerIds || []);
  const answers = item.answers || [];
  const strikes = Math.min(3, Math.max(0, stage.strikes || 0));

  // Split answers into 2 columns (up to 4 per column, 8 max standard)
  const midPoint = Math.ceil(answers.length / 2);
  const leftCol = answers.slice(0, midPoint);
  const rightCol = answers.slice(midPoint);

  const renderAnswerSlot = (ans: (typeof answers)[number], displayNumber: number) => {
    const isRevealed = ans.revealed || revealedIds.has(ans.id);

    return (
      <div
        key={ans.id}
        style={{ height: '112px', minHeight: '112px' }}
        className={`w-full rounded-2xl px-6 flex items-center justify-between border-4 transition-all duration-500 transform ${
          isRevealed
            ? 'bg-[var(--p-panel)] border-[var(--p-accent-ink)] shadow-md'
            : 'bg-[var(--p-panel-2)] border-[var(--p-line)]'
        }`}
      >
        {isRevealed ? (
          <>
            <div className="flex items-center gap-5 min-w-0 flex-1">
              <div className="w-14 h-14 rounded-xl bg-[var(--p-brand)] text-[var(--p-on-brand)] font-black text-[28px] flex items-center justify-center shrink-0">
                {displayNumber}
              </div>
              <span className="text-[34px] font-black text-[var(--p-text)] truncate uppercase tracking-wide">
                {ans.text}
              </span>
            </div>
            <div className="px-6 py-2 rounded-xl bg-[var(--p-accent)] text-[var(--p-on-accent)] font-black text-[40px] tabular-numbers shrink-0 ml-4">
              {ans.points}
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--p-panel)] border-2 border-[var(--p-line-strong)] text-[var(--p-text-2)] font-black text-[30px] flex items-center justify-center">
              {displayNumber}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full justify-between gap-5">
      {/* Top row: Pot/Bolsa + Strikes (up to 3 large red X) */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 px-8 py-3 rounded-2xl bg-[var(--p-accent-soft)] border-4 border-[var(--p-accent-ink)] shadow-sm">
          <Trophy className="w-10 h-10 text-[var(--p-accent-ink)]" />
          <div>
            <span className="text-[18px] font-black tracking-widest text-[var(--p-accent-ink)] uppercase block">
              Bolsa acumulada
            </span>
            <span className="text-[52px] font-black leading-none text-[var(--p-text)] tabular-numbers">
              {stage.potScore || 0} <span className="text-[28px] text-[var(--p-accent-ink)]">PTS</span>
            </span>
          </div>
        </div>

        {/* Strikes */}
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-[var(--p-panel)] border border-[var(--p-line)]">
          <span className="text-[20px] font-black tracking-widest text-[var(--p-text-2)] uppercase mr-2">
            STRIKES
          </span>
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((strikeIndex) => {
              const isStrike = strikeIndex <= strikes;
              return (
                <div
                  key={strikeIndex}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 ${
                    isStrike
                      ? 'bg-[var(--p-err-bg)] border-[var(--p-err)] text-[var(--p-err)] shadow-sm scale-105'
                      : 'bg-[var(--p-panel-2)] border-[var(--p-line)] text-[var(--p-line-strong)]'
                  }`}
                >
                  <X className={`w-10 h-10 stroke-[3.5] ${isStrike ? 'opacity-100' : 'opacity-30'}`} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Question Text in 58px */}
      <div className="flex-1 flex items-center justify-center px-6 py-2">
        <h2 className="text-[58px] font-black leading-[1.12] text-[var(--p-text)] text-center max-w-6xl tracking-tight">
          {item.question}
        </h2>
      </div>

      {/* Answers Board in 2 columns with rows of 112px height */}
      <div className="grid grid-cols-2 gap-5 w-full">
        <div className="flex flex-col gap-4">
          {leftCol.map((ans, idx) => renderAnswerSlot(ans, idx + 1))}
        </div>
        <div className="flex flex-col gap-4">
          {rightCol.map((ans, idx) => renderAnswerSlot(ans, leftCol.length + idx + 1))}
        </div>
      </div>
    </div>
  );
};

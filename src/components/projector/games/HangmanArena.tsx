import React from 'react';
import { HangmanGameState } from '../../../types/masterStudio';
import { normalizeChar } from '../../../utils/gameEngineRules';
import { Sparkles, HelpCircle, X } from 'lucide-react';

interface HangmanArenaProps {
  stage: HangmanGameState;
}

const ALPHABET_27 = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

export const HangmanArena: React.FC<HangmanArenaProps> = ({ stage }) => {
  const items = stage?.items || [];
  const currentIndex = stage?.currentIndex ?? 0;
  const item = items[currentIndex];

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <HelpCircle className="w-24 h-24 text-[var(--p-accent-ink)] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-[var(--p-text)] mb-3">Ahorcado Pro</h2>
        <p className="font-projector text-[28px] font-bold text-[var(--p-text-2)] uppercase tracking-wider">Competición en vivo</p>
      </div>
    );
  }

  const normalizedGuessed = new Set(stage.guessedLetters.map((l) => normalizeChar(l)));
  const normalizedTargetChars = new Set(
    item.word.split('').filter((c) => c !== ' ').map((c) => normalizeChar(c))
  );

  const maxStrikes = stage.maxStrikes || 6;
  const currentStrikes = stage.strikes || 0;

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      {/* Header/Top Bar: Category, Hint and ERRORES indicator with circles */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="px-5 py-2 rounded-full bg-[var(--p-panel)] border border-[var(--p-line)] text-[var(--p-accent-ink)] font-black text-[22px] uppercase tracking-wide">
            {item.category || 'Adivina la Palabra'}
          </span>
          {item.hint && (
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--p-panel-2)] border border-[var(--p-line)] text-[var(--p-text-2)] font-semibold text-[22px]">
              <Sparkles className="w-5 h-5 text-[var(--p-accent-ink)]" />
              Pista: {item.hint}
            </span>
          )}
        </div>

        {/* ERRORES indicator */}
        <div className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-[var(--p-panel)] border border-[var(--p-line)]">
          <span className="text-[20px] font-black tracking-widest text-[var(--p-text-2)] uppercase mr-2">
            ERRORES
          </span>
          <div className="flex items-center gap-2.5">
            {Array.from({ length: maxStrikes }).map((_, idx) => {
              const isUsed = idx < currentStrikes;
              return isUsed ? (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-full bg-[var(--p-err-bg)] border-2 border-[var(--p-err)] text-[var(--p-err)] flex items-center justify-center font-black animate-in zoom-in-75 duration-200"
                >
                  <X className="w-6 h-6 stroke-[3]" />
                </div>
              ) : (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-full bg-[var(--p-ok-bg)] border-2 border-[var(--p-ok)]"
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Word Slots: ALWAYS on a single row with dynamic width and blank space gaps */}
      <div className="flex-1 flex items-center justify-center py-4 w-full overflow-hidden">
        {(() => {
          const chars = item.word.split('');
          const letterCount = chars.filter((c) => c !== ' ').length;
          const spaceCount = chars.filter((c) => c === ' ').length;
          const maxRowWidth = 1520;
          const spaceWidth = spaceCount > 0 ? Math.min(48, Math.max(16, Math.floor(160 / spaceCount))) : 0;
          const gapBetweenItems = Math.min(12, Math.max(4, Math.floor(180 / Math.max(1, chars.length))));
          const totalGaps = (chars.length - 1) * gapBetweenItems;
          const availableForCards = Math.max(200, maxRowWidth - (spaceCount * spaceWidth) - totalGaps);
          const cardWidth = Math.min(112, Math.max(38, Math.floor(availableForCards / Math.max(1, letterCount))));
          const cardHeight = Math.round(cardWidth * 1.25);
          const fontSize = Math.round(cardWidth * 0.76);

          return (
            <div
              className="flex flex-nowrap items-center justify-center w-full overflow-hidden"
              style={{ gap: `${gapBetweenItems}px` }}
            >
              {chars.map((char, index) => {
                if (char === ' ') {
                  return (
                    <div
                      key={index}
                      style={{ width: `${spaceWidth}px`, height: `${cardHeight}px` }}
                      className="shrink-0"
                    />
                  );
                }

                const norm = normalizeChar(char);
                const isGuessed = normalizedGuessed.has(norm);
                const isRevealed = isGuessed || stage.solved || stage.gameOver;

                return isRevealed ? (
                  <div
                    key={index}
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                      fontSize: `${fontSize}px`,
                    }}
                    className="shrink-0 rounded-2xl bg-[var(--p-brand)] text-[var(--p-on-brand)] font-black flex items-center justify-center shadow-md border-4 border-[var(--p-brand)] transition-all transform animate-in zoom-in-90"
                  >
                    {char.toUpperCase()}
                  </div>
                ) : (
                  <div
                    key={index}
                    style={{
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                    }}
                    className="shrink-0 rounded-2xl border-4 border-dashed border-[var(--p-line-strong)] bg-[var(--p-panel-2)] flex items-center justify-center text-transparent"
                  >
                    ?
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Full Keyboard below: A-Z + Ñ (27 letters) */}
      <div className="w-full flex flex-col items-center gap-2 pt-2">
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-6xl">
          {ALPHABET_27.map((letter) => {
            const norm = normalizeChar(letter);
            const isGuessed = normalizedGuessed.has(norm);
            const isCorrect = isGuessed && normalizedTargetChars.has(norm);
            const isWrong = isGuessed && !normalizedTargetChars.has(norm);

            let keyClasses = 'bg-[var(--p-panel)] border-[var(--p-line)] text-[var(--p-text)]';
            if (isCorrect) {
              keyClasses = 'bg-[var(--p-ok-bg)] border-[var(--p-ok)] text-[var(--p-ok)] font-black shadow-sm';
            } else if (isWrong) {
              keyClasses = 'bg-[var(--p-err-bg)] border-[var(--p-err)] text-[var(--p-err)] line-through opacity-80';
            }

            return (
              <div
                key={letter}
                className={`w-[60px] h-[66px] rounded-xl border-2 flex items-center justify-center font-black text-[28px] tracking-wide transition-all ${keyClasses}`}
              >
                {letter}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

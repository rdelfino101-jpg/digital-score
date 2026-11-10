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
        <HelpCircle className="w-24 h-24 text-[#FFC53D] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-white mb-3">AHORCADO PRO</h2>
        <p className="font-projector text-[28px] font-bold text-[#B8BCE6] uppercase tracking-wider">COMPETICIÓN EN VIVO</p>
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
          <span className="px-5 py-2 rounded-full bg-[#1C1F47] border border-[#2A2D5C] text-[#FFC53D] font-black text-[22px] uppercase tracking-wide">
            {item.category || 'Adivina la Palabra'}
          </span>
          {item.hint && (
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#15173A] border border-[#2A2D5C] text-[#B8BCE6] font-semibold text-[22px]">
              <Sparkles className="w-5 h-5 text-[#FFC53D]" />
              Pista: {item.hint}
            </span>
          )}
        </div>

        {/* ERRORES indicator: red with × for failed strikes, green empty for available */}
        <div className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-[#15173A] border border-[#2A2D5C]">
          <span className="text-[20px] font-black tracking-widest text-[#B8BCE6] uppercase mr-2">
            ERRORES
          </span>
          <div className="flex items-center gap-2.5">
            {Array.from({ length: maxStrikes }).map((_, idx) => {
              const isUsed = idx < currentStrikes;
              return isUsed ? (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-full bg-[#3F1216] border-2 border-[#EF4444] text-[#EF4444] flex items-center justify-center font-black animate-in zoom-in-75 duration-200"
                >
                  <X className="w-6 h-6 stroke-[3]" />
                </div>
              ) : (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-full bg-[#0F5132]/40 border-2 border-[#4ADE80]/60"
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Word Slots: 112x140px white cards for guessed letters, dashed border for missing */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-6xl">
          {item.word.split('').map((char, index) => {
            if (char === ' ') {
              return <div key={index} className="w-12 h-[140px]" />;
            }

            const norm = normalizeChar(char);
            const isGuessed = normalizedGuessed.has(norm);
            const isRevealed = isGuessed || stage.solved || stage.gameOver;

            return isRevealed ? (
              <div
                key={index}
                className="w-[112px] h-[140px] rounded-2xl bg-white text-slate-950 font-black text-[76px] flex items-center justify-center shadow-2xl border-4 border-white transition-all transform animate-in zoom-in-90"
              >
                {char.toUpperCase()}
              </div>
            ) : (
              <div
                key={index}
                className="w-[112px] h-[140px] rounded-2xl border-4 border-dashed border-[#2A2D5C] bg-[#15173A]/60 flex items-center justify-center text-transparent"
              >
                ?
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Keyboard below: A-Z + Ñ (27 letters) */}
      <div className="w-full flex flex-col items-center gap-2 pt-2">
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-6xl">
          {ALPHABET_27.map((letter) => {
            const norm = normalizeChar(letter);
            const isGuessed = normalizedGuessed.has(norm);
            const isCorrect = isGuessed && normalizedTargetChars.has(norm);
            const isWrong = isGuessed && !normalizedTargetChars.has(norm);

            let keyClasses = 'bg-[#15173A] border-[#2A2D5C] text-white hover:border-[#4B5299]';
            if (isCorrect) {
              keyClasses = 'bg-[#0F5132] border-[#4ADE80] text-[#4ADE80] font-black shadow-lg shadow-[#0F5132]/50';
            } else if (isWrong) {
              keyClasses = 'bg-[#3F1216] border-[#EF4444] text-[#EF4444] line-through opacity-85';
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

import React from 'react';
import { BibleBookGameState } from '../../../types/masterStudio';
import { AnswerOption } from '../common/AnswerOption';
import { Sparkles, BookOpen } from 'lucide-react';

interface BibleBookArenaProps {
  stage: BibleBookGameState;
}

export const BibleBookArena: React.FC<BibleBookArenaProps> = ({ stage }) => {
  const items = stage?.items || [];
  const currentIndex = stage?.currentIndex ?? 0;
  const item = items[currentIndex];

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <BookOpen className="w-24 h-24 text-[#FFC53D] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-white mb-3">¿EN QUÉ LIBRO ESTÁ?</h2>
        <p className="font-projector text-[28px] font-bold text-[#B8BCE6] uppercase tracking-wider">COMPETICIÓN EN VIVO</p>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D'] as const;

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      {/* Top badges / meta */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1C1F47] border border-[#2A2D5C] text-[#FFC53D] font-black text-[22px] tracking-wide uppercase">
            <BookOpen className="w-6 h-6 text-[#FFC53D]" />
            {item.testament}
          </span>
          {item.hint && (
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#15173A] border border-[#4B5299] text-[#B8BCE6] font-semibold text-[22px]">
              <Sparkles className="w-5 h-5 text-[#FFC53D]" />
              Pista: {item.hint}
            </span>
          )}
        </div>

        {stage.revealed && (
          <div className="px-6 py-2.5 rounded-xl bg-[#0F5132] border-2 border-[#4ADE80] text-[#4ADE80] font-black text-[24px] uppercase tracking-wider animate-in fade-in duration-200">
            Cita: {item.reference}
          </div>
        )}
      </div>

      {/* Main Quote / Verse in 74px centered */}
      <div className="flex-1 flex items-center justify-center px-12 py-4">
        <blockquote className="text-center max-w-6xl">
          <p className="text-[74px] font-black leading-[1.12] text-white tracking-tight drop-shadow-md">
            “{item.verseOrEvent}”
          </p>
        </blockquote>
      </div>

      {/* 4 Options in 2x2 grid of 124px height */}
      <div className="grid grid-cols-2 gap-5 w-full">
        {item.options.map((opt, idx) => {
          const badge = optionLetters[idx] || 'A';
          const isSelected = stage.selectedOption === opt;
          const isCorrect = opt === item.book;

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
              style={{ height: '124px', minHeight: '124px' }}
            />
          );
        })}
      </div>
    </div>
  );
};

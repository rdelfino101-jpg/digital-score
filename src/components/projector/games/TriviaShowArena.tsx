import React from 'react';
import { TriviaShowGameState } from '../../../types/masterStudio';
import { AnswerOption } from '../common/AnswerOption';
import { Zap, HelpCircle, CheckCircle2 } from 'lucide-react';

interface TriviaShowArenaProps {
  stage: TriviaShowGameState;
}

export const TriviaShowArena: React.FC<TriviaShowArenaProps> = ({ stage }) => {
  const items = stage?.items || [];
  const currentIndex = stage?.currentIndex ?? 0;
  const item = items[currentIndex];

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <HelpCircle className="w-24 h-24 text-[#FFC53D] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-white mb-3">TRIVIA SHOW</h2>
        <p className="font-projector text-[28px] font-bold text-[#B8BCE6] uppercase tracking-wider">COMPETICIÓN EN VIVO</p>
      </div>
    );
  }

  const optionKeys = ['A', 'B', 'C', 'D'] as const;
  const is5050Used = stage.used5050 || (stage.hiddenOptions5050 && stage.hiddenOptions5050.length > 0);

  return (
    <div className="flex flex-col h-full justify-between gap-5">
      {/* Top row: Category, points & 50:50 chip */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-5 py-2 rounded-full bg-[#1C1F47] border border-[#2A2D5C] text-[#FFC53D] font-black text-[22px] uppercase tracking-wide">
            {item.category || 'Trivia'}
          </span>
          <span className="px-5 py-2 rounded-full bg-[#15173A] border border-[#2A2D5C] text-white font-bold text-[22px]">
            {item.points} PUNTOS
          </span>
        </div>

        {is5050Used && (
          <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-[#3A2A05] border-2 border-[#FFC53D] text-[#FFC53D] font-black text-[22px] uppercase tracking-wider animate-in fade-in">
            <Zap className="w-6 h-6 text-[#FFC53D]" />
            50:50 usado
          </div>
        )}
      </div>

      {/* Question Text in 62px */}
      <div className="flex-1 flex items-center justify-center px-8 py-3">
        <h2 className="text-[62px] font-black leading-[1.14] text-white text-center max-w-6xl tracking-tight drop-shadow-md">
          {item.question}
        </h2>
      </div>

      {/* 2x2 Options Grid with AnswerOption (124px height) */}
      <div className="grid grid-cols-2 gap-5 w-full">
        {optionKeys.map((key) => {
          const text = item.options[key];
          const isHidden5050 = stage.hiddenOptions5050?.includes(key);
          const isSelected = stage.selectedOption === key;
          const isCorrect = item.correctAnswer === key;

          let optionState: 'normal' | 'selected' | 'correct' | 'incorrect' | 'fifty_fifty' = 'normal';

          if (isHidden5050) {
            optionState = 'fifty_fifty';
          } else if (stage.revealed) {
            if (isCorrect) optionState = 'correct';
            else if (isSelected) optionState = 'incorrect';
          } else if (isSelected) {
            optionState = 'selected';
          }

          return (
            <AnswerOption
              key={key}
              badge={key}
              text={text}
              state={optionState}
              points={isCorrect && stage.revealed ? item.points : undefined}
              style={{ height: '124px', minHeight: '124px' }}
            />
          );
        })}
      </div>

      {/* On reveal: green explanation banner below options */}
      {stage.revealed && item.explanation && (
        <div className="w-full px-8 py-4 rounded-2xl bg-[#0F5132] border-2 border-[#4ADE80] text-white flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 className="w-10 h-10 text-[#4ADE80] shrink-0" />
          <div className="flex-1">
            <span className="text-[20px] font-black tracking-wider uppercase text-[#4ADE80] block mb-0.5">
              Explicación Oficial
            </span>
            <p className="text-[26px] font-medium leading-snug text-white">
              {item.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

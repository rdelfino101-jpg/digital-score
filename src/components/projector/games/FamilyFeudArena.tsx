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
        <HelpCircle className="w-24 h-24 text-[#FFC53D] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-white mb-3">100 PERSONAS DIJERON</h2>
        <p className="font-projector text-[28px] font-bold text-[#B8BCE6] uppercase tracking-wider">COMPETICIÓN EN VIVO</p>
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

  return (
    <div className="flex flex-col h-full justify-between gap-5">
      {/* Top row: Pot/Bolsa in Gold Box + Strikes (up to 3 large red X) */}
      <div className="flex items-center justify-between gap-6">
        {/* Pot Score in Gold Box */}
        <div className="flex items-center gap-4 px-8 py-3 rounded-2xl bg-[#3A2A05] border-4 border-[#FFC53D] shadow-xl shadow-[#FFC53D]/10">
          <Trophy className="w-10 h-10 text-[#FFC53D]" />
          <div>
            <span className="text-[18px] font-black tracking-widest text-[#FFC53D] uppercase block">
              BOLSA ACUMULADA
            </span>
            <span className="text-[52px] font-black leading-none text-white tabular-numbers">
              {stage.potScore || 0} <span className="text-[28px] text-[#FFC53D]">PTS</span>
            </span>
          </div>
        </div>

        {/* Strikes (3 large red X slots) */}
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#15173A] border border-[#2A2D5C]">
          <span className="text-[20px] font-black tracking-widest text-[#B8BCE6] uppercase mr-2">
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
                      ? 'bg-[#3F1216] border-[#EF4444] text-[#EF4444] shadow-lg shadow-[#EF4444]/40 scale-105'
                      : 'bg-[#1C1F47] border-[#2A2D5C] text-[#2A2D5C]'
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
        <h2 className="text-[58px] font-black leading-[1.12] text-white text-center max-w-6xl tracking-tight drop-shadow-md">
          {item.question}
        </h2>
      </div>

      {/* Answers Board in 2 columns with rows of 112px height */}
      <div className="grid grid-cols-2 gap-5 w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {leftCol.map((ans, idx) => {
            const isRevealed = ans.revealed || revealedIds.has(ans.id);
            const displayNumber = idx + 1;

            return (
              <div
                key={ans.id}
                style={{ height: '112px', minHeight: '112px' }}
                className={`w-full rounded-2xl px-6 flex items-center justify-between border-4 transition-all duration-500 transform ${
                  isRevealed
                    ? 'bg-[#15173A] border-[#FFC53D] shadow-xl'
                    : 'bg-[#15173A]/80 border-[#2A2D5C]'
                }`}
              >
                {isRevealed ? (
                  <>
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-[#1C1F47] border-2 border-[#FFC53D] text-[#FFC53D] font-black text-[28px] flex items-center justify-center shrink-0">
                        {displayNumber}
                      </div>
                      <span className="text-[34px] font-black text-white truncate uppercase tracking-wide">
                        {ans.text}
                      </span>
                    </div>
                    <div className="px-6 py-2 rounded-xl bg-[#3A2A05] border-2 border-[#FFC53D] text-[#FFC53D] font-black text-[40px] tabular-numbers shrink-0 ml-4">
                      {ans.points}
                    </div>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#1C1F47] border-2 border-[#4B5299] text-[#B8BCE6] font-black text-[30px] flex items-center justify-center shadow-inner">
                      {displayNumber}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {rightCol.map((ans, idx) => {
            const isRevealed = ans.revealed || revealedIds.has(ans.id);
            const displayNumber = leftCol.length + idx + 1;

            return (
              <div
                key={ans.id}
                style={{ height: '112px', minHeight: '112px' }}
                className={`w-full rounded-2xl px-6 flex items-center justify-between border-4 transition-all duration-500 transform ${
                  isRevealed
                    ? 'bg-[#15173A] border-[#FFC53D] shadow-xl'
                    : 'bg-[#15173A]/80 border-[#2A2D5C]'
                }`}
              >
                {isRevealed ? (
                  <>
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-[#1C1F47] border-2 border-[#FFC53D] text-[#FFC53D] font-black text-[28px] flex items-center justify-center shrink-0">
                        {displayNumber}
                      </div>
                      <span className="text-[34px] font-black text-white truncate uppercase tracking-wide">
                        {ans.text}
                      </span>
                    </div>
                    <div className="px-6 py-2 rounded-xl bg-[#3A2A05] border-2 border-[#FFC53D] text-[#FFC53D] font-black text-[40px] tabular-numbers shrink-0 ml-4">
                      {ans.points}
                    </div>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#1C1F47] border-2 border-[#4B5299] text-[#B8BCE6] font-black text-[30px] flex items-center justify-center shadow-inner">
                      {displayNumber}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

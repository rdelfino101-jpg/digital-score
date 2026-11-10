import React from 'react';
import { MillionaireGameState } from '../../../types/masterStudio';
import { AnswerOption } from '../common/AnswerOption';
import { Zap, Users, PhoneCall, Shuffle, ShieldCheck, CheckCircle2, Trophy, Clock } from 'lucide-react';

interface MillionaireArenaProps {
  stage: MillionaireGameState;
}

const MILLIONAIRE_LADDER = [
  { level: 15, points: '1,000,000 PTS' },
  { level: 14, points: '500,000 PTS' },
  { level: 13, points: '250,000 PTS' },
  { level: 12, points: '125,000 PTS' },
  { level: 11, points: '64,000 PTS' },
  { level: 10, points: '32,000 PTS' },
  { level: 9, points: '16,000 PTS' },
  { level: 8, points: '8,000 PTS' },
  { level: 7, points: '4,000 PTS' },
  { level: 6, points: '2,000 PTS' },
  { level: 5, points: '1,000 PTS' },
  { level: 4, points: '500 PTS' },
  { level: 3, points: '300 PTS' },
  { level: 2, points: '200 PTS' },
  { level: 1, points: '100 PTS' },
];

export const MillionaireArena: React.FC<MillionaireArenaProps> = ({ stage }) => {
  const items = stage?.items || [];
  const currentIndex = stage?.currentIndex ?? 0;
  const item = items[currentIndex];
  const optionKeys = ['A', 'B', 'C', 'D'] as const;
  const safeHavens = new Set(stage?.safeHavenLevels || [5, 10]);
  const currentLvl = stage?.currentLevel || 1;

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Trophy className="w-24 h-24 text-[#FFC53D] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-white mb-3">¿QUIÉN QUIERE SER MILLONARIO?</h2>
        <p className="font-projector text-[28px] font-bold text-[#B8BCE6] uppercase tracking-wider">COMPETICIÓN EN VIVO</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-8">
      {/* Left Column: Game Area (Question, Options, Lifelines, Overlays) */}
      <div className="flex-1 flex flex-col justify-between h-full gap-5">
        {/* Top bar: Question Level & Accumulated Pot */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-6 py-2.5 rounded-full bg-[#1C1F47] border-2 border-[#FFC53D] text-[#FFC53D] font-black text-[24px] uppercase tracking-wider">
              NIVEL {currentLvl} DE 15
            </span>
            <span className="px-6 py-2.5 rounded-full bg-[#15173A] border border-[#2A2D5C] text-white font-bold text-[24px]">
              POR {item.points?.toLocaleString() || '100'} PUNTOS
            </span>
          </div>

          <div className="px-6 py-2 rounded-2xl bg-[#3A2A05] border-2 border-[#FFC53D] text-[#FFC53D] font-black text-[22px]">
            Acumulado: {stage.accumulatedPoints?.toLocaleString() || 0} PTS
          </div>
        </div>

        {/* Modal/Overlay for Audience Poll if active */}
        {stage.showAudiencePoll && stage.audiencePollResults && (
          <div className="w-full p-6 rounded-3xl bg-[#15173A] border-4 border-[#4F7BFF] animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-[#4F7BFF] mb-4">
              <Users className="w-8 h-8" />
              <span className="text-[24px] font-black tracking-widest uppercase">
                VOTACIÓN DEL PÚBLICO EN TIEMPO REAL
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {optionKeys.map((key) => {
                const percent = stage.audiencePollResults?.[key] ?? 25;
                return (
                  <div key={key} className="flex flex-col items-center gap-2">
                    <span className="text-[32px] font-black text-white">{percent}%</span>
                    <div className="w-full h-28 bg-[#1C1F47] rounded-xl overflow-hidden flex flex-col justify-end p-1 border border-[#2A2D5C]">
                      <div
                        className="w-full bg-[#4F7BFF] rounded-lg transition-all duration-500"
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[26px] font-black text-[#FFC53D]">OPCIÓN {key}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal/Overlay for Phone Call if active */}
        {stage.showPhoneCall && (
          <div className="w-full p-6 rounded-3xl bg-[#15173A] border-4 border-[#FF8A1F] flex items-center justify-between animate-in zoom-in-95">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#FF8A1F]/20 border-2 border-[#FF8A1F] text-[#FF8A1F] flex items-center justify-center animate-pulse">
                <PhoneCall className="w-10 h-10" />
              </div>
              <div>
                <span className="text-[22px] font-black text-[#FF8A1F] uppercase tracking-wider block">
                  LLAMADA AL EXPERTO ACTIVA
                </span>
                <span className="text-[26px] text-[#B8BCE6] font-semibold">
                  El participante está consultando con su contacto telefónico
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-[#1C1F47] border-2 border-[#FF8A1F]">
              <Clock className="w-8 h-8 text-[#FF8A1F]" />
              <span className="text-[52px] font-black text-white tabular-numbers">
                {stage.phoneCallSecondsRemaining ?? 30}s
              </span>
            </div>
          </div>
        )}

        {/* Question Text in 52px */}
        <div className="flex-1 flex items-center justify-center px-6 py-2">
          <h2 className="text-[52px] font-black leading-[1.14] text-white text-center max-w-5xl tracking-tight drop-shadow-md">
            {item.question}
          </h2>
        </div>

        {/* 2x2 Options Grid with AnswerOption (124px height) */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {optionKeys.map((key) => {
            const text = item.options[key];
            const isHidden5050 = stage.hiddenOptions5050?.includes(key);
            const isSelected = stage.selectedOption === key;
            const isCorrect = item.correctAnswer === key;

            let optionState: 'normal' | 'selected' | 'correct' | 'incorrect' | 'fifty_fifty' | 'final_answer' = 'normal';

            if (isHidden5050) {
              optionState = 'fifty_fifty';
            } else if (stage.revealed) {
              if (isCorrect) optionState = 'correct';
              else if (isSelected) optionState = 'incorrect';
            } else if (isSelected) {
              optionState = stage.isFinalAnswer ? 'final_answer' : 'selected';
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

        {/* Lifelines Row below options: crossed out if used */}
        <div className="grid grid-cols-4 gap-4 w-full pt-1">
          {/* 50:50 */}
          <div
            className={`flex items-center justify-center gap-3 py-3 rounded-2xl border-2 transition-all ${
              stage.lifelines?.fiftyFifty
                ? 'bg-[#15173A]/40 border-[#2A2D5C] text-[#B8BCE6]/40 line-through'
                : 'bg-[#15173A] border-[#FFC53D] text-[#FFC53D] shadow-lg shadow-[#FFC53D]/10'
            }`}
          >
            <Zap className="w-6 h-6 shrink-0" />
            <span className="text-[20px] font-black tracking-wider uppercase">50:50</span>
          </div>

          {/* Público */}
          <div
            className={`flex items-center justify-center gap-3 py-3 rounded-2xl border-2 transition-all ${
              stage.lifelines?.audiencePoll
                ? 'bg-[#15173A]/40 border-[#2A2D5C] text-[#B8BCE6]/40 line-through'
                : 'bg-[#15173A] border-[#4F7BFF] text-[#4F7BFF] shadow-lg shadow-[#4F7BFF]/10'
            }`}
          >
            <Users className="w-6 h-6 shrink-0" />
            <span className="text-[20px] font-black tracking-wider uppercase">Público</span>
          </div>

          {/* Llamada */}
          <div
            className={`flex items-center justify-center gap-3 py-3 rounded-2xl border-2 transition-all ${
              stage.lifelines?.phoneCall
                ? 'bg-[#15173A]/40 border-[#2A2D5C] text-[#B8BCE6]/40 line-through'
                : 'bg-[#15173A] border-[#FF8A1F] text-[#FF8A1F] shadow-lg shadow-[#FF8A1F]/10'
            }`}
          >
            <PhoneCall className="w-6 h-6 shrink-0" />
            <span className="text-[20px] font-black tracking-wider uppercase">Llamada</span>
          </div>

          {/* Cambio */}
          <div
            className={`flex items-center justify-center gap-3 py-3 rounded-2xl border-2 transition-all ${
              stage.lifelines?.switchQuestion
                ? 'bg-[#15173A]/40 border-[#2A2D5C] text-[#B8BCE6]/40 line-through'
                : 'bg-[#15173A] border-[#E04FD8] text-[#E04FD8] shadow-lg shadow-[#E04FD8]/10'
            }`}
          >
            <Shuffle className="w-6 h-6 shrink-0" />
            <span className="text-[20px] font-black tracking-wider uppercase">Cambio</span>
          </div>
        </div>
      </div>

      {/* Right Column: 15-Level Ladder (46px row height) */}
      <div className="w-[380px] flex flex-col justify-between rounded-3xl bg-[#15173A] border-2 border-[#2A2D5C] p-3 shadow-2xl shrink-0">
        <div className="text-center py-1.5 border-b border-[#2A2D5C]">
          <span className="text-[18px] font-black tracking-widest text-[#B8BCE6] uppercase">
            ESCALERA DE PREMIOS
          </span>
        </div>

        <div className="flex flex-col gap-1 my-1">
          {MILLIONAIRE_LADDER.map((step) => {
            const isCurrent = step.level === currentLvl;
            const isPassed = step.level < currentLvl;
            const isSafeHaven = safeHavens.has(step.level);
            const isTopPrize = step.level === 15;

            let rowStyle = 'bg-[#1C1F47]/50 text-[#B8BCE6] border-transparent';
            if (isCurrent) {
              rowStyle = 'bg-[#3A2A05] border-2 border-[#FFC53D] text-[#FFC53D] shadow-lg scale-105 z-10';
            } else if (isPassed) {
              rowStyle = 'bg-[#0F5132]/60 text-[#4ADE80] border-transparent';
            } else if (isSafeHaven) {
              rowStyle = 'bg-[#1C1F47] border-2 border-[#4F7BFF] text-white';
            }

            return (
              <div
                key={step.level}
                style={{ height: '44px', minHeight: '44px' }}
                className={`w-full rounded-xl px-4 flex items-center justify-between transition-all ${rowStyle}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[20px] font-black w-7 text-right">
                    {step.level}
                  </span>
                  {isSafeHaven && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#4F7BFF]/30 text-[#4F7BFF] text-[13px] font-black uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Seguro
                    </span>
                  )}
                  {isTopPrize && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FFC53D]/30 text-[#FFC53D] text-[13px] font-black uppercase tracking-wider">
                      <Trophy className="w-3.5 h-3.5" />
                      Meta
                    </span>
                  )}
                </div>

                <span className="text-[22px] font-black tabular-numbers">
                  {step.points}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { MillionaireGameState } from '../../../types/masterStudio';
import { AnswerOption } from '../common/AnswerOption';
import { Zap, Users, PhoneCall, Shuffle, ShieldCheck, Trophy, Clock } from 'lucide-react';

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
        <Trophy className="w-24 h-24 text-[var(--p-accent-ink)] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-[var(--p-text)] mb-3">¿Quién quiere ser millonario?</h2>
        <p className="font-projector text-[28px] font-bold text-[var(--p-text-2)] uppercase tracking-wider">Competición en vivo</p>
      </div>
    );
  }

  const lifelinesConfig = [
    { key: 'fiftyFifty' as const, label: '50:50', icon: Zap },
    { key: 'audiencePoll' as const, label: 'Público', icon: Users },
    { key: 'phoneCall' as const, label: 'Llamada', icon: PhoneCall },
    { key: 'switchQuestion' as const, label: 'Cambio', icon: Shuffle },
  ];

  return (
    <div className="flex h-full gap-8">
      {/* Left Column: Game Area */}
      <div className="flex-1 flex flex-col justify-between h-full gap-5">
        {/* Top bar: Question Level & Accumulated Pot */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-6 py-2.5 rounded-full bg-[var(--p-brand)] text-[var(--p-on-brand)] font-black text-[24px] uppercase tracking-wider">
              NIVEL {currentLvl} DE 15
            </span>
            <span className="px-6 py-2.5 rounded-full bg-[var(--p-panel)] border border-[var(--p-line)] text-[var(--p-text)] font-bold text-[24px]">
              POR {item.points?.toLocaleString() || '100'} PUNTOS
            </span>
          </div>

          <div className="px-6 py-2 rounded-2xl bg-[var(--p-accent-soft)] border-2 border-[var(--p-accent-ink)] text-[var(--p-accent-ink)] font-black text-[22px]">
            Acumulado: {stage.accumulatedPoints?.toLocaleString() || 0} PTS
          </div>
        </div>

        {/* Overlay for Audience Poll if active */}
        {stage.showAudiencePoll && stage.audiencePollResults && (
          <div className="w-full p-6 rounded-3xl bg-[var(--p-panel)] border-4 border-[var(--p-brand)] shadow-md animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-[var(--p-accent-ink)] mb-4">
              <Users className="w-8 h-8" />
              <span className="text-[24px] font-black tracking-widest uppercase">
                Votación del público en tiempo real
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {optionKeys.map((key) => {
                const percent = stage.audiencePollResults?.[key] ?? 25;
                return (
                  <div key={key} className="flex flex-col items-center gap-2">
                    <span className="text-[32px] font-black text-[var(--p-text)]">{percent}%</span>
                    <div className="w-full h-28 bg-[var(--p-panel-2)] rounded-xl overflow-hidden flex flex-col justify-end p-1 border border-[var(--p-line)]">
                      <div
                        className="w-full bg-[var(--p-brand)] rounded-lg transition-all duration-500"
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[26px] font-black text-[var(--p-accent-ink)]">OPCIÓN {key}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Overlay for Phone Call if active */}
        {stage.showPhoneCall && (
          <div className="w-full p-6 rounded-3xl bg-[var(--p-panel)] border-4 border-[var(--p-accent-ink)] shadow-md flex items-center justify-between animate-in zoom-in-95">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--p-accent)] text-[var(--p-on-accent)] flex items-center justify-center animate-pulse">
                <PhoneCall className="w-10 h-10" />
              </div>
              <div>
                <span className="text-[22px] font-black text-[var(--p-accent-ink)] uppercase tracking-wider block">
                  Llamada al experto activa
                </span>
                <span className="text-[26px] text-[var(--p-text-2)] font-semibold">
                  El participante está consultando con su contacto telefónico
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-[var(--p-panel-2)] border-2 border-[var(--p-accent-ink)]">
              <Clock className="w-8 h-8 text-[var(--p-accent-ink)]" />
              <span className="text-[52px] font-black text-[var(--p-text)] tabular-numbers">
                {stage.phoneCallSecondsRemaining ?? 30}s
              </span>
            </div>
          </div>
        )}

        {/* Question Text in 52px */}
        <div className="flex-1 flex items-center justify-center px-6 py-2">
          <h2 className="text-[52px] font-black leading-[1.14] text-[var(--p-text)] text-center max-w-5xl tracking-tight">
            {item.question}
          </h2>
        </div>

        {/* 2x2 Options Grid */}
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

        {/* Lifelines Row */}
        <div className="grid grid-cols-4 gap-4 w-full pt-1">
          {lifelinesConfig.map((lf) => {
            const Icon = lf.icon;
            const isUsed = Boolean(stage.lifelines?.[lf.key]);
            return (
              <div
                key={lf.key}
                className={`flex items-center justify-center gap-3 py-3 rounded-2xl border-2 transition-all ${
                  isUsed
                    ? 'bg-[var(--p-panel-2)] border-[var(--p-line)] text-[var(--p-text-3)] line-through opacity-50'
                    : 'bg-[var(--p-panel)] border-[var(--p-accent-ink)] text-[var(--p-accent-ink)] shadow-sm'
                }`}
              >
                <Icon className="w-6 h-6 shrink-0" />
                <span className="text-[20px] font-black tracking-wider uppercase">{lf.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: 15-Level Ladder */}
      <div className="w-[380px] flex flex-col justify-between rounded-3xl bg-[var(--p-panel)] border-2 border-[var(--p-line)] p-3 shadow-md shrink-0">
        <div className="text-center py-1.5 border-b border-[var(--p-line)]">
          <span className="text-[18px] font-black tracking-widest text-[var(--p-text-2)] uppercase">
            Escalera de premios
          </span>
        </div>

        <div className="flex flex-col gap-1 my-1">
          {MILLIONAIRE_LADDER.map((step) => {
            const isCurrent = step.level === currentLvl;
            const isPassed = step.level < currentLvl;
            const isSafeHaven = safeHavens.has(step.level);
            const isTopPrize = step.level === 15;

            let rowStyle = 'bg-[var(--p-panel-2)] text-[var(--p-text-2)] border-transparent';
            if (isCurrent) {
              rowStyle = 'bg-[var(--p-accent)] text-[var(--p-on-accent)] border-2 border-[var(--p-accent-ink)] shadow-sm scale-[1.03] z-10';
            } else if (isPassed) {
              rowStyle = 'bg-[var(--p-ok-bg)] text-[var(--p-ok)] border-transparent';
            } else if (isSafeHaven) {
              rowStyle = 'bg-[var(--p-brand)] text-[var(--p-on-brand)] border-transparent';
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
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[13px] font-black uppercase tracking-wider ${
                        isCurrent
                          ? 'bg-black/15 text-[var(--p-on-accent)]'
                          : isPassed
                          ? 'bg-[var(--p-panel)] text-[var(--p-ok)]'
                          : 'bg-white/15 text-[var(--p-on-brand)]'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Seguro
                    </span>
                  )}
                  {isTopPrize && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[13px] font-black uppercase tracking-wider ${
                        isCurrent
                          ? 'bg-black/15 text-[var(--p-on-accent)]'
                          : 'bg-[var(--p-accent-soft)] text-[var(--p-accent-ink)]'
                      }`}
                    >
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

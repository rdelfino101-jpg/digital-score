import React from 'react';
import { DealOrNoDealGameState } from '../../../types/masterStudio';
import { Briefcase, PhoneCall, CheckCircle2, XCircle } from 'lucide-react';

interface DealOrNoDealArenaProps {
  stage: DealOrNoDealGameState;
}

export const DealOrNoDealArena: React.FC<DealOrNoDealArenaProps> = ({ stage }) => {
  const briefcases = stage?.briefcases || [];

  if (briefcases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Briefcase className="w-24 h-24 text-[var(--p-accent-ink)] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-[var(--p-text)] mb-3">Trato Hecho</h2>
        <p className="font-projector text-[28px] font-bold text-[var(--p-text-2)] uppercase tracking-wider">Competición en vivo</p>
      </div>
    );
  }

  const sortedValues = [...briefcases].sort((a, b) => a.value - b.value);
  const midPoint = Math.ceil(sortedValues.length / 2);
  const lowValues = sortedValues.slice(0, midPoint);
  const highValues = sortedValues.slice(midPoint);

  const contestantCase = briefcases.find(
    (b) => b.number === stage?.contestantBriefcaseNumber || b.isContestantBriefcase
  );

  const showBankerBanner =
    (stage?.bankerOffer || 0) > 0 &&
    (stage?.isBankerOfferPending ||
      stage?.gameStatus === 'banker_offer' ||
      stage?.isBankerCallActive ||
      stage?.bankerOfferAccepted !== null);

  return (
    <div className="flex flex-col h-full justify-between gap-5">
      {/* Top Banner: Banker Offer or Round Info */}
      {showBankerBanner ? (
        <div className="w-full py-5 px-8 rounded-3xl bg-[var(--p-brand)] border-4 border-[var(--p-accent)] text-[var(--p-on-brand)] shadow-lg flex items-center justify-between animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[var(--p-accent)] text-[var(--p-on-accent)] flex items-center justify-center">
              <PhoneCall className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <span className="text-[22px] font-black tracking-widest text-[var(--p-brand-2)] uppercase block">
                Oferta oficial del banquero
              </span>
              <span className="text-[52px] font-black text-[var(--p-on-brand)] leading-none tabular-numbers">
                {stage.bankerOffer.toLocaleString()} <span className="text-[30px] text-[var(--p-brand-2)]">PTS</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[34px] font-black text-[var(--p-on-brand)] uppercase tracking-wide block">
              ¿Trato o no trato?
            </span>
            {stage.bankerOfferAccepted === true && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--p-ok-bg)] text-[var(--p-ok)] px-4 py-1 text-[24px] font-bold mt-1">
                <CheckCircle2 className="w-6 h-6" /> ¡Trato aceptado!
              </span>
            )}
            {stage.bankerOfferAccepted === false && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--p-err-bg)] text-[var(--p-err)] px-4 py-1 text-[24px] font-bold mt-1">
                <XCircle className="w-6 h-6" /> ¡Rechazado! Sigue el juego
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-5 py-2 rounded-full bg-[var(--p-panel)] border border-[var(--p-line)] text-[var(--p-accent-ink)] font-black text-[22px] uppercase tracking-wide">
              Ronda {stage.currentRound || 1}
            </span>
            <span className="px-5 py-2 rounded-full bg-[var(--p-panel-2)] border border-[var(--p-line)] text-[var(--p-text-2)] font-semibold text-[22px]">
              Maletines restantes por abrir: {Math.max(0, (stage.briefcasesToOpenThisRound || 1) - (stage.briefcasesOpenedThisRound || 0))}
            </span>
          </div>

          {contestantCase && (
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-[var(--p-accent)] text-[var(--p-on-accent)] font-black text-[22px]">
              <Briefcase className="w-6 h-6" />
              SU MALETÍN: #{contestantCase.number}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left Values Column, 4x4 Briefcases Grid, Right Values Column */}
      <div className="flex-1 flex items-center justify-between gap-8 py-2">
        {/* Left Column: Low Values */}
        <div className="w-[220px] flex flex-col gap-2 shrink-0">
          <div className="text-center py-1 border-b border-[var(--p-line)] mb-1">
            <span className="text-[18px] font-black tracking-widest text-[var(--p-text-2)] uppercase">
              Valores bajos
            </span>
          </div>
          {lowValues.map((caseItem) => {
            const isEliminated = caseItem.isOpen;
            return (
              <div
                key={`low-${caseItem.id}`}
                className={`py-2 px-4 rounded-xl border flex items-center justify-between transition-all ${
                  isEliminated
                    ? 'bg-[var(--p-panel-2)] border-[var(--p-line)] text-[var(--p-text-3)] opacity-45 line-through'
                    : 'bg-[var(--p-panel)] border-[var(--p-line-strong)] text-[var(--p-text)] font-black'
                }`}
              >
                <span className="text-[20px] font-bold text-[var(--p-text-3)]">#{caseItem.number}</span>
                <span className="text-[22px] font-black tabular-numbers">{caseItem.value.toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        {/* Center: 4x4 Grid of 120px Briefcases */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="grid grid-cols-4 gap-4">
            {briefcases.map((bc) => {
              const isSelectedMine =
                bc.number === stage.contestantBriefcaseNumber || bc.isContestantBriefcase;

              // Opened briefcase
              if (bc.isOpen) {
                return (
                  <div
                    key={bc.id}
                    className="w-[120px] h-[120px] rounded-2xl border-4 border-dashed border-[var(--p-line)] bg-[var(--p-panel-2)] flex flex-col items-center justify-center p-2 text-center transition-all opacity-65"
                  >
                    <span className="text-[14px] font-bold text-[var(--p-text-3)] uppercase">#{bc.number}</span>
                    <span className="text-[22px] font-black text-[var(--p-accent-ink)] leading-tight tabular-numbers">
                      {bc.value.toLocaleString()}
                    </span>
                    <span className="text-[12px] text-[var(--p-text-3)]">PTS</span>
                  </div>
                );
              }

              // Contestant's chosen briefcase
              if (isSelectedMine) {
                return (
                  <div
                    key={bc.id}
                    className="w-[120px] h-[120px] rounded-2xl border-4 border-[var(--p-accent-ink)] bg-[var(--p-accent)] text-[var(--p-on-accent)] flex flex-col items-center justify-center p-2 text-center shadow-md transform scale-105"
                  >
                    <Briefcase className="w-6 h-6 mb-0.5" />
                    <span className="text-[34px] font-black leading-none">{bc.number}</span>
                    <span className="text-[12px] font-black tracking-wider uppercase mt-1">SU MALETÍN</span>
                  </div>
                );
              }

              // Normal unopened briefcase card
              return (
                <div
                  key={bc.id}
                  className="w-[120px] h-[120px] rounded-2xl border-4 border-[var(--p-brand)] bg-[var(--p-brand)] text-[var(--p-on-brand)] font-black flex flex-col items-center justify-center shadow-md transition-all"
                >
                  <span className="text-[14px] font-bold text-[var(--p-brand-2)] uppercase tracking-widest">MALETÍN</span>
                  <span className="text-[40px] font-black leading-none">{bc.number}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: High Values */}
        <div className="w-[220px] flex flex-col gap-2 shrink-0">
          <div className="text-center py-1 border-b border-[var(--p-line)] mb-1">
            <span className="text-[18px] font-black tracking-widest text-[var(--p-accent-ink)] uppercase">
              Premios mayores
            </span>
          </div>
          {highValues.map((caseItem) => {
            const isEliminated = caseItem.isOpen;
            return (
              <div
                key={`high-${caseItem.id}`}
                className={`py-2 px-4 rounded-xl border flex items-center justify-between transition-all ${
                  isEliminated
                    ? 'bg-[var(--p-panel-2)] border-[var(--p-line)] text-[var(--p-text-3)] opacity-45 line-through'
                    : 'bg-[var(--p-accent-soft)] border-[var(--p-accent-ink)] text-[var(--p-text)] font-black'
                }`}
              >
                <span className="text-[20px] font-bold text-[var(--p-accent-ink)]">#{caseItem.number}</span>
                <span className="text-[22px] font-black tabular-numbers text-[var(--p-text)]">{caseItem.value.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

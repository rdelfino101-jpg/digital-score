import React from 'react';
import { DealOrNoDealGameState } from '../../../types/masterStudio';
import { Briefcase, PhoneCall, Award, Trophy, CheckCircle2, XCircle } from 'lucide-react';

interface DealOrNoDealArenaProps {
  stage: DealOrNoDealGameState;
}

export const DealOrNoDealArena: React.FC<DealOrNoDealArenaProps> = ({ stage }) => {
  const briefcases = stage?.briefcases || [];

  if (briefcases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Briefcase className="w-24 h-24 text-[#FFC53D] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-white mb-3">TRATO HECHO</h2>
        <p className="font-projector text-[28px] font-bold text-[#B8BCE6] uppercase tracking-wider">COMPETICIÓN EN VIVO</p>
      </div>
    );
  }

  // Collect all values and sort ascending to split into Low (Left) and High (Right) boards
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
        <div className="w-full py-5 px-8 rounded-3xl bg-[#3A2A05] border-4 border-[#FFC53D] shadow-2xl flex items-center justify-between animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#FFC53D]/20 border-2 border-[#FFC53D] text-[#FFC53D] flex items-center justify-center">
              <PhoneCall className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <span className="text-[22px] font-black tracking-widest text-[#FFC53D] uppercase block">
                OFERTA OFICIAL DEL BANQUERO
              </span>
              <span className="text-[52px] font-black text-white leading-none tabular-numbers">
                {stage.bankerOffer.toLocaleString()} <span className="text-[30px] text-[#FFC53D]">PTS</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[34px] font-black text-[#FFC53D] uppercase tracking-wide block">
              ¿TRATO O NO TRATO?
            </span>
            {stage.bankerOfferAccepted === true && (
              <span className="inline-flex items-center gap-2 text-[#4ADE80] text-[24px] font-bold">
                <CheckCircle2 className="w-6 h-6" /> ¡Trato Aceptado!
              </span>
            )}
            {stage.bankerOfferAccepted === false && (
              <span className="inline-flex items-center gap-2 text-[#EF4444] text-[24px] font-bold">
                <XCircle className="w-6 h-6" /> ¡Rechazado! Sigue el juego
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-5 py-2 rounded-full bg-[#1C1F47] border border-[#2A2D5C] text-[#FFC53D] font-black text-[22px] uppercase tracking-wide">
              Ronda {stage.currentRound || 1}
            </span>
            <span className="px-5 py-2 rounded-full bg-[#15173A] border border-[#2A2D5C] text-[#B8BCE6] font-semibold text-[22px]">
              Maletines restantes por abrir: {Math.max(0, (stage.briefcasesToOpenThisRound || 1) - (stage.briefcasesOpenedThisRound || 0))}
            </span>
          </div>

          {contestantCase && (
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-[#3A2A05] border-2 border-[#FFC53D] text-[#FFC53D] font-black text-[22px]">
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
          <div className="text-center py-1 border-b border-[#2A2D5C] mb-1">
            <span className="text-[18px] font-black tracking-widest text-[#4F7BFF] uppercase">
              VALORES BAJOS
            </span>
          </div>
          {lowValues.map((caseItem) => {
            const isEliminated = caseItem.isOpen;
            return (
              <div
                key={`low-${caseItem.id}`}
                className={`py-2 px-4 rounded-xl border flex items-center justify-between transition-all ${
                  isEliminated
                    ? 'bg-[#15173A]/30 border-[#2A2D5C]/40 text-[#B8BCE6]/30 line-through'
                    : 'bg-[#15173A] border-[#4F7BFF]/50 text-white font-black'
                }`}
              >
                <span className="text-[20px] font-bold text-[#B8BCE6]/70">#{caseItem.number}</span>
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
                    className="w-[120px] h-[120px] rounded-2xl border-4 border-dashed border-[#2A2D5C] bg-[#15173A]/60 flex flex-col items-center justify-center p-2 text-center transition-all opacity-70"
                  >
                    <span className="text-[14px] font-bold text-[#B8BCE6] uppercase">#{bc.number}</span>
                    <span className="text-[22px] font-black text-[#FFC53D] leading-tight tabular-numbers">
                      {bc.value.toLocaleString()}
                    </span>
                    <span className="text-[12px] text-[#B8BCE6]">PTS</span>
                  </div>
                );
              }

              // Contestant's chosen briefcase
              if (isSelectedMine) {
                return (
                  <div
                    key={bc.id}
                    className="w-[120px] h-[120px] rounded-2xl border-4 border-[#FFC53D] bg-[#3A2A05] text-[#FFC53D] flex flex-col items-center justify-center p-2 text-center shadow-xl shadow-[#FFC53D]/20 transform scale-105"
                  >
                    <Briefcase className="w-6 h-6 mb-0.5" />
                    <span className="text-[34px] font-black leading-none">{bc.number}</span>
                    <span className="text-[12px] font-black tracking-wider uppercase mt-1">SU MALETÍN</span>
                  </div>
                );
              }

              // Normal unopened metallic briefcase card
              return (
                <div
                  key={bc.id}
                  className="w-[120px] h-[120px] rounded-2xl border-4 border-slate-300 bg-gradient-to-b from-white to-slate-200 text-slate-950 font-black flex flex-col items-center justify-center shadow-2xl transition-all"
                >
                  <span className="text-[14px] font-bold text-slate-500 uppercase tracking-widest">MALETÍN</span>
                  <span className="text-[40px] font-black leading-none text-slate-950">{bc.number}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: High Values */}
        <div className="w-[220px] flex flex-col gap-2 shrink-0">
          <div className="text-center py-1 border-b border-[#2A2D5C] mb-1">
            <span className="text-[18px] font-black tracking-widest text-[#FFC53D] uppercase">
              PREMIOS MAYORES
            </span>
          </div>
          {highValues.map((caseItem) => {
            const isEliminated = caseItem.isOpen;
            return (
              <div
                key={`high-${caseItem.id}`}
                className={`py-2 px-4 rounded-xl border flex items-center justify-between transition-all ${
                  isEliminated
                    ? 'bg-[#15173A]/30 border-[#2A2D5C]/40 text-[#B8BCE6]/30 line-through'
                    : 'bg-[#3A2A05]/60 border-[#FFC53D]/50 text-[#FFC53D] font-black'
                }`}
              >
                <span className="text-[20px] font-bold text-[#FFC53D]/70">#{caseItem.number}</span>
                <span className="text-[22px] font-black tabular-numbers">{caseItem.value.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

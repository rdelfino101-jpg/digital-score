import React, { useEffect } from 'react';
import { NightWinnerItem } from '../../../types/masterStudio';
import { Trophy, Sparkles, Award, Ticket, X } from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

interface FullscreenWinnerCelebrationProps {
  drawNumber: number;
  title: string;
  winnerName: string;
  ticketNumber?: number;
  group?: string;
  nightWinners: NightWinnerItem[];
  onClose?: () => void;
}

export const FullscreenWinnerCelebration: React.FC<FullscreenWinnerCelebrationProps> = ({
  drawNumber,
  title,
  winnerName,
  ticketNumber,
  group,
  nightWinners,
  onClose,
}) => {
  useEffect(() => {
    // Play celebratory fanfare
    studioAudio.playFanfare();
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between bg-[#0A0B1E]/95 backdrop-blur-2xl p-12 text-center select-none font-projector animate-in zoom-in-95 duration-500">
      {/* Top Header: SORTEO N DE LA NOCHE · [título] */}
      <div className="flex items-center justify-between w-full border-b-2 border-[#2A2D5C] pb-5">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-[#FFC53D] text-slate-950 font-black shadow-xl shadow-[#FFC53D]/20 animate-bounce">
            <Trophy className="w-9 h-9" />
          </div>
          <div className="text-left">
            <span className="text-[20px] font-black uppercase tracking-[0.25em] text-[#FFC53D] block">
              SORTEO {drawNumber || 1} DE LA NOCHE
            </span>
            <h2 className="text-[36px] font-black text-white leading-tight">
              {title || 'Gran Sorteo Oficial'}
            </h2>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#15173A] border-2 border-[#2A2D5C] text-[#B8BCE6] hover:text-white hover:border-white font-bold text-[18px] transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
            <span>Continuar Sorteos</span>
          </button>
        )}
      </div>

      {/* Center Winner Showcase: ¡Felicidades! + 190px Name + Golden Ticket Pill */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-4">
        {/* Subhead: ¡Felicidades! */}
        <div className="inline-flex items-center gap-3 px-8 py-2.5 rounded-full bg-[#3A2A05] border-2 border-[#FFC53D] text-[#FFC53D] text-[28px] font-black tracking-widest uppercase mb-4 shadow-xl">
          <Sparkles className="w-8 h-8" />
          ¡FELICIDADES AL GANADOR!
          <Sparkles className="w-8 h-8" />
        </div>

        {/* 
          Giant Winner Name in 190px
          Requirement 6: "nombre en 190px, boleto en pastilla dorada"
        */}
        <h1
          className="text-[190px] font-black text-white leading-[0.95] tracking-tight uppercase drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] max-w-7xl truncate px-4"
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          {winnerName}
        </h1>

        {/* Group / Cell if available */}
        {group && (
          <span className="text-[34px] font-bold text-[#B8BCE6] mt-2 block">
            {group}
          </span>
        )}

        {/* Golden Ticket Pill */}
        {ticketNumber && (
          <div className="mt-6 inline-flex items-center gap-4 px-10 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-[#FFC53D] to-amber-400 text-slate-950 font-black shadow-2xl border-4 border-white animate-pulse">
            <Ticket className="w-10 h-10 stroke-[2.5]" />
            <span className="text-[44px] leading-none tabular-numbers tracking-wide">
              BOLETO #{ticketNumber}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Ticker Strip: Ganadores de la noche */}
      <div className="w-full pt-4 border-t-2 border-[#2A2D5C]">
        <div className="flex items-center gap-4 mb-2">
          <Award className="w-6 h-6 text-[#FFC53D]" />
          <span className="text-[18px] font-black uppercase tracking-widest text-[#FFC53D]">
            GANADORES DE LA NOCHE ({nightWinners.length})
          </span>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-1">
          {nightWinners.length === 0 ? (
            <div className="text-[18px] text-[#B8BCE6] italic">
              Primer ganador oficial registrado esta noche.
            </div>
          ) : (
            nightWinners.map((w, idx) => (
              <div
                key={w.id || idx}
                className="px-5 py-2 rounded-xl bg-[#15173A] border border-[#2A2D5C] flex items-center gap-3 shrink-0"
              >
                <span className="px-2 py-0.5 rounded bg-[#3A2A05] text-[#FFC53D] text-[13px] font-black">
                  Sorteo #{w.drawNumber}
                </span>
                <span className="text-[20px] font-bold text-white">{w.name}</span>
                {w.ticketNumber && (
                  <span className="text-[14px] text-slate-400 font-semibold">
                    (#{w.ticketNumber})
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

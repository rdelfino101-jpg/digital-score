import React from 'react';
import { RaffleParticipant } from '../../../types/masterStudio';
import { Dices, Ticket, CheckCircle2 } from 'lucide-react';

interface TombolaNumbersArenaProps {
  currentNumber: number | null;
  participants: RaffleParticipant[];
  drawnHistory: number[];
  zeroPadding: number;
}

export const TombolaNumbersArena: React.FC<TombolaNumbersArenaProps> = ({
  currentNumber,
  participants,
  drawnHistory,
  zeroPadding,
}) => {
  const padLength = zeroPadding || 3;

  // Find participant matching current ticket
  const matchingParticipant = currentNumber !== null
    ? participants.find((p) => p.ticketNumber === currentNumber)
    : null;

  const formattedNumber = currentNumber !== null
    ? String(currentNumber).padStart(padLength, '0')
    : '---';

  const previousDrawn = drawnHistory.filter((n) => n !== currentNumber);

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-5xl gap-6 select-none">
      {/* 
        Giant White Sphere (520px diameter)
        Requirement 10: "bola blanca gigante (520px) con el número en 230px"
      */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div
          className="relative rounded-full flex flex-col items-center justify-center shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_-20px_40px_rgba(0,0,0,0.2),inset_0_20px_40px_rgba(255,255,255,0.9)] border-4 border-slate-300"
          style={{
            width: '520px',
            height: '520px',
            background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #f1f5f9 60%, #cbd5e1 100%)',
          }}
        >
          {/* Inner metallic ring */}
          <div className="w-[440px] h-[440px] rounded-full border-4 border-slate-400/40 flex flex-col items-center justify-center">
            <span className="text-[20px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">
              BOLETO GANADOR
            </span>

            {/* Drawn number in 230px */}
            <span
              className="text-[230px] font-black text-slate-950 leading-none tabular-numbers tracking-tighter"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              {formattedNumber}
            </span>
          </div>
        </div>

        {/* Participant Name under the ball */}
        <div className="mt-5 text-center">
          {matchingParticipant ? (
            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-[#15173A] border-2 border-[#4ADE80] text-white shadow-xl animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 text-[#4ADE80]" />
              <div className="text-left">
                <span className="text-[14px] font-bold text-[#4ADE80] uppercase tracking-wider block">
                  TITULAR DEL BOLETO
                </span>
                <span className="text-[32px] font-black text-white leading-tight">
                  {matchingParticipant.name}
                </span>
                {matchingParticipant.groupOrCell && (
                  <span className="text-[18px] text-[#FFC53D] font-bold ml-2">
                    ({matchingParticipant.groupOrCell})
                  </span>
                )}
              </div>
            </div>
          ) : currentNumber !== null ? (
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-[#15173A] border border-[#2A2D5C] text-[#B8BCE6] text-[22px] font-bold">
              <Ticket className="w-6 h-6 text-[#FFC53D]" />
              Boleto #{formattedNumber}
            </div>
          ) : (
            <span className="text-[24px] text-[#B8BCE6] font-semibold">
              Listo para extraer la bola del sorteo...
            </span>
          )}
        </div>
      </div>

      {/* YA SALIERON Section (Previous Drawn Numbers) */}
      <div className="w-full p-4 rounded-2xl bg-[#15173A] border-2 border-[#2A2D5C]">
        <div className="flex items-center gap-3 mb-2">
          <Dices className="w-6 h-6 text-[#FFC53D]" />
          <span className="text-[18px] font-black text-[#FFC53D] tracking-widest uppercase">
            YA SALIERON ({previousDrawn.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 min-h-[50px] overflow-x-auto pb-1">
          {previousDrawn.length === 0 ? (
            <span className="text-[16px] text-slate-500 italic">
              Aún no hay números anteriores en esta sesión.
            </span>
          ) : (
            previousDrawn.map((num) => {
              const matched = participants.find((p) => p.ticketNumber === num);
              return (
                <div
                  key={num}
                  className="px-4 py-1.5 rounded-full bg-white text-slate-950 border-2 border-slate-300 font-black text-[20px] tabular-numbers shadow flex items-center gap-2"
                >
                  <span>#{String(num).padStart(padLength, '0')}</span>
                  {matched && (
                    <span className="text-[14px] text-slate-600 font-bold truncate max-w-[120px]">
                      {matched.name}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

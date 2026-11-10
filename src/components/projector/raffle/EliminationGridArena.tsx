import React from 'react';
import { RaffleParticipant } from '../../../types/masterStudio';
import { Droplets, Users, X, AlertTriangle } from 'lucide-react';

interface EliminationGridArenaProps {
  participants: RaffleParticipant[];
  lastEliminatedId: string | null;
  targetRound: number;
  currentRound: number;
}

export const EliminationGridArena: React.FC<EliminationGridArenaProps> = ({
  participants,
  lastEliminatedId,
  targetRound,
  currentRound,
}) => {
  const activeCount = participants.filter((p) => !p.eliminated).length;

  return (
    <div className="flex flex-col w-full h-full gap-5 select-none">
      {/* Top Banner: QUEDAN N and Elimination Round status */}
      <div className="flex items-center justify-between w-full px-6 py-3 rounded-2xl bg-[#15173A] border-2 border-[#2A2D5C]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#3F1216] border border-[#EF4444] text-[#EF4444] flex items-center justify-center">
            <Droplets className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[14px] font-black text-[#EF4444] uppercase tracking-widest block">
              MODALIDAD AL AGUA / ELIMINACIÓN
            </span>
            <span className="text-[22px] font-bold text-white">
              Giro {currentRound} de {targetRound} (El último en quedar gana)
            </span>
          </div>
        </div>

        {/* Big Counter: QUEDAN N */}
        <div className="flex items-center gap-4 px-8 py-2 rounded-2xl bg-[#0F5132] border-2 border-[#4ADE80] shadow-lg">
          <Users className="w-8 h-8 text-[#4ADE80]" />
          <div className="text-right">
            <span className="text-[14px] font-black text-[#4ADE80] uppercase tracking-widest block">
              EN JUEGO
            </span>
            <span className="text-[42px] font-black leading-none text-white tabular-numbers">
              QUEDAN {activeCount}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Cards with all participant names */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-4 gap-3.5 w-full">
          {participants.map((p) => {
            const isEliminated = p.eliminated;
            const isJustEliminated = p.id === lastEliminatedId;

            if (isJustEliminated) {
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-[#3F1216] border-4 border-[#EF4444] text-white flex flex-col justify-between shadow-2xl animate-pulse"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[11px] font-black uppercase">
                      ¡ELIMINADO!
                    </span>
                    <X className="w-5 h-5 text-[#EF4444]" />
                  </div>
                  <span className="text-[24px] font-black line-through text-white leading-tight">
                    {p.name}
                  </span>
                  <span className="text-[12px] text-[#EF4444] font-bold mt-1">Al Agua</span>
                </div>
              );
            }

            if (isEliminated) {
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-[#15173A]/30 border-2 border-[#2A2D5C]/40 text-[#B8BCE6]/30 flex flex-col justify-between opacity-35 select-none"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    #{p.ticketNumber || '---'}
                  </span>
                  <span className="text-[22px] font-bold line-through truncate leading-tight">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-slate-600 font-semibold mt-1">Fuera de juego</span>
                </div>
              );
            }

            // Active participant
            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-[#15173A] border-2 border-[#2A2D5C] hover:border-[#4B5299] text-white flex flex-col justify-between shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded bg-[#1C1F47] text-[#FFC53D] text-[12px] font-black">
                    #{p.ticketNumber || '---'}
                  </span>
                  <div className="w-3 h-3 rounded-full bg-[#4ADE80]" />
                </div>
                <span className="text-[24px] font-black text-white leading-tight truncate">
                  {p.name}
                </span>
                {p.groupOrCell ? (
                  <span className="text-[13px] text-[#B8BCE6] font-semibold truncate mt-1">
                    {p.groupOrCell}
                  </span>
                ) : (
                  <span className="text-[12px] text-[#4ADE80] font-bold mt-1">Activo</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

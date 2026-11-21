import React from 'react';
import { RaffleParticipant } from '../../../types/masterStudio';
import { Droplets, Users, X } from 'lucide-react';

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
  const isDense = participants.length > 12;
  const cardHeightPx = isDense ? 120 : 150;
  const nameFontSizeClass = isDense ? 'text-[32px]' : 'text-[40px]';

  return (
    <div className="flex flex-col w-full h-full gap-5 select-none">
      {/* Top Banner */}
      <div className="flex items-center justify-between w-full px-6 py-3 rounded-2xl bg-[var(--p-panel)] border-2 border-[var(--p-line)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--p-err-bg)] border border-[var(--p-err)] text-[var(--p-err)] flex items-center justify-center">
            <Droplets className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[14px] font-black text-[var(--p-err)] uppercase tracking-widest block">
              Modalidad al agua / eliminación
            </span>
            <span className="text-[22px] font-bold text-[var(--p-text)]">
              Giro {currentRound} de {targetRound} (El último en quedar gana)
            </span>
          </div>
        </div>

        {/* Big Counter: QUEDAN N */}
        <div className="flex items-center gap-4 px-8 py-2 rounded-2xl bg-[var(--p-ok-bg)] border-2 border-[var(--p-ok)] shadow-sm">
          <Users className="w-8 h-8 text-[var(--p-ok)]" />
          <div className="text-right">
            <span className="text-[14px] font-black text-[var(--p-ok)] uppercase tracking-widest block">
              En juego
            </span>
            <span className="text-[42px] font-black leading-none text-[var(--p-text)] tabular-numbers">
              QUEDAN {activeCount}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-4 gap-4 w-full">
          {participants.map((p) => {
            const isEliminated = p.eliminated;
            const isJustEliminated = p.id === lastEliminatedId;

            if (isJustEliminated) {
              return (
                <div
                  key={p.id}
                  style={{ minHeight: `${cardHeightPx}px` }}
                  className="p-4 rounded-2xl bg-[var(--p-err-bg)] border-4 border-[var(--p-err)] text-[var(--p-text)] flex flex-col justify-between shadow-md animate-pulse"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--p-err)] text-[var(--p-err-bg)] text-[12px] font-black uppercase">
                      ¡Eliminado!
                    </span>
                    <X className="w-6 h-6 text-[var(--p-err)]" />
                  </div>
                  <span className={`${nameFontSizeClass} font-black line-through text-[var(--p-text)] leading-tight break-words`} style={{ textWrap: 'balance' }}>
                    {p.name}
                  </span>
                  <span className="text-[14px] text-[var(--p-err)] font-bold mt-1">Al Agua</span>
                </div>
              );
            }

            if (isEliminated) {
              return (
                <div
                  key={p.id}
                  style={{ minHeight: `${cardHeightPx}px` }}
                  className="p-4 rounded-2xl bg-[var(--p-panel-2)] border-2 border-[var(--p-line)] text-[var(--p-text-3)] flex flex-col justify-between opacity-45 select-none"
                >
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--p-text-3)] block mb-1">
                    #{p.ticketNumber || '---'}
                  </span>
                  <span className={`${nameFontSizeClass} font-bold line-through leading-tight break-words`} style={{ textWrap: 'balance' }}>
                    {p.name}
                  </span>
                  <span className="text-[12px] text-[var(--p-text-3)] font-semibold mt-1">Fuera de juego</span>
                </div>
              );
            }

            // Active participant
            return (
              <div
                key={p.id}
                style={{ minHeight: `${cardHeightPx}px` }}
                className="p-4 rounded-2xl bg-[var(--p-panel)] border-2 border-[var(--p-line)] text-[var(--p-text)] flex flex-col justify-between shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded bg-[var(--p-panel-2)] text-[var(--p-accent-ink)] text-[13px] font-black">
                    #{p.ticketNumber || '---'}
                  </span>
                  <div className="w-3.5 h-3.5 rounded-full bg-[var(--p-ok)]" />
                </div>
                <span className={`${nameFontSizeClass} font-black text-[var(--p-text)] leading-tight break-words`} style={{ textWrap: 'balance' }}>
                  {p.name}
                </span>
                {p.groupOrCell ? (
                  <span className="text-[14px] text-[var(--p-text-2)] font-semibold truncate mt-1">
                    {p.groupOrCell}
                  </span>
                ) : (
                  <span className="text-[13px] text-[var(--p-ok)] font-bold mt-1">Activo</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

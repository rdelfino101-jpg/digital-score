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

  const matchingParticipant = currentNumber !== null
    ? participants.find((p) => p.ticketNumber === currentNumber)
    : null;

  const formattedNumber = currentNumber !== null
    ? String(currentNumber).padStart(padLength, '0')
    : '---';

  const previousDrawn = drawnHistory.filter((n) => n !== currentNumber);

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-5xl gap-6 select-none">
      {/* Giant Sphere (520px diameter) */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div
          className="relative rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-[var(--p-line-strong)] bg-[var(--p-panel)]"
          style={{
            width: '520px',
            height: '520px',
          }}
        >
          {/* Inner ring */}
          <div className="w-[440px] h-[440px] rounded-full border-4 border-[var(--p-line)] bg-[var(--p-panel-2)] flex flex-col items-center justify-center">
            <span className="text-[20px] font-black uppercase tracking-[0.3em] text-[var(--p-text-3)] mb-1">
              Boleto ganador
            </span>

            {/* Drawn number in 230px */}
            <span
              className="text-[230px] font-black text-[var(--p-text)] leading-none tabular-numbers tracking-tighter"
              style={{ fontFamily: "'Archivo Variable', 'Archivo', sans-serif" }}
            >
              {formattedNumber}
            </span>
          </div>
        </div>

        {/* Participant Name under the ball */}
        <div className="mt-5 text-center">
          {matchingParticipant ? (
            <div className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-[var(--p-ok-bg)] border-2 border-[var(--p-ok)] text-[var(--p-text)] shadow-md animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 text-[var(--p-ok)]" />
              <div className="text-left">
                <span className="text-[14px] font-bold text-[var(--p-ok)] uppercase tracking-wider block">
                  Titular del boleto
                </span>
                <span className="text-[32px] font-black text-[var(--p-text)] leading-tight">
                  {matchingParticipant.name}
                </span>
                {matchingParticipant.groupOrCell && (
                  <span className="text-[18px] text-[var(--p-accent-ink)] font-bold ml-2">
                    ({matchingParticipant.groupOrCell})
                  </span>
                )}
              </div>
            </div>
          ) : currentNumber !== null ? (
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-[var(--p-panel)] border border-[var(--p-line)] text-[var(--p-text-2)] text-[22px] font-bold">
              <Ticket className="w-6 h-6 text-[var(--p-accent-ink)]" />
              Boleto #{formattedNumber}
            </div>
          ) : (
            <span className="text-[24px] text-[var(--p-text-2)] font-semibold">
              Listo para extraer la bola del sorteo...
            </span>
          )}
        </div>
      </div>

      {/* YA SALIERON Section */}
      <div className="w-full p-4 rounded-2xl bg-[var(--p-panel)] border-2 border-[var(--p-line)]">
        <div className="flex items-center gap-3 mb-2">
          <Dices className="w-6 h-6 text-[var(--p-accent-ink)]" />
          <span className="text-[18px] font-black text-[var(--p-accent-ink)] tracking-widest uppercase">
            Ya salieron ({previousDrawn.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 min-h-[50px] overflow-x-auto pb-1">
          {previousDrawn.length === 0 ? (
            <span className="text-[16px] text-[var(--p-text-3)] italic">
              Aún no hay números anteriores en esta sesión.
            </span>
          ) : (
            previousDrawn.map((num) => {
              const matched = participants.find((p) => p.ticketNumber === num);
              return (
                <div
                  key={num}
                  className="px-4 py-1.5 rounded-full bg-[var(--p-panel-2)] text-[var(--p-text)] border-2 border-[var(--p-line-strong)] font-black text-[20px] tabular-numbers shadow-sm flex items-center gap-2"
                >
                  <span>#{String(num).padStart(padLength, '0')}</span>
                  {matched && (
                    <span className="text-[14px] text-[var(--p-text-2)] font-bold truncate max-w-[120px]">
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

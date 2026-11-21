import React, { useEffect } from 'react';
import { NightWinnerItem } from '../../../types/masterStudio';
import { Trophy, Sparkles, Award, Ticket, X } from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';
import { FitText } from '../common/FitText';

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
    studioAudio.playFanfare();
  }, []);

  const cleanWinnerName = (winnerName || '').trim();

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between bg-[var(--p-bg)] p-12 text-center select-none font-projector animate-in zoom-in-95 duration-500">
      {/* Top Header: SORTEO N DE LA NOCHE · [título] */}
      <div className="flex items-center justify-between w-full border-b-2 border-[var(--p-line)] pb-5">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="p-3.5 rounded-2xl bg-[var(--p-accent)] text-[var(--p-on-accent)] font-black shadow-md animate-bounce shrink-0">
            <Trophy className="w-9 h-9" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <span className="text-[20px] font-black uppercase tracking-[0.25em] text-[var(--p-accent-ink)] block">
              SORTEO {drawNumber || 1} DE LA NOCHE
            </span>
            <FitText
              as="h2"
              max={36}
              min={20}
              className="w-full font-black text-[var(--p-text)]"
              title={title || 'Gran Sorteo Oficial'}
            >
              {title || 'Gran Sorteo Oficial'}
            </FitText>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--p-panel)] border-2 border-[var(--p-line)] text-[var(--p-text-2)] hover:text-[var(--p-text)] hover:border-[var(--p-line-strong)] font-bold text-[18px] transition-all cursor-pointer shrink-0 ml-4"
          >
            <X className="w-6 h-6" />
            <span>Continuar Sorteos</span>
          </button>
        )}
      </div>

      {/* Center Winner Showcase */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-4 max-w-7xl mx-auto w-full min-w-0">
        <div className="inline-flex items-center gap-3 px-8 py-2.5 rounded-full bg-[var(--p-accent-soft)] border-2 border-[var(--p-accent-ink)] text-[var(--p-accent-ink)] text-[28px] font-black tracking-widest uppercase mb-6 shadow-sm">
          <Sparkles className="w-8 h-8" />
          ¡Felicidades al ganador!
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="w-full px-4">
          <FitText
            as="h1"
            max={180}
            min={44}
            lines={2}
            lineHeight={1.02}
            className="w-full font-projector-title text-center text-[var(--p-text)]"
            style={{ fontFamily: "'Archivo Variable', 'Archivo', sans-serif" }}
            title={cleanWinnerName}
          >
            {cleanWinnerName}
          </FitText>
        </div>

        {group && (
          <div className="mt-3 max-w-4xl w-full">
            <FitText
              max={34}
              min={18}
              className="w-full text-center font-bold text-[var(--p-text-2)]"
              title={group}
            >
              {group}
            </FitText>
          </div>
        )}

        {ticketNumber && (
          <div className="mt-6 inline-flex items-center gap-4 px-10 py-3.5 rounded-full bg-[var(--p-accent)] text-[var(--p-on-accent)] font-black shadow-lg border-4 border-[var(--p-line-strong)]">
            <Ticket className="w-10 h-10 stroke-[2.5]" />
            <span className="text-[44px] leading-none tabular-numbers tracking-wide">
              BOLETO #{ticketNumber}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Ticker Strip: Ganadores de la noche */}
      <div className="w-full pt-4 border-t-2 border-[var(--p-line)]">
        <div className="flex items-center gap-4 mb-2">
          <Award className="w-6 h-6 text-[var(--p-accent-ink)]" />
          <span className="text-[18px] font-black uppercase tracking-widest text-[var(--p-accent-ink)]">
            Ganadores de la noche ({nightWinners.length})
          </span>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-1">
          {nightWinners.length === 0 ? (
            <div className="text-[18px] text-[var(--p-text-2)] italic">
              Primer ganador oficial registrado esta noche.
            </div>
          ) : (
            nightWinners.map((w, idx) => (
              <div
                key={w.id || idx}
                className="px-5 py-2 rounded-xl bg-[var(--p-panel)] border border-[var(--p-line)] flex items-center gap-3 shrink-0"
              >
                <span className="px-2 py-0.5 rounded bg-[var(--p-accent-soft)] text-[var(--p-accent-ink)] text-[13px] font-black">
                  Sorteo #{w.drawNumber}
                </span>
                <span className="text-[20px] font-bold text-[var(--p-text)]">{w.name}</span>
                {w.ticketNumber && (
                  <span className="text-[14px] text-[var(--p-text-3)] font-semibold">
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

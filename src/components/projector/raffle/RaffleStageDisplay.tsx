import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MasterLiveState, RaffleWinnerHistoryItem } from '../../../types/masterStudio';
import { studioAudio } from '../../../utils/audioSynth';
import { Sparkles, Trophy, Award, Ticket, Droplets, ArrowRight } from 'lucide-react';
import { RaffleSvgWheel } from './RaffleSvgWheel';
import { ChallengeCombinerArena } from './ChallengeCombinerArena';
import { TombolaNumbersArena } from './TombolaNumbersArena';
import { TournamentBracketArena } from './TournamentBracketArena';
import { EliminationGridArena } from './EliminationGridArena';
import { QrRegistrationProjectorScene } from './QrRegistrationProjectorScene';
import { FullscreenWinnerCelebration } from './FullscreenWinnerCelebration';

interface RaffleStageDisplayProps {
  state: MasterLiveState;
}

export const RaffleStageDisplay: React.FC<RaffleStageDisplayProps> = ({ state }) => {
  const raffle = state.raffle;
  const activeSpin = raffle.activeSpin;
  const [currentWheelAngle, setCurrentWheelAngle] = useState(0);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastEliminatedId, setLastEliminatedId] = useState<string | null>(null);
  const lastProcessedSpinIdRef = useRef<number | null>(null);

  // Extract roomCode from URL if available
  const roomCode = useMemo(() => {
    if (typeof window === 'undefined') return 'K7P2';
    const param = new URL(window.location.href).searchParams.get('room');
    return param ? param.toUpperCase().trim().slice(0, 4) : 'K7P2';
  }, []);

  // Handle deterministic spin triggers
  useEffect(() => {
    if (!activeSpin || activeSpin.spinId === lastProcessedSpinIdRef.current) return;
    lastProcessedSpinIdRef.current = activeSpin.spinId;
    setIsAnimating(true);

    // Audio drumroll suspense
    studioAudio.playDrumroll(Math.min(8, activeSpin.durationMs / 1000));

    // Handle Wheel rotation
    if (raffle.mode === 'wheel') {
      setCurrentWheelAngle(activeSpin.targetAngle);
    }

    // Handle Number Tombola roll
    if (raffle.mode === 'tombola_numbers') {
      const winnerTicket = activeSpin.winnerItem.ticketNumber || activeSpin.winnerIndex + 1;
      const interval = setInterval(() => {
        const rand =
          Math.floor(Math.random() * (raffle.numberRangeMax - raffle.numberRangeMin + 1)) +
          raffle.numberRangeMin;
        setDisplayNumber(rand);
      }, 60);

      setTimeout(() => {
        clearInterval(interval);
        setDisplayNumber(winnerTicket);
      }, activeSpin.durationMs - 200);
    }

    // Spin completion
    const timer = setTimeout(() => {
      setIsAnimating(false);

      const isEliminationDraw =
        activeSpin.rule === 'elimination' &&
        activeSpin.eliminationRound < activeSpin.eliminationTotal;

      if (isEliminationDraw) {
        setLastEliminatedId(activeSpin.winnerItem.id);
        studioAudio.playEliminatedSplash();
      } else {
        studioAudio.playFanfare();
      }
    }, activeSpin.durationMs);

    return () => clearTimeout(timer);
  }, [activeSpin, raffle.mode, raffle.participants.length, raffle.numberRangeMin, raffle.numberRangeMax]);

  // If QR Registration Scene is active, show it full-frame
  if (raffle.showQrRegistrationScene) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden select-none font-projector animate-projector-wipe">
        <QrRegistrationProjectorScene
          roomCode={roomCode}
          participants={raffle.participants}
          prizeTitle={raffle.prizeTitle}
        />
      </div>
    );
  }

  const activeCount = raffle.participants.filter((p) => !p.eliminated).length;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden select-none font-projector animate-projector-wipe">
      {/* 
        FULLSCREEN WINNER CELEBRATION OVERLAY
        Requirement 6: "pantalla completa de ganador: SORTEO N DE LA NOCHE, ¡Felicidades!, nombre en 190px..."
      */}
      {raffle.showWinnerCelebrationScreen && raffle.activeWinnerScreenData && (
        <FullscreenWinnerCelebration
          drawNumber={raffle.activeWinnerScreenData.drawNumber}
          title={raffle.activeWinnerScreenData.title}
          winnerName={raffle.activeWinnerScreenData.winnerName}
          ticketNumber={raffle.activeWinnerScreenData.ticketNumber}
          group={raffle.activeWinnerScreenData.group}
          nightWinners={raffle.nightWinners || []}
        />
      )}

      {/* Top Header Banner */}
      <header className="relative z-20 w-full flex items-center justify-between gap-6 border-b-2 border-[#2A2D5C] pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#FFC53D] text-slate-950 shadow-xl">
            <Sparkles className="w-8 h-8 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-projector text-[22px] font-black uppercase tracking-widest text-[#FFC53D]">
                Centro de Sorteos en Vivo
              </span>
              <span className="text-white/40">•</span>
              <span className="font-projector text-[22px] font-bold text-[#B8BCE6] uppercase">
                {raffle.mode === 'wheel' && 'Ruleta de la Fortuna'}
                {raffle.mode === 'slot_machine' && 'Combinador de Retos'}
                {raffle.mode === 'tombola_numbers' && 'Tómbola de Números'}
                {raffle.mode === 'team_matcher' && 'Emparejador de Equipos'}
              </span>
            </div>
            <h1 className="font-projector-title text-[48px] text-white truncate">
              {raffle.prizeTitle || 'Gran Sorteo Oficial'}
            </h1>
          </div>
        </div>

        {/* Right Status Badges */}
        <div className="flex items-center gap-3">
          <div className="px-5 py-2 rounded-2xl bg-[#1C1F47] border border-[#2A2D5C] text-[#FFC53D] font-black text-[22px] uppercase tracking-wide">
            SORTEO {raffle.raffleDrawCount || 1} DE LA NOCHE
          </div>

          {raffle.drawRule === 'elimination' ? (
            <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#3F1216] border border-[#EF4444] text-[#EF4444] font-black text-[20px] uppercase">
              <Droplets className="w-6 h-6" />
              <span>Giro {activeSpin?.eliminationRound || raffle.currentEliminationCount + 1} de {raffle.eliminationTargetRound}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-[#0F5132] border border-[#4ADE80] text-[#4ADE80] font-black text-[20px] uppercase">
              <Trophy className="w-6 h-6" />
              <span>Giro Directo</span>
            </div>
          )}

          <div className="px-5 py-2 rounded-2xl bg-[#15173A] border border-[#2A2D5C] text-white font-mono text-[20px] font-bold">
            {activeCount} Activos
          </div>
        </div>
      </header>

      {/* Main Arena */}
      <main className="relative z-10 flex-1 w-full flex items-center justify-center my-3 overflow-hidden">
        {/* MODE ELIMINACIÓN (Requirement 11) */}
        {raffle.drawRule === 'elimination' ? (
          <EliminationGridArena
            participants={raffle.participants}
            lastEliminatedId={lastEliminatedId}
            targetRound={raffle.eliminationTargetRound}
            currentRound={activeSpin?.eliminationRound || raffle.currentEliminationCount + 1}
          />
        ) : raffle.mode === 'wheel' ? (
          <div className="flex w-full h-full items-center justify-between gap-12 px-6">
            {/* Left Card: Sorteo de la Noche + Ganadores de la noche */}
            <div className="w-[460px] h-full flex flex-col justify-between p-7 rounded-3xl bg-[#15173A] border-4 border-[#2A2D5C] shadow-2xl shrink-0">
              {/* Sorteo Counter & Tagline */}
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3A2A05] border border-[#FFC53D] text-[#FFC53D] text-[15px] font-black uppercase tracking-wider mb-2">
                  <Award className="w-4 h-4" /> SORTEO {raffle.raffleDrawCount || 1} DE LA NOCHE
                </div>
                <h3 className="text-[34px] font-black text-white leading-tight mb-2">
                  {raffle.prizeTitle || 'Gran Sorteo Oficial'}
                </h3>
                <p className="text-[22px] font-black text-[#FFC53D] tracking-wide uppercase">
                  Quien quede bajo la flecha gana
                </p>
              </div>

              {/* Ganadores de la Noche List */}
              <div className="flex-1 flex flex-col mt-6 pt-4 border-t border-[#2A2D5C] overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[18px] font-black uppercase tracking-widest text-[#B8BCE6]">
                    GANADORES DE LA NOCHE
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1C1F47] text-[#FFC53D] text-[13px] font-bold">
                    {(raffle.nightWinners || []).length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {(raffle.nightWinners || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                      <Trophy className="w-10 h-10 mb-2 opacity-30" />
                      <span className="text-[17px]">Aún no hay ganadores en esta sesión.</span>
                    </div>
                  ) : (
                    (raffle.nightWinners || []).map((w, idx) => (
                      <div
                        key={w.id || idx}
                        className="p-3 rounded-xl bg-[#0A0B1E] border border-[#2A2D5C] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-[#3A2A05] text-[#FFC53D] font-black text-[14px] flex items-center justify-center shrink-0">
                            #{w.drawNumber}
                          </span>
                          <span className="text-[20px] font-bold text-white truncate">
                            {w.name}
                          </span>
                        </div>
                        {w.ticketNumber && (
                          <span className="text-[15px] font-black text-[#FFC53D] shrink-0">
                            #{w.ticketNumber}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: SVG Wheel with White Pointer at 3 o'clock */}
            <div className="flex-1 flex items-center justify-center">
              <RaffleSvgWheel
                participants={raffle.participants}
                targetAngle={currentWheelAngle}
                isSpinning={isAnimating}
                durationMs={activeSpin?.durationMs || raffle.spinDurationSeconds * 1000}
              />
            </div>
          </div>
        ) : raffle.mode === 'slot_machine' ? (
          <ChallengeCombinerArena
            participants={raffle.participants}
            challenges={raffle.challengesList}
            prizes={raffle.prizesList}
            activeSpin={activeSpin}
            durationMs={activeSpin?.durationMs || raffle.spinDurationSeconds * 1000}
          />
        ) : raffle.mode === 'tombola_numbers' ? (
          <TombolaNumbersArena
            currentNumber={displayNumber}
            participants={raffle.participants}
            drawnHistory={raffle.drawnNumbersHistory}
            zeroPadding={raffle.numberZeroPadding}
          />
        ) : raffle.mode === 'team_matcher' ? (
          <TournamentBracketArena
            matcherResult={raffle.lastMatcherResult}
            prizeTitle={raffle.prizeTitle}
          />
        ) : null}
      </main>

      {/* Bottom Footer Ribbon with Recent Activity */}
      <footer className="w-full flex items-center justify-between border-t border-[#2A2D5C] pt-3 text-[#B8BCE6] text-[16px]">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white">Centro de Sorteos Oficial</span>
          <span>•</span>
          <span>{raffle.participants.length} personas registradas</span>
          <span>•</span>
          <span>{raffle.registrationsOpen ? 'Inscripciones Abiertas' : 'Inscripciones Cerradas'}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[#FFC53D] font-bold">Sala {roomCode}</span>
        </div>
      </footer>
    </div>
  );
};

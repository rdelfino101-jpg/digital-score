import React, { useMemo } from 'react';
import {
  Scoreboard,
  Scoreboard1v1,
  ScoreboardMultiplayer,
  BroadcastSettings,
  TimerState,
  LiveState,
} from '../types/scoreboard';
import {
  formatTimeDisplay,
  rankParticipants,
  DEFAULT_HUD_TOGGLES,
  RankedParticipant,
} from '../utils/scoreboardRules';
import { CelebrationCanvas } from './CelebrationCanvas';
import {
  Trophy,
  Award,
  Medal,
  Flame,
  Timer,
  ArrowLeft,
  Radio,
  EyeOff,
  History,
  ShieldAlert,
} from 'lucide-react';

interface ProjectorViewProps {
  liveState?: LiveState | null;
  scoreboard?: Scoreboard;
  broadcast?: BroadcastSettings;
  timer?: TimerState;
  onExitProjector?: () => void;
  isEmbeddedPreview?: boolean;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({
  liveState,
  scoreboard: propScoreboard,
  broadcast: propBroadcast,
  timer: propTimer,
  onExitProjector,
  isEmbeddedPreview = false,
}) => {
  // If liveState is provided, it is the absolute single source of truth.
  // Otherwise fall back to individual props (e.g. for embedded mini-preview).
  const scoreboard = liveState !== undefined ? liveState?.activeScoreboard : propScoreboard;
  const timer = liveState !== undefined ? liveState?.timer : propTimer;
  const toggles = liveState !== undefined ? (liveState?.hudToggles || DEFAULT_HUD_TOGGLES) : (propBroadcast?.hudToggles || DEFAULT_HUD_TOGGLES);
  const theme = liveState !== undefined ? (liveState?.scene.theme || 'broadcast-dark') : (propBroadcast?.theme || 'broadcast-dark');
  const blackout = liveState !== undefined ? Boolean(liveState?.scene.isBlackout) : Boolean(propBroadcast?.blackout);
  const celebrationActive = liveState !== undefined ? Boolean(liveState?.scene.celebrationActive) : Boolean(propBroadcast?.celebrationActive);
  const celebrationWinner = liveState !== undefined ? liveState?.scene.celebrationWinner : propBroadcast?.celebrationWinner;
  const tickerActive = liveState !== undefined ? Boolean(liveState?.scene.tickerActive) : Boolean(propBroadcast?.tickerActive);
  const tickerMessage = liveState !== undefined ? (liveState?.scene.tickerMessage || '') : (propBroadcast?.tickerMessage || '');

  // Background style based on theme
  const containerClasses = useMemo(() => {
    if (theme === 'chroma-green') {
      return 'bg-[#00FF00] text-slate-900';
    }
    if (theme === 'broadcast-light') {
      return 'bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900';
    }
    // broadcast-dark default
    return 'bg-gradient-to-br from-[#070b14] via-[#0b1329] to-[#040711] text-white';
  }, [theme]);

  // Is timer warning (< 10 seconds in countdown)?
  const isTimerWarning =
    Boolean(timer && timer.mode === 'countdown' && timer.secondsRemaining <= 10 && timer.secondsRemaining > 0);
  const isTimerFinished =
    Boolean(timer && timer.mode === 'countdown' && timer.secondsRemaining === 0 && !timer.isRunning);

  const showHeader = toggles.showEventTitles || (Boolean(timer) && toggles.showTimer && timer!.mode !== 'off');

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden select-none font-sans transition-all duration-500 ${containerClasses} ${
        isEmbeddedPreview ? 'h-full w-full' : 'h-screen w-screen'
      }`}
    >
      {/* Ambient glow effects for dark theme */}
      {theme === 'broadcast-dark' && (
        <>
          <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-red-600/15 blur-3xl" />
        </>
      )}

      {/* Floating return-to-console button (hidden during embedded preview) */}
      {!isEmbeddedPreview && onExitProjector && (
        <button
          onClick={onExitProjector}
          title="Regresar a la Consola del Operador"
          aria-label="Regresar a la Consola del Operador"
          className="group absolute top-3.5 right-4 z-50 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 text-xs text-white/80 shadow-xl backdrop-blur-md transition-all hover:bg-black hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Consola</span>
        </button>
      )}

      {/* Celebration Canvas Effects */}
      <CelebrationCanvas
        active={celebrationActive}
        accentColor={celebrationWinner?.color || '#f59e0b'}
      />

      {/* Blackout Mode Overlay */}
      {blackout ? (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="h-20 w-20 rounded-full border border-white/10 bg-white/5 p-4 backdrop-blur-md flex items-center justify-center">
              <Radio className="h-10 w-10 text-red-500 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
          </div>
          <h1 className="font-scoreboard text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-wider uppercase text-white drop-shadow-md">
            {scoreboard?.title || 'SEÑAL EN ESPERA'}
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-slate-400 font-medium">
            {scoreboard?.subtitle || 'Transmisión en directo • Regresamos en unos instantes'}
          </p>
        </div>
      ) : !scoreboard ? (
        <div className="flex h-full w-full flex-col items-center justify-center text-center p-6 animate-pulse">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-lg">
            <Radio className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="font-scoreboard text-2xl sm:text-3xl font-bold tracking-wider uppercase text-white">
            CONECTANDO CON LA CONSOLA EN VIVO...
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Esperando transmisión desde Scoreboard Studio Pro
          </p>
        </div>
      ) : (
        <>
          {/* Header Bar: Event Title, Subtitle & Master Clock (Auto-collapses if both hidden) */}
          {showHeader && (
            <header className="relative z-10 flex flex-wrap items-center justify-between border-b border-white/10 px-6 py-3 sm:px-10 sm:py-4 sm:pr-32 backdrop-blur-md bg-black/25 transition-all">
              {/* Event Title & Subtitle */}
              {toggles.showEventTitles ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 rounded-sm bg-red-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      EN VIVO
                    </span>
                    <h1 className="font-scoreboard text-xl sm:text-2xl md:text-3xl font-bold tracking-wide uppercase text-white drop-shadow">
                      {scoreboard.title}
                    </h1>
                  </div>
                  {scoreboard.subtitle && (
                    <p className="text-xs sm:text-sm font-medium tracking-wide text-slate-300 ml-0.5 mt-0.5">
                      {scoreboard.subtitle}
                    </p>
                  )}
                </div>
              ) : (
                <div /> // Spacer
              )}

              {/* Master Clock if active and visible */}
              {Boolean(timer) && toggles.showTimer && timer!.mode !== 'off' && (
                <div
                  className={`flex items-center gap-3 rounded-xl border px-4 py-1.5 backdrop-blur-md transition-all ${
                    isTimerWarning
                      ? 'border-amber-500/50 bg-amber-950/40 text-amber-300 animate-pulse'
                      : isTimerFinished
                      ? 'border-red-500/50 bg-red-950/40 text-red-400'
                      : 'border-white/15 bg-black/40 text-white'
                  }`}
                >
                  <Timer className="h-5 w-5 text-emerald-400" />
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                      {timer!.mode === 'countdown' ? 'TIEMPO RESTANTE' : 'CRONÓMETRO'}
                    </span>
                    <span className="font-scoreboard text-2xl sm:text-3xl font-bold tracking-wider leading-none">
                      {timer!.mode === 'countdown'
                        ? formatTimeDisplay(timer!.secondsRemaining)
                        : formatTimeDisplay(timer!.stopwatchSeconds)}
                    </span>
                  </div>
                </div>
              )}
            </header>
          )}

          {/* MAIN SCOREBOARD PRESENTATION */}
          <main className="relative z-10 flex-1 flex flex-col justify-center px-4 py-4 sm:px-8 lg:px-12 transition-all">
            {toggles.viewMode === 'summary_table' ? (
              // SUMMARY TABLE VIEW
              <SummaryTableView scoreboard={scoreboard} theme={theme} />
            ) : scoreboard.type === 'one_on_one' ? (
              // 1 VS 1 STANDARD VIEW
              <Scoreboard1v1Display
                scoreboard={scoreboard}
                theme={theme}
                toggles={toggles}
              />
            ) : (
              // MULTIPLAYER STANDARD VIEW
              <ScoreboardMultiplayerDisplay
                scoreboard={scoreboard}
                theme={theme}
                toggles={toggles}
              />
            )}
          </main>
        </>
      )}

      {/* Celebration Winner Banner Modal */}
      {celebrationActive && celebrationWinner && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-4">
          <div className="relative max-w-xl rounded-3xl border-2 border-amber-400/80 bg-slate-950/90 p-8 text-center shadow-2xl backdrop-blur-xl animate-scale-up">
            <div className="mx-auto -mt-16 flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-600 to-yellow-300 text-slate-950 shadow-xl">
              <Trophy className="h-10 w-10 animate-bounce" />
            </div>
            <span className="mt-4 inline-block rounded-full bg-amber-400/20 px-4 py-1 text-xs font-black uppercase tracking-widest text-amber-300">
              ¡CAMPEÓN / GANADOR!
            </span>
            <h2
              className="mt-2 font-scoreboard text-4xl sm:text-5xl font-black uppercase tracking-tight drop-shadow-lg"
              style={{ color: celebrationWinner.color || '#fbbf24' }}
            >
              {celebrationWinner.name}
            </h2>
            <div className="mt-2 font-scoreboard text-5xl font-black text-white">
              {celebrationWinner.score}
            </div>
            {celebrationWinner.subtitle && (
              <p className="mt-2 text-sm font-semibold text-slate-300">
                {celebrationWinner.subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* LOWER THIRD / TICKER BANNER */}
      {toggles.showTicker && tickerActive && tickerMessage && !blackout && (
        <div className="relative z-20 w-full border-t border-white/10 bg-slate-950/90 py-2.5 px-4 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="flex shrink-0 items-center gap-1.5 rounded bg-blue-600 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-white">
              <Flame className="h-3.5 w-3.5 text-amber-300" />
              AVISO
            </span>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm sm:text-base font-semibold text-white tracking-wide">
                {tickerMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------
 * 1 vs 1 Visual Display Component
 * ------------------------------------------------------------- */
interface Scoreboard1v1DisplayProps {
  scoreboard: Scoreboard1v1;
  theme: string;
  toggles: NonNullable<BroadcastSettings['hudToggles']>;
}

const Scoreboard1v1Display: React.FC<Scoreboard1v1DisplayProps> = ({
  scoreboard,
  theme,
  toggles,
}) => {
  const { teamA, teamB, periodTypeLabel, currentRound, totalRounds, roundHistory } =
    scoreboard;

  const isLeadingA = teamA.score > teamB.score;
  const isLeadingB = teamB.score > teamA.score;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 sm:gap-6">
      {/* Match Meta: Period badge & Round History chips */}
      {(toggles.showPeriod || (toggles.showRoundHistory && roundHistory.length > 0)) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Period Badge */}
          {toggles.showPeriod && (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-5 py-1.5 backdrop-blur-md shadow-md">
              <span className="font-scoreboard text-sm sm:text-base font-bold uppercase tracking-widest text-amber-400">
                {periodTypeLabel} {currentRound}
              </span>
              {totalRounds > 0 && (
                <span className="text-xs font-semibold text-slate-400">
                  ({currentRound}/{totalRounds})
                </span>
              )}
            </div>
          )}

          {/* Previous Rounds History Mini Badges */}
          {toggles.showRoundHistory && roundHistory.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1 backdrop-blur-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sets:</span>
              {roundHistory.map((rec, idx) => (
                <span
                  key={idx}
                  className="rounded bg-white/10 px-2 py-0.5 font-scoreboard text-xs font-bold text-slate-200"
                >
                  <span style={{ color: teamA.color }}>{rec.scoreA}</span>
                  <span className="text-slate-500 mx-0.5">-</span>
                  <span style={{ color: teamB.color }}>{rec.scoreB}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teams Grid: Team A vs Team B */}
      <div className="grid w-full grid-cols-1 md:grid-cols-11 items-center gap-4 sm:gap-6">
        {/* TEAM A CARD */}
        <div
          className={`relative col-span-1 md:col-span-5 flex flex-col justify-between rounded-3xl border-2 p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 shadow-2xl ${
            isLeadingA ? 'ring-4 ring-amber-400/40' : ''
          }`}
          style={{
            borderColor: teamA.color,
            backgroundColor:
              theme === 'chroma-green'
                ? '#000000'
                : 'rgba(15, 23, 42, 0.88)',
          }}
        >
          {/* Top color line */}
          <div
            className="absolute top-0 left-8 right-8 h-1.5 rounded-b-full shadow-lg"
            style={{ backgroundColor: teamA.color }}
          />

          <div className="flex items-center justify-between">
            <span
              className="text-xs sm:text-sm font-black uppercase tracking-widest"
              style={{ color: teamA.color }}
            >
              EQUIPO LOCAL (A)
            </span>

            <div className="flex items-center gap-2">
              {/* Possession / Serve Indicator */}
              {toggles.showPossession && teamA.hasPossession && (
                <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-sm animate-pulse">
                  <Flame className="h-3 w-3" />
                  SAQUE / BALÓN
                </span>
              )}

              {teamA.advantage && (
                <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-amber-300 border border-amber-400/40">
                  VENTAJA
                </span>
              )}
            </div>
          </div>

          {/* Team Name */}
          <h2 className="font-scoreboard mt-2 truncate text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-wide text-white drop-shadow">
            {teamA.name}
          </h2>

          {/* Giant Score or Suspense Placeholder */}
          <div className="my-4 flex items-center justify-center min-h-[90px]">
            {toggles.showScores ? (
              <span className="font-scoreboard text-7xl sm:text-8xl lg:text-9xl font-black tracking-tight text-white drop-shadow-2xl">
                {teamA.score}
              </span>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-black/40 px-6 py-4 text-slate-400 backdrop-blur-md">
                <EyeOff className="h-8 w-8 text-indigo-400 animate-pulse" />
                <span className="font-scoreboard text-2xl sm:text-3xl font-bold tracking-widest text-slate-200">
                  PUNTOS OCULTOS
                </span>
              </div>
            )}
          </div>

          {/* Bottom stats: Sets Won, Fouls, Cards (Intelligently auto-arranges) */}
          {(scoreboard.roundProgression === 'sets_reset' || toggles.showFouls) && (
            <div className="mt-2 flex items-center justify-around border-t border-white/10 pt-4 text-xs sm:text-sm font-semibold text-slate-300">
              {/* Sets Won */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  SETS GANADOS
                </span>
                <span className="font-scoreboard text-2xl font-bold text-white">
                  {teamA.setsWon}
                </span>
              </div>

              {/* Fouls */}
              {toggles.showFouls && (
                <>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      FALTAS
                    </span>
                    <span className="font-scoreboard text-2xl font-bold text-red-400">
                      {teamA.fouls}
                    </span>
                  </div>
                </>
              )}

              {/* Cards if any */}
              {toggles.showFouls && ((teamA.cardsYellow || 0) > 0 || (teamA.cardsRed || 0) > 0) && (
                <>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    {(teamA.cardsYellow || 0) > 0 && (
                      <span className="h-5 w-4 rounded-sm bg-amber-400 font-bold text-[10px] text-slate-950 flex items-center justify-center">
                        {teamA.cardsYellow}
                      </span>
                    )}
                    {(teamA.cardsRed || 0) > 0 && (
                      <span className="h-5 w-4 rounded-sm bg-red-600 font-bold text-[10px] text-white flex items-center justify-center">
                        {teamA.cardsRed}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* VS DIVIDER */}
        <div className="col-span-1 md:col-span-1 flex flex-col items-center justify-center py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-black/60 shadow-xl backdrop-blur-md">
            <span className="font-scoreboard text-base sm:text-lg font-black tracking-widest text-slate-300">
              VS
            </span>
          </div>
        </div>

        {/* TEAM B CARD */}
        <div
          className={`relative col-span-1 md:col-span-5 flex flex-col justify-between rounded-3xl border-2 p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 shadow-2xl ${
            isLeadingB ? 'ring-4 ring-amber-400/40' : ''
          }`}
          style={{
            borderColor: teamB.color,
            backgroundColor:
              theme === 'chroma-green'
                ? '#000000'
                : 'rgba(15, 23, 42, 0.88)',
          }}
        >
          {/* Top color line */}
          <div
            className="absolute top-0 left-8 right-8 h-1.5 rounded-b-full shadow-lg"
            style={{ backgroundColor: teamB.color }}
          />

          <div className="flex items-center justify-between">
            <span
              className="text-xs sm:text-sm font-black uppercase tracking-widest"
              style={{ color: teamB.color }}
            >
              EQUIPO VISITANTE (B)
            </span>

            <div className="flex items-center gap-2">
              {/* Possession / Serve Indicator */}
              {toggles.showPossession && teamB.hasPossession && (
                <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-sm animate-pulse">
                  <Flame className="h-3 w-3" />
                  SAQUE / BALÓN
                </span>
              )}

              {teamB.advantage && (
                <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-amber-300 border border-amber-400/40">
                  VENTAJA
                </span>
              )}
            </div>
          </div>

          {/* Team Name */}
          <h2 className="font-scoreboard mt-2 truncate text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-wide text-white drop-shadow">
            {teamB.name}
          </h2>

          {/* Giant Score or Suspense Placeholder */}
          <div className="my-4 flex items-center justify-center min-h-[90px]">
            {toggles.showScores ? (
              <span className="font-scoreboard text-7xl sm:text-8xl lg:text-9xl font-black tracking-tight text-white drop-shadow-2xl">
                {teamB.score}
              </span>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-black/40 px-6 py-4 text-slate-400 backdrop-blur-md">
                <EyeOff className="h-8 w-8 text-indigo-400 animate-pulse" />
                <span className="font-scoreboard text-2xl sm:text-3xl font-bold tracking-widest text-slate-200">
                  PUNTOS OCULTOS
                </span>
              </div>
            )}
          </div>

          {/* Bottom stats: Sets Won, Fouls, Cards */}
          {(scoreboard.roundProgression === 'sets_reset' || toggles.showFouls) && (
            <div className="mt-2 flex items-center justify-around border-t border-white/10 pt-4 text-xs sm:text-sm font-semibold text-slate-300">
              {/* Sets Won */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  SETS GANADOS
                </span>
                <span className="font-scoreboard text-2xl font-bold text-white">
                  {teamB.setsWon}
                </span>
              </div>

              {/* Fouls */}
              {toggles.showFouls && (
                <>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      FALTAS
                    </span>
                    <span className="font-scoreboard text-2xl font-bold text-red-400">
                      {teamB.fouls}
                    </span>
                  </div>
                </>
              )}

              {/* Cards if any */}
              {toggles.showFouls && ((teamB.cardsYellow || 0) > 0 || (teamB.cardsRed || 0) > 0) && (
                <>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    {(teamB.cardsYellow || 0) > 0 && (
                      <span className="h-5 w-4 rounded-sm bg-amber-400 font-bold text-[10px] text-slate-950 flex items-center justify-center">
                        {teamB.cardsYellow}
                      </span>
                    )}
                    {(teamB.cardsRed || 0) > 0 && (
                      <span className="h-5 w-4 rounded-sm bg-red-600 font-bold text-[10px] text-white flex items-center justify-center">
                        {teamB.cardsRed}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * Multiplayer / Leaderboard Visual Display Component
 * ------------------------------------------------------------- */
interface ScoreboardMultiplayerDisplayProps {
  scoreboard: ScoreboardMultiplayer;
  theme: string;
  toggles: NonNullable<BroadcastSettings['hudToggles']>;
}

const ScoreboardMultiplayerDisplay: React.FC<ScoreboardMultiplayerDisplayProps> = ({
  scoreboard,
  theme,
  toggles,
}) => {
  const { participants, autoSort, periodTypeLabel, currentRound, totalRounds } =
    scoreboard;

  const rankedList = useMemo(() => {
    return rankParticipants(participants, autoSort);
  }, [participants, autoSort]);

  const maxScore = useMemo(() => {
    if (participants.length === 0) return 100;
    const highest = Math.max(...participants.map((p) => p.score));
    return highest > 0 ? highest : 100;
  }, [participants]);

  const gridClasses = useMemo(() => {
    const count = participants.length;
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 8) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  }, [participants.length]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col justify-center gap-4">
      {/* Meta Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-300">
            TABLA DE POSICIONES ({participants.length} PARTICIPANTES)
          </span>

          {toggles.showPeriod && (
            <span className="rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/30">
              {periodTypeLabel} {currentRound}
              {totalRounds > 0 && ` / ${totalRounds}`}
            </span>
          )}
        </div>

        {autoSort && (
          <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            Auto-ordenado por puntaje
          </span>
        )}
      </div>

      <div className={`grid gap-3 sm:gap-4 ${gridClasses}`}>
        {rankedList.map((participant: RankedParticipant) => {
          const percentage = Math.min(100, Math.max(0, (participant.score / maxScore) * 100));

          return (
            <div
              key={participant.id}
              className={`relative overflow-hidden rounded-2xl border-2 p-4 backdrop-blur-xl shadow-lg transition-all duration-300 ${
                toggles.showPossession && participant.hasTurn ? 'ring-4 ring-amber-400/60' : ''
              }`}
              style={{
                borderColor: participant.medal === 'gold' ? '#f59e0b' : participant.color,
                backgroundColor:
                  theme === 'chroma-green'
                    ? '#000000'
                    : 'rgba(15, 23, 42, 0.88)',
              }}
            >
              {/* Progress bar fill in the background */}
              {toggles.showScores && (
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 opacity-15 transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: participant.color,
                  }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between gap-3">
                {/* Rank & Medal & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-scoreboard font-black shadow-md ${
                      participant.medal === 'gold'
                        ? 'bg-gradient-to-tr from-amber-600 to-yellow-300 text-slate-950'
                        : participant.medal === 'silver'
                        ? 'bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950'
                        : participant.medal === 'bronze'
                        ? 'bg-gradient-to-tr from-amber-800 to-amber-600 text-white'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {participant.medal === 'gold' ? (
                      <Trophy className="h-5 w-5" />
                    ) : participant.medal === 'silver' ? (
                      <Medal className="h-5 w-5" />
                    ) : participant.medal === 'bronze' ? (
                      <Award className="h-5 w-5" />
                    ) : (
                      <span>#{participant.rank}</span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-scoreboard truncate text-base sm:text-lg font-bold text-white">
                        {participant.name}
                      </span>
                      {toggles.showPossession && participant.hasTurn && (
                        <span className="rounded bg-amber-400 px-1.5 py-0.2 text-[9px] font-black uppercase text-slate-950 animate-pulse">
                          TURNO
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold uppercase text-slate-400">
                      Puesto {participant.rank} {participant.isTied && '(Empate)'}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="flex flex-col items-end shrink-0">
                  {toggles.showScores ? (
                    <>
                      <span
                        className="font-scoreboard text-2xl sm:text-3xl font-black tracking-tight"
                        style={{ color: participant.color }}
                      >
                        {participant.score}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">PTS</span>
                    </>
                  ) : (
                    <EyeOff className="h-6 w-6 text-slate-500 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * Summary Table / Standings View Component (Mode viewMode === 'summary_table')
 * ------------------------------------------------------------- */
const SummaryTableView: React.FC<{ scoreboard: Scoreboard; theme: string }> = ({
  scoreboard,
  theme,
}) => {
  if (scoreboard.type === 'one_on_one') {
    const { teamA, teamB, roundHistory, periodTypeLabel } = scoreboard;

    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-amber-400" />
            <h2 className="font-scoreboard text-xl font-bold uppercase tracking-wider text-white">
              Resumen del Encuentro por {periodTypeLabel}s
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {roundHistory.length} Rondas Disputadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-base">
            <thead className="border-b border-white/10 text-xs font-bold uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Equipo</th>
                {roundHistory.map((r, i) => (
                  <th key={i} className="px-3 py-3 text-center">
                    {r.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Actual</th>
                <th className="px-4 py-3 text-right">Sets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr>
                <td className="px-4 py-4 font-scoreboard text-lg sm:text-xl font-bold" style={{ color: teamA.color }}>
                  {teamA.name}
                </td>
                {roundHistory.map((r, i) => (
                  <td key={i} className="px-3 py-4 text-center font-scoreboard font-bold text-white">
                    {r.scoreA}
                  </td>
                ))}
                <td className="px-4 py-4 text-right font-scoreboard text-2xl font-black text-white">
                  {teamA.score}
                </td>
                <td className="px-4 py-4 text-right font-scoreboard text-xl font-bold text-amber-400">
                  {teamA.setsWon}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 font-scoreboard text-lg sm:text-xl font-bold" style={{ color: teamB.color }}>
                  {teamB.name}
                </td>
                {roundHistory.map((r, i) => (
                  <td key={i} className="px-3 py-4 text-center font-scoreboard font-bold text-white">
                    {r.scoreB}
                  </td>
                ))}
                <td className="px-4 py-4 text-right font-scoreboard text-2xl font-black text-white">
                  {teamB.score}
                </td>
                <td className="px-4 py-4 text-right font-scoreboard text-xl font-bold text-amber-400">
                  {teamB.setsWon}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Multiplayer summary table
  const ranked = rankParticipants(scoreboard.participants, true);
  const rounds = scoreboard.roundHistory;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="font-scoreboard text-xl font-bold uppercase tracking-wider text-white">
            Tabla General de Posiciones & Historial de Rondas
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          {rounds.length} Rondas Registradas
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-white/10 text-[11px] font-bold uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2.5">Pos.</th>
              <th className="px-4 py-2.5">Participante / Equipo</th>
              {rounds.map((r, i) => (
                <th key={i} className="px-3 py-2.5 text-center">
                  {r.label}
                </th>
              ))}
              <th className="px-4 py-2.5 text-right font-bold text-white">Puntaje Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {ranked.map((p) => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                <td className="px-3 py-3 font-scoreboard font-bold">
                  {p.medal === 'gold' ? (
                    <span className="text-amber-400 font-black">#1 🥇</span>
                  ) : p.medal === 'silver' ? (
                    <span className="text-slate-300 font-black">#2 🥈</span>
                  ) : p.medal === 'bronze' ? (
                    <span className="text-amber-600 font-black">#3 🥉</span>
                  ) : (
                    <span>#{p.rank}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-scoreboard font-bold text-white flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </td>
                {rounds.map((r, i) => (
                  <td key={i} className="px-3 py-3 text-center font-scoreboard text-slate-300">
                    {r.scores[p.id] ?? '-'}
                  </td>
                ))}
                <td
                  className="px-4 py-3 text-right font-scoreboard text-xl font-black"
                  style={{ color: p.color }}
                >
                  {p.score} PTS
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

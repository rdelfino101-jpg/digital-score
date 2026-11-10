import React from 'react';
import {
  BroadcastSettings,
  BroadcastTheme,
  Scoreboard,
  TimerMode,
  TimerState,
} from '../types/scoreboard';
import {
  determineWinner,
  formatTimeDisplay,
} from '../utils/scoreboardRules';
import { LiveHudTogglesPanel } from './LiveHudTogglesPanel';
import {
  Play,
  Pause,
  RotateCcw,
  Timer as TimerIcon,
  Radio,
  EyeOff,
  Eye,
  Trophy,
  Sparkles,
  Palette,
  Send,
  Sliders,
  Tv,
} from 'lucide-react';

interface MasterControlPanelProps {
  scoreboards: Scoreboard[];
  broadcast: BroadcastSettings;
  timer: TimerState;
  onUpdateBroadcast: (updated: Partial<BroadcastSettings>) => void;
  onUpdateTimer: (updated: Partial<TimerState>) => void;
  onTriggerCelebration: () => void;
}

export const MasterControlPanel: React.FC<MasterControlPanelProps> = ({
  scoreboards,
  broadcast,
  timer,
  onUpdateBroadcast,
  onUpdateTimer,
  onTriggerCelebration,
}) => {
  const liveScoreboard = scoreboards.find((s) => s.id === broadcast.liveScoreboardId);
  const projectedWinner = liveScoreboard ? determineWinner(liveScoreboard) : null;

  // Timer controls
  const toggleTimerRunning = () => {
    onUpdateTimer({ isRunning: !timer.isRunning, lastTickTimestamp: Date.now() });
  };

  const handleResetTimer = () => {
    onUpdateTimer({
      isRunning: false,
      secondsRemaining: timer.initialSeconds,
      stopwatchSeconds: 0,
      lastTickTimestamp: Date.now(),
    });
  };

  const handleAdjustTimer = (deltaSeconds: number) => {
    if (timer.mode === 'countdown') {
      const next = Math.max(0, timer.secondsRemaining + deltaSeconds);
      onUpdateTimer({ secondsRemaining: next });
    } else if (timer.mode === 'stopwatch') {
      const next = Math.max(0, timer.stopwatchSeconds + deltaSeconds);
      onUpdateTimer({ stopwatchSeconds: next });
    }
  };

  const handleSetCountdownMinutes = (minutes: number) => {
    const secs = minutes * 60;
    onUpdateTimer({
      mode: 'countdown',
      initialSeconds: secs,
      secondsRemaining: secs,
      isRunning: false,
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-2xl backdrop-blur-md">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-indigo-400" />
          <h2 className="font-scoreboard text-base font-bold uppercase tracking-wider text-white">
            Master de Control y Transmisión en Vivo
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Control Central de Salida
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. SELECCIÓN DE SEÑAL EN VIVO */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Radio className="h-4 w-4 text-red-500 animate-pulse" />
            <span>Marcador al Aire</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Elige cuál de tus marcadores se proyecta ahora mismo en la pantalla:
          </p>

          <select
            value={broadcast.liveScoreboardId}
            onChange={(e) => onUpdateBroadcast({ liveScoreboardId: e.target.value })}
            aria-label="Marcador actualmente transmitido al aire"
            className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-red-500 focus:outline-none"
          >
            {scoreboards.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.type === 'one_on_one' ? '1v1' : `Multi ${s.participants.length}`})
              </option>
            ))}
          </select>

          {/* Quick status badge */}
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between rounded-lg bg-black/40 px-2.5 py-1.5 text-xs">
              <span className="text-slate-400">Estado:</span>
              <span className="font-bold text-red-400">TRANSMITIENDO</span>
            </div>
          </div>
        </div>

        {/* 2. MÓDULO DE CRONÓMETRO / TIMER */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              <TimerIcon className="h-4 w-4 text-emerald-400" />
              <span>Cronómetro / Reloj</span>
            </div>
            {/* Mode selector */}
            <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-[10px]">
              {(['countdown', 'stopwatch', 'off'] as TimerMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdateTimer({ mode })}
                  className={`rounded-md px-1.5 py-0.5 font-bold uppercase ${
                    timer.mode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'countdown' ? 'Regresivo' : mode === 'stopwatch' ? 'Ascendente' : 'Off'}
                </button>
              ))}
            </div>
          </div>

          {/* Big Time Display */}
          <div className="my-2 flex items-center justify-center rounded-xl bg-slate-950 py-2 border border-slate-800">
            <span
              className={`font-scoreboard text-3xl font-black tracking-wider ${
                timer.mode === 'off'
                  ? 'text-slate-600 line-through'
                  : timer.isRunning
                  ? 'text-emerald-400'
                  : 'text-white'
              }`}
            >
              {timer.mode === 'countdown'
                ? formatTimeDisplay(timer.secondsRemaining)
                : timer.mode === 'stopwatch'
                ? formatTimeDisplay(timer.stopwatchSeconds)
                : '--:--'}
            </span>
          </div>

          {/* Timer Play/Pause & Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTimerRunning}
              disabled={timer.mode === 'off'}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-all shadow-md ${
                timer.isRunning
                  ? 'bg-amber-600 text-white hover:bg-amber-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              } disabled:opacity-30`}
            >
              {timer.isRunning ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Iniciar</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              disabled={timer.mode === 'off'}
              className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
              title="Reiniciar tiempo"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Adjust Buttons */}
          {timer.mode !== 'off' && (
            <div className="mt-2 grid grid-cols-4 gap-1">
              <button
                onClick={() => handleAdjustTimer(-10)}
                className="rounded border border-slate-700 bg-slate-800 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
              >
                -10s
              </button>
              <button
                onClick={() => handleAdjustTimer(10)}
                className="rounded border border-slate-700 bg-slate-800 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
              >
                +10s
              </button>
              <button
                onClick={() => handleAdjustTimer(60)}
                className="rounded border border-slate-700 bg-slate-800 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
              >
                +1m
              </button>
              <button
                onClick={() => handleSetCountdownMinutes(10)}
                className="rounded border border-slate-700 bg-slate-800 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
              >
                10m
              </button>
            </div>
          )}
        </div>

        {/* 3. PROYECCIÓN & EFECTOS (Blackout + Celebración) */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Tv className="h-4 w-4 text-purple-400" />
            <span>Escena y Efectos</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Control de visibilidad y momento de clímax:
          </p>

          <div className="mt-3 flex flex-col gap-2.5">
            {/* Blackout Toggle */}
            <button
              onClick={() => onUpdateBroadcast({ blackout: !broadcast.blackout })}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                broadcast.blackout
                  ? 'border-red-500 bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {broadcast.blackout ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{broadcast.blackout ? 'BLACKOUT ACTIVO' : 'Blackout / Ocultar'}</span>
              </div>
              <span className="text-[10px] uppercase opacity-80">
                {broadcast.blackout ? 'En Negro' : 'Visible'}
              </span>
            </button>

            {/* Celebration Trigger */}
            <button
              onClick={onTriggerCelebration}
              className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-600 to-yellow-500 px-3 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>Destacar Ganador</span>
              </div>
              <Sparkles className="h-3.5 w-3.5" />
            </button>

            {/* Projected Winner Preview */}
            {projectedWinner && (
              <div className="rounded-lg bg-black/40 px-2.5 py-1.5 text-[11px] text-slate-300 flex items-center justify-between">
                <span className="text-slate-400">Ganador actual:</span>
                <span className="font-bold truncate max-w-[120px]" style={{ color: projectedWinner.color }}>
                  {projectedWinner.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4. TEMA DE SALIDA & CHROMA KEY OBS */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Palette className="h-4 w-4 text-blue-400" />
            <span>Fondo de Proyección</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Adapta el fondo para proyector, TV o captura OBS:
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {[
              { id: 'broadcast-dark', label: 'Tema Oscuro Broadcast', desc: 'Para pantallas y TV' },
              { id: 'broadcast-light', label: 'Tema Claro Studio', desc: 'Salones iluminados' },
              { id: 'chroma-green', label: 'Verde Chroma (#00FF00)', desc: 'Para OBS / vMix / Stream' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onUpdateBroadcast({ theme: t.id as BroadcastTheme })}
                className={`flex items-center justify-between rounded-xl border px-3 py-1.5 text-xs transition-all ${
                  broadcast.theme === t.id
                    ? 'border-blue-500 bg-blue-500/20 font-bold text-white shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{t.label}</span>
                {t.id === 'chroma-green' && (
                  <span className="h-3 w-3 rounded-full bg-[#00FF00] border border-black/40" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIVE HUD VISIBILITY TOGGLES (CONTROL DE CAPAS EN VIVO) */}
      <div className="mt-1">
        <LiveHudTogglesPanel
          toggles={broadcast.hudToggles}
          onChange={(partialToggles) =>
            onUpdateBroadcast({
              hudToggles: { ...broadcast.hudToggles, ...partialToggles },
            })
          }
        />
      </div>

      {/* LOWER THIRD / TICKER INPUT BAR */}
      <div className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
            TICKER
          </span>
          <span className="text-xs font-bold text-slate-300">Mensaje en Pantalla (Lower Third):</span>
        </div>

        <input
          type="text"
          value={broadcast.tickerMessage}
          onChange={(e) => onUpdateBroadcast({ tickerMessage: e.target.value })}
          placeholder="Escribe un anuncio o aviso para la audiencia del evento..."
          aria-label="Mensaje del Ticker o aviso inferior"
          className="flex-1 min-w-[240px] rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
        />

        <button
          onClick={() => onUpdateBroadcast({ tickerActive: !broadcast.tickerActive })}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition-all shadow-sm ${
            broadcast.tickerActive
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>{broadcast.tickerActive ? 'Ocultar Ticker' : 'Mostrar en Vivo'}</span>
        </button>
      </div>
    </div>
  );
};

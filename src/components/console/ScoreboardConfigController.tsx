import React, { useState } from 'react';
import {
  ScoreboardConfig,
  TimerState,
  LiveHudToggles,
  LiveSceneSettings,
  MasterViewMode,
  StudioTeam,
  SportPresetId,
} from '../../types/masterStudio';
import { formatTimeDisplay } from '../../utils/gameEngineRules';
import {
  Tv,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Eye,
  Sliders,
  Type,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { ConfirmActionModal } from './modals/ConfirmActionModal';

interface ScoreboardConfigControllerProps {
  scoreboard: ScoreboardConfig;
  timer: TimerState;
  hudToggles: LiveHudToggles;
  scene: LiveSceneSettings;
  teams: StudioTeam[];
  viewMode: MasterViewMode;
  onSetViewMode: (mode: MasterViewMode) => void;
  onUpdateScoreboard: (config: ScoreboardConfig) => void;
  onUpdateTimer: (timer: TimerState) => void;
  onUpdateHudToggles: (toggles: LiveHudToggles) => void;
  onUpdateScene: (scene: LiveSceneSettings) => void;
  onTriggerCelebration: () => void;
}

export const ScoreboardConfigController: React.FC<ScoreboardConfigControllerProps> = ({
  scoreboard,
  timer,
  hudToggles,
  scene,
  teams,
  viewMode,
  onSetViewMode,
  onUpdateScoreboard,
  onUpdateTimer,
  onUpdateHudToggles,
  onUpdateScene,
  onTriggerCelebration,
}) => {
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [isConfirmClearHistoryOpen, setIsConfirmClearHistoryOpen] = useState(false);

  const sportPresets: Array<{
    id: SportPresetId;
    label: string;
    icon: string;
    desc: string;
    period: string;
    buttons: number[];
  }> = [
    {
      id: 'basketball',
      label: 'Básquetbol',
      icon: '🏀',
      desc: '4 Cuartos • Botones +1, +2, +3 • Faltas y Bonus',
      period: 'Cuarto',
      buttons: [1, 2, 3],
    },
    {
      id: 'soccer',
      label: 'Fútbol / Futsal',
      icon: '⚽',
      desc: '1er/2do Tiempo • Botón +1 • Cronómetro ascendente',
      period: 'Tiempo',
      buttons: [1],
    },
    {
      id: 'volleyball',
      label: 'Voleibol / Pádel',
      icon: '🏐',
      desc: 'Sets ganados • Puntos por Set • Saque/Servicio',
      period: 'Set',
      buttons: [1],
    },
    {
      id: 'combat',
      label: 'Boxeo / Combate',
      icon: '🥊',
      desc: 'Rounds con tiempo límite • Puntos y penalizaciones',
      period: 'Round',
      buttons: [1, 2],
    },
    {
      id: 'general',
      label: 'Trivia / Concurso',
      icon: '🎯',
      desc: 'Rondas por preguntas • Botones +100, +200, +500',
      period: 'Ronda',
      buttons: [100, 200, 500],
    },
    {
      id: 'custom',
      label: '100% Personalizado',
      icon: '⚙️',
      desc: 'Reglas y botones ajustables a medida',
      period: 'Ronda',
      buttons: [1, 5, 10],
    },
  ];

  const currentPreset =
    sportPresets.find((p) => p.id === scoreboard.sportPreset) || sportPresets[0];

  const handleSelectPreset = (presetId: SportPresetId) => {
    const preset = sportPresets.find((p) => p.id === presetId);
    if (!preset) return;

    onUpdateScoreboard({
      ...scoreboard,
      sportPreset: presetId,
      periodTypeLabel: preset.period,
      quickScoreButtons: preset.buttons,
    });
    setIsPresetDropdownOpen(false);
  };

  const handleToggleTimer = () => {
    onUpdateTimer({
      ...timer,
      isRunning: !timer.isRunning,
      lastTickTimestamp: Date.now(),
    });
  };

  const handleResetTimer = () => {
    onUpdateTimer({
      ...timer,
      isRunning: false,
      secondsRemaining: timer.initialSeconds,
      stopwatchSeconds: 0,
      lastTickTimestamp: Date.now(),
    });
  };

  const handleAdjustTimer = (deltaSeconds: number) => {
    if (timer.mode === 'countdown') {
      const next = Math.max(0, timer.secondsRemaining + deltaSeconds);
      onUpdateTimer({
        ...timer,
        secondsRemaining: next,
      });
    } else {
      const next = Math.max(0, timer.stopwatchSeconds + deltaSeconds);
      onUpdateTimer({
        ...timer,
        stopwatchSeconds: next,
      });
    }
  };

  const handleNextRound = () => {
    const nextRound = scoreboard.currentRound + 1;
    const scoreMap: Record<string, number> = {};
    teams.forEach((t) => {
      scoreMap[t.id] = t.score;
    });

    const newHistory = [
      ...scoreboard.roundHistory,
      {
        roundNumber: scoreboard.currentRound,
        label: `${scoreboard.periodTypeLabel} ${scoreboard.currentRound}`,
        scores: scoreMap,
      },
    ];

    onUpdateScoreboard({
      ...scoreboard,
      currentRound: nextRound,
      roundHistory: newHistory,
    });
  };

  const handlePrevRound = () => {
    onUpdateScoreboard({
      ...scoreboard,
      currentRound: Math.max(1, scoreboard.currentRound - 1),
    });
  };

  const handleRequestClearHistory = () => {
    setIsConfirmClearHistoryOpen(true);
  };

  const handleExecuteClearHistory = () => {
    onUpdateScoreboard({
      ...scoreboard,
      roundHistory: [],
    });
    setIsConfirmClearHistoryOpen(false);
  };

  const isScoreboardLive = viewMode === 'SCOREBOARD_ONLY';
  const segundos = timer.mode === 'countdown' ? timer.secondsRemaining : timer.stopwatchSeconds;

  const visibles: Array<{ key: keyof LiveHudToggles; label: string }> = [
    { key: 'showScores', label: 'Puntajes' },
    { key: 'showTimer', label: 'Reloj' },
    { key: 'showPeriod', label: 'Ronda o periodo' },
    { key: 'showRoundHistory', label: 'Historial de rondas' },
    { key: 'showEventTitles', label: 'Título del evento' },
    { key: 'showTicker', label: 'Cintillo inferior' },
    { key: 'showFouls', label: 'Faltas' },
    { key: 'showPossession', label: 'Saque o posesión' },
  ];

  return (
    <div className="@container flex-1 select-none space-y-4 overflow-y-auto bg-[var(--c-bg)] p-4 xl:p-5">
      {/* Encabezado del módulo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold text-[var(--c-text)]">Marcador</h1>
          <p className="truncate text-[13px] text-[var(--c-text-3)]">
            {currentPreset.icon} {currentPreset.label} · {scoreboard.title || 'Sin título'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--c-line)] bg-[var(--c-panel)] p-0.5" role="group" aria-label="Formato del marcador">
            {[
              { id: 'one_on_one' as const, label: 'Duelo 1 vs 1' },
              { id: 'multiplayer' as const, label: 'Tabla (3+)' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onUpdateScoreboard({ ...scoreboard, mode: m.id })}
                aria-pressed={scoreboard.mode === m.id}
                className={`rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  scoreboard.mode === m.id
                    ? 'bg-[var(--c-panel-2)] font-bold text-[var(--c-text)] shadow-[inset_0_0_0_1px_var(--c-line-strong)]'
                    : 'font-semibold text-[var(--c-text-3)] hover:text-[var(--c-text)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => onSetViewMode('SCOREBOARD_ONLY')}
            disabled={isScoreboardLive}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-bold transition-colors ${
              isScoreboardLive
                ? 'cursor-default border border-red-500/60 bg-red-500/10 text-red-300'
                : 'bg-[var(--c-accent)] text-white hover:bg-blue-500'
            }`}
          >
            {isScoreboardLive ? (
              <>
                <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
                Al aire
              </>
            ) : (
              <>
                <Tv className="h-4 w-4" />
                Poner al aire
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
        {/* Cronómetro */}
        <Tarjeta icono={Clock} titulo="Cronómetro">
          <div className="mb-3 flex rounded-lg border border-[var(--c-line)] bg-[var(--c-bg)] p-0.5" role="group" aria-label="Tipo de cronómetro">
            {[
              { id: 'countdown', label: 'Regresivo' },
              { id: 'stopwatch', label: 'Ascendente' },
              { id: 'off', label: 'Apagado' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onUpdateTimer({ ...timer, mode: m.id as TimerState['mode'] })}
                aria-pressed={timer.mode === m.id}
                className={`flex-1 rounded-md py-1 text-[12px] transition-colors ${
                  timer.mode === m.id ? 'bg-[var(--c-panel-2)] font-bold text-[var(--c-text)]' : 'font-semibold text-[var(--c-text-3)] hover:text-[var(--c-text)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className={`rounded-xl border border-[var(--c-line)] bg-[var(--c-bg)] py-4 text-center ${timer.mode === 'off' ? 'opacity-40' : ''}`}>
            <p className="font-mono text-[52px] font-black leading-none text-[var(--c-text)]">{formatTimeDisplay(segundos)}</p>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[var(--c-text-3)]">
              <span className={`h-2 w-2 rounded-full ${timer.isRunning ? 'bg-emerald-400' : 'bg-[var(--c-line-strong)]'}`} aria-hidden />
              {timer.mode === 'off' ? 'Apagado' : timer.isRunning ? 'Corriendo' : 'En pausa'}
            </p>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleToggleTimer}
              disabled={timer.mode === 'off'}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[14px] font-bold transition-colors disabled:opacity-40 ${
                timer.isRunning ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {timer.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {timer.isRunning ? 'Pausar' : 'Iniciar'}
            </button>
            <button
              onClick={handleResetTimer}
              className="rounded-lg border border-[var(--c-line)] bg-[var(--c-panel-2)] px-3 text-[var(--c-text-2)] transition-colors hover:text-[var(--c-text)]"
              title="Reiniciar el cronómetro"
              aria-label="Reiniciar el cronómetro"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[
              { d: -60, l: '−1 min' },
              { d: -30, l: '−30 s' },
              { d: 30, l: '+30 s' },
              { d: 60, l: '+1 min' },
            ].map((a) => (
              <button
                key={a.d}
                onClick={() => handleAdjustTimer(a.d)}
                className="rounded-md bg-[var(--c-panel-2)] py-1.5 text-[12px] font-semibold text-[var(--c-text-2)] transition-colors hover:text-[var(--c-text)]"
              >
                {a.l}
              </button>
            ))}
          </div>
        </Tarjeta>

        {/* Ronda */}
        <Tarjeta
          icono={Layers}
          titulo="Ronda"
          accion={
            scoreboard.totalRounds > 0 ? (
              <span className="text-[12px] text-[var(--c-text-3)]">de {scoreboard.totalRounds}</span>
            ) : undefined
          }
        >
          <div className="flex items-end justify-between gap-3 rounded-xl border border-[var(--c-line)] bg-[var(--c-bg)] px-4 py-3.5">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-[12px] text-[var(--c-text-3)]">Se llama</span>
              <input
                type="text"
                value={scoreboard.periodTypeLabel}
                onChange={(e) => onUpdateScoreboard({ ...scoreboard, periodTypeLabel: e.target.value })}
                className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 -ml-1 text-[18px] font-bold text-[var(--c-text)] hover:border-[var(--c-line)] focus:border-[var(--c-accent)] focus:outline-none"
                placeholder="Ronda, cuarto, set…"
              />
            </label>
            <p className="font-mono text-[52px] font-black leading-none text-[var(--c-text)]">{scoreboard.currentRound}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={handlePrevRound}
              className="flex items-center justify-center gap-1 rounded-lg border border-[var(--c-line)] bg-[var(--c-panel-2)] py-2.5 text-[13px] font-semibold text-[var(--c-text)] transition-colors hover:border-[var(--c-line-strong)]"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              onClick={handleNextRound}
              className="flex items-center justify-center gap-1 rounded-lg bg-[var(--c-accent)] py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-blue-500"
              title="Guarda los puntajes de esta ronda en el historial y pasa a la siguiente"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[var(--c-line)] pt-2.5 text-[12px] text-[var(--c-text-3)]">
            <span>
              {scoreboard.roundHistory.length === 0
                ? 'Sin rondas guardadas'
                : `${scoreboard.roundHistory.length} ${scoreboard.roundHistory.length === 1 ? 'ronda guardada' : 'rondas guardadas'}`}
            </span>
            {scoreboard.roundHistory.length > 0 && (
              <button onClick={handleRequestClearHistory} className="font-semibold text-red-400 hover:text-red-300">
                Borrar historial
              </button>
            )}
          </div>
        </Tarjeta>

        {/* Qué se ve en pantalla */}
        <Tarjeta icono={Eye} titulo="Qué se ve en pantalla">
          <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 @md:grid-cols-2">
            {visibles.map((v) => {
              const activo = Boolean(hudToggles[v.key]);
              return (
                <button
                  key={v.key}
                  role="switch"
                  aria-checked={activo}
                  onClick={() => onUpdateHudToggles({ ...hudToggles, [v.key]: !activo })}
                  className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-left text-[13px] text-[var(--c-text)] hover:bg-[var(--c-panel-2)]"
                >
                  <span className={activo ? '' : 'text-[var(--c-text-3)]'}>{v.label}</span>
                  <Switch activo={activo} />
                </button>
              );
            })}
          </div>
        </Tarjeta>

        {/* Cintillo */}
        <Tarjeta
          icono={Type}
          titulo="Cintillo inferior"
          accion={
            <button
              role="switch"
              aria-checked={scene.tickerActive}
              onClick={() => onUpdateScene({ ...scene, tickerActive: !scene.tickerActive })}
              className="flex items-center gap-2 text-[12px] font-semibold text-[var(--c-text-2)] hover:text-[var(--c-text)]"
            >
              {scene.tickerActive ? 'Visible' : 'Oculto'}
              <Switch activo={scene.tickerActive} />
            </button>
          }
        >
          <textarea
            value={scene.tickerMessage}
            onChange={(e) => onUpdateScene({ ...scene, tickerMessage: e.target.value })}
            rows={3}
            placeholder="Aviso que se muestra abajo en el proyector…"
            className="w-full resize-none rounded-lg border border-[var(--c-line)] bg-[var(--c-bg)] p-2.5 text-[13px] text-[var(--c-text)] focus:border-[var(--c-accent)] focus:outline-none"
          />
          <p className="mt-1.5 text-right text-[12px] text-[var(--c-text-3)]">{scene.tickerMessage.length} caracteres</p>
        </Tarjeta>
      </div>

      {/* Configuración (se usa antes del evento) */}
      <details className="group rounded-2xl border border-[var(--c-line)] bg-[var(--c-panel)]" open={isPresetDropdownOpen}>
        <summary
          onClick={(e) => {
            e.preventDefault();
            setIsPresetDropdownOpen(!isPresetDropdownOpen);
          }}
          className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3"
        >
          <span className="flex items-center gap-2 text-[13px] font-bold text-[var(--c-text)]">
            <Sliders className="h-4 w-4 text-[var(--c-text-3)]" />
            Configuración del marcador
            <span className="font-normal text-[var(--c-text-3)]">· título y tipo de competencia</span>
          </span>
          <ChevronDown className={`h-4 w-4 text-[var(--c-text-3)] transition-transform ${isPresetDropdownOpen ? 'rotate-180' : ''}`} />
        </summary>

        <div className="space-y-4 border-t border-[var(--c-line)] px-4 py-4">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-[var(--c-text-2)]">Título que aparece en el proyector</span>
            <input
              type="text"
              value={scoreboard.title}
              onChange={(e) => onUpdateScoreboard({ ...scoreboard, title: e.target.value })}
              className="w-full rounded-lg border border-[var(--c-line)] bg-[var(--c-bg)] px-3 py-2 text-[14px] font-semibold text-[var(--c-text)] focus:border-[var(--c-accent)] focus:outline-none"
              placeholder="Nombre del torneo o competencia…"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-[12px] font-semibold text-[var(--c-text-2)]">Tipo de competencia</span>
            <div className="grid grid-cols-1 gap-1.5 @xl:grid-cols-2 @4xl:grid-cols-3">
              {sportPresets.map((sp) => {
                const elegido = sp.id === scoreboard.sportPreset;
                return (
                  <button
                    key={sp.id}
                    onClick={() => handleSelectPreset(sp.id)}
                    aria-pressed={elegido}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                      elegido ? 'border-[var(--c-accent)] bg-[var(--c-accent-soft)]' : 'border-[var(--c-line)] hover:border-[var(--c-line-strong)]'
                    }`}
                  >
                    <span className="text-[16px] leading-none">{sp.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-[var(--c-text)]">{sp.label}</span>
                      <span className="block text-[12px] text-[var(--c-text-3)]">{sp.desc}</span>
                    </span>
                    {elegido && <Check className="h-4 w-4 shrink-0 text-[var(--c-accent)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </details>

      <ConfirmActionModal
        isOpen={isConfirmClearHistoryOpen}
        title="¿Borrar el historial de rondas?"
        message="Se borran los puntajes guardados de las rondas anteriores. Los puntajes actuales no cambian."
        confirmText="Sí, borrar"
        cancelText="Cancelar"
        severity="danger"
        iconType="history"
        onConfirm={handleExecuteClearHistory}
        onClose={() => setIsConfirmClearHistoryOpen(false)}
      />
    </div>
  );
};

const Tarjeta: React.FC<{
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icono: Icono, titulo, accion, children }) => (
  <section className="@container rounded-2xl border border-[var(--c-line)] bg-[var(--c-panel)] p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-[13px] font-bold text-[var(--c-text)]">
        <Icono className="h-4 w-4 text-[var(--c-text-3)]" />
        {titulo}
      </h2>
      {accion}
    </div>
    {children}
  </section>
);

const Switch: React.FC<{ activo: boolean }> = ({ activo }) => (
  <span
    className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors ${activo ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-line-strong)]'}`}
    aria-hidden
  >
    <span className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all ${activo ? 'left-[16px]' : 'left-[2px]'}`} />
  </span>
);

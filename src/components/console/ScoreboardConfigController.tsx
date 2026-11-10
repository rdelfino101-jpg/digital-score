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
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
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

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-5 bg-[#070b14] overflow-y-auto space-y-4 select-none">
      {/* 1. TOP BAR: Event Title + Compact Sport Preset Dropdown + Mode Switcher */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Title Input & Sport Preset */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl shrink-0">
            <Tv className="w-5 h-5" />
          </div>

          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              Título del Evento:
            </div>
            <input
              type="text"
              value={scoreboard.title}
              onChange={(e) => onUpdateScoreboard({ ...scoreboard, title: e.target.value })}
              className="bg-transparent font-black text-base text-white focus:outline-none focus:underline"
              placeholder="Nombre del Torneo / Competencia..."
            />
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Sport Preset Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 text-xs font-bold text-slate-200 transition-colors shadow-sm"
            >
              <span>{currentPreset.icon}</span>
              <span>Plantilla: {currentPreset.label}</span>
              {isPresetDropdownOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isPresetDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 animate-fadeIn">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 border-b border-slate-800/80 mb-1">
                  Elegir Plantilla de Deporte:
                </div>
                <div className="space-y-1">
                  {sportPresets.map((sp) => {
                    const isSelected = sp.id === scoreboard.sportPreset;
                    return (
                      <button
                        key={sp.id}
                        onClick={() => handleSelectPreset(sp.id)}
                        className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-blue-600/30 border border-blue-500/50 text-white font-bold'
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{sp.icon}</span>
                          <div className="min-w-0">
                            <div className="font-bold truncate">{sp.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{sp.desc}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Mode Toggle: 1v1 vs Leaderboard */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => onUpdateScoreboard({ ...scoreboard, mode: 'one_on_one' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                scoreboard.mode === 'one_on_one'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Duelo 1 vs 1
            </button>
            <button
              onClick={() => onUpdateScoreboard({ ...scoreboard, mode: 'multiplayer' })}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                scoreboard.mode === 'multiplayer'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tabla (3+)
            </button>
          </div>

          {/* Quick Put Live Button */}
          <button
            onClick={() => onSetViewMode('SCOREBOARD_ONLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isScoreboardLive
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-400 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
            }`}
          >
            {isScoreboardLive ? '● Marcador AL AIRE' : 'Transmitir Marcador'}
          </button>
        </div>
      </div>

      {/* 2. CENTER STAGE (PROTAGONISTA): CRONÓMETRO + RONDA / PERIODO LADO A LADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD A: CRONÓMETRO DE TRANSMISIÓN */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Cronómetro de Transmisión
              </h3>
            </div>

            <select
              value={timer.mode}
              onChange={(e) => onUpdateTimer({ ...timer, mode: e.target.value as any })}
              aria-label="Modo de cronómetro"
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="countdown">Modo: Regresivo (Cuenta Atrás)</option>
              <option value="stopwatch">Modo: Ascendente (Cronómetro)</option>
              <option value="off">Modo: Apagado</option>
            </select>
          </div>

          {/* Giant Time Readout */}
          <div className="my-2 py-4 px-6 bg-slate-950 border border-slate-800 rounded-xl text-center shadow-inner">
            <div className="text-5xl lg:text-6xl font-black font-mono tracking-wider text-white">
              {formatTimeDisplay(
                timer.mode === 'countdown' ? timer.secondsRemaining : timer.stopwatchSeconds
              )}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 mt-1.5 flex items-center justify-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  timer.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span>
                {timer.isRunning
                  ? 'En Marcha'
                  : timer.mode === 'countdown'
                  ? 'Pausado (Cuenta Regresiva)'
                  : 'Pausado (Cronómetro)'}
              </span>
            </div>
          </div>

          {/* Big Start / Pause & Reset Buttons */}
          <div className="space-y-2 mt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTimer}
                className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
                  timer.isRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                {timer.isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{timer.isRunning ? 'Pausar Reloj' : 'Iniciar Reloj'}</span>
              </button>

              <button
                onClick={handleResetTimer}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                title="Reiniciar cronómetro"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Adjustment Grid */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleAdjustTimer(60)}
                className="py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold border border-slate-800"
              >
                +1 min
              </button>
              <button
                onClick={() => handleAdjustTimer(-60)}
                className="py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold border border-slate-800"
              >
                -1 min
              </button>
              <button
                onClick={() => handleAdjustTimer(30)}
                className="py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold border border-slate-800"
              >
                +30s
              </button>
              <button
                onClick={() => handleAdjustTimer(-30)}
                className="py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-bold border border-slate-800"
              >
                -30s
              </button>
            </div>
          </div>
        </div>

        {/* CARD B: RONDA Y PERIODO ACTUAL */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Ronda y Periodo Actual
              </h3>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Total Rondas: {scoreboard.totalRounds}
            </div>
          </div>

          {/* Period Readout & Label Input */}
          <div className="my-2 py-4 px-6 bg-slate-950 border border-slate-800 rounded-xl shadow-inner flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Nombre del Periodo:
              </span>
              <input
                type="text"
                value={scoreboard.periodTypeLabel}
                onChange={(e) =>
                  onUpdateScoreboard({ ...scoreboard, periodTypeLabel: e.target.value })
                }
                className="bg-transparent font-black text-xl text-white focus:outline-none focus:underline"
                placeholder="Cuarto / Tiempo / Set..."
              />
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                Número Actual:
              </span>
              <div className="text-4xl lg:text-5xl font-black font-mono text-purple-400 leading-none">
                {scoreboard.currentRound}
              </div>
            </div>
          </div>

          {/* Period Navigation Buttons */}
          <div className="space-y-2 mt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrevRound}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black transition-colors"
              >
                &lt;&lt; Periodo Anterior
              </button>
              <button
                onClick={handleNextRound}
                className="py-3 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-600/30 transition-all active:scale-98"
              >
                Siguiente Periodo &gt;&gt;
              </button>
            </div>

            {/* History count & clear */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="font-medium">
                Instantáneas guardadas: {scoreboard.roundHistory.length}
              </span>
              {scoreboard.roundHistory.length > 0 && (
                <button
                  onClick={handleRequestClearHistory}
                  className="text-red-400 hover:text-red-300 font-bold text-[11px] cursor-pointer"
                >
                  Limpiar Historial
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. LOWER SECTION: HUD VISIBILITY MATRIX (COMPACT PILLS) + LOWER-THIRD TICKER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* HUD Matrix Pills */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Matriz de Visibilidad en Pantalla (HUD Toggles)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'showTimer', label: 'Reloj / Timer' },
              { key: 'showPeriod', label: 'Periodo / Ronda' },
              { key: 'showRoundHistory', label: 'Historial Sets' },
              { key: 'showFouls', label: 'Faltas / Tarjetas' },
              { key: 'showPossession', label: 'Posesión / Saque' },
              { key: 'showEventTitles', label: 'Títulos Evento' },
              { key: 'showScores', label: 'Puntajes Grandes' },
              { key: 'showTicker', label: 'Cintillo Ticker' },
            ].map((toggle) => {
              const isChecked = (hudToggles as any)[toggle.key];
              return (
                <button
                  key={toggle.key}
                  onClick={() =>
                    onUpdateHudToggles({
                      ...hudToggles,
                      [toggle.key]: !isChecked,
                    })
                  }
                  className={`p-2 rounded-xl text-xs font-bold text-left border transition-all ${
                    isChecked
                      ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-bold">
                    {isChecked ? '● Visible' : '○ Oculto'}
                  </div>
                  <div className="truncate mt-0.5">{toggle.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lower-Third Ticker Editor Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Cintillo Informativo Inferior (Ticker)
                </h3>
              </div>

              <button
                onClick={() => onUpdateScene({ ...scene, tickerActive: !scene.tickerActive })}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                  scene.tickerActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {scene.tickerActive ? '● Activo en Pantalla' : '○ Inactivo'}
              </button>
            </div>

            <textarea
              value={scene.tickerMessage}
              onChange={(e) => onUpdateScene({ ...scene, tickerMessage: e.target.value })}
              rows={2}
              placeholder="Escribe el mensaje o aviso que recorrerá la parte inferior del proyector..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono resize-none"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>💡 Mensaje animado en bucle continuo en la pantalla del proyector.</span>
            <span className="font-mono text-slate-400">{scene.tickerMessage.length} caracteres</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Clear Round History */}
      <ConfirmActionModal
        isOpen={isConfirmClearHistoryOpen}
        title="¿Vaciar Historial de Rondas Anteriores?"
        message="Se eliminarán todas las instantáneas de rondas previas guardadas en este partido. Los puntajes actuales de los equipos no se modificarán."
        confirmText="Sí, Vaciar Historial"
        cancelText="Cancelar"
        severity="danger"
        iconType="history"
        onConfirm={handleExecuteClearHistory}
        onClose={() => setIsConfirmClearHistoryOpen(false)}
      />
    </div>
  );
};

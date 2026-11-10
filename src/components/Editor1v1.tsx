import React, { useState } from 'react';
import { Scoreboard1v1 } from '../types/scoreboard';
import {
  calculateUpdatedScore,
  swapTeams1v1,
  advanceRound1v1,
  previousRound1v1,
  TEAM_COLOR_PALETTE,
} from '../utils/scoreboardRules';
import { SportPresetSelectorModal } from './SportPresetSelectorModal';
import { RoundHistoryManagerModal } from './RoundHistoryManagerModal';
import {
  ArrowLeftRight,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  Shield,
  Trophy,
  Dumbbell,
  History,
  Flame,
  ChevronRight,
  ChevronLeft,
  Square,
} from 'lucide-react';

interface Editor1v1Props {
  scoreboard: Scoreboard1v1;
  onChange: (updated: Scoreboard1v1) => void;
  isLive: boolean;
}

export const Editor1v1: React.FC<Editor1v1Props> = ({
  scoreboard,
  onChange,
  isLive,
}) => {
  const { teamA, teamB, quickScoreButtons = [1, 2, 3] } = scoreboard;
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const updateTeamA = (partial: Partial<typeof teamA>) => {
    onChange({
      ...scoreboard,
      teamA: { ...scoreboard.teamA, ...partial },
      updatedAt: Date.now(),
    });
  };

  const updateTeamB = (partial: Partial<typeof teamB>) => {
    onChange({
      ...scoreboard,
      teamB: { ...scoreboard.teamB, ...partial },
      updatedAt: Date.now(),
    });
  };

  const handleScoreChange = (team: 'A' | 'B', delta: number) => {
    if (team === 'A') {
      updateTeamA({ score: calculateUpdatedScore(teamA.score, delta) });
    } else {
      updateTeamB({ score: calculateUpdatedScore(teamB.score, delta) });
    }
  };

  const handleSwap = () => {
    onChange(swapTeams1v1(scoreboard));
  };

  const handleAdvanceRound = () => {
    onChange(advanceRound1v1(scoreboard));
  };

  const handlePreviousRound = () => {
    onChange(previousRound1v1(scoreboard));
  };

  const handleTogglePossession = (target: 'A' | 'B') => {
    if (target === 'A') {
      const nextA = !teamA.hasPossession;
      updateTeamA({ hasPossession: nextA });
      if (nextA) updateTeamB({ hasPossession: false });
    } else {
      const nextB = !teamB.hasPossession;
      updateTeamB({ hasPossession: nextB });
      if (nextB) updateTeamA({ hasPossession: false });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner: Sport Preset, Match Details & Live Round Controller */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-md">
        <div className="flex flex-1 min-w-[260px] flex-col gap-2">
          {/* Header Row: Preset button & Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsPresetModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-950/50 px-3 py-1 text-xs font-bold text-blue-300 hover:bg-blue-900/60 hover:border-blue-400 transition-all shadow-sm"
              title="Cambiar deporte o personalizar reglas"
            >
              <Dumbbell className="h-3.5 w-3.5 text-blue-400" />
              <span>Plantilla: {scoreboard.sportPreset ? scoreboard.sportPreset.toUpperCase() : 'PERSONALIZADO'}</span>
            </button>

            <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 border border-slate-700">
              {scoreboard.roundProgression === 'sets_reset' ? 'Modo Sets (Reset)' : 'Modo Acumulativo'}
            </span>

            {isLive && (
              <span className="rounded bg-red-600/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                EN VIVO AL AIRE
              </span>
            )}
          </div>

          {/* Match Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={scoreboard.title}
              onChange={(e) =>
                onChange({ ...scoreboard, title: e.target.value, updatedAt: Date.now() })
              }
              placeholder="Título del partido / evento"
              aria-label="Título del partido o evento"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={scoreboard.subtitle}
              onChange={(e) =>
                onChange({ ...scoreboard, subtitle: e.target.value, updatedAt: Date.now() })
              }
              placeholder="Subtítulo o fase (ej. Campeonato 2026)"
              aria-label="Subtítulo o fase del evento"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Live Round Controller & Swap */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Round controller */}
          <div className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-950 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {scoreboard.periodTypeLabel} {scoreboard.currentRound}
                {scoreboard.totalRounds > 0 && ` de ${scoreboard.totalRounds}`}
              </span>

              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                title="Ver y corregir historial de rondas"
              >
                <History className="h-3 w-3" />
                <span>Historial ({scoreboard.roundHistory?.length || 0})</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePreviousRound}
                disabled={scoreboard.currentRound <= 1}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-30"
                title="Ronda anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </button>

              <button
                onClick={handleAdvanceRound}
                className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-600 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-amber-500 shadow-sm"
                title="Cierra la ronda actual y avanza a la siguiente"
              >
                <span>Siguiente {scoreboard.periodTypeLabel}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Swap sides */}
          <button
            onClick={handleSwap}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-900/50 hover:border-indigo-400 transition-all shadow-sm"
            title="Intercambiar lados de Equipo A y B"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Swap Lados</span>
          </button>
        </div>
      </div>

      {/* Round History Preview Strip (if any previous rounds exist) */}
      {scoreboard.roundHistory && scoreboard.roundHistory.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs">
          <span className="font-bold text-slate-400 uppercase text-[10px] shrink-0">
            Parciales:
          </span>
          <div className="flex items-center gap-2">
            {scoreboard.roundHistory.map((rec, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-0.5 font-scoreboard text-xs"
              >
                <span className="text-amber-400 font-bold">{rec.label}:</span>
                <span style={{ color: teamA.color }}>{rec.scoreA}</span>
                <span className="text-slate-500">-</span>
                <span style={{ color: teamB.color }}>{rec.scoreB}</span>
              </span>
            ))}
          </div>
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="ml-auto text-[10px] text-blue-400 hover:underline shrink-0"
          >
            Editar Historial
          </button>
        </div>
      )}

      {/* TEAMS CONSOLE PANELS (SIDE BY SIDE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* TEAM A OPERATOR PANEL */}
        <div
          className="relative flex flex-col rounded-3xl border-2 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md"
          style={{ borderColor: teamA.color }}
        >
          {/* Header & Possession Toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: teamA.color }}
              >
                EQUIPO A (LOCAL)
              </span>
              {/* Possession / Serve Button */}
              <button
                onClick={() => handleTogglePossession('A')}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition-all ${
                  teamA.hasPossession
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Marca si este equipo tiene la posesión del balón o el saque"
              >
                <Flame className="h-3 w-3" />
                <span>{teamA.hasPossession ? 'POSESIÓN / SAQUE' : 'SIN SAQUE'}</span>
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <span>Color:</span>
              <input
                type="color"
                value={teamA.color}
                onChange={(e) => updateTeamA({ color: e.target.value })}
                aria-label="Color del Equipo A"
                className="h-6 w-6 cursor-pointer rounded border border-slate-700 bg-transparent"
              />
            </label>
          </div>

          {/* Editable Team Name Input */}
          <div className="mt-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Nombre del Equipo / Jugador:
            </label>
            <input
              type="text"
              value={teamA.name}
              onChange={(e) => updateTeamA({ name: e.target.value })}
              aria-label="Nombre del Equipo A"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 font-scoreboard text-lg sm:text-xl font-bold text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Color Palette Quick Swatches */}
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-400">Paleta:</span>
            {TEAM_COLOR_PALETTE.slice(0, 6).map((c) => (
              <button
                key={c.hex}
                onClick={() => updateTeamA({ color: c.hex })}
                className="h-5 w-5 rounded-full border border-white/20 transition-transform hover:scale-110 active:scale-95"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>

          {/* BIG SCORE DISPLAY & DIRECT INPUT */}
          <div className="my-3 flex items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                PUNTAJE ACTUAL
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleScoreChange('A', -1)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-90 transition-all"
                  title="Restar 1 punto"
                >
                  <Minus className="h-6 w-6" />
                </button>

                <input
                  type="number"
                  value={teamA.score}
                  onChange={(e) => updateTeamA({ score: Math.max(0, parseInt(e.target.value) || 0) })}
                  aria-label="Puntaje directo del Equipo A"
                  className="font-scoreboard w-28 text-center text-5xl sm:text-6xl font-black text-white bg-transparent focus:outline-none"
                />

                <button
                  onClick={() => handleScoreChange('A', 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-90 transition-all"
                  title="Sumar 1 punto"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC PARAMETRIZED QUICK SCORE BUTTONS */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {quickScoreButtons.map((btnVal) => (
              <button
                key={btnVal}
                onClick={() => handleScoreChange('A', btnVal)}
                className="flex-1 min-w-[50px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-sm font-black text-white hover:border-blue-500 hover:bg-blue-600/20 active:scale-95 transition-all"
              >
                +{btnVal}
              </button>
            ))}
            <button
              onClick={() => handleScoreChange('A', -1)}
              className="flex-1 min-w-[50px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-sm font-black text-slate-300 hover:border-rose-500 hover:text-rose-400 active:scale-95 transition-all"
            >
              -1
            </button>
            <button
              onClick={() => updateTeamA({ score: 0 })}
              className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40 active:scale-95 transition-all"
              title="Resetear a 0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* SETS, FOULS, CARDS & ADVANTAGE */}
          <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-800 pt-3">
            {/* Sets Won */}
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/60 p-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sets</span>
              <div className="mt-1 flex items-center gap-1">
                <button
                  onClick={() => updateTeamA({ setsWon: Math.max(0, teamA.setsWon - 1) })}
                  className="h-5 w-5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  -
                </button>
                <span className="font-scoreboard w-5 text-center text-sm font-bold text-white">
                  {teamA.setsWon}
                </span>
                <button
                  onClick={() => updateTeamA({ setsWon: teamA.setsWon + 1 })}
                  className="h-5 w-5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fouls */}
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/60 p-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Faltas</span>
              <div className="mt-1 flex items-center gap-1">
                <button
                  onClick={() => updateTeamA({ fouls: Math.max(0, teamA.fouls - 1) })}
                  className="h-5 w-5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  -
                </button>
                <span className="font-scoreboard w-5 text-center text-sm font-bold text-red-400">
                  {teamA.fouls}
                </span>
                <button
                  onClick={() => updateTeamA({ fouls: teamA.fouls + 1 })}
                  className="h-5 w-5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tarjetas Amarillas */}
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/60 p-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Tarj.</span>
              <div className="mt-1 flex items-center gap-1">
                <button
                  onClick={() =>
                    updateTeamA({ cardsYellow: Math.max(0, (teamA.cardsYellow || 0) + 1) })
                  }
                  className="h-5 w-5 rounded bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
                  title="Sumar tarjeta amarilla"
                >
                  {teamA.cardsYellow || 0}
                </button>
                <button
                  onClick={() =>
                    updateTeamA({ cardsRed: Math.max(0, (teamA.cardsRed || 0) + 1) })
                  }
                  className="h-5 w-5 rounded bg-red-600 text-white text-xs font-bold shadow-sm"
                  title="Sumar tarjeta roja"
                >
                  {teamA.cardsRed || 0}
                </button>
              </div>
            </div>

            {/* Advantage */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Ventaja</span>
              <button
                onClick={() => updateTeamA({ advantage: !teamA.advantage })}
                className={`mt-1 rounded-lg px-2 py-0.5 text-xs font-bold transition-all ${
                  teamA.advantage
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {teamA.advantage ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* TEAM B OPERATOR PANEL */}
        <div
          className="relative flex flex-col rounded-3xl border-2 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md"
          style={{ borderColor: teamB.color }}
        >
          {/* Header & Possession Toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: teamB.color }}
              >
                EQUIPO B (VISITANTE)
              </span>
              {/* Possession / Serve Button */}
              <button
                onClick={() => handleTogglePossession('B')}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition-all ${
                  teamB.hasPossession
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Marca si este equipo tiene la posesión del balón o el saque"
              >
                <Flame className="h-3 w-3" />
                <span>{teamB.hasPossession ? 'POSESIÓN / SAQUE' : 'SIN SAQUE'}</span>
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <span>Color:</span>
              <input
                type="color"
                value={teamB.color}
                onChange={(e) => updateTeamB({ color: e.target.value })}
                aria-label="Color del Equipo B"
                className="h-6 w-6 cursor-pointer rounded border border-slate-700 bg-transparent"
              />
            </label>
          </div>

          {/* Editable Team Name Input */}
          <div className="mt-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Nombre del Equipo / Jugador:
            </label>
            <input
              type="text"
              value={teamB.name}
              onChange={(e) => updateTeamB({ name: e.target.value })}
              aria-label="Nombre del Equipo B"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 font-scoreboard text-lg sm:text-xl font-bold text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Color Palette Quick Swatches */}
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-400">Paleta:</span>
            {TEAM_COLOR_PALETTE.slice(1, 7).map((c) => (
              <button
                key={c.hex}
                onClick={() => updateTeamB({ color: c.hex })}
                className="h-5 w-5 rounded-full border border-white/20 transition-transform hover:scale-110 active:scale-95"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>

          {/* BIG SCORE DISPLAY & DIRECT INPUT */}
          <div className="my-3 flex items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                PUNTAJE ACTUAL
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleScoreChange('B', -1)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-90 transition-all"
                  title="Restar 1 punto"
                >
                  <Minus className="h-6 w-6" />
                </button>

                <input
                  type="number"
                  value={teamB.score}
                  onChange={(e) => updateTeamB({ score: Math.max(0, parseInt(e.target.value) || 0) })}
                  aria-label="Puntaje directo del Equipo B"
                  className="font-scoreboard w-28 text-center text-5xl sm:text-6xl font-black text-white bg-transparent focus:outline-none"
                />

                <button
                  onClick={() => handleScoreChange('B', 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500 bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-90 transition-all"
                  title="Sumar 1 punto"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC PARAMETRIZED QUICK SCORE BUTTONS */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {quickScoreButtons.map((btnVal) => (
              <button
                key={btnVal}
                onClick={() => handleScoreChange('B', btnVal)}
                className="flex-1 min-w-[50px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-sm font-black text-white hover:border-red-500 hover:bg-red-600/20 active:scale-95 transition-all"
              >
                +{btnVal}
              </button>
            ))}
            <button
              onClick={() => handleScoreChange('B', -1)}
              className="flex-1 min-w-[50px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-sm font-black text-slate-300 hover:border-rose-500 hover:text-rose-400 active:scale-95 transition-all"
            >
              -1
            </button>
            <button
              onClick={() => updateTeamB({ score: 0 })}
              className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40 active:scale-95 transition-all"
              title="Resetear a 0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* SETS, FOULS, CARDS & ADVANTAGE */}
          <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-800 pt-3">
            {/* Sets Won */}
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/60 p-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sets</span>
              <div className="mt-1 flex items-center gap-1">
                <button
                  onClick={() => updateTeamB({ setsWon: Math.max(0, teamB.setsWon - 1) })}
                  className="h-5 w-5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  -
                </button>
                <span className="font-scoreboard w-5 text-center text-sm font-bold text-white">
                  {teamB.setsWon}
                </span>
                <button
                  onClick={() => updateTeamB({ setsWon: teamB.setsWon + 1 })}
                  className="h-5 w-5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fouls */}
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/60 p-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Faltas</span>
              <div className="mt-1 flex items-center gap-1">
                <button
                  onClick={() => updateTeamB({ fouls: Math.max(0, teamB.fouls - 1) })}
                  className="h-5 w-5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  -
                </button>
                <span className="font-scoreboard w-5 text-center text-sm font-bold text-red-400">
                  {teamB.fouls}
                </span>
                <button
                  onClick={() => updateTeamB({ fouls: teamB.fouls + 1 })}
                  className="h-5 w-5 rounded bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Tarjetas */}
            <div className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950/60 p-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Tarj.</span>
              <div className="mt-1 flex items-center gap-1">
                <button
                  onClick={() =>
                    updateTeamB({ cardsYellow: Math.max(0, (teamB.cardsYellow || 0) + 1) })
                  }
                  className="h-5 w-5 rounded bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
                  title="Sumar tarjeta amarilla"
                >
                  {teamB.cardsYellow || 0}
                </button>
                <button
                  onClick={() =>
                    updateTeamB({ cardsRed: Math.max(0, (teamB.cardsRed || 0) + 1) })
                  }
                  className="h-5 w-5 rounded bg-red-600 text-white text-xs font-bold shadow-sm"
                  title="Sumar tarjeta roja"
                >
                  {teamB.cardsRed || 0}
                </button>
              </div>
            </div>

            {/* Advantage */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Ventaja</span>
              <button
                onClick={() => updateTeamB({ advantage: !teamB.advantage })}
                className={`mt-1 rounded-lg px-2 py-0.5 text-xs font-bold transition-all ${
                  teamB.advantage
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {teamB.advantage ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Modal */}
      <SportPresetSelectorModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        scoreboard={scoreboard}
        onApplyConfig={(cfg) => {
          onChange({
            ...scoreboard,
            ...cfg,
            updatedAt: Date.now(),
          });
        }}
      />

      {/* Round History Manager Modal */}
      <RoundHistoryManagerModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        scoreboard={scoreboard}
        onUpdateHistory1v1={(newHist) => {
          onChange({
            ...scoreboard,
            roundHistory: newHist,
            updatedAt: Date.now(),
          });
        }}
      />
    </div>
  );
};

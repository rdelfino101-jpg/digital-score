import React, { useState } from 'react';
import { Participant, ScoreboardMultiplayer } from '../types/scoreboard';
import {
  calculateUpdatedScore,
  advanceRoundMultiplayer,
  TEAM_COLOR_PALETTE,
} from '../utils/scoreboardRules';
import { SportPresetSelectorModal } from './SportPresetSelectorModal';
import { RoundHistoryManagerModal } from './RoundHistoryManagerModal';
import {
  UserPlus,
  Trash2,
  RotateCcw,
  Plus,
  Minus,
  ArrowUpDown,
  Trophy,
  Dumbbell,
  History,
  Flame,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface EditorMultiplayerProps {
  scoreboard: ScoreboardMultiplayer;
  onChange: (updated: ScoreboardMultiplayer) => void;
  isLive: boolean;
}

export const EditorMultiplayer: React.FC<EditorMultiplayerProps> = ({
  scoreboard,
  onChange,
  isLive,
}) => {
  const { participants, autoSort, quickScoreButtons = [100, 200, 500] } = scoreboard;
  const [customDeltas, setCustomDeltas] = useState<Record<string, number>>({});
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const updateParticipant = (id: string, partial: Partial<Participant>) => {
    const updated = participants.map((p) =>
      p.id === id ? { ...p, ...partial } : p
    );
    onChange({
      ...scoreboard,
      participants: updated,
      updatedAt: Date.now(),
    });
  };

  const handleScoreChange = (id: string, delta: number) => {
    const target = participants.find((p) => p.id === id);
    if (!target) return;
    updateParticipant(id, {
      score: calculateUpdatedScore(target.score, delta),
    });
  };

  const handleCustomAdd = (id: string) => {
    const delta = customDeltas[id] || 0;
    if (delta !== 0) {
      handleScoreChange(id, delta);
      setCustomDeltas((prev) => ({ ...prev, [id]: 0 }));
    }
  };

  const handleAddParticipant = () => {
    const nextIndex = participants.length + 1;
    const color =
      TEAM_COLOR_PALETTE[(nextIndex - 1) % TEAM_COLOR_PALETTE.length].hex;
    const newParticipant: Participant = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `Equipo ${nextIndex}`,
      color,
      score: 0,
      hasTurn: false,
    };
    onChange({
      ...scoreboard,
      participants: [...participants, newParticipant],
      updatedAt: Date.now(),
    });
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 2) {
      alert('Debe haber al menos 2 participantes en el marcador multijugador.');
      return;
    }
    const target = participants.find((p) => p.id === id);
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al participante "${target?.name || 'seleccionado'}"?`)) {
      return;
    }
    onChange({
      ...scoreboard,
      participants: participants.filter((p) => p.id !== id),
      updatedAt: Date.now(),
    });
  };

  const handleAdvanceRound = () => {
    onChange(advanceRoundMultiplayer(scoreboard));
  };

  const handlePreviousRound = () => {
    if (scoreboard.currentRound <= 1) return;
    const prevRound = scoreboard.currentRound - 1;
    const newHistory = [...(scoreboard.roundHistory || [])];
    newHistory.pop();
    onChange({
      ...scoreboard,
      currentRound: prevRound,
      roundHistory: newHistory,
      updatedAt: Date.now(),
    });
  };

  const handleToggleTurn = (participantId: string) => {
    // Sets turn to this participant or toggles off if already active
    const target = participants.find((p) => p.id === participantId);
    const nextTurn = !target?.hasTurn;

    const updated = participants.map((p) => ({
      ...p,
      hasTurn: p.id === participantId ? nextTurn : false,
    }));

    onChange({
      ...scoreboard,
      participants: updated,
      updatedAt: Date.now(),
    });
  };

  const handleResetAllScores = () => {
    if (window.confirm('¿Reiniciar el puntaje de todos los participantes a 0?')) {
      onChange({
        ...scoreboard,
        participants: participants.map((p) => ({ ...p, score: 0 })),
        updatedAt: Date.now(),
      });
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
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/50 px-3 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400 transition-all shadow-sm"
              title="Cambiar formato o personalizar botones"
            >
              <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
              <span>Plantilla: {scoreboard.sportPreset ? scoreboard.sportPreset.toUpperCase() : 'PERSONALIZADO'}</span>
            </button>

            <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 border border-slate-700">
              {participants.length} Participantes
            </span>

            {isLive && (
              <span className="rounded bg-red-600/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                EN VIVO AL AIRE
              </span>
            )}
          </div>

          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={scoreboard.title}
              onChange={(e) =>
                onChange({ ...scoreboard, title: e.target.value, updatedAt: Date.now() })
              }
              placeholder="Nombre del Torneo / Trivia"
              aria-label="Nombre del Torneo o Trivia"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-semibold text-white focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              value={scoreboard.subtitle}
              onChange={(e) =>
                onChange({ ...scoreboard, subtitle: e.target.value, updatedAt: Date.now() })
              }
              placeholder="Subtítulo o fase"
              aria-label="Subtítulo o fase"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Live Round Controller & AutoSort */}
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
                title="Ver historial de rondas"
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
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </button>

              <button
                onClick={handleAdvanceRound}
                className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-600 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-amber-500 shadow-sm"
              >
                <span>Cerrar {scoreboard.periodTypeLabel}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* AutoSort Toggle */}
          <button
            onClick={() =>
              onChange({ ...scoreboard, autoSort: !autoSort, updatedAt: Date.now() })
            }
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
              autoSort
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">Auto-Ordenar:</span> {autoSort ? 'ACTIVO' : 'MANUAL'}
          </button>

          {/* Add Team */}
          <button
            onClick={handleAddParticipant}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Equipo</span>
          </button>
        </div>
      </div>

      {/* Round History Preview Strip */}
      {scoreboard.roundHistory && scoreboard.roundHistory.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs">
          <span className="font-bold text-slate-400 uppercase text-[10px] shrink-0">
            Rondas Guardadas:
          </span>
          <div className="flex items-center gap-2">
            {scoreboard.roundHistory.map((rec, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-0.5 font-scoreboard text-xs text-amber-400"
              >
                <span>{rec.label} ({Object.keys(rec.scores || {}).length} equipos)</span>
              </span>
            ))}
          </div>
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="ml-auto text-[10px] text-emerald-400 hover:underline shrink-0"
          >
            Ver Detalle Completo
          </button>
        </div>
      )}

      {/* PARTICIPANTS OPERATOR CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {participants.map((p, idx) => {
          const customDelta = customDeltas[p.id] || 0;

          return (
            <div
              key={p.id}
              className={`relative flex flex-col justify-between rounded-2xl border-2 bg-slate-900/80 p-4 shadow-lg backdrop-blur-md transition-all ${
                p.hasTurn ? 'ring-2 ring-amber-400/60' : ''
              }`}
              style={{ borderColor: p.color }}
            >
              {/* Header: Turn badge, Name input, color picker & delete */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black text-slate-950 font-scoreboard"
                    style={{ backgroundColor: p.color }}
                  >
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
                    aria-label={`Nombre del participante ${idx + 1}`}
                    className="font-scoreboard w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-sm font-bold text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Turn button */}
                  <button
                    onClick={() => handleToggleTurn(p.id)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase transition-all ${
                      p.hasTurn
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Marca si es el turno activo de este equipo"
                  >
                    {p.hasTurn ? 'TURNO' : 'TURNO'}
                  </button>

                  <input
                    type="color"
                    value={p.color}
                    onChange={(e) => updateParticipant(p.id, { color: e.target.value })}
                    aria-label={`Color para ${p.name}`}
                    className="h-6 w-6 cursor-pointer rounded border border-slate-700 bg-transparent"
                  />

                  {participants.length > 2 && (
                    <button
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Eliminar este equipo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Big Score Display with direct input & -1/+1 buttons */}
              <div className="my-2.5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-1.5">
                <button
                  onClick={() => handleScoreChange(p.id, -1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95"
                  title="Restar 1 punto"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={p.score}
                    onChange={(e) =>
                      updateParticipant(p.id, {
                        score: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    aria-label={`Puntaje directo de ${p.name}`}
                    className="font-scoreboard w-24 text-center text-3xl font-black bg-transparent focus:outline-none"
                    style={{ color: p.color }}
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">PTS</span>
                </div>

                <button
                  onClick={() => handleScoreChange(p.id, 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-sm"
                  title="Sumar 1 punto"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* PARAMETRIZED QUICK SCORE BUTTONS */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickScoreButtons.map((btnVal) => (
                  <button
                    key={btnVal}
                    onClick={() => handleScoreChange(p.id, btnVal)}
                    className="flex-1 min-w-[48px] rounded-lg border border-slate-700 bg-slate-800/80 py-1.5 text-xs font-bold text-white hover:border-emerald-500 hover:bg-emerald-600/20 active:scale-95"
                  >
                    +{btnVal}
                  </button>
                ))}
                <button
                  onClick={() => handleScoreChange(p.id, -1)}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1.5 text-xs font-bold text-slate-300 hover:border-rose-500 hover:text-rose-400 active:scale-95"
                >
                  -1
                </button>
              </div>

              {/* Custom Score Addition Field */}
              <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-800/80 pt-2">
                <input
                  type="number"
                  value={customDelta === 0 ? '' : customDelta}
                  onChange={(e) =>
                    setCustomDeltas((prev) => ({
                      ...prev,
                      [p.id]: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="+/- cant."
                  aria-label="Puntos personalizados a sumar o restar"
                  className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={() => handleCustomAdd(p.id)}
                  disabled={!customDelta}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => updateParticipant(p.id, { score: 0 })}
                  className="rounded-lg p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                  title="Poner a 0"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
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
        onUpdateHistoryMulti={(newHist) => {
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

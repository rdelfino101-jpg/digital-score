import React, { useState } from 'react';
import {
  StudioTeam,
  TurnEngineState,
  RaffleWinnerHistoryItem,
} from '../../types/masterStudio';
import { getNextTurnTeamId, getPrevTurnTeamId } from '../../utils/gameEngineRules';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Flame,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Zap,
  Gift,
  Trophy,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ConfirmActionModal } from './modals/ConfirmActionModal';

interface TeamManagerSidebarProps {
  teams: StudioTeam[];
  turn: TurnEngineState;
  onUpdateTeams: (teams: StudioTeam[]) => void;
  onUpdateTurn: (turn: TurnEngineState) => void;
  onQuickAdjustScore: (teamId: string, delta: number) => void;
  isRaffleModule?: boolean;
  raffleWinners?: RaffleWinnerHistoryItem[];
}

export const TeamManagerSidebar: React.FC<TeamManagerSidebarProps> = ({
  teams,
  turn,
  onUpdateTeams,
  onUpdateTurn,
  onQuickAdjustScore,
  isRaffleModule = false,
  raffleWinners = [],
}) => {
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'teams' | 'raffle_winners'>('teams');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<StudioTeam | null>(null);

  const activeTeam = teams.find((t) => t.id === turn.activeTeamId) || teams[0];

  const handleNextTurn = () => {
    const nextId = getNextTurnTeamId(teams, turn.activeTeamId);
    onUpdateTurn({
      ...turn,
      activeTeamId: nextId,
      lastActionMessage: `Turno avanzado a ${teams.find((t) => t.id === nextId)?.name || 'Equipo'}`,
    });
  };

  const handlePrevTurn = () => {
    const prevId = getPrevTurnTeamId(teams, turn.activeTeamId);
    onUpdateTurn({
      ...turn,
      activeTeamId: prevId,
      lastActionMessage: `Turno regresado a ${teams.find((t) => t.id === prevId)?.name || 'Equipo'}`,
    });
  };

  const handleSelectTurn = (teamId: string) => {
    onUpdateTurn({
      ...turn,
      activeTeamId: teamId,
      lastActionMessage: `Turno asignado a ${teams.find((t) => t.id === teamId)?.name || 'Equipo'}`,
    });
  };

  const handleToggleSteal = () => {
    onUpdateTurn({
      ...turn,
      stealMode: !turn.stealMode,
      lastActionMessage: !turn.stealMode ? '¡Modo Robo de Puntos Activado!' : 'Modo Robo desactivado',
    });
  };

  const handleToggleAutoAdvance = () => {
    onUpdateTurn({
      ...turn,
      autoAdvanceOnScore: !turn.autoAdvanceOnScore,
    });
  };

  const handleStartEdit = (t: StudioTeam) => {
    setEditingTeamId(t.id);
    setTempName(t.name);
  };

  const handleSaveEdit = (t: StudioTeam) => {
    if (!tempName.trim()) return;
    onUpdateTeams(
      teams.map((item) => (item.id === t.id ? { ...item, name: tempName.trim() } : item))
    );
    setEditingTeamId(null);
  };

  const handleColorChange = (t: StudioTeam, color: string) => {
    onUpdateTeams(
      teams.map((item) => (item.id === t.id ? { ...item, color } : item))
    );
  };

  const handleTogglePossession = (t: StudioTeam) => {
    onUpdateTeams(
      teams.map((item) => ({
        ...item,
        hasPossession: item.id === t.id ? !item.hasPossession : false,
      }))
    );
  };

  const handleAddFoul = (t: StudioTeam, delta: number) => {
    onUpdateTeams(
      teams.map((item) =>
        item.id === t.id ? { ...item, fouls: Math.max(0, item.fouls + delta) } : item
      )
    );
  };

  const handleAddSet = (t: StudioTeam, delta: number) => {
    onUpdateTeams(
      teams.map((item) =>
        item.id === t.id ? { ...item, setsWon: Math.max(0, item.setsWon + delta) } : item
      )
    );
  };

  const handleAddNewTeam = () => {
    if (!newTeamName.trim()) return;
    const defaultColors = [
      '#2563eb',
      '#dc2626',
      '#16a34a',
      '#ea580c',
      '#9333ea',
      '#06b6d4',
      '#eab308',
      '#ec4899',
    ];
    const color = defaultColors[teams.length % defaultColors.length];
    const newTeam: StudioTeam = {
      id: `team-${Date.now()}`,
      name: newTeamName.trim(),
      color,
      score: 0,
      setsWon: 0,
      fouls: 0,
      hasPossession: false,
    };
    onUpdateTeams([...teams, newTeam]);
    setNewTeamName('');
    setIsAddingTeam(false);
  };

  const handleRequestDeleteTeam = (team: StudioTeam) => {
    if (teams.length <= 2) {
      return;
    }
    setTeamToDelete(team);
  };

  const handleExecuteDeleteTeam = () => {
    if (!teamToDelete) return;
    const teamId = teamToDelete.id;
    const updated = teams.filter((t) => t.id !== teamId);
    let nextTurn = turn.activeTeamId;
    if (turn.activeTeamId === teamId) {
      nextTurn = updated[0]?.id || null;
    }
    onUpdateTeams(updated);
    onUpdateTurn({ ...turn, activeTeamId: nextTurn });
    setTeamToDelete(null);
  };

  const handleRequestResetScores = () => {
    setConfirmResetOpen(true);
  };

  const handleExecuteResetScores = () => {
    onUpdateTeams(
      teams.map((t) => ({
        ...t,
        score: 0,
        setsWon: 0,
        fouls: 0,
      }))
    );
    setConfirmResetOpen(false);
  };

  // If collapsed on desktop
  if (isCollapsed) {
    return (
      <aside className="w-12 shrink-0 bg-[#0a0f1d] border-r border-slate-800 flex flex-col items-center py-3 select-none">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Expandir barra de Equipos y Turnos"
        >
          <PanelLeftOpen className="w-5 h-5 text-blue-400" />
        </button>

        <div className="mt-4 flex flex-col items-center gap-2">
          {teams.map((t) => (
            <span
              key={t.id}
              onClick={() => {
                handleSelectTurn(t.id);
                setIsCollapsed(false);
              }}
              className="w-4 h-4 rounded-full cursor-pointer shadow ring-1 ring-white/20 hover:scale-125 transition-transform"
              style={{ backgroundColor: t.color }}
              title={`${t.name}: ${t.score} pts`}
            />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 shrink-0 bg-[#0a0f1d] border-r border-slate-800 flex flex-col h-full overflow-hidden select-none">
      {/* 1. TOP FIXED SECTION: CONTROL DE TURNOS CARD */}
      <div className="p-3 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span>Control de Turnos</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Steal Mode Toggle */}
            <button
              onClick={handleToggleSteal}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all ${
                turn.stealMode
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-200 hover:text-white'
              }`}
              title="Permite que otros equipos roben los puntos tras un error"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.2} />
              <span>Robo {turn.stealMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Collapse sidebar button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Colapsar barra lateral"
            >
              <PanelLeftClose className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Active Team Display Card */}
        {activeTeam && (
          <div
            className="p-2.5 rounded-xl border-2 transition-all shadow-md flex items-center justify-between"
            style={{
              borderColor: activeTeam.color,
              backgroundColor: `${activeTeam.color}15`,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow ring-1 ring-white/30"
                style={{ backgroundColor: activeTeam.color }}
              />
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                  En Turno Ahora:
                </span>
                <span className="font-black text-sm text-white truncate block">
                  {activeTeam.name}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xl font-black font-mono text-white leading-none">
                {activeTeam.score}
              </span>
              <span className="text-[9px] block text-slate-400 font-bold uppercase">pts</span>
            </div>
          </div>
        )}

        {/* Ergonomic Turn Navigation Buttons */}
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          <button
            onClick={handlePrevTurn}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>&lt;&lt; Anterior</span>
          </button>
          <button
            onClick={handleNextTurn}
            className="flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black shadow-md shadow-blue-600/30 transition-all active:scale-98"
          >
            <span>Siguiente &gt;&gt;</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto advance toggle */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 font-medium">
          <span>Pasar turno al sumar puntos:</span>
          <button
            onClick={handleToggleAutoAdvance}
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
              turn.autoAdvanceOnScore
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {turn.autoAdvanceOnScore ? 'Sí' : 'No'}
          </button>
        </div>
      </div>

      {/* 2. SUB-TABS: Equipos vs Historial Ganadores (Útil si está en sorteos) */}
      <div className="px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-bold shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-2 py-1 rounded-lg text-xs transition-colors ${
              activeTab === 'teams'
                ? 'bg-blue-600/30 text-blue-300 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Equipos ({teams.length})
          </button>

          {isRaffleModule && (
            <button
              onClick={() => setActiveTab('raffle_winners')}
              className={`px-2 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                activeTab === 'raffle_winners'
                  ? 'bg-amber-600/30 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3 h-3" />
              <span>Ganadores ({raffleWinners.length})</span>
            </button>
          )}
        </div>

        {activeTab === 'teams' && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleRequestResetScores}
              className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
              title="Reiniciar todos los puntajes a 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsAddingTeam(!isAddingTeam)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-[11px] font-bold transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Equipo</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Team Inline Form */}
      {isAddingTeam && activeTab === 'teams' && (
        <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-1.5 shrink-0">
          <input
            type="text"
            placeholder="Nombre del nuevo equipo..."
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewTeam()}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleAddNewTeam}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
          >
            Crear
          </button>
        </div>
      )}

      {/* 3. SCROLLABLE MIDDLE: ULTRA COMPACT TEAM CARDS */}
      {activeTab === 'teams' ? (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {teams.map((team) => {
            const isTurnActive = team.id === turn.activeTeamId;
            const isEditing = editingTeamId === team.id;

            return (
              <div
                key={team.id}
                className={`rounded-xl border transition-all p-2 ${
                  isTurnActive
                    ? 'bg-slate-900/90 border-blue-500 shadow-md ring-1 ring-blue-500/40'
                    : 'bg-slate-900/50 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Row 1: Dot + Name + Turn button + Score */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <label className="cursor-pointer relative shrink-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full block border border-white/30 shadow-sm"
                        style={{ backgroundColor: team.color }}
                      />
                      <input
                        type="color"
                        value={team.color}
                        onChange={(e) => handleColorChange(team, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-3.5 h-3.5"
                        title="Cambiar color del equipo"
                      />
                    </label>

                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(team)}
                          className="bg-slate-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(team)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => handleSelectTurn(team.id)}
                        className="font-black text-xs text-slate-200 truncate cursor-pointer hover:text-white"
                        title="Haz clic para asignarle el turno"
                      >
                        {team.name}
                      </span>
                    )}
                  </div>

                  {/* Actions & Score */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSelectTurn(team.id)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${
                        isTurnActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isTurnActive ? '★ Turno' : 'Turno'}
                    </button>

                    <button
                      onClick={() => handleStartEdit(team)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded transition-colors shadow-sm"
                      title="Editar nombre"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-300" strokeWidth={2.2} />
                    </button>

                    {teams.length > 2 && (
                      <button
                        onClick={() => handleRequestDeleteTeam(team)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-red-400 p-1.5 rounded transition-colors shadow-sm cursor-pointer"
                        title="Eliminar equipo"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-400" strokeWidth={2.2} />
                      </button>
                    )}

                    <span className="font-mono font-black text-base text-white ml-1">
                      {team.score}
                    </span>
                  </div>
                </div>

                {/* Row 2: 5 Quick Points Adjustment Buttons */}
                <div className="grid grid-cols-5 gap-1 mb-1.5">
                  <button
                    onClick={() => onQuickAdjustScore(team.id, -1)}
                    className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => onQuickAdjustScore(team.id, 1)}
                    className="py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-xs font-mono font-bold transition-colors"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => onQuickAdjustScore(team.id, 5)}
                    className="py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-xs font-mono font-bold transition-colors"
                  >
                    +5
                  </button>
                  <button
                    onClick={() => onQuickAdjustScore(team.id, 10)}
                    className="py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-mono font-bold transition-colors"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => onQuickAdjustScore(team.id, 50)}
                    className="py-1 rounded bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white text-xs font-mono font-bold transition-colors"
                  >
                    +50
                  </button>
                </div>

                {/* Row 3: Discrete Footer for Sets, Fouls, Possession */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/70">
                  <div className="flex items-center gap-1">
                    <span>Sets:</span>
                    <strong className="text-purple-400 font-mono">{team.setsWon}</strong>
                    <button
                      onClick={() => handleAddSet(team, 1)}
                      className="px-1 text-slate-400 hover:text-white bg-slate-800 rounded font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span>Faltas:</span>
                    <strong className="text-red-400 font-mono">{team.fouls}</strong>
                    <button
                      onClick={() => handleAddFoul(team, 1)}
                      className="px-1 text-slate-400 hover:text-white bg-slate-800 rounded font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleTogglePossession(team)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
                      team.hasPossession
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {team.hasPossession ? '● Saque' : 'Saque'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Sorteos Winners View in the left sidebar */
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {raffleWinners.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              <Gift className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>No hay ganadores registrados aún.</p>
            </div>
          ) : (
            raffleWinners.map((w, idx) => (
              <div
                key={w.id || idx}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate">{w.name}</div>
                  <div className="text-[10px] text-amber-400 truncate">{w.prize}</div>
                </div>
                {w.ticketNumber && (
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                    #{w.ticketNumber}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmation Modal: Reset All Scores */}
      <ConfirmActionModal
        isOpen={confirmResetOpen}
        title="¿Reiniciar Todos los Puntajes a 0?"
        message="Esta acción pondrá en 0 los puntos, sets y faltas acumuladas de todos los equipos del evento. Puedes usar 'Deshacer' (Ctrl+Z) si necesitas recuperarlos."
        confirmText="Sí, Reiniciar a 0"
        cancelText="Cancelar"
        severity="warning"
        iconType="reset"
        onConfirm={handleExecuteResetScores}
        onClose={() => setConfirmResetOpen(false)}
      />

      {/* Confirmation Modal: Delete Team */}
      <ConfirmActionModal
        isOpen={!!teamToDelete}
        title={`¿Eliminar al equipo "${teamToDelete?.name}"?`}
        message="El equipo será removido de la tabla y del orden de turnos de la competencia."
        confirmText="Sí, Eliminar Equipo"
        cancelText="Cancelar"
        severity="danger"
        iconType="trash"
        onConfirm={handleExecuteDeleteTeam}
        onClose={() => setTeamToDelete(null)}
      />
    </aside>
  );
};

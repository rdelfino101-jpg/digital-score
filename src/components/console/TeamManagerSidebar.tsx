import React, { useState } from 'react';
import {
  StudioTeam,
  TurnEngineState,
  RaffleWinnerHistoryItem,
} from '../../types/masterStudio';
import { getNextTurnTeamId, getPrevTurnTeamId } from '../../utils/gameEngineRules';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
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

  const ancho = 'w-[272px] 2xl:w-80';

  if (isCollapsed) {
    return (
      <aside className="flex w-12 shrink-0 select-none flex-col items-center border-r border-[var(--c-line)] bg-[var(--c-panel)] py-3">
        <button
          onClick={() => setIsCollapsed(false)}
          className="rounded-lg p-2 text-[var(--c-text-2)] transition-colors hover:bg-[var(--c-panel-2)] hover:text-[var(--c-text)]"
          title="Mostrar equipos y turnos"
          aria-label="Mostrar equipos y turnos"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
        <div className="mt-4 flex flex-col items-center gap-2.5">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                handleSelectTurn(t.id);
                setIsCollapsed(false);
              }}
              className={`h-4 w-4 rounded-full transition-transform hover:scale-125 ${
                t.id === turn.activeTeamId ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[var(--c-panel)]' : ''
              }`}
              style={{ backgroundColor: t.color }}
              title={`${t.name}: ${t.score} pts`}
              aria-label={`${t.name}: ${t.score} puntos`}
            />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className={`${ancho} flex h-full shrink-0 select-none flex-col overflow-hidden border-r border-[var(--c-line)] bg-[var(--c-panel)]`}>
      {/* Turno */}
      <div className="shrink-0 border-b border-[var(--c-line)] p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[12px] font-bold text-[var(--c-text-2)]">Turno</h2>
          <button
            onClick={() => setIsCollapsed(true)}
            className="rounded-md p-1 text-[var(--c-text-3)] transition-colors hover:bg-[var(--c-panel-2)] hover:text-[var(--c-text)]"
            title="Ocultar columna de equipos"
            aria-label="Ocultar columna de equipos"
          >
            <PanelLeftClose className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        {activeTeam && (
          <div className="relative overflow-hidden rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2.5">
            <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: activeTeam.color }} aria-hidden />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-amber-300">En turno</p>
                <p className="line-clamp-2 text-[15px] font-bold leading-tight text-[var(--c-text)]">{activeTeam.name}</p>
              </div>
              <p className="shrink-0 font-mono text-[24px] font-black leading-none text-[var(--c-text)]">{activeTeam.score}</p>
            </div>
          </div>
        )}

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button
            onClick={handlePrevTurn}
            className="flex items-center justify-center gap-1 rounded-lg border border-[var(--c-line)] bg-[var(--c-panel-2)] py-2 text-[13px] font-semibold text-[var(--c-text)] transition-colors hover:border-[var(--c-line-strong)]"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
          <button
            onClick={handleNextTurn}
            className="flex items-center justify-center gap-1 rounded-lg bg-[var(--c-accent)] py-2 text-[13px] font-bold text-white transition-colors hover:bg-blue-500"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2.5 space-y-1.5">
          <Interruptor
            activo={turn.stealMode}
            onClick={handleToggleSteal}
            etiqueta="Robo de puntos"
            ayuda="Tras un error, otro equipo puede robar los puntos"
          />
          <Interruptor
            activo={turn.autoAdvanceOnScore}
            onClick={handleToggleAutoAdvance}
            etiqueta="Pasar turno al sumar puntos"
          />
        </div>
      </div>

      {/* Encabezado de la lista */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--c-line)] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('teams')}
            className={`whitespace-nowrap rounded-md px-2 py-1 text-[13px] transition-colors ${
              activeTab === 'teams' ? 'bg-[var(--c-panel-2)] font-bold text-[var(--c-text)]' : 'font-semibold text-[var(--c-text-3)] hover:text-[var(--c-text)]'
            }`}
          >
            Equipos ({teams.length})
          </button>
          {isRaffleModule && (
            <button
              onClick={() => setActiveTab('raffle_winners')}
              className={`flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[13px] transition-colors ${
                activeTab === 'raffle_winners'
                  ? 'bg-[var(--c-panel-2)] font-bold text-[var(--c-text)]'
                  : 'font-semibold text-[var(--c-text-3)] hover:text-[var(--c-text)]'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              Ganadores ({raffleWinners.length})
            </button>
          )}
        </div>

        {activeTab === 'teams' && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleRequestResetScores}
              className="rounded-md p-1.5 text-[var(--c-text-3)] transition-colors hover:bg-[var(--c-panel-2)] hover:text-[var(--c-text)]"
              title="Poner todos los puntajes en 0"
              aria-label="Poner todos los puntajes en 0"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsAddingTeam(!isAddingTeam)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-semibold text-[var(--c-accent)] transition-colors hover:bg-[var(--c-accent-soft)]"
              title="Agregar equipo"
              aria-label="Agregar equipo"
            >
              <Plus className="h-4 w-4" />
              {!isRaffleModule && 'Agregar'}
            </button>
          </div>
        )}
      </div>

      {isAddingTeam && activeTab === 'teams' && (
        <div className="flex shrink-0 items-center gap-1.5 border-b border-[var(--c-line)] p-2.5">
          <input
            type="text"
            placeholder="Nombre del nuevo equipo..."
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewTeam()}
            className="min-w-0 flex-1 rounded-lg border border-[var(--c-line-strong)] bg-[var(--c-bg)] px-2.5 py-1.5 text-[13px] text-[var(--c-text)] focus:border-[var(--c-accent)] focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleAddNewTeam}
            className="rounded-lg bg-[var(--c-accent)] px-3 py-1.5 text-[13px] font-bold text-white hover:bg-blue-500"
          >
            Crear
          </button>
        </div>
      )}

      {activeTab === 'teams' ? (
        <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
          {teams.map((team) => {
            const isTurnActive = team.id === turn.activeTeamId;
            const isEditing = editingTeamId === team.id;

            return (
              <div
                key={team.id}
                className={`group relative overflow-hidden rounded-xl border p-2.5 transition-colors ${
                  isTurnActive ? 'border-amber-500/50 bg-[var(--c-panel-2)]' : 'border-[var(--c-line)] bg-[var(--c-panel-2)]/60'
                }`}
              >
                <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: team.color }} aria-hidden />

                {/* Nombre y puntaje */}
                <div className="mb-2 flex items-start justify-between gap-2 pl-1">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <label className="relative mt-[3px] shrink-0 cursor-pointer" title="Cambiar color del equipo">
                      <span className="block h-3.5 w-3.5 rounded-full border border-white/25" style={{ backgroundColor: team.color }} />
                      <input
                        type="color"
                        value={team.color}
                        onChange={(e) => handleColorChange(team, e.target.value)}
                        className="absolute inset-0 h-3.5 w-3.5 cursor-pointer opacity-0"
                        aria-label={`Color de ${team.name}`}
                      />
                    </label>

                    {isEditing ? (
                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(team);
                            if (e.key === 'Escape') setEditingTeamId(null);
                          }}
                          className="min-w-0 flex-1 rounded-md border border-[var(--c-accent)] bg-[var(--c-bg)] px-1.5 py-0.5 text-[13px] text-[var(--c-text)] focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(team)}
                          className="rounded-md p-1 text-emerald-400 hover:bg-[var(--c-panel)]"
                          aria-label="Guardar nombre"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectTurn(team.id)}
                        className="min-w-0 flex-1 text-left"
                        title={isTurnActive ? 'Tiene el turno' : 'Dar el turno a este equipo'}
                      >
                        <span className="line-clamp-2 text-[14px] font-bold leading-tight text-[var(--c-text)]">{team.name}</span>
                        <span
                          className={`mt-0.5 block text-[12px] font-semibold ${
                            isTurnActive ? 'text-amber-300' : 'text-[var(--c-text-3)] group-hover:text-[var(--c-text-2)]'
                          }`}
                        >
                          {isTurnActive ? 'En turno' : 'Dar turno'}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-[22px] font-black leading-none text-[var(--c-text)]">{team.score}</span>
                    {!isEditing && (
                      <div className="flex items-center opacity-60 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleStartEdit(team)}
                          className="rounded-md p-1 text-[var(--c-text-2)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
                          title="Cambiar nombre"
                          aria-label={`Cambiar nombre de ${team.name}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {teams.length > 2 && (
                          <button
                            onClick={() => handleRequestDeleteTeam(team)}
                            className="rounded-md p-1 text-[var(--c-text-2)] hover:bg-[var(--c-panel)] hover:text-red-400"
                            title="Eliminar equipo"
                            aria-label={`Eliminar ${team.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Puntos rápidos */}
                <div className="grid grid-cols-5 gap-1 pl-1">
                  {[-1, 1, 5, 10, 50].map((delta) => (
                    <button
                      key={delta}
                      onClick={() => onQuickAdjustScore(team.id, delta)}
                      className={`rounded-md py-1.5 font-mono text-[13px] font-bold transition-colors active:scale-95 ${
                        delta < 0
                          ? 'bg-[var(--c-panel)] text-[var(--c-text-3)] hover:text-[var(--c-text)]'
                          : 'bg-[var(--c-panel)] text-[var(--c-text)] hover:bg-[var(--c-accent)] hover:text-white'
                      }`}
                      aria-label={`${delta > 0 ? 'Sumar' : 'Restar'} ${Math.abs(delta)} a ${team.name}`}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>

                {/* Sets, faltas y saque */}
                <div className="mt-2 flex items-center justify-between gap-2 pl-1 text-[12px] text-[var(--c-text-3)]">
                  <Contador etiqueta="Sets" valor={team.setsWon} onSumar={() => handleAddSet(team, 1)} />
                  <Contador etiqueta="Faltas" valor={team.fouls} onSumar={() => handleAddFoul(team, 1)} />
                  <button
                    onClick={() => handleTogglePossession(team)}
                    aria-pressed={team.hasPossession}
                    className={`rounded-md px-1.5 py-0.5 text-[12px] font-semibold transition-colors ${
                      team.hasPossession ? 'bg-amber-500/20 text-amber-300' : 'hover:text-[var(--c-text)]'
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
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {raffleWinners.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[var(--c-text-3)]">
              <Gift className="mx-auto mb-2 h-8 w-8 opacity-60" />
              <p>Todavía no hay ganadores.</p>
            </div>
          ) : (
            raffleWinners.map((w, idx) => (
              <div
                key={w.id || idx}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--c-line)] bg-[var(--c-panel-2)] p-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-[var(--c-text)]">{w.name}</div>
                  <div className="truncate text-[12px] text-amber-300">{w.prize}</div>
                </div>
                {w.ticketNumber && (
                  <span className="shrink-0 rounded-md bg-[var(--c-panel)] px-1.5 py-0.5 font-mono text-[12px] font-bold text-[var(--c-text-2)]">
                    #{w.ticketNumber}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmActionModal
        isOpen={confirmResetOpen}
        title="¿Poner todos los puntajes en 0?"
        message="Se pondrán en 0 los puntos, sets y faltas de todos los equipos. Si te equivocas, usa Deshacer (Ctrl+Z)."
        confirmText="Sí, poner en 0"
        cancelText="Cancelar"
        severity="warning"
        iconType="reset"
        onConfirm={handleExecuteResetScores}
        onClose={() => setConfirmResetOpen(false)}
      />

      <ConfirmActionModal
        isOpen={!!teamToDelete}
        title={`¿Eliminar a "${teamToDelete?.name}"?`}
        message="El equipo sale de la tabla y del orden de turnos."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        severity="danger"
        iconType="trash"
        onConfirm={handleExecuteDeleteTeam}
        onClose={() => setTeamToDelete(null)}
      />
    </aside>
  );
};

const Interruptor: React.FC<{ activo: boolean; onClick: () => void; etiqueta: string; ayuda?: string }> = ({
  activo,
  onClick,
  etiqueta,
  ayuda,
}) => (
  <button
    role="switch"
    aria-checked={activo}
    onClick={onClick}
    title={ayuda}
    className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-0.5 text-left text-[12px] text-[var(--c-text-2)] hover:text-[var(--c-text)]"
  >
    <span>{etiqueta}</span>
    <span
      className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors ${activo ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-line-strong)]'}`}
      aria-hidden
    >
      <span
        className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all ${activo ? 'left-[16px]' : 'left-[2px]'}`}
      />
    </span>
  </button>
);

const Contador: React.FC<{ etiqueta: string; valor: number; onSumar: () => void }> = ({ etiqueta, valor, onSumar }) => (
  <span className="flex items-center gap-1">
    {etiqueta}
    <strong className="font-mono text-[var(--c-text)]">{valor}</strong>
    <button
      onClick={onSumar}
      className="rounded px-1 font-bold text-[var(--c-text-2)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
      aria-label={`Sumar ${etiqueta.toLowerCase()}`}
    >
      +
    </button>
  </span>
);

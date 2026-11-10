import {
  CelebrationWinner,
  LiveHudToggles,
  Participant,
  RoundScoreRecord1v1,
  RoundScoreRecordMultiplayer,
  Scoreboard,
  Scoreboard1v1,
  ScoreboardAppState,
  ScoreboardMultiplayer,
  SportPresetId,
  TimerState,
} from '../types/scoreboard';

/**
 * Updates a numerical score ensuring non-negative values if allowNegative is false.
 */
export function calculateUpdatedScore(
  currentScore: number,
  delta: number,
  allowNegative = false
): number {
  const next = currentScore + delta;
  if (!allowNegative && next < 0) return 0;
  return next;
}

/**
 * Swaps Team A and Team B in a 1 vs 1 scoreboard.
 */
export function swapTeams1v1(scoreboard: Scoreboard1v1): Scoreboard1v1 {
  return {
    ...scoreboard,
    teamA: { ...scoreboard.teamB },
    teamB: { ...scoreboard.teamA },
    updatedAt: Date.now(),
  };
}

/**
 * Advances a 1 vs 1 round/set according to the progression mode (cumulative or sets_reset).
 */
export function advanceRound1v1(scoreboard: Scoreboard1v1): Scoreboard1v1 {
  const { currentRound, teamA, teamB, roundProgression, periodTypeLabel, roundHistory } =
    scoreboard;

  const newHistoryRecord: RoundScoreRecord1v1 = {
    roundNumber: currentRound,
    label: `${periodTypeLabel} ${currentRound}`,
    scoreA: teamA.score,
    scoreB: teamB.score,
  };

  const nextHistory = [...roundHistory, newHistoryRecord];
  const nextRound = currentRound + 1;

  if (roundProgression === 'sets_reset') {
    // Sets mode: winner of this set earns +1 set won, scores reset to 0
    let setsA = teamA.setsWon;
    let setsB = teamB.setsWon;

    if (teamA.score > teamB.score) {
      setsA += 1;
    } else if (teamB.score > teamA.score) {
      setsB += 1;
    }

    return {
      ...scoreboard,
      currentRound: nextRound,
      roundHistory: nextHistory,
      teamA: { ...teamA, score: 0, setsWon: setsA, advantage: false },
      teamB: { ...teamB, score: 0, setsWon: setsB, advantage: false },
      updatedAt: Date.now(),
    };
  }

  // Cumulative mode: scores stay, round counter increases
  return {
    ...scoreboard,
    currentRound: nextRound,
    roundHistory: nextHistory,
    updatedAt: Date.now(),
  };
}

/**
 * Reverts to the previous round for a 1 vs 1 scoreboard.
 */
export function previousRound1v1(scoreboard: Scoreboard1v1): Scoreboard1v1 {
  if (scoreboard.currentRound <= 1) return scoreboard;

  const prevRound = scoreboard.currentRound - 1;
  const newHistory = [...scoreboard.roundHistory];
  const lastRecord = newHistory.pop();

  if (scoreboard.roundProgression === 'sets_reset' && lastRecord) {
    // Restore previous scores from lastRecord
    let setsA = scoreboard.teamA.setsWon;
    let setsB = scoreboard.teamB.setsWon;
    if (lastRecord.scoreA > lastRecord.scoreB && setsA > 0) setsA -= 1;
    if (lastRecord.scoreB > lastRecord.scoreA && setsB > 0) setsB -= 1;

    return {
      ...scoreboard,
      currentRound: prevRound,
      roundHistory: newHistory,
      teamA: { ...scoreboard.teamA, score: lastRecord.scoreA, setsWon: setsA },
      teamB: { ...scoreboard.teamB, score: lastRecord.scoreB, setsWon: setsB },
      updatedAt: Date.now(),
    };
  }

  return {
    ...scoreboard,
    currentRound: prevRound,
    roundHistory: newHistory,
    updatedAt: Date.now(),
  };
}

/**
 * Advances a multiplayer round, storing current snapshot in history.
 */
export function advanceRoundMultiplayer(
  scoreboard: ScoreboardMultiplayer
): ScoreboardMultiplayer {
  const { currentRound, participants, periodTypeLabel, roundHistory, roundProgression } =
    scoreboard;

  const currentScores: Record<string, number> = {};
  participants.forEach((p) => {
    currentScores[p.id] = p.score;
  });

  const newRecord: RoundScoreRecordMultiplayer = {
    roundNumber: currentRound,
    label: `${periodTypeLabel} ${currentRound}`,
    scores: currentScores,
  };

  const nextHistory = [...roundHistory, newRecord];
  const nextRound = currentRound + 1;

  if (roundProgression === 'sets_reset') {
    return {
      ...scoreboard,
      currentRound: nextRound,
      roundHistory: nextHistory,
      participants: participants.map((p) => ({ ...p, score: 0 })),
      updatedAt: Date.now(),
    };
  }

  return {
    ...scoreboard,
    currentRound: nextRound,
    roundHistory: nextHistory,
    updatedAt: Date.now(),
  };
}

/**
 * Returns sorted participants from highest to lowest score with rank and medal indicator.
 */
export interface RankedParticipant extends Participant {
  rank: number;
  isTied: boolean;
  medal?: 'gold' | 'silver' | 'bronze';
}

export function rankParticipants(
  participants: Participant[],
  autoSort = true
): RankedParticipant[] {
  const sorted = autoSort
    ? [...participants].sort((a, b) => b.score - a.score)
    : [...participants];

  return sorted.map((p) => {
    const rank = participants.filter((other) => other.score > p.score).length + 1;
    const isTied =
      participants.filter((other) => other.id !== p.id && other.score === p.score)
        .length > 0;

    let medal: 'gold' | 'silver' | 'bronze' | undefined;
    if (rank === 1) medal = 'gold';
    else if (rank === 2) medal = 'silver';
    else if (rank === 3) medal = 'bronze';

    return {
      ...p,
      rank,
      isTied,
      medal,
    };
  });
}

/**
 * Formats seconds into MM:SS or HH:MM:SS format.
 */
export function formatTimeDisplay(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

/**
 * Computes winner for celebration in either 1v1 or multiplayer scoreboard.
 */
export function determineWinner(scoreboard: Scoreboard): CelebrationWinner | null {
  if (scoreboard.type === 'one_on_one') {
    const { teamA, teamB, periodTypeLabel, currentRound, roundProgression } = scoreboard;

    // In sets mode, consider setsWon first
    if (roundProgression === 'sets_reset') {
      if (teamA.setsWon > teamB.setsWon) {
        return {
          name: teamA.name,
          score: `${teamA.setsWon} - ${teamB.setsWon} Sets`,
          color: teamA.color,
          subtitle: `Ganador del partido (${teamA.setsWon} sets ganados)`,
        };
      } else if (teamB.setsWon > teamA.setsWon) {
        return {
          name: teamB.name,
          score: `${teamB.setsWon} - ${teamA.setsWon} Sets`,
          color: teamB.color,
          subtitle: `Ganador del partido (${teamB.setsWon} sets ganados)`,
        };
      }
    }

    if (teamA.score > teamB.score) {
      return {
        name: teamA.name,
        score: `${teamA.score} - ${teamB.score}`,
        color: teamA.color,
        subtitle: `Líder del encuentro (${periodTypeLabel} ${currentRound})`,
      };
    } else if (teamB.score > teamA.score) {
      return {
        name: teamB.name,
        score: `${teamB.score} - ${teamA.score}`,
        color: teamB.color,
        subtitle: `Líder del encuentro (${periodTypeLabel} ${currentRound})`,
      };
    } else {
      return {
        name: '¡Empate Técnico!',
        score: `${teamA.score} = ${teamB.score}`,
        color: '#f59e0b',
        subtitle: `${teamA.name} y ${teamB.name} están igualados`,
      };
    }
  } else {
    if (scoreboard.participants.length === 0) return null;
    const ranked = rankParticipants(scoreboard.participants, true);
    const leader = ranked[0];
    const runnersUp = ranked.filter((p) => p.score === leader.score);

    if (runnersUp.length > 1) {
      return {
        name: `Empate en 1er lugar (${runnersUp.length} participantes)`,
        score: `${leader.score} pts`,
        color: '#f59e0b',
        subtitle: runnersUp.map((r) => r.name).join(' & '),
      };
    }

    return {
      name: leader.name,
      score: `${leader.score} pts`,
      color: leader.color,
      subtitle: `Líder Absoluto de la Tabla`,
    };
  }
}

/**
 * Ticks a timer forward by 1 second.
 */
export function tickTimerState(prev: TimerState): TimerState {
  if (!prev.isRunning) return prev;

  if (prev.mode === 'countdown') {
    const nextRemaining = Math.max(0, prev.secondsRemaining - 1);
    const isNowFinished = nextRemaining === 0;
    return {
      ...prev,
      secondsRemaining: nextRemaining,
      isRunning: !isNowFinished,
      lastTickTimestamp: Date.now(),
    };
  } else if (prev.mode === 'stopwatch') {
    return {
      ...prev,
      stopwatchSeconds: prev.stopwatchSeconds + 1,
      lastTickTimestamp: Date.now(),
    };
  }

  return prev;
}

/**
 * Palette colors available for quick team/participant styling.
 */
export const TEAM_COLOR_PALETTE = [
  { name: 'Azul Eléctrico', hex: '#2563eb' },
  { name: 'Rojo Carmesí', hex: '#dc2626' },
  { name: 'Verde Esmeralda', hex: '#16a34a' },
  { name: 'Amarillo Oro', hex: '#d97706' },
  { name: 'Púrpura Neón', hex: '#9333ea' },
  { name: 'Cian Turquesa', hex: '#0891b2' },
  { name: 'Naranja Fuego', hex: '#ea580c' },
  { name: 'Rosa Magenta', hex: '#db2777' },
  { name: 'Gris Grafito', hex: '#475569' },
  { name: 'Blanco Puro', hex: '#ffffff' },
];

/**
 * Sport preset definitions with defaults.
 */
export interface SportPresetDefinition {
  id: SportPresetId;
  name: string;
  category: '1v1' | 'multi';
  description: string;
  periodLabel: string;
  defaultRounds: number;
  progression: 'cumulative' | 'sets_reset';
  quickButtons: number[];
  suggestedTimerMode: 'countdown' | 'stopwatch' | 'off';
  suggestedTimerMinutes: number;
  hasPossession: boolean;
  hasFouls: boolean;
}

export const SPORT_PRESETS: SportPresetDefinition[] = [
  {
    id: 'basketball',
    name: 'Básquetbol',
    category: '1v1',
    description: 'Cuartos de 10/12 min, tiros de 1, 2 y 3 pts, faltas acumuladas y posesión.',
    periodLabel: 'Cuarto',
    defaultRounds: 4,
    progression: 'cumulative',
    quickButtons: [1, 2, 3],
    suggestedTimerMode: 'countdown',
    suggestedTimerMinutes: 10,
    hasPossession: true,
    hasFouls: true,
  },
  {
    id: 'soccer',
    name: 'Fútbol / Futsal',
    category: '1v1',
    description: 'Tiempos de juego, goles de 1 pt, faltas y tarjetas amarillas/rojas.',
    periodLabel: 'Tiempo',
    defaultRounds: 2,
    progression: 'cumulative',
    quickButtons: [1],
    suggestedTimerMode: 'stopwatch',
    suggestedTimerMinutes: 45,
    hasPossession: false,
    hasFouls: true,
  },
  {
    id: 'volleyball',
    name: 'Voleibol / Pádel / Tenis',
    category: '1v1',
    description: 'Puntuación por Sets (reseteo por set, puntos a 25/11), indicador de saque/servicio.',
    periodLabel: 'Set',
    defaultRounds: 3,
    progression: 'sets_reset',
    quickButtons: [1],
    suggestedTimerMode: 'stopwatch',
    suggestedTimerMinutes: 0,
    hasPossession: true,
    hasFouls: false,
  },
  {
    id: 'combat',
    name: 'Combate / Boxeo / MMA',
    category: '1v1',
    description: 'Rondas con descanso, puntos de jueces o golpes, advertencias/penalizaciones.',
    periodLabel: 'Ronda',
    defaultRounds: 3,
    progression: 'cumulative',
    quickButtons: [1, 2, 3],
    suggestedTimerMode: 'countdown',
    suggestedTimerMinutes: 3,
    hasPossession: false,
    hasFouls: true,
  },
  {
    id: 'trivia',
    name: 'Trivia / Concurso por Rondas',
    category: 'multi',
    description: 'Preguntas con puntaje configurable (100, 200, 500) y registro ronda por ronda.',
    periodLabel: 'Ronda',
    defaultRounds: 5,
    progression: 'cumulative',
    quickButtons: [100, 200, 500],
    suggestedTimerMode: 'countdown',
    suggestedTimerMinutes: 1,
    hasPossession: false,
    hasFouls: false,
  },
  {
    id: 'tournament',
    name: 'Torneo / Tabla de Posiciones',
    category: 'multi',
    description: 'Puntos acumulativos para ligas, torneos gaming o dinámicas grupales.',
    periodLabel: 'Ronda',
    defaultRounds: 4,
    progression: 'cumulative',
    quickButtons: [1, 5, 10],
    suggestedTimerMode: 'off',
    suggestedTimerMinutes: 0,
    hasPossession: false,
    hasFouls: false,
  },
  {
    id: 'custom',
    name: '100% Personalizado',
    category: '1v1',
    description: 'Control manual total de periodos, botones de puntos y reglas.',
    periodLabel: 'Periodo',
    defaultRounds: 2,
    progression: 'cumulative',
    quickButtons: [1, 2, 5],
    suggestedTimerMode: 'countdown',
    suggestedTimerMinutes: 10,
    hasPossession: true,
    hasFouls: true,
  },
];

export const DEFAULT_HUD_TOGGLES: LiveHudToggles = {
  showTimer: true,
  showPeriod: true,
  showRoundHistory: true,
  showFouls: true,
  showPossession: true,
  showEventTitles: true,
  showScores: true,
  showTicker: true,
  viewMode: 'standard',
};

/**
 * Generates the 3 requested default sample scoreboards.
 */
export function createDefaultScoreboards(): Scoreboard[] {
  // 1. Basketball Match (1v1 with Quarters, fouls, possession, countdown)
  const basketball: Scoreboard1v1 = {
    id: 'sb-demo-basketball',
    type: 'one_on_one',
    sportPreset: 'basketball',
    title: 'Gran Final de Básquetbol Pro',
    subtitle: 'Campeonato Nacional 2026',
    teamA: {
      id: 'team-lakers',
      name: 'Águilas Doradas',
      color: '#d97706',
      score: 78,
      setsWon: 0,
      fouls: 4,
      advantage: false,
      hasPossession: true,
    },
    teamB: {
      id: 'team-celtics',
      name: 'Halcones Verdes',
      color: '#16a34a',
      score: 74,
      setsWon: 0,
      fouls: 3,
      advantage: false,
      hasPossession: false,
    },
    periodTypeLabel: 'Cuarto',
    currentRound: 4,
    totalRounds: 4,
    roundProgression: 'cumulative',
    quickScoreButtons: [1, 2, 3],
    roundHistory: [
      { roundNumber: 1, label: 'Cuarto 1', scoreA: 20, scoreB: 18 },
      { roundNumber: 2, label: 'Cuarto 2', scoreA: 42, scoreB: 39 },
      { roundNumber: 3, label: 'Cuarto 3', scoreA: 61, scoreB: 58 },
    ],
    updatedAt: Date.now(),
  };

  // 2. Volleyball / Padel (1v1 with Sets history, serve indicator, sets reset)
  const volleyball: Scoreboard1v1 = {
    id: 'sb-demo-volleyball',
    type: 'one_on_one',
    sportPreset: 'volleyball',
    title: 'Clásico de Voleibol / Pádel',
    subtitle: 'Torneo Abierto de Campeones',
    teamA: {
      id: 'team-volley-a',
      name: 'Vóley Trueno',
      color: '#2563eb',
      score: 22,
      setsWon: 1,
      fouls: 0,
      advantage: true,
      hasPossession: true, // Saque/Servicio
    },
    teamB: {
      id: 'team-volley-b',
      name: 'Furia Roja',
      color: '#dc2626',
      score: 20,
      setsWon: 1,
      fouls: 0,
      advantage: false,
      hasPossession: false,
    },
    periodTypeLabel: 'Set',
    currentRound: 3,
    totalRounds: 3,
    roundProgression: 'sets_reset',
    pointsToWinSet: 25,
    quickScoreButtons: [1],
    roundHistory: [
      { roundNumber: 1, label: 'Set 1', scoreA: 25, scoreB: 21 },
      { roundNumber: 2, label: 'Set 2', scoreA: 19, scoreB: 25 },
    ],
    updatedAt: Date.now(),
  };

  // 3. Trivia 5 Teams with Round-by-round points & cumulative leaderboards
  const trivia: ScoreboardMultiplayer = {
    id: 'sb-demo-trivia',
    type: 'multiplayer',
    sportPreset: 'trivia',
    title: 'Gran Trivia & Desafío de Sabios',
    subtitle: '5 Equipos en Competencia por Rondas',
    periodTypeLabel: 'Ronda',
    currentRound: 3,
    totalRounds: 5,
    roundProgression: 'cumulative',
    quickScoreButtons: [100, 200, 500],
    participants: [
      { id: 't-1', name: 'Mentes Maestras', color: '#2563eb', score: 1400 },
      { id: 't-2', name: 'Los Científicos', color: '#16a34a', score: 1200 },
      { id: 't-3', name: 'Nova Explorers', color: '#d97706', score: 900 },
      { id: 't-4', name: 'Cyber Nerds', color: '#9333ea', score: 1550, hasTurn: true },
      { id: 't-5', name: 'Quiz Masters', color: '#db2777', score: 800 },
    ],
    autoSort: true,
    roundHistory: [
      {
        roundNumber: 1,
        label: 'Ronda 1',
        scores: { 't-1': 500, 't-2': 400, 't-3': 300, 't-4': 600, 't-5': 300 },
      },
      {
        roundNumber: 2,
        label: 'Ronda 2',
        scores: { 't-1': 900, 't-2': 800, 't-3': 600, 't-4': 1100, 't-5': 500 },
      },
    ],
    updatedAt: Date.now(),
  };

  return [basketball, volleyball, trivia];
}

/**
 * Initial application state.
 */
export function createInitialAppState(): ScoreboardAppState {
  const defaults = createDefaultScoreboards();
  return {
    scoreboards: defaults,
    activeEditingId: defaults[0].id,
    broadcast: {
      liveScoreboardId: defaults[0].id,
      blackout: false,
      celebrationActive: false,
      celebrationWinner: null,
      tickerMessage: '¡Bienvenidos a la transmisión oficial en vivo! Gran definición.',
      tickerActive: true,
      theme: 'broadcast-dark',
      hudToggles: { ...DEFAULT_HUD_TOGGLES },
    },
    timer: {
      mode: 'countdown',
      isRunning: false,
      secondsRemaining: 600, // 10 minutes
      initialSeconds: 600,
      stopwatchSeconds: 0,
    },
    version: 2,
  };
}

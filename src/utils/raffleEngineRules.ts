import {
  RaffleParticipant,
  RaffleState,
  RaffleSpinEvent,
  TeamMatcherResult,
  TournamentBracket,
  TournamentMatch,
} from '../types/masterStudio';

export const RAFFLE_PALETTE = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#d97706', // Amber
  '#9333ea', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f97316', // Orange
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#e11d48', // Rose
  '#3b82f6', // Light Blue
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#f59e0b', // Yellow
];

/**
 * Cryptographically secure random number between 0 (inclusive) and 1 (exclusive).
 * Replaces Math.random() as required by Requirement 3.
 */
export function getCryptoRandom(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] / (0xffffffff + 1);
  }
  return Math.random();
}

/**
 * Normalizes participant name for deduplication (lowercase, trimmed, without accents).
 */
export function normalizeParticipantName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
}

export const DEFAULT_CHALLENGES: string[] = [
  'canta el coro de su alabanza favorita',
  'recita el Salmo 23 completo sin equivocarse',
  'imita a un predicador famoso por 20 segundos',
  'hace 10 sentadillas sin reírse ni perder el aliento',
  'menciona 5 libros del Nuevo Testamento en 7 segundos',
  'baila una coreografía en cámara lenta por 15 segundos',
  'cuenta un testimonio inspirador de 30 segundos',
  'responde una pregunta bíblica difícil del público',
  'hace mímica de una historia bíblica sin hablar',
  'da un abrazo de bendición a tres personas distintas',
];

export const DEFAULT_PRIZES: string[] = [
  'una Biblia de Estudio de Lujo',
  'una Canasta Familiar Sorpresa',
  'un Termo Oficial del Evento + Libro',
  'una Cena Especial para Dos Personas',
  'un Chocolate Gigante Premium',
  'una Entrada VIP al Gran Concierto',
  '200 Puntos para la Clasificación de su Equipo',
  'un Kit Completo de Merchandising Oficial',
  'un Pase de Cortesía + Regalo Especial',
  'la Gran Copa y Premio Estelar de la Noche',
];

export const DEFAULT_RAFFLE_PARTICIPANTS: RaffleParticipant[] = [
  { id: 'raf-1', name: 'Sofía Martínez', color: RAFFLE_PALETTE[0], ticketNumber: 101, eliminated: false, groupOrCell: 'Jóvenes Vencedores' },
  { id: 'raf-2', name: 'Mateo Fernández', color: RAFFLE_PALETTE[1], ticketNumber: 102, eliminated: false, groupOrCell: 'Familia de Fe' },
  { id: 'raf-3', name: 'Valentina Gómez', color: RAFFLE_PALETTE[2], ticketNumber: 103, eliminated: false, groupOrCell: 'Luz y Sal' },
  { id: 'raf-4', name: 'Lucas Rodríguez', color: RAFFLE_PALETTE[3], ticketNumber: 104, eliminated: false, groupOrCell: 'Guerreros de Oración' },
  { id: 'raf-5', name: 'Isabella Díaz', color: RAFFLE_PALETTE[4], ticketNumber: 105, eliminated: false, groupOrCell: 'Jóvenes Vencedores' },
  { id: 'raf-6', name: 'Santiago Morales', color: RAFFLE_PALETTE[5], ticketNumber: 106, eliminated: false, groupOrCell: 'Familia de Fe' },
  { id: 'raf-7', name: 'Camila Herrera', color: RAFFLE_PALETTE[6], ticketNumber: 107, eliminated: false, groupOrCell: 'Luz y Sal' },
  { id: 'raf-8', name: 'Emiliano Castro', color: RAFFLE_PALETTE[7], ticketNumber: 108, eliminated: false, groupOrCell: 'Guerreros de Oración' },
  { id: 'raf-9', name: 'Lucía Benítez', color: RAFFLE_PALETTE[8], ticketNumber: 109, eliminated: false, groupOrCell: 'Generación Viva' },
  { id: 'raf-10', name: 'Joaquín Silva', color: RAFFLE_PALETTE[9], ticketNumber: 110, eliminated: false, groupOrCell: 'Generación Viva' },
  { id: 'raf-11', name: 'Martina Romero', color: RAFFLE_PALETTE[10], ticketNumber: 111, eliminated: false, groupOrCell: 'Luz y Sal' },
  { id: 'raf-12', name: 'Benjamín Vargas', color: RAFFLE_PALETTE[11], ticketNumber: 112, eliminated: false, groupOrCell: 'Familia de Fe' },
];

export function createInitialRaffleState(): RaffleState {
  return {
    mode: 'wheel',
    participants: DEFAULT_RAFFLE_PARTICIPANTS,
    prizeTitle: 'Gran Sorteo Oficial',
    drawRule: 'direct_win',
    eliminationTargetRound: 3,
    currentEliminationCount: 0,
    autoRemoveWinner: true,
    spinDurationSeconds: 6,
    numberRangeMin: 1,
    numberRangeMax: 200,
    numberZeroPadding: 3,
    drawnNumbersHistory: [],
    matcherType: 'duels_1v1',
    matcherNumTeams: 4,
    matcherBracketSize: 8,
    lastMatcherResult: null,
    activeSpin: null,
    lastWinner: null,
    winnersHistory: [],
    challengesList: [...DEFAULT_CHALLENGES],
    prizesList: [...DEFAULT_PRIZES],
    challengeCombinerResult: null,
    raffleDrawCount: 1,
    nightWinners: [],
    showWinnerCelebrationScreen: false,
    activeWinnerScreenData: null,
    registrationsOpen: true,
    showQrRegistrationScene: false,
    drawRecords: [],
  };
}

/**
 * Calculates a deterministic wheel spin result.
 * Computes exact target angle such that the 3 o'clock pointer (at 0 degrees / right side)
 * lands precisely on winnerItem.
 */
export function calculateDeterministicWheelSpin(
  state: RaffleState,
  previousAngle = 0
): RaffleSpinEvent | null {
  const activeParticipants = state.participants.filter((p) => !p.eliminated);
  if (activeParticipants.length === 0) return null;

  // Pick random winner among active using crypto
  const randomActiveIdx = Math.floor(getCryptoRandom() * activeParticipants.length);
  const winnerItem = activeParticipants[randomActiveIdx];
  const winnerFullIndex = state.participants.findIndex((p) => p.id === winnerItem.id);

  const numSlices = state.participants.length;
  const sliceDeg = 360 / numSlices;

  // Segment mid-angle in SVG coordinates (0 deg = 3 o'clock)
  const centerOfWinnerDeg = winnerFullIndex * sliceDeg + sliceDeg / 2;

  // Pointer is at 3 o'clock (0 deg).
  // Rotating the wheel by angle Omega puts the point at: (centerOfWinnerDeg + Omega) mod 360 = 0
  // Hence Omega = (360 - (centerOfWinnerDeg mod 360)) mod 360.
  const desiredModAngle = ((360 - (centerOfWinnerDeg % 360)) % 360 + 360) % 360;

  // Multiple full turns for drama (at least 5-8 turns)
  const fullTurns = Math.max(5, Math.floor(state.spinDurationSeconds * 1.5));
  const currentMod = ((previousAngle % 360) + 360) % 360;
  let angleDiff = desiredModAngle - currentMod;
  if (angleDiff < 0) angleDiff += 360;

  // Land precisely at the center of the winner slice under the 3 o'clock pointer
  const targetAngle = previousAngle + fullTurns * 360 + angleDiff;
  const durationMs = state.spinDurationSeconds * 1000;
  const currentCount = state.currentEliminationCount + 1;

  return {
    spinId: Date.now(),
    isSpinning: true,
    winnerIndex: winnerFullIndex,
    winnerItem,
    targetAngle,
    slotFinalIndices: [winnerFullIndex, winnerFullIndex, winnerFullIndex],
    durationMs,
    startTime: Date.now(),
    rule: state.drawRule,
    eliminationRound: currentCount,
    eliminationTotal: state.eliminationTargetRound,
    prizeTitle: state.prizeTitle,
  };
}

/**
 * Calculates deterministic Challenge Combiner (Reemplazo de Tragamonedas).
 * Reel 1: Persona (participante activo)
 * Reel 2: Reto (de challengesList)
 * Reel 3: Premio (de prizesList)
 */
export function calculateDeterministicChallengeSpin(
  state: RaffleState
): RaffleSpinEvent | null {
  const activeParticipants = state.participants.filter((p) => !p.eliminated);
  if (activeParticipants.length === 0) return null;

  const challenges = state.challengesList.length > 0 ? state.challengesList : DEFAULT_CHALLENGES;
  const prizes = state.prizesList.length > 0 ? state.prizesList : DEFAULT_PRIZES;

  const randomActiveIdx = Math.floor(getCryptoRandom() * activeParticipants.length);
  const winnerItem = activeParticipants[randomActiveIdx];
  const winnerFullIndex = state.participants.findIndex((p) => p.id === winnerItem.id);

  const challengeIndex = Math.floor(getCryptoRandom() * challenges.length);
  const prizeIndex = Math.floor(getCryptoRandom() * prizes.length);

  const challengeText = challenges[challengeIndex];
  const prizeText = prizes[prizeIndex];

  const durationMs = state.spinDurationSeconds * 1000;
  const currentCount = state.currentEliminationCount + 1;

  return {
    spinId: Date.now(),
    isSpinning: true,
    winnerIndex: winnerFullIndex,
    winnerItem,
    targetAngle: 0,
    slotFinalIndices: [winnerFullIndex, challengeIndex, prizeIndex],
    challengeIndex,
    prizeIndex,
    challengeText,
    prizeText,
    durationMs,
    startTime: Date.now(),
    rule: state.drawRule,
    eliminationRound: currentCount,
    eliminationTotal: state.eliminationTargetRound,
    prizeTitle: state.prizeTitle,
  };
}

/**
 * Backward-compatible alias for calculateDeterministicChallengeSpin
 */
export const calculateDeterministicSlotSpin = calculateDeterministicChallengeSpin;

/**
 * Calculates random tombola ticket draw using crypto random.
 */
export function calculateDeterministicNumberDraw(
  state: RaffleState
): { drawnNumber: number; participant: RaffleParticipant } | null {
  const available: number[] = [];
  for (let i = state.numberRangeMin; i <= state.numberRangeMax; i++) {
    if (!state.drawnNumbersHistory.includes(i)) {
      available.push(i);
    }
  }

  if (available.length === 0) return null;

  const pickedIndex = Math.floor(getCryptoRandom() * available.length);
  const picked = available[pickedIndex];
  const padLength = state.numberZeroPadding || 3;
  const formatted = String(picked).padStart(padLength, '0');

  // Match or create participant entry
  const existing = state.participants.find((p) => p.ticketNumber === picked);
  const participant: RaffleParticipant = existing || {
    id: `ticket-${picked}`,
    name: `Boleto #${formatted}`,
    ticketNumber: picked,
    color: RAFFLE_PALETTE[picked % RAFFLE_PALETTE.length],
  };

  return { drawnNumber: picked, participant };
}

/**
 * Generates tournament bracket for 4, 8 or 16 teams.
 */
export function generateTournamentBracket(
  participants: RaffleParticipant[],
  bracketSize: 4 | 8 | 16 = 8
): TournamentBracket {
  const names = participants
    .filter((p) => !p.eliminated)
    .map((p) => p.name.trim())
    .filter(Boolean);

  // Shuffle with crypto random
  const shuffled = [...names];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(getCryptoRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Pad or trim to bracketSize
  const teamList: string[] = [];
  for (let i = 0; i < bracketSize; i++) {
    if (i < shuffled.length) {
      teamList.push(shuffled[i]);
    } else {
      teamList.push(`Equipo ${i + 1}`);
    }
  }

  // Calculate rounds count: 4 -> 2 rounds (Semis, Final); 8 -> 3 rounds (Cuartos, Semis, Final); 16 -> 4 rounds (Octavos, Cuartos, Semis, Final)
  const roundsCount = Math.log2(bracketSize);
  const matches: TournamentMatch[] = [];

  let matchCounter = 1;
  let matchesInRound = bracketSize / 2;

  for (let round = 0; round < roundsCount; round++) {
    for (let m = 0; m < matchesInRound; m++) {
      let teamA = '';
      let teamB = '';

      if (round === 0) {
        teamA = teamList[m * 2] || `Equipo ${m * 2 + 1}`;
        teamB = teamList[m * 2 + 1] || `Equipo ${m * 2 + 2}`;
      }

      matches.push({
        id: `match-r${round}-m${m}-${matchCounter++}`,
        roundIndex: round,
        matchIndex: m,
        teamA,
        teamB,
        winner: undefined,
      });
    }
    matchesInRound = matchesInRound / 2;
  }

  return {
    size: bracketSize,
    matches,
  };
}

/**
 * Advances a winner in a tournament bracket to the next round.
 */
export function advanceTournamentWinner(
  bracket: TournamentBracket,
  matchId: string,
  winnerTeam: string
): TournamentBracket {
  const matches = bracket.matches.map((m) => {
    if (m.id === matchId) {
      return { ...m, winner: winnerTeam };
    }
    return m;
  });

  const targetMatch = matches.find((m) => m.id === matchId);
  if (!targetMatch) return { ...bracket, matches };

  const nextRoundIndex = targetMatch.roundIndex + 1;
  const nextMatchIndex = Math.floor(targetMatch.matchIndex / 2);
  const isTeamAInNext = targetMatch.matchIndex % 2 === 0;

  const updatedMatches = matches.map((m) => {
    if (m.roundIndex === nextRoundIndex && m.matchIndex === nextMatchIndex) {
      return {
        ...m,
        teamA: isTeamAInNext ? winnerTeam : m.teamA,
        teamB: !isTeamAInNext ? winnerTeam : m.teamB,
      };
    }
    return m;
  });

  return {
    ...bracket,
    matches: updatedMatches,
  };
}

/**
 * Generates random 1v1 matchups, partitions into N balanced teams, or creates tournament brackets.
 */
export function generateTeamMatchups(
  participants: RaffleParticipant[],
  type: 'duels_1v1' | 'n_teams' | 'tournament_bracket',
  numTeams = 4,
  bracketSize: 4 | 8 | 16 = 8
): TeamMatcherResult {
  const names = participants
    .filter((p) => !p.eliminated)
    .map((p) => p.name.trim())
    .filter(Boolean);

  if (type === 'tournament_bracket') {
    const bracket = generateTournamentBracket(participants, bracketSize);
    return {
      type: 'tournament_bracket',
      bracket,
      timestamp: Date.now(),
    };
  }

  // Fisher-Yates Shuffle with crypto random
  const shuffled = [...names];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(getCryptoRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  if (type === 'duels_1v1') {
    const matchups: Array<{ teamA: string; teamB: string }> = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        matchups.push({ teamA: shuffled[i], teamB: shuffled[i + 1] });
      } else {
        matchups.push({ teamA: shuffled[i], teamB: 'Pasa a Siguiente Ronda (Bye)' });
      }
    }
    return {
      type: 'duels_1v1',
      matchups,
      timestamp: Date.now(),
    };
  }

  // Partition into N teams
  const safeNumTeams = Math.max(2, Math.min(numTeams, shuffled.length || 2));
  const groups: Array<{ groupName: string; members: string[]; color: string }> = [];

  for (let t = 0; t < safeNumTeams; t++) {
    groups.push({
      groupName: `Equipo ${t + 1}`,
      members: [],
      color: RAFFLE_PALETTE[t % RAFFLE_PALETTE.length],
    });
  }

  shuffled.forEach((name, idx) => {
    groups[idx % safeNumTeams].members.push(name);
  });

  return {
    type: 'n_teams',
    groups,
    timestamp: Date.now(),
  };
}

/**
 * Parses raw text input into RaffleParticipant list (lines or commas).
 */
export function parseParticipantsFromText(
  rawText: string,
  startTicket = 1
): RaffleParticipant[] {
  const lines = rawText
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return lines.map((name, idx) => ({
    id: `custom-${Date.now()}-${idx}`,
    name,
    color: RAFFLE_PALETTE[idx % RAFFLE_PALETTE.length],
    ticketNumber: startTicket + idx,
    eliminated: false,
  }));
}

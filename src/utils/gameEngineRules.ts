import {
  MasterLiveState,
  StudioTeam,
  TurnEngineState,
  ScoreboardConfig,
  TimerState,
  LiveHudToggles,
  LiveSceneSettings,
  GameStageState,
  HangmanGameState,
  FamilyFeudGameState,
  TriviaShowGameState,
  DealBriefcase,
} from '../types/masterStudio';
import {
  INITIAL_BIBLE_BOOK_ITEMS,
  INITIAL_WHO_SAID_IT_ITEMS,
  INITIAL_HANGMAN_ITEMS,
  INITIAL_CHARADES_ITEMS,
  INITIAL_FAMILY_FEUD_ITEMS,
  INITIAL_TRIVIA_SHOW_ITEMS,
  INITIAL_ANAGRAM_ITEMS,
  WHEEL_REWARDS,
  INITIAL_MUSIC_ITEMS,
  INITIAL_MILLIONAIRE_ITEMS,
  INITIAL_BRIEFCASES,
} from './gameData';
import { createInitialRaffleState } from './raffleEngineRules';

export const DEFAULT_TEAMS: StudioTeam[] = [
  {
    id: 'team-1',
    name: 'Águilas Doradas',
    color: '#d97706',
    score: 120,
    setsWon: 1,
    fouls: 2,
    advantage: false,
    hasPossession: true,
    roundHistoryScores: [40, 40, 40],
  },
  {
    id: 'team-2',
    name: 'Halcones Verdes',
    color: '#16a34a',
    score: 100,
    setsWon: 0,
    fouls: 3,
    advantage: false,
    hasPossession: false,
    roundHistoryScores: [30, 35, 35],
  },
  {
    id: 'team-3',
    name: 'Furia Roja',
    color: '#dc2626',
    score: 90,
    setsWon: 0,
    fouls: 1,
    advantage: false,
    hasPossession: false,
    roundHistoryScores: [30, 30, 30],
  },
  {
    id: 'team-4',
    name: 'Vóley Trueno',
    color: '#2563eb',
    score: 80,
    setsWon: 1,
    fouls: 0,
    advantage: false,
    hasPossession: false,
    roundHistoryScores: [25, 25, 30],
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

export function createInitialMasterLiveState(): MasterLiveState {
  const teams = [...DEFAULT_TEAMS];

  const scoreboard: ScoreboardConfig = {
    mode: 'multiplayer',
    sportPreset: 'general',
    title: 'Gran Competencia & Game Show Pro',
    subtitle: 'Temporada Oficial 2026',
    periodTypeLabel: 'Ronda',
    currentRound: 3,
    totalRounds: 5,
    roundProgression: 'cumulative',
    quickScoreButtons: [50, 100, 200],
    roundHistory: [
      { roundNumber: 1, label: 'Ronda 1', scores: { 'team-1': 40, 'team-2': 30, 'team-3': 30, 'team-4': 25 } },
      { roundNumber: 2, label: 'Ronda 2', scores: { 'team-1': 40, 'team-2': 35, 'team-3': 30, 'team-4': 25 } },
    ],
  };

  const timer: TimerState = {
    mode: 'countdown',
    isRunning: false,
    secondsRemaining: 600,
    initialSeconds: 600,
    stopwatchSeconds: 0,
  };

  const turn: TurnEngineState = {
    activeTeamId: teams[0].id,
    orderMode: 'sequential',
    autoAdvanceOnScore: true,
    stealMode: false,
    lastActionMessage: 'Inicio de la dinámica',
  };

  const scene: LiveSceneSettings = {
    theme: 'broadcast-dark',
    customBgImage: '',
    customOverlayOpacity: 40,
    customBgBlur: 0,
    isBlackout: false,
    celebrationActive: false,
    celebrationWinner: null,
    tickerActive: true,
    tickerMessage: '¡Bienvenidos a Live Event & Game Show Master Studio! Todo en vivo.',
  };

  const gameStage: GameStageState = {
    activeGameId: 'bible_book',
    bibleBook: {
      items: INITIAL_BIBLE_BOOK_ITEMS,
      currentIndex: 0,
      level: 'options',
      revealed: false,
      selectedOption: null,
      pointsAwarded: false,
    },
    whoSaidIt: {
      items: INITIAL_WHO_SAID_IT_ITEMS,
      currentIndex: 0,
      showHint: false,
      revealed: false,
      selectedOption: null,
      pointsAwarded: false,
    },
    hangman: {
      items: INITIAL_HANGMAN_ITEMS,
      currentIndex: 0,
      guessedLetters: [],
      strikes: 0,
      maxStrikes: 6,
      solved: false,
      gameOver: false,
      pointsAwarded: false,
    },
    charades: {
      items: INITIAL_CHARADES_ITEMS,
      currentIndex: 0,
      roundSeconds: 60,
      remainingSeconds: 60,
      isRunning: false,
      correctCount: 0,
      skippedCount: 0,
      guessedWordIds: [],
      pointsAwarded: false,
    },
    familyFeud: {
      items: INITIAL_FAMILY_FEUD_ITEMS,
      currentIndex: 0,
      potScore: 0,
      strikes: 0,
      revealedAnswerIds: [],
      potAwardedTeamId: null,
    },
    triviaShow: {
      items: INITIAL_TRIVIA_SHOW_ITEMS,
      currentIndex: 0,
      selectedOption: null,
      revealed: false,
      hiddenOptions5050: [],
      used5050: false,
      pointsAwarded: false,
    },
    anagramWheel: {
      items: INITIAL_ANAGRAM_ITEMS,
      currentIndex: 0,
      revealed: false,
      wheelSpinning: false,
      wheelAngle: 0,
      selectedReward: null,
      pointsAwarded: false,
      rewards: WHEEL_REWARDS,
    },
    musicKaraoke: {
      items: INITIAL_MUSIC_ITEMS,
      currentIndex: 0,
      currentMode: INITIAL_MUSIC_ITEMS[0]?.mode || 'guess_song',
      isPlaying: false,
      currentPlaybackSeconds: 0,
      revealedSong: false,
      activeSnippetSeconds: null,
      isMusicCut: false,
      revealedWordsCount: 0,
      lyricsSolved: false,
      audioTarget: 'projector',
      karaokeScore: 90,
      lastAwardedPoints: 0,
      lastAwardedRatingLabel: '',
      showScoreCelebration: false,
      pointsAwarded: false,
    },
    millionaireShow: {
      items: INITIAL_MILLIONAIRE_ITEMS,
      currentIndex: 0,
      currentLevel: 1,
      selectedOption: null,
      isFinalAnswer: false,
      revealed: false,
      isCorrect: null,
      lifelines: {
        fiftyFifty: false,
        audiencePoll: false,
        phoneCall: false,
        switchQuestion: false,
      },
      hiddenOptions5050: [],
      audiencePollResults: null,
      showAudiencePoll: false,
      phoneCallSecondsRemaining: null,
      showPhoneCall: false,
      safeHavenLevels: [5, 10],
      accumulatedPoints: 0,
      gameStatus: 'playing',
      pointsAwarded: false,
    },
    dealOrNoDeal: {
      briefcases: INITIAL_BRIEFCASES,
      totalBriefcases: 16,
      contestantBriefcaseNumber: null,
      lastOpenedBriefcaseId: null,
      revealingBriefcaseId: null,
      suspenseActive: false,
      bankerOffer: 0,
      bankerOfferLabel: '',
      isBankerCallActive: false,
      isBankerOfferPending: false,
      bankerOfferAccepted: null,
      mode: 'points',
      xrayMode: false,
      currentRound: 1,
      briefcasesToOpenThisRound: 4,
      briefcasesOpenedThisRound: 0,
      gameStatus: 'selecting_own',
      finalWinnings: null,
      pointsAwarded: false,
    },
  };

  return {
    viewMode: 'GAME_STAGE',
    teams,
    turn,
    scoreboard,
    timer,
    hudToggles: DEFAULT_HUD_TOGGLES,
    scene,
    gameStage,
    raffle: createInitialRaffleState(),
    timestamp: Date.now(),
  };
}

/**
 * Calculates next team in turn based on order mode.
 */
export function getNextTurnTeamId(
  teams: StudioTeam[],
  currentActiveTeamId: string | null
): string | null {
  if (teams.length === 0) return null;
  if (!currentActiveTeamId) return teams[0].id;

  const currentIndex = teams.findIndex((t) => t.id === currentActiveTeamId);
  if (currentIndex === -1) return teams[0].id;

  const nextIndex = (currentIndex + 1) % teams.length;
  return teams[nextIndex].id;
}

/**
 * Calculates previous team in turn.
 */
export function getPrevTurnTeamId(
  teams: StudioTeam[],
  currentActiveTeamId: string | null
): string | null {
  if (teams.length === 0) return null;
  if (!currentActiveTeamId) return teams[teams.length - 1].id;

  const currentIndex = teams.findIndex((t) => t.id === currentActiveTeamId);
  if (currentIndex === -1) return teams[teams.length - 1].id;

  const prevIndex = (currentIndex - 1 + teams.length) % teams.length;
  return teams[prevIndex].id;
}

/**
 * Adds points to a specific team and ensures non-negative clamp if desired.
 */
export function awardPointsToTeam(
  teams: StudioTeam[],
  teamId: string,
  pointsToAdd: number
): StudioTeam[] {
  return teams.map((team) => {
    if (team.id === teamId) {
      const newScore = Math.max(0, team.score + pointsToAdd);
      return { ...team, score: newScore };
    }
    return team;
  });
}

export interface RankedTeam extends StudioTeam {
  rank: number;
  isTied: boolean;
  medal?: 'gold' | 'silver' | 'bronze';
}

/**
 * Ranks teams by score with tie detection and medals.
 */
export function rankStudioTeams(teams: StudioTeam[], autoSort: boolean = true): RankedTeam[] {
  const copy = [...teams];
  if (autoSort) {
    copy.sort((a, b) => b.score - a.score);
  }

  return copy.map((team, idx, arr) => {
    let rank = idx + 1;
    if (idx > 0 && team.score === arr[idx - 1].score) {
      rank = (arr[idx - 1] as RankedTeam).rank || idx;
    }
    const isTied = arr.some((other) => other.id !== team.id && other.score === team.score);
    let medal: 'gold' | 'silver' | 'bronze' | undefined;
    if (rank === 1) medal = 'gold';
    else if (rank === 2) medal = 'silver';
    else if (rank === 3) medal = 'bronze';

    return {
      ...team,
      rank,
      isTied,
      medal,
    };
  });
}

/**
 * Normalizes characters for word games (accent/diacritic insensitive, preserving Ñ).
 */
export const normalizeChar = (char: string): string => {
  if (!char) return '';
  if (char.toUpperCase() === 'Ñ') return 'Ñ';
  return char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
};

/**
 * Pure hangman letter guess processor with accent & diacritic normalization.
 */
export function processHangmanGuess(
  state: HangmanGameState,
  rawLetter: string
): HangmanGameState {
  if (state.solved || state.gameOver) return state;

  const letterUpper = normalizeChar(rawLetter);
  if (!letterUpper) return state;

  // If already guessed (comparing normalized letters)
  if (state.guessedLetters.some((l) => normalizeChar(l) === letterUpper)) return state;

  const currentItem = state.items[state.currentIndex];
  if (!currentItem) return state;

  const wordChars = currentItem.word.split('');
  const nextGuessed = [...state.guessedLetters, letterUpper];

  // Hit if any character in the word, when normalized, matches the guessed letter
  const isHit = wordChars.some((ch) => normalizeChar(ch) === letterUpper);
  const nextStrikes = isHit ? state.strikes : state.strikes + 1;
  const isGameOver = nextStrikes >= state.maxStrikes;

  // Check if every letter (excluding spaces/hyphens/punctuation) has been guessed
  const allRevealed = wordChars
    .filter((ch) => /[A-ZÁÉÍÓÚÑa-záéíóúñ]/i.test(ch))
    .every((ch) => nextGuessed.some((gl) => normalizeChar(gl) === normalizeChar(ch)));

  return {
    ...state,
    guessedLetters: nextGuessed,
    strikes: nextStrikes,
    solved: allRevealed,
    gameOver: isGameOver,
  };
}

/**
 * Pure family feud answer reveal processor.
 */
export function processFamilyFeudReveal(
  state: FamilyFeudGameState,
  answerId: string
): FamilyFeudGameState {
  const item = state.items[state.currentIndex];
  if (!item) return state;

  if (state.revealedAnswerIds.includes(answerId)) {
    // Unreveal
    const target = item.answers.find((a) => a.id === answerId);
    const points = target ? target.points : 0;
    return {
      ...state,
      revealedAnswerIds: state.revealedAnswerIds.filter((id) => id !== answerId),
      potScore: Math.max(0, state.potScore - points),
    };
  }

  // Reveal
  const target = item.answers.find((a) => a.id === answerId);
  const points = target ? target.points : 0;
  return {
    ...state,
    revealedAnswerIds: [...state.revealedAnswerIds, answerId],
    potScore: state.potScore + points,
  };
}

/**
 * Pure family feud strike processor.
 */
export function processFamilyFeudStrike(
  state: FamilyFeudGameState
): FamilyFeudGameState {
  const nextStrikes = (state.strikes + 1) % 4; // Cycles 0 -> 1 -> 2 -> 3 -> 0
  return {
    ...state,
    strikes: nextStrikes,
  };
}

/**
 * Pure 50/50 lifeline processor for trivia show.
 */
export function processTrivia5050(
  state: TriviaShowGameState
): TriviaShowGameState {
  if (state.used5050) return state;

  const item = state.items[state.currentIndex];
  if (!item) return state;

  const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const incorrectKeys = keys.filter((k) => k !== item.correctAnswer);

  // Pick 2 random incorrect keys to hide
  const shuffled = [...incorrectKeys].sort(() => 0.5 - Math.random());
  const toHide = shuffled.slice(0, 2);

  return {
    ...state,
    hiddenOptions5050: toHide,
    used5050: true,
  };
}

/**
 * Formats time in MM:SS or HH:MM:SS
 */
export function formatTimeDisplay(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Scrambles a word's letters ensuring the result differs from the original word
 * when the word has more than 1 distinct letter.
 */
export function scrambleWord(word: string): string {
  const clean = word.trim().toUpperCase();
  if (clean.length <= 1) return clean;

  const chars = clean.split('');
  // Check if all characters are identical
  const allSame = chars.every((c) => c === chars[0]);
  if (allSame) return clean;

  let shuffled = '';
  let attempts = 0;

  do {
    const arr = [...chars];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    shuffled = arr.join('');
    attempts++;
  } while (shuffled === clean && attempts < 30);

  // If still identical after 30 attempts, find first two distinct characters and swap them
  if (shuffled === clean) {
    const arr = [...chars];
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] !== arr[i + 1]) {
        const temp = arr[i];
        arr[i] = arr[i + 1];
        arr[i + 1] = temp;
        shuffled = arr.join('');
        break;
      }
    }
  }

  return shuffled;
}

/**
 * Universal extractor for 11-character YouTube & YouTube Music videoId.
 * Supports:
 * - https://www.youtube.com/watch?v=XXXXXXXXXXX
 * - https://youtu.be/XXXXXXXXXXX
 * - https://music.youtube.com/watch?v=XXXXXXXXXXX
 * - https://www.youtube.com/embed/XXXXXXXXXXX
 * - https://www.youtube.com/shorts/XXXXXXXXXXX
 * - Raw 11-char ID
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regex = /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regex);
  return match ? match[1] : null;
}

/**
 * Calculates a realistic Deal or No Deal Banker offer based on remaining unopened briefcases and current round.
 * Factors in an increasing willingness factor (e.g. 35% in round 1 up to ~85-90% in round 5+).
 */
export function calculateBankerOffer(remainingValues: number[], round: number = 1): number {
  if (!remainingValues || remainingValues.length === 0) return 0;
  if (remainingValues.length === 1) return remainingValues[0];

  const sum = remainingValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / remainingValues.length;

  // Escalation factor: starts around 35-40% and rises to 85-90% in later rounds
  const factor = Math.min(0.92, 0.28 + (round * 0.12));
  const rawOffer = mean * factor;

  // Round nicely to nearest 5 or 10 units
  return Math.max(5, Math.round(rawOffer / 5) * 5);
}

/**
 * Simulates audience voting distribution leaning predominantly towards the correct answer (55-80%).
 * Guarantees that the 4 options sum exactly to 100%.
 */
export function generateAudiencePoll(correctAnswer: 'A' | 'B' | 'C' | 'D'): Record<'A' | 'B' | 'C' | 'D', number> {
  const options: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const others = options.filter((opt) => opt !== correctAnswer);

  // Correct answer gets 55% to 75%
  const correctPercent = Math.floor(Math.random() * 21) + 55;
  const remaining = 100 - correctPercent;

  // Distribute remaining between other 3
  const p1 = Math.floor(Math.random() * (remaining - 4)) + 1;
  const p2 = Math.floor(Math.random() * (remaining - p1 - 2)) + 1;
  const p3 = remaining - p1 - p2;

  const result: Record<'A' | 'B' | 'C' | 'D', number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  result[correctAnswer] = correctPercent;
  result[others[0]] = p1;
  result[others[1]] = p2;
  result[others[2]] = p3;

  return result;
}

/**
 * Shuffles values across briefcases, resetting open state and contestant choice.
 */
export function shuffleBriefcases(briefcases: DealBriefcase[]): DealBriefcase[] {
  const values = briefcases.map((b) => b.value);
  // Fisher-Yates shuffle
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  return briefcases.map((b, idx) => ({
    ...b,
    value: values[idx],
    isOpen: false,
    isContestantBriefcase: false,
  }));
}


export type ScoreboardType = 'one_on_one' | 'multiplayer';

export type SportPresetId =
  | 'basketball'
  | 'soccer'
  | 'volleyball'
  | 'combat'
  | 'trivia'
  | 'tournament'
  | 'custom';

export type RoundProgressionType = 'cumulative' | 'sets_reset';

export interface RoundScoreRecord1v1 {
  roundNumber: number;
  label: string;
  scoreA: number;
  scoreB: number;
}

export interface RoundScoreRecordMultiplayer {
  roundNumber: number;
  label: string;
  scores: Record<string, number>; // participantId -> roundScore
}

export interface Team1v1 {
  id: string;
  name: string;
  color: string;
  score: number;
  setsWon: number;
  fouls: number;
  cardsYellow?: number;
  cardsRed?: number;
  advantage?: boolean;
  hasPossession?: boolean; // possession or serve indicator
}

export interface Scoreboard1v1 {
  id: string;
  type: 'one_on_one';
  sportPreset: SportPresetId;
  title: string;
  subtitle: string;
  teamA: Team1v1;
  teamB: Team1v1;
  
  // Period & Round configuration
  periodTypeLabel: string; // e.g. "Cuarto", "Tiempo", "Set", "Ronda", "Nivel"
  currentRound: number;
  totalRounds: number;
  roundProgression: RoundProgressionType; // 'cumulative' or 'sets_reset'
  roundHistory: RoundScoreRecord1v1[];
  pointsToWinSet?: number;
  
  // Fast buttons customization
  quickScoreButtons: number[]; // e.g. [1, 2, 3] or [1] or [10, 50, 100]

  updatedAt: number;
}

export interface Participant {
  id: string;
  name: string;
  color: string;
  score: number;
  hasTurn?: boolean;
}

export interface ScoreboardMultiplayer {
  id: string;
  type: 'multiplayer';
  sportPreset: SportPresetId;
  title: string;
  subtitle: string;
  participants: Participant[];
  autoSort: boolean;
  
  // Round configuration
  periodTypeLabel: string; // e.g. "Ronda", "Etapa", "Nivel"
  currentRound: number;
  totalRounds: number;
  roundProgression: RoundProgressionType;
  roundHistory: RoundScoreRecordMultiplayer[];

  // Fast buttons customization
  quickScoreButtons: number[]; // e.g. [100, 200, 500] or [1, 5, 10]

  updatedAt: number;
}

export type Scoreboard = Scoreboard1v1 | ScoreboardMultiplayer;

export type TimerMode = 'countdown' | 'stopwatch' | 'off';

export interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  secondsRemaining: number;
  initialSeconds: number;
  stopwatchSeconds: number;
  lastTickTimestamp?: number;
}

export type BroadcastTheme = 'broadcast-dark' | 'broadcast-light' | 'chroma-green';

export interface CelebrationWinner {
  name: string;
  score: number | string;
  color: string;
  subtitle?: string;
}

export interface LiveHudToggles {
  showTimer: boolean;
  showPeriod: boolean;
  showRoundHistory: boolean;
  showFouls: boolean;
  showPossession: boolean;
  showEventTitles: boolean;
  showScores: boolean;
  showTicker: boolean;
  viewMode: 'standard' | 'summary_table'; // Standard score view vs Round summary / Standings table
}

export interface BroadcastSettings {
  liveScoreboardId: string;
  blackout: boolean;
  celebrationActive: boolean;
  celebrationWinner?: CelebrationWinner | null;
  tickerMessage: string;
  tickerActive: boolean;
  theme: BroadcastTheme;
  hudToggles: LiveHudToggles;
}

export interface ScoreboardAppState {
  scoreboards: Scoreboard[];
  activeEditingId: string;
  broadcast: BroadcastSettings;
  timer: TimerState;
  version: number;
}

export interface LiveSceneSettings {
  theme: BroadcastTheme;
  isBlackout: boolean;
  celebrationActive: boolean;
  celebrationWinner?: CelebrationWinner | null;
  tickerActive: boolean;
  tickerMessage: string;
}

export interface LiveState {
  activeScoreboard: Scoreboard | null;
  timer: TimerState;
  hudToggles: LiveHudToggles;
  scene: LiveSceneSettings;
  timestamp: number;
}

export type SyncChannelMessage =
  | { type: 'SYNC_STATE'; payload: LiveState; timestamp: number }
  | { type: 'REQUEST_INITIAL_STATE'; timestamp: number };

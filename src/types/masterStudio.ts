/**
 * Live Event & Game Show Master Studio (All-in-One)
 * Complete Data Models & Types
 */

export type MasterViewMode =
  | 'SCOREBOARD_ONLY'
  | 'GAME_STAGE'
  | 'RAFFLE_STAGE'
  | 'LEADERBOARD_FULL'
  | 'PODIUM_CELEBRATION'
  | 'BLACKOUT';

export type SportPresetId =
  | 'basketball'
  | 'soccer'
  | 'volleyball'
  | 'combat'
  | 'general'
  | 'custom';

export type ScoreboardMode = 'one_on_one' | 'multiplayer';

export type TurnOrderMode = 'sequential' | 'manual' | 'buzzer';

export interface StudioTeam {
  id: string;
  name: string;
  color: string;
  score: number;
  setsWon: number;
  fouls: number;
  cardsYellow?: number;
  cardsRed?: number;
  advantage?: boolean;
  hasPossession?: boolean; // Serve or ball possession indicator
  roundHistoryScores?: number[]; // Snapshot of scores in each round
}

export interface TurnEngineState {
  activeTeamId: string | null;
  orderMode: TurnOrderMode;
  autoAdvanceOnScore: boolean;
  stealMode: boolean; // Strike mode: pass to next team to steal points
  lastActionMessage?: string;
}

export interface ScoreboardConfig {
  mode: ScoreboardMode;
  sportPreset: SportPresetId;
  title: string;
  subtitle: string;
  periodTypeLabel: string; // 'Cuarto', 'Tiempo', 'Set', 'Ronda', 'Nivel'
  currentRound: number;
  totalRounds: number;
  roundProgression: 'cumulative' | 'sets_reset';
  quickScoreButtons: number[]; // e.g. [1, 2, 3] or [10, 50, 100]
  pointsToWinSet?: number;
  roundHistory: Array<{
    roundNumber: number;
    label: string;
    scores: Record<string, number>;
  }>;
}

export type TimerMode = 'countdown' | 'stopwatch' | 'off';

export interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  secondsRemaining: number;
  initialSeconds: number;
  stopwatchSeconds: number;
  lastTickTimestamp?: number;
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
  viewMode: 'standard' | 'summary_table';
}

export type BroadcastTheme =
  | 'broadcast-dark'
  | 'sports-neon'
  | 'tv-game-gold'
  | 'cyber-arcade'
  | 'parchment-gold'
  | 'versus-fire'
  | 'broadcast-light'
  | 'chroma-green'
  | 'high-contrast'
  | 'custom';

export interface CelebrationWinner {
  name: string;
  score: number | string;
  color: string;
  subtitle?: string;
}

export interface LiveSceneSettings {
  theme: BroadcastTheme;
  customBgImage?: string;
  customOverlayOpacity?: number; // 0 to 90 %
  customBgBlur?: number; // 0 to 20 px
  isBlackout: boolean;
  celebrationActive: boolean;
  celebrationWinner?: CelebrationWinner | null;
  tickerActive: boolean;
  tickerMessage: string;
}

/* -------------------------------------------------------------
 * 7 Interactive Game Dynamics States & Items
 * ------------------------------------------------------------- */
export type ActiveGameId =
  | 'bible_book'
  | 'who_said_it'
  | 'hangman'
  | 'charades'
  | 'family_feud'
  | 'trivia_show'
  | 'anagram_wheel'
  | 'music_karaoke'
  | 'millionaire_show'
  | 'deal_or_nodeal';

// 1. ¿En qué libro de la Biblia está?
export interface BibleBookItem {
  id: string;
  verseOrEvent: string;
  reference: string;
  book: string;
  testament: 'Antiguo Testamento' | 'Nuevo Testamento';
  options: string[];
  hint?: string;
  points: number;
}

export interface BibleBookGameState {
  items: BibleBookItem[];
  currentIndex: number;
  level: 'testament' | 'options' | 'blind'; // 3 levels: AT/NT, 4 Options, or Blind
  revealed: boolean;
  selectedOption: string | null;
  pointsAwarded: boolean;
}

// 2. ¿Quién lo dijo?
export interface WhoSaidItItem {
  id: string;
  quote: string;
  author: string;
  context?: string;
  options: string[];
  hint?: string;
  points: number;
}

export interface WhoSaidItGameState {
  items: WhoSaidItItem[];
  currentIndex: number;
  showHint: boolean;
  revealed: boolean;
  selectedOption: string | null;
  pointsAwarded: boolean;
}

// 3. Adivina la Palabra / Ahorcado Pro
export interface HangmanItem {
  id: string;
  word: string;
  category: string;
  hint?: string;
  pointsPerLetter: number;
  pointsSolve: number;
}

export interface HangmanGameState {
  items: HangmanItem[];
  currentIndex: number;
  guessedLetters: string[];
  strikes: number;
  maxStrikes: number;
  solved: boolean;
  gameOver: boolean;
  pointsAwarded: boolean;
}

// 4. Charadas / Actúalo contra el Reloj
export interface CharadesItem {
  id: string;
  word: string;
  category: string;
  difficulty: 'fácil' | 'medio' | 'difícil';
  points: number;
}

export interface CharadesGameState {
  items: CharadesItem[];
  currentIndex: number;
  roundSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  correctCount: number;
  skippedCount: number;
  guessedWordIds: string[];
  pointsAwarded: boolean;
}

// 5. 100 Personas Dijeron / Los Más Populares
export interface FamilyFeudAnswer {
  id: string;
  text: string;
  points: number;
  revealed: boolean;
}

export interface FamilyFeudItem {
  id: string;
  question: string;
  answers: FamilyFeudAnswer[];
}

export interface FamilyFeudGameState {
  items: FamilyFeudItem[];
  currentIndex: number;
  potScore: number;
  strikes: number; // 0 to 3
  revealedAnswerIds: string[];
  potAwardedTeamId: string | null;
}

// 6. Trivia Show con Comodines
export interface TriviaShowItem {
  id: string;
  question: string;
  category: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  points: number;
  explanation?: string;
}

export interface TriviaShowGameState {
  items: TriviaShowItem[];
  currentIndex: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  revealed: boolean;
  hiddenOptions5050: ('A' | 'B' | 'C' | 'D')[];
  used5050: boolean;
  pointsAwarded: boolean;
}

// 7. Palabra Desordenada + Ruleta de Retos/Castigos
export interface AnagramWheelItem {
  id: string;
  originalWord: string;
  scrambledWord: string;
  category: string;
  hint: string;
  points: number;
}

export interface WheelReward {
  id: string;
  label: string;
  type: 'points_bonus' | 'points_penalty' | 'double_points' | 'lose_turn' | 'physical_challenge';
  value?: number;
  color: string;
}

export interface AnagramWheelGameState {
  items: AnagramWheelItem[];
  currentIndex: number;
  revealed: boolean;
  wheelSpinning: boolean;
  wheelAngle: number;
  selectedReward: WheelReward | null;
  pointsAwarded: boolean;
  rewards?: WheelReward[];
}

// 8. Music & Karaoke Show (3 en 1)
export type MusicGameMode = 'guess_song' | 'guess_lyrics' | 'karaoke_show';

export interface MusicTrackItem {
  id: string;
  title: string;
  artist: string;
  category: string;
  mode: MusicGameMode;
  youtubeUrl: string;
  videoId: string;
  localMediaUrl?: string;
  startTime: number;
  cutTime?: number;
  letraPrevia?: string;
  letraSecreta?: string;
  points: number;
}

export interface MusicKaraokeGameState {
  items: MusicTrackItem[];
  currentIndex: number;
  currentMode: MusicGameMode;
  isPlaying: boolean;
  currentPlaybackSeconds: number;
  revealedSong: boolean;
  activeSnippetSeconds: number | null;
  isMusicCut: boolean;
  revealedWordsCount: number;
  lyricsSolved: boolean;
  audioTarget: 'projector' | 'console' | 'both';
  karaokeScore: number;
  lastAwardedPoints?: number;
  lastAwardedRatingLabel?: string;
  showScoreCelebration: boolean;
  pointsAwarded: boolean;
}

// 9. ¿Quién Quiere Ser Millonario? (Escalera de Premios y Comodines)
export interface MillionaireItem {
  id: string;
  level: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  points: number;
  explanation?: string;
}

export interface MillionaireLifelines {
  fiftyFifty: boolean;
  audiencePoll: boolean;
  phoneCall: boolean;
  switchQuestion: boolean;
}

export interface MillionaireGameState {
  items: MillionaireItem[];
  currentIndex: number;
  currentLevel: number;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  isFinalAnswer: boolean; // "¿Respuesta Definitiva?"
  revealed: boolean;
  isCorrect: boolean | null;
  lifelines: MillionaireLifelines;
  hiddenOptions5050: ('A' | 'B' | 'C' | 'D')[];
  audiencePollResults: Record<'A' | 'B' | 'C' | 'D', number> | null;
  showAudiencePoll: boolean;
  phoneCallSecondsRemaining: number | null;
  showPhoneCall: boolean;
  safeHavenLevels: number[]; // e.g. [5, 10]
  accumulatedPoints: number;
  gameStatus: 'playing' | 'walked_away' | 'failed' | 'won_top';
  pointsAwarded: boolean;
}

// 10. Trato Hecho / Deal or No Deal (Maletines y La Banca)
export interface DealBriefcase {
  id: number;
  number: number;
  value: number;
  customLabel?: string;
  isOpen: boolean;
  isContestantBriefcase: boolean;
}

export interface DealOrNoDealGameState {
  briefcases: DealBriefcase[];
  totalBriefcases: number;
  contestantBriefcaseNumber: number | null;
  lastOpenedBriefcaseId: number | null;
  revealingBriefcaseId: number | null;
  suspenseActive: boolean;
  bankerOffer: number;
  bankerOfferLabel?: string;
  isBankerCallActive: boolean;
  isBankerOfferPending: boolean;
  bankerOfferAccepted: boolean | null;
  mode: 'points' | 'custom_prizes';
  xrayMode: boolean; // Peek briefcase values (Host only)
  currentRound: number;
  briefcasesToOpenThisRound: number;
  briefcasesOpenedThisRound: number;
  gameStatus: 'selecting_own' | 'opening_cases' | 'banker_offer' | 'deal_accepted' | 'final_case_opened';
  finalWinnings: number | null;
  pointsAwarded: boolean;
}

export interface GameStageState {
  activeGameId: ActiveGameId;
  bibleBook: BibleBookGameState;
  whoSaidIt: WhoSaidItGameState;
  hangman: HangmanGameState;
  charades: CharadesGameState;
  familyFeud: FamilyFeudGameState;
  triviaShow: TriviaShowGameState;
  anagramWheel: AnagramWheelGameState;
  musicKaraoke: MusicKaraokeGameState;
  millionaireShow: MillionaireGameState;
  dealOrNoDeal: DealOrNoDealGameState;
}

/* -------------------------------------------------------------
 * Giveaway & Raffle Studio (Centro de Sorteos en Vivo)
 * ------------------------------------------------------------- */
export type RaffleMode =
  | 'wheel'            // Ruleta de la Fortuna
  | 'slot_machine'     // Combinador de Retos (Persona + Reto + Premio)
  | 'tombola_numbers'  // Tómbola / Sorteo de Boletos Numéricos
  | 'team_matcher';    // Emparejador / Llaves y Equipos al Azar

export type RaffleDrawRule =
  | 'direct_win'       // El que sale GANA
  | 'elimination';     // Al Agua / Eliminación (se descarta hasta la N-ésima ronda)

export interface RaffleParticipant {
  id: string;
  name: string;
  color?: string;
  ticketNumber?: number;
  eliminated?: boolean;
  groupOrCell?: string;
  registeredViaQr?: boolean;
  clientToken?: string;
  joinedAt?: number;
}

export interface TournamentMatch {
  id: string;
  roundIndex: number; // 0 = Cuartos, 1 = Semis, 2 = Final
  matchIndex: number;
  teamA: string;
  teamB: string;
  winner?: string;
}

export interface TournamentBracket {
  size: 4 | 8 | 16;
  matches: TournamentMatch[];
}

export interface RaffleDrawRecord {
  id: string;
  drawNumber: number;
  title: string;
  mode: RaffleMode;
  participantCount: number;
  winnerName: string;
  ticketNumber?: number;
  groupOrCell?: string;
  challengePhrase?: string;
  timestamp: number;
  dateStr: string;
}

export interface NightWinnerItem {
  id: string;
  drawNumber: number;
  name: string;
  ticketNumber?: number;
  groupOrCell?: string;
  title: string;
  timestamp: number;
}

export interface RaffleWinnerHistoryItem {
  id: string;
  name: string;
  prize?: string;
  ticketNumber?: number;
  timestamp: number;
  mode: RaffleMode;
  rule: RaffleDrawRule;
  isEliminationSplash?: boolean;
  drawNumber?: number;
  groupOrCell?: string;
}

export interface RaffleSpinEvent {
  spinId: number;
  isSpinning: boolean;
  winnerIndex: number;
  winnerItem: RaffleParticipant;
  targetAngle: number; // in degrees for the wheel
  slotFinalIndices: number[]; // for slot machine reels
  durationMs: number;
  startTime: number;
  rule: RaffleDrawRule;
  eliminationRound: number; // e.g. 1 of 3
  eliminationTotal: number;
  prizeTitle: string;
  // Challenge combiner reel results
  challengeText?: string;
  prizeText?: string;
  challengeIndex?: number;
  prizeIndex?: number;
}

export interface TeamMatcherResult {
  type: 'duels_1v1' | 'n_teams' | 'tournament_bracket';
  matchups?: Array<{ teamA: string; teamB: string }>;
  groups?: Array<{ groupName: string; members: string[]; color: string }>;
  bracket?: TournamentBracket;
  timestamp: number;
}

export interface RaffleState {
  mode: RaffleMode;
  participants: RaffleParticipant[];
  prizeTitle: string;
  drawRule: RaffleDrawRule;
  eliminationTargetRound: number; // e.g. "Al 3er tiro gana" -> 3
  currentEliminationCount: number; // count of eliminated draws in current session
  autoRemoveWinner: boolean;
  spinDurationSeconds: number; // 3, 6, 10
  // Number tombola specific settings
  numberRangeMin: number;
  numberRangeMax: number;
  numberZeroPadding: number;
  drawnNumbersHistory: number[];
  // Team matcher settings
  matcherType: 'duels_1v1' | 'n_teams' | 'tournament_bracket';
  matcherNumTeams: number; // e.g. 2, 3, 4, 6
  matcherBracketSize: 4 | 8 | 16;
  lastMatcherResult: TeamMatcherResult | null;
  // Live spin state (deterministic synchronization across console and projector)
  activeSpin: RaffleSpinEvent | null;
  lastWinner: RaffleWinnerHistoryItem | null;
  winnersHistory: RaffleWinnerHistoryItem[];
  // Combinador de Retos (Rodillo 1: Persona, Rodillo 2: Reto, Rodillo 3: Premio)
  challengesList: string[];
  prizesList: string[];
  challengeCombinerResult?: { person: string; challenge: string; prize: string; phrase: string } | null;
  // Sorteos de la Noche
  raffleDrawCount: number;
  nightWinners: NightWinnerItem[];
  // Pantalla de Ganador en Proyector
  showWinnerCelebrationScreen: boolean;
  activeWinnerScreenData?: {
    drawNumber: number;
    title: string;
    winnerName: string;
    ticketNumber?: number;
    group?: string;
  } | null;
  // Inscripción por QR en Proyector y Celular
  registrationsOpen: boolean;
  showQrRegistrationScene: boolean;
  // Historial y Registro completo de Sorteos para auditoría y Excel
  drawRecords: RaffleDrawRecord[];
}

/* -------------------------------------------------------------
 * Master Live State (Single Source of Truth)
 * ------------------------------------------------------------- */
export interface MasterLiveState {
  viewMode: MasterViewMode;
  teams: StudioTeam[];
  turn: TurnEngineState;
  scoreboard: ScoreboardConfig;
  timer: TimerState;
  hudToggles: LiveHudToggles;
  scene: LiveSceneSettings;
  gameStage: GameStageState;
  raffle: RaffleState;
  buzzer?: BuzzerServerState;
  timestamp: number;
}

export type BuzzerStatus = 'closed' | 'open' | 'answering';

export interface BuzzerPressItem {
  teamId: string;
  timestamp: number;
  msAfterFirst: number;
}

export interface BuzzerRuleConfig {
  pointsForCorrect: number;
  penaltyForIncorrect: number;
  passToNext: boolean;
  answerTimeSeconds: number;
  lockoutSeconds: number;
  useBuzzersInGameStage: boolean;
}

export interface BuzzerConnectedClientInfo {
  teamId: string;
  token: string;
  latencyMs: number;
  connected: boolean;
}

export interface BuzzerServerState {
  status: BuzzerStatus;
  openedAt: number | null;
  presses: BuzzerPressItem[];
  lockedOutUntil: Record<string, number>;
  excludedTeams: string[];
  answeringTeamId: string | null;
  answerDeadline: number | null;
  config: BuzzerRuleConfig;
  connectedClients?: Record<string, BuzzerConnectedClientInfo>;
}

export type RemoteCommandType =
  | 'AWARD_POINTS'
  | 'QUICK_ADJUST'
  | 'NEXT_TURN'
  | 'PREV_TURN'
  | 'SELECT_TURN'
  | 'TOGGLE_STEAL'
  | 'TRIGGER_SOUND'
  | 'SET_VIEW_MODE'
  | 'SET_ACTIVE_GAME'
  | 'TOGGLE_TIMER'
  | 'RESET_TIMER'
  | 'TRIGGER_CELEBRATION'
  | 'NEXT_GAME_ITEM'
  | 'PREV_GAME_ITEM'
  | 'REVEAL_GAME_ANSWER'
  | 'SPIN_RAFFLE'
  | 'SET_RAFFLE_MODE'
  | 'RESET_RAFFLE'
  | 'BUZZER_OPEN'
  | 'BUZZER_CLOSE'
  | 'BUZZER_RESET'
  | 'BUZZER_JUDGE'
  | 'UNDO_LAST_ACTION';

export interface RemoteCommandMessage {
  type: 'REMOTE_COMMAND';
  command: RemoteCommandType;
  payload?: any;
  timestamp: number;
  room?: string;
  pin?: string;
}

export type MasterSyncMessage =
  | { type: 'SYNC_MASTER_STATE'; payload: MasterLiveState; timestamp: number; room?: string }
  | { type: 'REQUEST_INITIAL_STATE'; timestamp: number; room?: string; role?: string }
  | { type: 'TRIGGER_SOUND'; sound: 'correct' | 'error' | 'turn' | 'tick' | 'timesUp' | 'wheel' | 'fanfare' | 'drumroll' | 'splash' | 'buzzer'; room?: string }
  | { type: 'AUTH_REMOTE'; room: string; pin: string; timestamp: number }
  | { type: 'AUTH_RESULT'; success: boolean; error?: string; room?: string; timestamp: number }
  | { type: 'PIN_CHANGED'; room: string; timestamp: number }
  | { type: 'RATE_LIMIT_WARNING'; message: string; timestamp: number; room?: string }
  | { type: 'BUZZER_OPEN'; room?: string; timestamp: number }
  | { type: 'BUZZER_CLOSE'; room?: string; timestamp: number }
  | { type: 'BUZZER_RESET'; room?: string; timestamp: number }
  | { type: 'BUZZER_JUDGE'; result: 'correct' | 'incorrect'; room?: string; timestamp: number }
  | { type: 'BUZZER_PRESS'; teamId: string; token: string; room?: string; timestamp: number }
  | { type: 'BUZZER_STATE'; state: BuzzerServerState; buzzer?: BuzzerServerState; room?: string; timestamp: number }
  | { type: 'BUZZER_CONFIG_UPDATE'; config: Partial<BuzzerRuleConfig>; room?: string; timestamp: number }
  | { type: 'BUZZER_REGENERATE_TOKENS'; room?: string; timestamp: number }
  | { type: 'BUZZER_DISCONNECTED'; reason: 'REPLACED_BY_ANOTHER_DEVICE' | 'TOKENS_REGENERATED' | 'INVALID_TOKEN'; message: string; room?: string; timestamp: number }
  | { type: 'BUZZER_PING'; clientTimestamp: number; room?: string }
  | { type: 'BUZZER_PONG'; clientTimestamp: number; serverTimestamp: number; room?: string }
  | RemoteCommandMessage;

/* -------------------------------------------------------------
 * Excel & Cloud Database Bank Types
 * ------------------------------------------------------------- */
export interface StudioContentBank {
  version: number;
  updatedAt: number;
  bibleBookItems: BibleBookItem[];
  whoSaidItItems: WhoSaidItItem[];
  hangmanItems: HangmanItem[];
  charadesItems: CharadesItem[];
  familyFeudItems: FamilyFeudItem[];
  triviaShowItems: TriviaShowItem[];
  anagramItems: AnagramWheelItem[];
  musicItems: MusicTrackItem[];
  millionaireItems: MillionaireItem[];
  briefcases: DealBriefcase[];
  raffleParticipants: RaffleParticipant[];
}

export interface CloudSyncConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseConnected: boolean;
  googleSheetsUrl: string;
  googleSheetsAutoSync: boolean;
  lastSyncTimestamp: number | null;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncMessage: string;
}


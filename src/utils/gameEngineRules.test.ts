import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialMasterLiveState,
  getNextTurnTeamId,
  getPrevTurnTeamId,
  awardPointsToTeam,
  rankStudioTeams,
  processHangmanGuess,
  processFamilyFeudReveal,
  processFamilyFeudStrike,
  processTrivia5050,
  formatTimeDisplay,
  normalizeChar,
  scrambleWord,
  extractYouTubeVideoId,
  calculateBankerOffer,
  generateAudiencePoll,
  shuffleBriefcases,
} from './gameEngineRules';
import { StudioTeam, HangmanGameState, FamilyFeudGameState, TriviaShowGameState, DealBriefcase } from '../types/masterStudio';

test('createInitialMasterLiveState: initializes valid complete state with 4 teams and 10 games', () => {
  const state = createInitialMasterLiveState();
  assert.equal(state.viewMode, 'GAME_STAGE');
  assert.equal(state.teams.length, 4);
  assert.equal(state.turn.activeTeamId, 'team-1');
  assert.ok(state.gameStage.bibleBook.items.length >= 5);
  assert.ok(state.gameStage.whoSaidIt.items.length >= 5);
  assert.ok(state.gameStage.hangman.items.length >= 5);
  assert.ok(state.gameStage.charades.items.length >= 5);
  assert.ok(state.gameStage.familyFeud.items.length >= 5);
  assert.ok(state.gameStage.triviaShow.items.length >= 5);
  assert.ok(state.gameStage.anagramWheel.items.length >= 5);
  assert.ok(state.gameStage.musicKaraoke.items.length >= 6);
  assert.equal(state.gameStage.musicKaraoke.currentIndex, 0);
  assert.equal(state.gameStage.musicKaraoke.currentMode, 'guess_song');
  // 9. Millionaire
  assert.ok(state.gameStage.millionaireShow.items.length >= 10);
  assert.equal(state.gameStage.millionaireShow.currentLevel, 1);
  assert.equal(state.gameStage.millionaireShow.gameStatus, 'playing');
  assert.deepEqual(state.gameStage.millionaireShow.safeHavenLevels, [5, 10]);
  // 10. Deal or No Deal
  assert.equal(state.gameStage.dealOrNoDeal.briefcases.length, 16);
  assert.equal(state.gameStage.dealOrNoDeal.totalBriefcases, 16);
  assert.equal(state.gameStage.dealOrNoDeal.gameStatus, 'selecting_own');
});

test('getNextTurnTeamId & getPrevTurnTeamId: cycles through teams sequentially', () => {
  const teams: StudioTeam[] = [
    { id: 't-1', name: 'Alpha', color: '#000', score: 0, setsWon: 0, fouls: 0 },
    { id: 't-2', name: 'Beta', color: '#111', score: 0, setsWon: 0, fouls: 0 },
    { id: 't-3', name: 'Gamma', color: '#222', score: 0, setsWon: 0, fouls: 0 },
  ];

  assert.equal(getNextTurnTeamId(teams, 't-1'), 't-2');
  assert.equal(getNextTurnTeamId(teams, 't-2'), 't-3');
  assert.equal(getNextTurnTeamId(teams, 't-3'), 't-1'); // wrap around

  assert.equal(getPrevTurnTeamId(teams, 't-1'), 't-3'); // wrap around backwards
  assert.equal(getPrevTurnTeamId(teams, 't-3'), 't-2');
});

test('awardPointsToTeam: adds points only to targeted team', () => {
  const teams: StudioTeam[] = [
    { id: 't-1', name: 'Alpha', color: '#000', score: 100, setsWon: 0, fouls: 0 },
    { id: 't-2', name: 'Beta', color: '#111', score: 50, setsWon: 0, fouls: 0 },
  ];

  const updated = awardPointsToTeam(teams, 't-1', 150);
  assert.equal(updated[0].score, 250);
  assert.equal(updated[1].score, 50);
});

test('rankStudioTeams: accurately sorts by score and assigns gold, silver, bronze medals', () => {
  const teams: StudioTeam[] = [
    { id: 't-1', name: 'Alpha', color: '#000', score: 50, setsWon: 0, fouls: 0 },
    { id: 't-2', name: 'Beta', color: '#111', score: 200, setsWon: 0, fouls: 0 },
    { id: 't-3', name: 'Gamma', color: '#222', score: 120, setsWon: 0, fouls: 0 },
    { id: 't-4', name: 'Delta', color: '#333', score: 10, setsWon: 0, fouls: 0 },
  ];

  const ranked = rankStudioTeams(teams, true);
  assert.equal(ranked[0].name, 'Beta');
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[0].medal, 'gold');

  assert.equal(ranked[1].name, 'Gamma');
  assert.equal(ranked[1].rank, 2);
  assert.equal(ranked[1].medal, 'silver');

  assert.equal(ranked[2].name, 'Alpha');
  assert.equal(ranked[2].rank, 3);
  assert.equal(ranked[2].medal, 'bronze');
});

test('processHangmanGuess: detects hits and strikes, triggers solved when all letters guessed', () => {
  const initial: HangmanGameState = {
    items: [{ id: '1', word: 'SOL', category: 'Test', pointsPerLetter: 10, pointsSolve: 50 }],
    currentIndex: 0,
    guessedLetters: [],
    strikes: 0,
    maxStrikes: 6,
    solved: false,
    gameOver: false,
    pointsAwarded: false,
  };

  // Wrong letter
  const g1 = processHangmanGuess(initial, 'A');
  assert.equal(g1.strikes, 1);
  assert.equal(g1.solved, false);

  // Correct letters
  const g2 = processHangmanGuess(g1, 'S');
  assert.equal(g2.strikes, 1);
  const g3 = processHangmanGuess(g2, 'O');
  const g4 = processHangmanGuess(g3, 'L');
  assert.equal(g4.solved, true);
  assert.equal(g4.gameOver, false);
});

test('normalizeChar: handles accents, diacritics and preserves Ñ', () => {
  assert.equal(normalizeChar('É'), 'E');
  assert.equal(normalizeChar('é'), 'E');
  assert.equal(normalizeChar('Á'), 'A');
  assert.equal(normalizeChar('Í'), 'I');
  assert.equal(normalizeChar('Ó'), 'O');
  assert.equal(normalizeChar('Ú'), 'U');
  assert.equal(normalizeChar('ü'), 'U');
  assert.equal(normalizeChar('Ñ'), 'Ñ');
  assert.equal(normalizeChar('ñ'), 'Ñ');
  assert.equal(normalizeChar('Z'), 'Z');
});

test('processHangmanGuess: reveals accented letters like É in PENTECOSTÉS when guessing E', () => {
  const pentecostesState: HangmanGameState = {
    items: [{ id: 'hm-1', word: 'PENTECOSTÉS', category: 'Fiestas Bíblicas', pointsPerLetter: 15, pointsSolve: 100 }],
    currentIndex: 0,
    guessedLetters: [],
    strikes: 0,
    maxStrikes: 6,
    solved: false,
    gameOver: false,
    pointsAwarded: false,
  };

  // Guess 'E' -> should be a hit (matches both E and É) with 0 strikes
  const g1 = processHangmanGuess(pentecostesState, 'E');
  assert.equal(g1.strikes, 0);
  assert.ok(g1.guessedLetters.includes('E'));

  // Remaining letters: P, N, T, C, O, S
  const g2 = processHangmanGuess(g1, 'P');
  const g3 = processHangmanGuess(g2, 'N');
  const g4 = processHangmanGuess(g3, 'T');
  const g5 = processHangmanGuess(g4, 'C');
  const g6 = processHangmanGuess(g5, 'O');
  const g7 = processHangmanGuess(g6, 'S');

  // All letters including É are now revealed by having guessed E
  assert.equal(g7.solved, true);
  assert.equal(g7.strikes, 0);
});

test('processFamilyFeudReveal & Strike: accumulates pot and toggles strikes', () => {
  const initial: FamilyFeudGameState = {
    items: [
      {
        id: 'ff-1',
        question: 'Pregunta',
        answers: [
          { id: 'a1', text: 'Opción 1', points: 30, revealed: false },
          { id: 'a2', text: 'Opción 2', points: 20, revealed: false },
        ],
      },
    ],
    currentIndex: 0,
    potScore: 0,
    strikes: 0,
    revealedAnswerIds: [],
    potAwardedTeamId: null,
  };

  const r1 = processFamilyFeudReveal(initial, 'a1');
  assert.equal(r1.potScore, 30);
  assert.ok(r1.revealedAnswerIds.includes('a1'));

  const r2 = processFamilyFeudReveal(r1, 'a2');
  assert.equal(r2.potScore, 50);

  const s1 = processFamilyFeudStrike(r2);
  assert.equal(s1.strikes, 1);
  const s2 = processFamilyFeudStrike(s1);
  assert.equal(s2.strikes, 2);
});

test('processTrivia5050: hides exactly 2 incorrect options', () => {
  const initial: TriviaShowGameState = {
    items: [
      {
        id: 't-1',
        question: 'Pregunta',
        category: 'Test',
        options: { A: '1', B: '2', C: '3', D: '4' },
        correctAnswer: 'B',
        points: 100,
      },
    ],
    currentIndex: 0,
    selectedOption: null,
    revealed: false,
    hiddenOptions5050: [],
    used5050: false,
    pointsAwarded: false,
  };

  const processed = processTrivia5050(initial);
  assert.equal(processed.used5050, true);
  assert.equal(processed.hiddenOptions5050.length, 2);
  assert.ok(!processed.hiddenOptions5050.includes('B'), 'Correct answer should never be hidden by 50/50');
});

test('formatTimeDisplay: formats seconds properly', () => {
  assert.equal(formatTimeDisplay(0), '00:00');
  assert.equal(formatTimeDisplay(60), '01:00');
  assert.equal(formatTimeDisplay(600), '10:00');
  assert.equal(formatTimeDisplay(3665), '01:01:05');
});

test('scrambleWord: produces distinct scrambled word with identical letter frequencies', () => {
  const original = 'APOCALIPSIS';
  const scrambled = scrambleWord(original);
  assert.equal(scrambled.length, original.length);
  assert.notEqual(scrambled, original);

  // Check character frequencies match
  const sortChars = (str: string) => str.split('').sort().join('');
  assert.equal(sortChars(scrambled), sortChars(original));

  // Single letter words return clean
  assert.equal(scrambleWord('A'), 'A');
  // All same letters returns clean
  assert.equal(scrambleWord('ZZZZ'), 'ZZZZ');
});

test('extractYouTubeVideoId: parses all YouTube & YouTube Music variations and raw 11-char IDs', () => {
  // Standard watch URL
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/watch?v=T_FkEw27XJ0'), 'T_FkEw27XJ0');
  // Short URL with params
  assert.equal(extractYouTubeVideoId('https://youtu.be/8CfpY0u0JbU?si=AbCdEfGh123'), '8CfpY0u0JbU');
  // YouTube Music URL
  assert.equal(extractYouTubeVideoId('https://music.youtube.com/watch?v=e5z_Y9rA7lE&feature=share'), 'e5z_Y9rA7lE');
  // Embed URL
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/embed/Nb1VOQRsPWA'), 'Nb1VOQRsPWA');
  // Shorts URL
  assert.equal(extractYouTubeVideoId('https://www.youtube.com/shorts/pP31Lq3K0oY'), 'pP31Lq3K0oY');
  // Raw 11-char ID
  assert.equal(extractYouTubeVideoId('G-gUeC6g2W8'), 'G-gUeC6g2W8');
  // Raw 11-char with whitespace
  assert.equal(extractYouTubeVideoId('  dQw4w9WgXcQ  '), 'dQw4w9WgXcQ');
  // Invalid strings or empty
  assert.equal(extractYouTubeVideoId(''), null);
  assert.equal(extractYouTubeVideoId('https://example.com/audio.mp3'), null);
  assert.equal(extractYouTubeVideoId('invalid-string'), null);
});

test('calculateBankerOffer: calculates plausible offers scaled by round progression', () => {
  // Empty returns 0
  assert.equal(calculateBankerOffer([]), 0);
  // Single value returns that value
  assert.equal(calculateBankerOffer([500]), 500);

  // Set of values with mean = 500
  const values = [100, 200, 400, 500, 600, 800, 900];
  const offerRound1 = calculateBankerOffer(values, 1);
  const offerRound3 = calculateBankerOffer(values, 3);
  const offerRound5 = calculateBankerOffer(values, 5);

  assert.ok(offerRound1 > 0);
  assert.ok(offerRound3 > offerRound1, 'Round 3 offer should exceed round 1 offer');
  assert.ok(offerRound5 >= offerRound3, 'Round 5 offer should be high relative to mean');
  assert.ok(offerRound5 <= 1000);
});

test('generateAudiencePoll: sums to exactly 100% and leans to correct answer', () => {
  const poll = generateAudiencePoll('B');
  const sum = poll.A + poll.B + poll.C + poll.D;
  assert.equal(sum, 100);
  assert.ok(poll.B >= 55, 'Correct answer should have majority percentage');
  assert.ok(poll.A > 0);
  assert.ok(poll.C > 0);
  assert.ok(poll.D > 0);
});

test('shuffleBriefcases: preserves values count and resets open status', () => {
  const cases: DealBriefcase[] = [
    { id: 1, number: 1, value: 10, isOpen: true, isContestantBriefcase: true },
    { id: 2, number: 2, value: 50, isOpen: true, isContestantBriefcase: false },
    { id: 3, number: 3, value: 100, isOpen: false, isContestantBriefcase: false },
    { id: 4, number: 4, value: 500, isOpen: true, isContestantBriefcase: false },
  ];

  const shuffled = shuffleBriefcases(cases);
  assert.equal(shuffled.length, 4);
  shuffled.forEach((b) => {
    assert.equal(b.isOpen, false);
    assert.equal(b.isContestantBriefcase, false);
  });

  const sumOriginal = cases.reduce((acc, c) => acc + c.value, 0);
  const sumShuffled = shuffled.reduce((acc, c) => acc + c.value, 0);
  assert.equal(sumShuffled, sumOriginal);
});




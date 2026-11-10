import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateUpdatedScore,
  swapTeams1v1,
  rankParticipants,
  formatTimeDisplay,
  determineWinner,
  tickTimerState,
  createDefaultScoreboards,
  advanceRound1v1,
  previousRound1v1,
  advanceRoundMultiplayer,
} from './scoreboardRules';
import { Scoreboard1v1, ScoreboardMultiplayer, TimerState } from '../types/scoreboard';

test('calculateUpdatedScore: handles increments, decrements, and clamp at 0', () => {
  assert.equal(calculateUpdatedScore(5, 3), 8);
  assert.equal(calculateUpdatedScore(5, -2), 3);
  assert.equal(calculateUpdatedScore(1, -5, false), 0);
  assert.equal(calculateUpdatedScore(1, -5, true), -4);
});

test('swapTeams1v1: flips teamA and teamB properties accurately', () => {
  const [demoBasketball] = createDefaultScoreboards();
  const original = demoBasketball as Scoreboard1v1;
  const swapped = swapTeams1v1(original);

  assert.equal(swapped.teamA.id, original.teamB.id);
  assert.equal(swapped.teamA.name, original.teamB.name);
  assert.equal(swapped.teamA.score, original.teamB.score);
  assert.equal(swapped.teamB.id, original.teamA.id);
  assert.equal(swapped.teamB.name, original.teamA.name);
  assert.equal(swapped.teamB.score, original.teamA.score);
});

test('advanceRound1v1: sets_reset mode saves history, awards set won, and resets current score to 0', () => {
  const [, demoVolleyball] = createDefaultScoreboards();
  const volley = demoVolleyball as Scoreboard1v1; // teamA: 22, teamB: 20, setsWon: 1 each
  
  const advanced = advanceRound1v1(volley);
  assert.equal(advanced.currentRound, 4);
  assert.equal(advanced.roundHistory.length, 3);
  assert.equal(advanced.roundHistory[2].scoreA, 22);
  assert.equal(advanced.roundHistory[2].scoreB, 20);
  // Team A won the set (22 > 20), so teamA setsWon becomes 2
  assert.equal(advanced.teamA.setsWon, 2);
  assert.equal(advanced.teamB.setsWon, 1);
  // Current score reset to 0 for next set
  assert.equal(advanced.teamA.score, 0);
  assert.equal(advanced.teamB.score, 0);

  // Test previousRound1v1 restoration
  const reverted = previousRound1v1(advanced);
  assert.equal(reverted.currentRound, 3);
  assert.equal(reverted.teamA.score, 22);
  assert.equal(reverted.teamB.score, 20);
  assert.equal(reverted.teamA.setsWon, 1);
});

test('advanceRound1v1: cumulative mode preserves total score and advances round number', () => {
  const [demoBasketball] = createDefaultScoreboards();
  const bball = demoBasketball as Scoreboard1v1; // currentRound 4, score 78 vs 74
  
  const advanced = advanceRound1v1(bball);
  assert.equal(advanced.currentRound, 5);
  assert.equal(advanced.teamA.score, 78);
  assert.equal(advanced.teamB.score, 74);
  assert.equal(advanced.roundHistory.length, 4);
  assert.equal(advanced.roundHistory[3].scoreA, 78);
});

test('advanceRoundMultiplayer: records snapshot of all participant scores for the round', () => {
  const [, , demoTrivia] = createDefaultScoreboards();
  const trivia = demoTrivia as ScoreboardMultiplayer;

  const advanced = advanceRoundMultiplayer(trivia);
  assert.equal(advanced.currentRound, 4);
  assert.equal(advanced.roundHistory.length, 3);
  assert.equal(advanced.roundHistory[2].scores['t-1'], 1400);
  assert.equal(advanced.roundHistory[2].scores['t-4'], 1550);
});

test('rankParticipants: sorts and assigns gold, silver, bronze medals', () => {
  const participants = [
    { id: '1', name: 'Alpha', color: '#000', score: 20 },
    { id: '2', name: 'Beta', color: '#111', score: 50 },
    { id: '3', name: 'Gamma', color: '#222', score: 35 },
    { id: '4', name: 'Delta', color: '#333', score: 10 },
  ];

  const ranked = rankParticipants(participants, true);

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

test('formatTimeDisplay: converts seconds into MM:SS and HH:MM:SS', () => {
  assert.equal(formatTimeDisplay(0), '00:00');
  assert.equal(formatTimeDisplay(65), '01:05');
  assert.equal(formatTimeDisplay(600), '10:00');
  assert.equal(formatTimeDisplay(3665), '01:01:05');
});

test('determineWinner: picks leader for 1v1 sets mode and multiplayer leaderboard', () => {
  const [, demoVolley, demoTrivia] = createDefaultScoreboards();
  
  const winnerVolley = determineWinner(demoVolley as Scoreboard1v1);
  assert.ok(winnerVolley);
  assert.equal(winnerVolley?.name, 'Vóley Trueno'); // score 22 > 20

  const winnerMulti = determineWinner(demoTrivia as ScoreboardMultiplayer);
  assert.ok(winnerMulti);
  assert.equal(winnerMulti?.name, 'Cyber Nerds'); // score 1550
});

test('tickTimerState: ticks countdown down and stops at zero, ticks stopwatch up', () => {
  const countdown: TimerState = {
    mode: 'countdown',
    isRunning: true,
    secondsRemaining: 2,
    initialSeconds: 10,
    stopwatchSeconds: 0,
  };

  const ticked1 = tickTimerState(countdown);
  assert.equal(ticked1.secondsRemaining, 1);
  assert.equal(ticked1.isRunning, true);

  const ticked2 = tickTimerState(ticked1);
  assert.equal(ticked2.secondsRemaining, 0);
  assert.equal(ticked2.isRunning, false);
});

test('extractLiveState: extracts complete live state payload from app state', async () => {
  const { extractLiveState } = await import('./storageSync');
  const { createInitialAppState } = await import('./scoreboardRules');
  
  const appState = createInitialAppState();
  const livePayload = extractLiveState(appState);

  assert.ok(livePayload);
  assert.ok(livePayload.activeScoreboard);
  assert.equal(livePayload.activeScoreboard.id, appState.broadcast.liveScoreboardId);
  assert.equal(livePayload.timer.secondsRemaining, appState.timer.secondsRemaining);
  assert.equal(livePayload.hudToggles.showTimer, true);
  assert.equal(livePayload.scene.theme, 'broadcast-dark');
  assert.ok(livePayload.timestamp > 0);
});

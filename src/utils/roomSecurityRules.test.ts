import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRoomCode,
  isValidRoomCode,
  generatePin,
  isValidPin,
  checkRateLimit,
  pushUndoSnapshot,
  popUndoSnapshot,
  ScoreTurnSnapshot,
} from './roomSecurityRules';

test('generateRoomCode: creates 4-character unambiguous uppercase codes', () => {
  for (let i = 0; i < 20; i++) {
    const code = generateRoomCode();
    assert.equal(code.length, 4);
    assert.equal(isValidRoomCode(code), true);
  }
});

test('isValidRoomCode: correctly accepts and rejects codes', () => {
  assert.equal(isValidRoomCode('K7P2'), true);
  assert.equal(isValidRoomCode('ABCD'), true);
  assert.equal(isValidRoomCode('K7P'), false); // too short
  assert.equal(isValidRoomCode('K7P29'), false); // too long
  assert.equal(isValidRoomCode(''), false);
  assert.equal(isValidRoomCode(null), false);
});

test('generatePin & isValidPin: creates and validates 4-digit PINs', () => {
  for (let i = 0; i < 20; i++) {
    const pin = generatePin();
    assert.equal(pin.length, 4);
    assert.equal(isValidPin(pin), true);
  }
  assert.equal(isValidPin('1234'), true);
  assert.equal(isValidPin('0000'), true);
  assert.equal(isValidPin('123'), false);
  assert.equal(isValidPin('12345'), false);
  assert.equal(isValidPin('abcd'), false);
});

test('checkRateLimit: limits to max 20 commands per second', () => {
  let timestamps: number[] = [];
  const now = 10000;

  // First 20 commands at the same millisecond should be allowed
  for (let i = 0; i < 20; i++) {
    const res = checkRateLimit(timestamps, 20, now);
    assert.equal(res.allowed, true);
    timestamps = res.updatedTimestamps;
  }
  assert.equal(timestamps.length, 20);

  // 21st command within same second should be blocked
  const blocked = checkRateLimit(timestamps, 20, now + 100);
  assert.equal(blocked.allowed, false);

  // After 1000ms window passes, commands are allowed again
  const later = checkRateLimit(timestamps, 20, now + 1001);
  assert.equal(later.allowed, true);
});

test('pushUndoSnapshot & popUndoSnapshot: caps at 20 snapshots and performs LIFO undo', () => {
  let history: ScoreTurnSnapshot[] = [];

  const createDummySnapshot = (idx: number): ScoreTurnSnapshot => ({
    teams: [{ id: 'team-1', name: 'Team 1', color: '#ff0000', score: idx, setsWon: 0, fouls: 0 }],
    turn: { activeTeamId: 'team-1', orderMode: 'sequential', autoAdvanceOnScore: true, stealMode: false },
    timestamp: Date.now() + idx,
  });

  // Push 25 snapshots
  for (let i = 1; i <= 25; i++) {
    history = pushUndoSnapshot(history, createDummySnapshot(i), 20);
  }

  // Length must be capped at 20
  assert.equal(history.length, 20);
  // Oldest kept should be snapshot 6 (because 25 - 20 + 1 = 6)
  assert.equal(history[0].teams[0].score, 6);
  assert.equal(history[history.length - 1].teams[0].score, 25);

  // Pop undo
  const { previous, remaining } = popUndoSnapshot(history);
  assert.equal(previous?.teams[0].score, 25);
  assert.equal(remaining.length, 19);

  // Pop next undo
  const { previous: prev2, remaining: rem2 } = popUndoSnapshot(remaining);
  assert.equal(prev2?.teams[0].score, 24);
  assert.equal(rem2.length, 18);
});

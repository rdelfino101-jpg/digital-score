import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isTeamLockedOut,
  getRemainingLockoutSeconds,
  isRateLimited,
  registerBuzzerPress,
  getNextEligibleTeam,
  calculateUpdatedTeamScore,
  formatMsDiff,
} from './buzzerRules.js';

test('isTeamLockedOut identifies when a team is locked out', () => {
  const now = 10000;
  const lockouts = {
    teamA: 12000, // locked out for 2 more seconds
    teamB: 9500,  // expired
  };

  assert.equal(isTeamLockedOut(lockouts, 'teamA', now), true);
  assert.equal(isTeamLockedOut(lockouts, 'teamB', now), false);
  assert.equal(isTeamLockedOut(lockouts, 'teamC', now), false);
});

test('getRemainingLockoutSeconds returns correct decimal seconds', () => {
  const now = 10000;
  const lockouts = {
    teamA: 11800, // 1.8s
    teamB: 10000, // 0s
  };

  assert.equal(getRemainingLockoutSeconds(lockouts, 'teamA', now), 1.8);
  assert.equal(getRemainingLockoutSeconds(lockouts, 'teamB', now), 0);
  assert.equal(getRemainingLockoutSeconds(lockouts, 'teamC', now), 0);
});

test('isRateLimited enforces 5 presses per second limit', () => {
  const now = 5000;
  const timestamps = [4100, 4200, 4300, 4400, 4500]; // 5 in the last 1s
  assert.equal(isRateLimited(timestamps, now, 5), true);

  const olderTimestamps = [3000, 3500, 4200, 4400]; // only 2 in the last 1s
  assert.equal(isRateLimited(olderTimestamps, now, 5), false);
});

test('registerBuzzerPress sets first press msAfterFirst to 0 and subsequent to delta ms', () => {
  const t0 = 1000;
  const res1 = registerBuzzerPress([], 'team-1', t0);
  assert.equal(res1.isFirst, true);
  assert.equal(res1.updatedPresses.length, 1);
  assert.equal(res1.updatedPresses[0].msAfterFirst, 0);

  const t1 = 1340; // 340ms later
  const res2 = registerBuzzerPress(res1.updatedPresses, 'team-2', t1);
  assert.equal(res2.isFirst, false);
  assert.equal(res2.updatedPresses.length, 2);
  assert.equal(res2.updatedPresses[1].msAfterFirst, 340);
  assert.equal(res2.updatedPresses[1].teamId, 'team-2');

  // Duplicate press from team-1 should be ignored
  const res3 = registerBuzzerPress(res2.updatedPresses, 'team-1', t1 + 100);
  assert.equal(res3.updatedPresses.length, 2);
});

test('getNextEligibleTeam passes turn to next non-excluded team', () => {
  const presses = [
    { teamId: 'team-1', timestamp: 1000, msAfterFirst: 0 },
    { teamId: 'team-2', timestamp: 1200, msAfterFirst: 200 },
    { teamId: 'team-3', timestamp: 1500, msAfterFirst: 500 },
  ];

  // If team-1 failed, team-2 is next
  assert.equal(getNextEligibleTeam(presses, ['team-1']), 'team-2');
  // If team-1 and team-2 failed, team-3 is next
  assert.equal(getNextEligibleTeam(presses, ['team-1', 'team-2']), 'team-3');
  // If all failed, returns null
  assert.equal(getNextEligibleTeam(presses, ['team-1', 'team-2', 'team-3']), null);
});

test('formatMsDiff formats seconds cleanly', () => {
  assert.equal(formatMsDiff(340), '+0.34 s');
  assert.equal(formatMsDiff(810), '+0.81 s');
  assert.equal(formatMsDiff(1200), '+1.20 s');
  assert.equal(formatMsDiff(0), '0.00 s');
});

test('calculateUpdatedTeamScore handles awards and penalties', () => {
  assert.equal(calculateUpdatedTeamScore(200, 100), 300);
  assert.equal(calculateUpdatedTeamScore(200, -25), 175);
  assert.equal(calculateUpdatedTeamScore(100, 0), 100);
});

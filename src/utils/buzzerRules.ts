import { BuzzerPressItem, BuzzerRuleConfig, BuzzerStatus } from '../types/masterStudio';

export const DEFAULT_BUZZER_CONFIG: BuzzerRuleConfig = {
  pointsForCorrect: 100,
  penaltyForIncorrect: 0,
  passToNext: true,
  answerTimeSeconds: 5,
  lockoutSeconds: 2,
  useBuzzersInGameStage: false,
};

/**
 * Checks if a team is currently in lockout state.
 */
export function isTeamLockedOut(
  lockedOutUntil: Record<string, number>,
  teamId: string,
  now: number
): boolean {
  const until = lockedOutUntil[teamId];
  return typeof until === 'number' && until > now;
}

/**
 * Calculates remaining lockout seconds (e.g. 1.8).
 */
export function getRemainingLockoutSeconds(
  lockedOutUntil: Record<string, number>,
  teamId: string,
  now: number
): number {
  const until = lockedOutUntil[teamId];
  if (!until || until <= now) return 0;
  return Number(((until - now) / 1000).toFixed(1));
}

/**
 * Rate limiter: returns true if the press exceeds max allowed presses per second.
 */
export function isRateLimited(
  recentPressTimestamps: number[],
  now: number,
  maxPerSecond = 5
): boolean {
  const oneSecondAgo = now - 1000;
  const recent = recentPressTimestamps.filter((t) => t > oneSecondAgo);
  return recent.length >= maxPerSecond;
}

/**
 * Adds a new press to the list, calculating msAfterFirst.
 */
export function registerBuzzerPress(
  currentPresses: BuzzerPressItem[],
  teamId: string,
  now: number
): { updatedPresses: BuzzerPressItem[]; isFirst: boolean } {
  // If team already pressed, ignore duplicate press
  if (currentPresses.some((p) => p.teamId === teamId)) {
    return { updatedPresses: currentPresses, isFirst: false };
  }

  if (currentPresses.length === 0) {
    const firstPress: BuzzerPressItem = {
      teamId,
      timestamp: now,
      msAfterFirst: 0,
    };
    return { updatedPresses: [firstPress], isFirst: true };
  }

  const firstTimestamp = currentPresses[0].timestamp;
  const msAfterFirst = Math.max(1, now - firstTimestamp);

  const newPress: BuzzerPressItem = {
    teamId,
    timestamp: now,
    msAfterFirst,
  };

  return {
    updatedPresses: [...currentPresses, newPress],
    isFirst: false,
  };
}

/**
 * Determines the next eligible team from the press order who has not been excluded.
 */
export function getNextEligibleTeam(
  presses: BuzzerPressItem[],
  excludedTeams: string[]
): string | null {
  const excludedSet = new Set(excludedTeams);
  const next = presses.find((p) => !excludedSet.has(p.teamId));
  return next ? next.teamId : null;
}

/**
 * Applies score award or penalty to team score.
 */
export function calculateUpdatedTeamScore(
  currentScore: number,
  delta: number
): number {
  return currentScore + delta;
}

/**
 * Formats milliseconds difference as seconds string with sign (+0.34 s).
 */
export function formatMsDiff(ms: number): string {
  if (ms <= 0) return '0.00 s';
  const sec = (ms / 1000).toFixed(2);
  return `+${sec} s`;
}

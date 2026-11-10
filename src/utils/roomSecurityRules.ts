import { StudioTeam, TurnEngineState } from '../types/masterStudio';

export interface ScoreTurnSnapshot {
  teams: StudioTeam[];
  turn: TurnEngineState;
  timestamp: number;
  label?: string;
}

const ROOM_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 31 unambiguous characters

/**
 * Generates a clean, unambiguous 4-character room code (e.g. "K7P2").
 */
export function generateRoomCode(): string {
  let result = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_ALPHABET.length);
    result += ROOM_ALPHABET[randomIndex];
  }
  return result;
}

/**
 * Validates a 4-character room code.
 */
export function isValidRoomCode(code?: string | null): boolean {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim().toUpperCase();
  if (clean.length !== 4) return false;
  for (let i = 0; i < clean.length; i++) {
    if (!ROOM_ALPHABET.includes(clean[i])) {
      // allow standard alphanumeric as fallback
      if (!/[A-Z0-9]/.test(clean[i])) return false;
    }
  }
  return true;
}

/**
 * Generates a 4-digit PIN for remote operator authentication.
 */
export function generatePin(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return String(num);
}

/**
 * Validates a 4-digit PIN.
 */
export function isValidPin(pin?: string | null): boolean {
  if (!pin || typeof pin !== 'string') return false;
  return /^\d{4}$/.test(pin.trim());
}

/**
 * Sliding window rate-limiter: enforces max commands per second per connection (default: 20/s).
 */
export function checkRateLimit(
  timestamps: number[],
  maxPerSecond = 20,
  now = Date.now()
): { allowed: boolean; updatedTimestamps: number[] } {
  const windowStart = now - 1000;
  const validTimestamps = timestamps.filter((t) => t > windowStart);
  if (validTimestamps.length >= maxPerSecond) {
    return {
      allowed: false,
      updatedTimestamps: validTimestamps,
    };
  }
  return {
    allowed: true,
    updatedTimestamps: [...validTimestamps, now],
  };
}

/**
 * Manages an undo history stack of up to maxItems (default: 20 snapshots).
 */
export function pushUndoSnapshot(
  history: ScoreTurnSnapshot[],
  snapshot: ScoreTurnSnapshot,
  maxItems = 20
): ScoreTurnSnapshot[] {
  const next = [...history, snapshot];
  if (next.length > maxItems) {
    return next.slice(next.length - maxItems);
  }
  return next;
}

/**
 * Pops the last snapshot from the undo history stack.
 */
export function popUndoSnapshot(
  history: ScoreTurnSnapshot[]
): { previous?: ScoreTurnSnapshot; remaining: ScoreTurnSnapshot[] } {
  if (history.length === 0) {
    return { remaining: [] };
  }
  const next = [...history];
  const previous = next.pop();
  return {
    previous,
    remaining: next,
  };
}

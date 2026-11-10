import {
  ScoreboardAppState,
  LiveState,
  SyncChannelMessage,
} from '../types/scoreboard';
import { createInitialAppState, DEFAULT_HUD_TOGGLES } from './scoreboardRules';

export const APP_STATE_STORAGE_KEY = 'scoreboard_studio_state_v2';
export const LIVE_STATE_STORAGE_KEY = 'scoreboard_live_state';
export const SYNC_CHANNEL_NAME = 'scoreboard_studio_sync';

/**
 * Extracts a complete, self-contained LiveState payload ready for projection broadcast.
 * This is the single source of truth for the Projector View.
 */
export function extractLiveState(appState: ScoreboardAppState): LiveState {
  const activeScoreboard =
    appState.scoreboards.find((s) => s.id === appState.broadcast.liveScoreboardId) ||
    appState.scoreboards[0] ||
    null;

  return {
    activeScoreboard: activeScoreboard ? JSON.parse(JSON.stringify(activeScoreboard)) : null,
    timer: { ...appState.timer },
    hudToggles: { ...(appState.broadcast.hudToggles || DEFAULT_HUD_TOGGLES) },
    scene: {
      theme: appState.broadcast.theme || 'broadcast-dark',
      isBlackout: Boolean(appState.broadcast.blackout),
      celebrationActive: Boolean(appState.broadcast.celebrationActive),
      celebrationWinner: appState.broadcast.celebrationWinner || null,
      tickerActive: Boolean(appState.broadcast.tickerActive),
      tickerMessage: appState.broadcast.tickerMessage || '',
    },
    timestamp: Date.now(),
  };
}

/**
 * Loads persisted operator app state from localStorage.
 */
export function loadSavedAppState(): ScoreboardAppState {
  if (typeof window === 'undefined') return createInitialAppState();
  try {
    const raw = localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) return createInitialAppState();
    const parsed = JSON.parse(raw) as ScoreboardAppState;
    if (parsed && Array.isArray(parsed.scoreboards) && parsed.broadcast && parsed.timer) {
      if (!parsed.broadcast.hudToggles) {
        parsed.broadcast.hudToggles = { ...DEFAULT_HUD_TOGGLES };
      }
      if (!parsed.version || parsed.version < 2 || parsed.scoreboards.length < 3) {
        return createInitialAppState();
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Could not parse saved scoreboard state, using defaults:', err);
  }
  return createInitialAppState();
}

/**
 * Saves operator app state to localStorage.
 */
export function saveAppState(state: ScoreboardAppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving app state to localStorage:', err);
  }
}

/**
 * Saves the live broadcast state to localStorage.
 */
export function saveLiveState(liveState: LiveState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LIVE_STATE_STORAGE_KEY, JSON.stringify(liveState));
  } catch (err) {
    console.error('Error saving live state to localStorage:', err);
  }
}

/**
 * Reads the live broadcast state from localStorage (synchronous read for projector initialization).
 */
export function loadLiveState(): LiveState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LIVE_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveState;
    if (parsed && typeof parsed.timestamp === 'number') {
      return parsed;
    }
  } catch (err) {
    console.warn('Could not parse live state from localStorage:', err);
  }
  return null;
}

/**
 * Creates and initializes a BroadcastChannel for instant cross-window live communication.
 */
export function createStudioSyncChannel(
  onMessage: (msg: SyncChannelMessage) => void
): {
  channel: BroadcastChannel | null;
  broadcastLiveState: (liveState: LiveState) => void;
  requestInitialState: () => void;
  close: () => void;
} {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return {
      channel: null,
      broadcastLiveState: () => {},
      requestInitialState: () => {},
      close: () => {},
    };
  }

  try {
    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);

    channel.onmessage = (event: MessageEvent<SyncChannelMessage>) => {
      if (event.data && typeof event.data === 'object' && 'type' in event.data) {
        onMessage(event.data);
      }
    };

    const broadcastLiveState = (liveState: LiveState) => {
      try {
        channel.postMessage({
          type: 'SYNC_STATE',
          payload: liveState,
          timestamp: liveState.timestamp || Date.now(),
        });
      } catch (err) {
        console.warn('BroadcastChannel broadcastLiveState error:', err);
      }
    };

    const requestInitialState = () => {
      try {
        channel.postMessage({
          type: 'REQUEST_INITIAL_STATE',
          timestamp: Date.now(),
        });
      } catch (err) {
        console.warn('BroadcastChannel requestInitialState error:', err);
      }
    };

    return {
      channel,
      broadcastLiveState,
      requestInitialState,
      close: () => {
        try {
          channel.close();
        } catch {
          // ignore
        }
      },
    };
  } catch (err) {
    console.warn('BroadcastChannel creation failed, falling back to storage sync:', err);
    return {
      channel: null,
      broadcastLiveState: () => {},
      requestInitialState: () => {},
      close: () => {},
    };
  }
}

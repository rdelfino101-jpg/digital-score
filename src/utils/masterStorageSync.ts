import { MasterLiveState, MasterSyncMessage, RemoteCommandType } from '../types/masterStudio';
import { createInitialMasterLiveState } from './gameEngineRules';
import { createInitialRaffleState } from './raffleEngineRules';

export const MASTER_STUDIO_STORAGE_KEY = 'master_studio_state';
export const MASTER_STUDIO_CHANNEL_NAME = 'master_studio_sync';

export function getRoomStorageKey(roomCode = 'K7P2'): string {
  return `${MASTER_STUDIO_STORAGE_KEY}_${roomCode.toUpperCase().slice(0, 4)}`;
}

/**
 * Saves current master live state to localStorage for room persistence and fallback.
 */
export function saveMasterLiveState(state: MasterLiveState, roomCode = 'K7P2'): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getRoomStorageKey(roomCode);
    localStorage.setItem(key, JSON.stringify(state));
    // Also save to generic key for backward compatibility
    localStorage.setItem(MASTER_STUDIO_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving master live state to localStorage:', err);
  }
}

/**
 * Loads saved master live state or initializes default for a specific room.
 */
export function loadMasterLiveState(roomCode = 'K7P2'): MasterLiveState {
  const initial = createInitialMasterLiveState();
  if (typeof window === 'undefined') return initial;
  try {
    const key = getRoomStorageKey(roomCode);
    const raw = localStorage.getItem(key) || localStorage.getItem(MASTER_STUDIO_STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as MasterLiveState;
    if (parsed && Array.isArray(parsed.teams) && parsed.gameStage && parsed.turn) {
      return {
        ...initial,
        ...parsed,
        gameStage: {
          ...initial.gameStage,
          ...parsed.gameStage,
          bibleBook: { ...initial.gameStage.bibleBook, ...(parsed.gameStage.bibleBook || {}) },
          whoSaidIt: { ...initial.gameStage.whoSaidIt, ...(parsed.gameStage.whoSaidIt || {}) },
          hangman: { ...initial.gameStage.hangman, ...(parsed.gameStage.hangman || {}) },
          charades: { ...initial.gameStage.charades, ...(parsed.gameStage.charades || {}) },
          familyFeud: { ...initial.gameStage.familyFeud, ...(parsed.gameStage.familyFeud || {}) },
          triviaShow: { ...initial.gameStage.triviaShow, ...(parsed.gameStage.triviaShow || {}) },
          anagramWheel: { ...initial.gameStage.anagramWheel, ...(parsed.gameStage.anagramWheel || {}) },
          musicKaraoke: { ...initial.gameStage.musicKaraoke, ...(parsed.gameStage.musicKaraoke || {}) },
          millionaireShow: { ...initial.gameStage.millionaireShow, ...(parsed.gameStage.millionaireShow || {}) },
          dealOrNoDeal: { ...initial.gameStage.dealOrNoDeal, ...(parsed.gameStage.dealOrNoDeal || {}) },
        },
        raffle: parsed.raffle || initial.raffle,
        buzzer: parsed.buzzer || initial.buzzer,
      };
    }
  } catch (err) {
    console.warn('Could not parse master live state from localStorage, falling back to initial:', err);
  }
  return initial;
}

export interface MasterSyncOptions {
  roomCode?: string;
  role?: 'director' | 'projector' | 'remote' | 'buzzer';
  pin?: string;
  teamId?: string;
  token?: string;
  onMessage: (msg: MasterSyncMessage) => void;
  onConnectionChange?: (status: 'connected' | 'connecting' | 'disconnected') => void;
  onAuthChange?: (authenticated: boolean, error?: string) => void;
}

/**
 * Hybrid Real-Time Room Synchronization Engine:
 * Combines native WebSockets isolated by 4-character room codes with
 * room-scoped BroadcastChannel and localStorage.
 */
export function createMasterSyncChannel(
  optionsOrOnMessage: MasterSyncOptions | ((msg: MasterSyncMessage) => void),
  legacyOnConnectionChange?: (status: 'connected' | 'connecting' | 'disconnected') => void
): {
  channel: BroadcastChannel | null;
  broadcastState: (state: MasterLiveState) => void;
  requestInitialState: () => void;
  broadcastSound: (sound: 'correct' | 'error' | 'turn' | 'tick' | 'timesUp' | 'wheel' | 'fanfare' | 'drumroll' | 'splash' | 'buzzer') => void;
  sendCommand: (command: RemoteCommandType, payload?: any) => void;
  authenticate: (pin: string) => void;
  notifyPinChanged: (newPin: string) => void;
  dispatch: (msg: MasterSyncMessage) => void;
  sendBuzzerOpen: () => void;
  sendBuzzerClose: () => void;
  sendBuzzerReset: () => void;
  sendBuzzerJudge: (result: 'correct' | 'incorrect') => void;
  sendBuzzerPress: (teamId: string, token: string) => void;
  sendBuzzerConfigUpdate: (config: Partial<import('../types/masterStudio').BuzzerRuleConfig>) => void;
  sendBuzzerRegenerateTokens: () => void;
  sendBuzzerPing: (clientTimestamp: number) => void;
  sendBuzzerPong: (clientTimestamp: number, serverTimestamp: number) => void;
  close: () => void;
} {
  const options: MasterSyncOptions =
    typeof optionsOrOnMessage === 'function'
      ? {
          onMessage: optionsOrOnMessage,
          onConnectionChange: legacyOnConnectionChange,
          roomCode: 'K7P2',
          role: 'director',
        }
      : optionsOrOnMessage;

  const roomCode = (options.roomCode || 'K7P2').trim().toUpperCase().slice(0, 4);
  const role = options.role || 'director';
  let activePin = (options.pin || '').trim();

  let ws: WebSocket | null = null;
  let isClosed = false;
  let reconnectTimer: any = null;

  // 1. Room-scoped BroadcastChannel for instant same-browser tab communication
  let channel: BroadcastChannel | null = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(`${MASTER_STUDIO_CHANNEL_NAME}_${roomCode}`);
      channel.onmessage = (event: MessageEvent<MasterSyncMessage>) => {
        if (event.data && typeof event.data === 'object' && 'type' in event.data) {
          // Verify room match if message carries room
          if (event.data.room && event.data.room !== roomCode) {
            return;
          }
          options.onMessage(event.data);
        }
      };
    } catch (err) {
      console.warn('BroadcastChannel initialization error:', err);
    }
  }

  // 2. WebSocket Connection with room and role parameters
  function connectWebSocket() {
    if (typeof window === 'undefined' || isClosed) return;

    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      const params = new URLSearchParams({
        room: roomCode,
        role,
        ...(activePin ? { pin: activePin } : {}),
        ...(options.teamId ? { team: options.teamId } : {}),
        ...(options.token ? { token: options.token } : {}),
      });
      const wsUrl = `${wsProtocol}//${wsHost}/ws?${params.toString()}`;

      options.onConnectionChange?.('connecting');
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        options.onConnectionChange?.('connected');
        // Request fresh state from the server on connection
        try {
          ws?.send(
            JSON.stringify({
              type: 'REQUEST_INITIAL_STATE',
              room: roomCode,
              role,
              timestamp: Date.now(),
            })
          );
        } catch {
          // ignore
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg && typeof msg === 'object' && 'type' in msg) {
            // Check room isolation
            if (msg.room && msg.room !== roomCode) {
              return;
            }

            if (msg.type === 'AUTH_RESULT') {
              options.onAuthChange?.(msg.success, msg.error);
            } else if (msg.type === 'PIN_CHANGED') {
              options.onAuthChange?.(false, 'El director actualizó el PIN de la sala. Ingresa el nuevo PIN.');
            }

            options.onMessage(msg);
          }
        } catch (err) {
          console.warn('Failed to parse incoming WebSocket message:', err);
        }
      };

      ws.onerror = () => {
        // Triggers onclose and attempts reconnect
      };

      ws.onclose = () => {
        options.onConnectionChange?.('disconnected');
        if (!isClosed) {
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connectWebSocket, 2000);
        }
      };
    } catch (err) {
      console.warn('WebSocket init exception:', err);
      if (!isClosed) {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      }
    }
  }

  connectWebSocket();

  // Helper to dispatch through WebSocket and BroadcastChannel
  const dispatch = (msg: MasterSyncMessage) => {
    const enriched = { ...msg, room: roomCode };

    // A. BroadcastChannel
    if (channel) {
      try {
        channel.postMessage(enriched);
      } catch (err) {
        console.warn('BroadcastChannel dispatch error:', err);
      }
    }

    // B. WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(enriched));
      } catch (err) {
        console.warn('WebSocket dispatch error:', err);
      }
    } else {
      // Fallback: send via REST API if WebSocket is buffering or reconnecting
      if (typeof window !== 'undefined' && 'fetch' in window) {
        try {
          fetch('/api/remote/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              room: roomCode,
              pin: activePin,
              ...(msg.type === 'REMOTE_COMMAND'
                ? { command: msg.command, payload: msg.payload }
                : { command: msg.type, payload: msg }),
            }),
          }).catch(() => {});
        } catch {
          // ignore
        }
      }
    }
  };

  const broadcastState = (state: MasterLiveState) => {
    dispatch({
      type: 'SYNC_MASTER_STATE',
      payload: state,
      room: roomCode,
      timestamp: state.timestamp || Date.now(),
    });
  };

  const requestInitialState = () => {
    dispatch({
      type: 'REQUEST_INITIAL_STATE',
      room: roomCode,
      role,
      timestamp: Date.now(),
    });
  };

  const broadcastSound = (sound: 'correct' | 'error' | 'turn' | 'tick' | 'timesUp' | 'wheel' | 'fanfare' | 'drumroll' | 'splash' | 'buzzer') => {
    dispatch({
      type: 'TRIGGER_SOUND',
      sound,
      room: roomCode,
    });
  };

  const sendCommand = (command: RemoteCommandType, payload?: any) => {
    dispatch({
      type: 'REMOTE_COMMAND',
      command,
      payload,
      room: roomCode,
      pin: activePin,
      timestamp: Date.now(),
    });
  };

  const authenticate = (pin: string) => {
    activePin = pin.trim();
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(
          JSON.stringify({
            type: 'AUTH_REMOTE',
            room: roomCode,
            pin: activePin,
            timestamp: Date.now(),
          })
        );
      } catch {}
    } else {
      // Reconnect with new PIN
      if (ws) {
        try {
          ws.close();
        } catch {}
      }
      connectWebSocket();
    }
  };

  const notifyPinChanged = (newPin: string) => {
    activePin = newPin.trim();
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(
          JSON.stringify({
            type: 'PIN_CHANGED',
            room: roomCode,
            newPin: activePin,
            timestamp: Date.now(),
          })
        );
      } catch {}
    }
  };

  return {
    channel,
    broadcastState,
    requestInitialState,
    broadcastSound,
    sendCommand,
    authenticate,
    notifyPinChanged,
    dispatch,
    sendBuzzerOpen: () => dispatch({ type: 'BUZZER_OPEN', room: roomCode, timestamp: Date.now() }),
    sendBuzzerClose: () => dispatch({ type: 'BUZZER_CLOSE', room: roomCode, timestamp: Date.now() }),
    sendBuzzerReset: () => dispatch({ type: 'BUZZER_RESET', room: roomCode, timestamp: Date.now() }),
    sendBuzzerJudge: (result: 'correct' | 'incorrect') => dispatch({ type: 'BUZZER_JUDGE', result, room: roomCode, timestamp: Date.now() }),
    sendBuzzerPress: (teamId: string, token: string) => dispatch({ type: 'BUZZER_PRESS', teamId, token, room: roomCode, timestamp: Date.now() }),
    sendBuzzerConfigUpdate: (config: Partial<import('../types/masterStudio').BuzzerRuleConfig>) => dispatch({ type: 'BUZZER_CONFIG_UPDATE', config, room: roomCode, timestamp: Date.now() }),
    sendBuzzerRegenerateTokens: () => dispatch({ type: 'BUZZER_REGENERATE_TOKENS', room: roomCode, timestamp: Date.now() }),
    sendBuzzerPing: (clientTimestamp: number) => dispatch({ type: 'BUZZER_PING', clientTimestamp, room: roomCode }),
    sendBuzzerPong: (clientTimestamp: number, serverTimestamp: number) => dispatch({ type: 'BUZZER_PONG', clientTimestamp, serverTimestamp, room: roomCode }),
    close: () => {
      isClosed = true;
      clearTimeout(reconnectTimer);
      if (ws) {
        try {
          ws.close();
        } catch {}
      }
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
    },
  };
}

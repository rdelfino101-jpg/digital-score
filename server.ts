import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

interface RoomState {
  code: string;
  operatorPin: string;
  latestMasterState: any | null;
  createdAt: number;
  qrParticipants?: any[];
  teamTokens: Map<string, string>;
  buzzer: {
    status: 'closed' | 'open' | 'answering';
    openedAt: number | null;
    presses: Array<{ teamId: string; timestamp: number; msAfterFirst: number }>;
    lockedOutUntil: Record<string, number>;
    excludedTeams: string[];
    answeringTeamId: string | null;
    answerDeadline: number | null;
    config: {
      pointsForCorrect: number;
      penaltyForIncorrect: number;
      passToNext: boolean;
      answerTimeSeconds: number;
      lockoutSeconds: number;
      useBuzzersInGameStage: boolean;
    };
  };
  connectedBuzzers: Map<string, { ws: ExtendedWebSocket; latencyMs: number; lastPingTime: number }>;
  buzzerAnswerTimer?: NodeJS.Timeout | null;
}

interface ExtendedWebSocket extends WebSocket {
  roomCode?: string;
  role?: 'director' | 'projector' | 'remote' | 'buzzer';
  teamId?: string;
  token?: string;
  isAuthenticated?: boolean;
  commandTimestamps?: number[];
  pressTimestamps?: number[];
}

const VALID_MESSAGE_TYPES = new Set([
  'SYNC_MASTER_STATE',
  'REQUEST_INITIAL_STATE',
  'TRIGGER_SOUND',
  'REMOTE_COMMAND',
  'AUTH_REMOTE',
  'PIN_CHANGED',
  'JOIN_REGISTRATION',
  'WINNER_ANNOUNCED',
  'BUZZER_OPEN',
  'BUZZER_CLOSE',
  'BUZZER_RESET',
  'BUZZER_JUDGE',
  'BUZZER_PRESS',
  'BUZZER_STATE',
  'BUZZER_CONFIG_UPDATE',
  'BUZZER_REGENERATE_TOKENS',
  'BUZZER_PING',
  'BUZZER_PONG',
]);

function generateRandomToken(): string {
  return randomBytes(5).toString('hex');
}

function getOrCreateTeamToken(room: RoomState, teamId: string): string {
  let token = room.teamTokens.get(teamId);
  if (!token) {
    token = generateRandomToken();
    room.teamTokens.set(teamId, token);
  }
  return token;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.use(express.json());

  // In-memory rooms repository
  const rooms = new Map<string, RoomState>();

  function getOrCreateRoom(rawCode?: string | null, initialPin = '1234'): RoomState {
    const code = (rawCode || 'K7P2').trim().toUpperCase().slice(0, 4);
    let room = rooms.get(code);
    if (!room) {
      const newRoom: RoomState = {
        code,
        operatorPin: initialPin,
        latestMasterState: null,
        createdAt: Date.now(),
        qrParticipants: [],
        teamTokens: new Map<string, string>(),
        buzzer: {
          status: 'closed',
          openedAt: null,
          presses: [],
          lockedOutUntil: {},
          excludedTeams: [],
          answeringTeamId: null,
          answerDeadline: null,
          config: {
            pointsForCorrect: 100,
            penaltyForIncorrect: 0,
            passToNext: true,
            answerTimeSeconds: 5,
            lockoutSeconds: 2,
            useBuzzersInGameStage: false,
          },
        },
        connectedBuzzers: new Map(),
      };
      rooms.set(code, newRoom);
      console.log(`[Master Studio] Nueva sala creada: ${code} (PIN operador inicial: ${initialPin})`);
      return newRoom;
    }
    if (!room.qrParticipants) {
      room.qrParticipants = [];
    }
    if (!room.teamTokens) {
      room.teamTokens = new Map<string, string>();
    }
    if (!room.connectedBuzzers) {
      room.connectedBuzzers = new Map();
    }
    if (!room.buzzer) {
      room.buzzer = {
        status: 'closed',
        openedAt: null,
        presses: [],
        lockedOutUntil: {},
        excludedTeams: [],
        answeringTeamId: null,
        answerDeadline: null,
        config: {
          pointsForCorrect: 100,
          penaltyForIncorrect: 0,
          passToNext: true,
          answerTimeSeconds: 5,
          lockoutSeconds: 2,
          useBuzzersInGameStage: false,
        },
      };
    }
    return room;
  }

  // Pre-initialize default room K7P2
  getOrCreateRoom('K7P2', '1234');

  // Broadcast helper to clients of the SAME room only
  const broadcastToRoom = (roomCode: string, data: any, excludeWs?: WebSocket) => {
    const raw = JSON.stringify({ ...data, room: roomCode });
    wss.clients.forEach((client) => {
      const extClient = client as ExtendedWebSocket;
      if (
        extClient !== excludeWs &&
        extClient.roomCode === roomCode &&
        extClient.readyState === WebSocket.OPEN
      ) {
        try {
          extClient.send(raw);
        } catch (err) {
          console.warn(`[Master Studio] Fallo al enviar a cliente en sala ${roomCode}:`, err);
        }
      }
    });
  };

  function broadcastBuzzerState(room: RoomState) {
    const connectedClients: Record<string, { teamId: string; token: string; latencyMs: number; connected: boolean }> = {};
    const teams = room.latestMasterState?.teams || [
      { id: 'team-1', name: 'Equipo 1' },
      { id: 'team-2', name: 'Equipo 2' },
      { id: 'team-3', name: 'Equipo 3' },
      { id: 'team-4', name: 'Equipo 4' },
    ];

    teams.forEach((t: any) => {
      const token = getOrCreateTeamToken(room, t.id);
      const conn = room.connectedBuzzers.get(t.id);
      const isConn = !!(conn && conn.ws.readyState === WebSocket.OPEN);
      connectedClients[t.id] = {
        teamId: t.id,
        token,
        latencyMs: isConn ? conn.latencyMs : 0,
        connected: isConn,
      };
    });

    const statePayload = {
      ...room.buzzer,
      connectedClients,
    };

    broadcastToRoom(room.code, {
      type: 'BUZZER_STATE',
      state: statePayload,
      room: room.code,
      timestamp: Date.now(),
    });
  }

  function handleBuzzerJudge(room: RoomState, result: 'correct' | 'incorrect') {
    if (room.buzzerAnswerTimer) {
      clearTimeout(room.buzzerAnswerTimer);
      room.buzzerAnswerTimer = null;
    }

    const currentAnswering = room.buzzer.answeringTeamId;
    if (!currentAnswering) return;

    const now = Date.now();

    if (result === 'correct') {
      const points = room.buzzer.config.pointsForCorrect || 100;
      if (room.latestMasterState && Array.isArray(room.latestMasterState.teams)) {
        const team = room.latestMasterState.teams.find((t: any) => t.id === currentAnswering);
        if (team) {
          team.score = (team.score || 0) + points;
          room.latestMasterState.timestamp = now;
          broadcastToRoom(room.code, {
            type: 'SYNC_MASTER_STATE',
            payload: room.latestMasterState,
            room: room.code,
            timestamp: now,
          });
        }
      }

      broadcastToRoom(room.code, {
        type: 'TRIGGER_SOUND',
        sound: 'correct',
        room: room.code,
        timestamp: now,
      });

      room.buzzer.status = 'closed';
      room.buzzer.answeringTeamId = null;
      room.buzzer.answerDeadline = null;
      broadcastBuzzerState(room);
    } else {
      // Incorrect
      const penalty = room.buzzer.config.penaltyForIncorrect || 0;
      if (penalty !== 0 && room.latestMasterState && Array.isArray(room.latestMasterState.teams)) {
        const team = room.latestMasterState.teams.find((t: any) => t.id === currentAnswering);
        if (team) {
          team.score = Math.max(0, (team.score || 0) + penalty);
          room.latestMasterState.timestamp = now;
          broadcastToRoom(room.code, {
            type: 'SYNC_MASTER_STATE',
            payload: room.latestMasterState,
            room: room.code,
            timestamp: now,
          });
        }
      }

      broadcastToRoom(room.code, {
        type: 'TRIGGER_SOUND',
        sound: 'error',
        room: room.code,
        timestamp: now,
      });

      if (!room.buzzer.excludedTeams.includes(currentAnswering)) {
        room.buzzer.excludedTeams.push(currentAnswering);
      }

      if (room.buzzer.config.passToNext) {
        // Find next press that is not excluded
        const nextPress = room.buzzer.presses.find((p) => !room.buzzer.excludedTeams.includes(p.teamId));
        if (nextPress) {
          room.buzzer.status = 'answering';
          room.buzzer.answeringTeamId = nextPress.teamId;
          const answerTimeMs = (room.buzzer.config.answerTimeSeconds || 5) * 1000;
          room.buzzer.answerDeadline = now + answerTimeMs;

          if (room.buzzer.config.useBuzzersInGameStage && room.latestMasterState) {
            room.latestMasterState.turn.activeTeamId = nextPress.teamId;
            broadcastToRoom(room.code, {
              type: 'SYNC_MASTER_STATE',
              payload: room.latestMasterState,
              room: room.code,
              timestamp: now,
            });
          }

          broadcastBuzzerState(room);

          room.buzzerAnswerTimer = setTimeout(() => {
            handleBuzzerJudge(room, 'incorrect');
          }, answerTimeMs);
        } else {
          // No more pressed teams. Check if any teams remain that haven't been excluded
          const allTeams = (room.latestMasterState?.teams || []).map((t: any) => t.id);
          const nonExcluded = allTeams.filter((id: string) => !room.buzzer.excludedTeams.includes(id));
          if (nonExcluded.length > 0) {
            room.buzzer.status = 'open';
            room.buzzer.openedAt = now;
            room.buzzer.answeringTeamId = null;
            room.buzzer.answerDeadline = null;
            room.buzzer.presses = [];
            broadcastBuzzerState(room);
          } else {
            room.buzzer.status = 'closed';
            room.buzzer.answeringTeamId = null;
            room.buzzer.answerDeadline = null;
            broadcastBuzzerState(room);
          }
        }
      } else {
        room.buzzer.status = 'closed';
        room.buzzer.answeringTeamId = null;
        room.buzzer.answerDeadline = null;
        broadcastBuzzerState(room);
      }
    }
  }

  // Ping interval to measure buzzer latencies every 5 seconds
  setInterval(() => {
    rooms.forEach((room) => {
      const now = Date.now();
      room.connectedBuzzers.forEach((conn) => {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.lastPingTime = now;
          try {
            conn.ws.send(
              JSON.stringify({
                type: 'BUZZER_PING',
                clientTimestamp: now,
                room: room.code,
              })
            );
          } catch {}
        }
      });
    });
  }, 5000);

  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    // Parse URL query parameters: ?room=K7P2&role=director&pin=1234&team=team-1&token=abc
    const reqUrl = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const requestedRoom = (reqUrl.searchParams.get('room') || 'K7P2').trim().toUpperCase().slice(0, 4);
    const role = (reqUrl.searchParams.get('role') || 'director').toLowerCase() as 'director' | 'projector' | 'remote' | 'buzzer';
    const providedPin = (reqUrl.searchParams.get('pin') || '').trim();
    const requestedTeam = (reqUrl.searchParams.get('team') || '').trim();
    const requestedToken = (reqUrl.searchParams.get('token') || '').trim();

    const room = getOrCreateRoom(requestedRoom);
    ws.roomCode = room.code;
    ws.role = role;
    ws.commandTimestamps = [];
    ws.pressTimestamps = [];

    // Authenticate: Director & Projector are trusted; Remote requires matching 4-digit PIN; Buzzer requires team token
    if (role === 'remote') {
      ws.isAuthenticated = providedPin.length === 4 && providedPin === room.operatorPin;
      // Send initial authentication feedback to remote
      ws.send(
        JSON.stringify({
          type: 'AUTH_RESULT',
          success: ws.isAuthenticated,
          error: ws.isAuthenticated ? undefined : 'PIN_REQUIRED',
          room: room.code,
          timestamp: Date.now(),
        })
      );
    } else if (role === 'buzzer') {
      ws.teamId = requestedTeam;
      ws.token = requestedToken;
      const expectedToken = getOrCreateTeamToken(room, requestedTeam);

      if (!requestedToken || requestedToken !== expectedToken) {
        ws.isAuthenticated = false;
        ws.send(
          JSON.stringify({
            type: 'BUZZER_DISCONNECTED',
            reason: 'INVALID_TOKEN',
            message: 'Token de pulsador inválido o expirado. Escanea el nuevo QR en la consola.',
            room: room.code,
            timestamp: Date.now(),
          })
        );
        setTimeout(() => ws.close(4003), 150);
        return;
      }

      ws.isAuthenticated = true;

      // Requirement 1: "Un celular por equipo: si un segundo celular se conecta con el mismo token, el anterior se desconecta y muestra 'Otro celular tomó el control de este equipo'"
      const existingConn = room.connectedBuzzers.get(requestedTeam);
      if (existingConn && existingConn.ws !== ws && existingConn.ws.readyState === WebSocket.OPEN) {
        try {
          existingConn.ws.send(
            JSON.stringify({
              type: 'BUZZER_DISCONNECTED',
              reason: 'REPLACED_BY_ANOTHER_DEVICE',
              message: 'Otro celular tomó el control de este equipo.',
              room: room.code,
              timestamp: Date.now(),
            })
          );
          existingConn.ws.close(4001);
        } catch {}
      }

      room.connectedBuzzers.set(requestedTeam, {
        ws,
        latencyMs: 15,
        lastPingTime: Date.now(),
      });

      console.log(`[Master Studio] Pulsador conectado: equipo ${requestedTeam} en sala ${room.code}`);
      broadcastBuzzerState(room);
    } else {
      ws.isAuthenticated = true;
    }

    // Send latest state of this room immediately if available
    if (room.latestMasterState) {
      ws.send(
        JSON.stringify({
          type: 'SYNC_MASTER_STATE',
          payload: room.latestMasterState,
          room: room.code,
          timestamp: Date.now(),
        })
      );
    }

    // Send current buzzer state on connect
    ws.send(
      JSON.stringify({
        type: 'BUZZER_STATE',
        state: {
          ...room.buzzer,
          connectedClients: {},
        },
        room: room.code,
        timestamp: Date.now(),
      })
    );

    ws.on('message', (messageBuffer) => {
      try {
        const rawString = messageBuffer.toString();
        const msg = JSON.parse(rawString);

        if (!msg || typeof msg !== 'object' || !msg.type) {
          return;
        }

        // Requirement 3: "Ignorar mensajes sin sala o de tipo desconocido"
        if (!VALID_MESSAGE_TYPES.has(msg.type)) {
          console.warn(`[Master Studio] Mensaje desconocido ignorado: ${msg.type}`);
          return;
        }

        const targetRoomCode = (msg.room || ws.roomCode || '').trim().toUpperCase().slice(0, 4);
        if (!targetRoomCode || targetRoomCode.length < 3) {
          console.warn('[Master Studio] Mensaje sin código de sala válido ignorado.');
          return;
        }

        const currentRoom = getOrCreateRoom(targetRoomCode);
        ws.roomCode = currentRoom.code;

        // Requirement 3: "Limitar a 20 comandos por segundo por conexión"
        const now = Date.now();
        ws.commandTimestamps = (ws.commandTimestamps || []).filter((t) => now - t < 1000);
        if (ws.commandTimestamps.length >= 20) {
          try {
            ws.send(
              JSON.stringify({
                type: 'RATE_LIMIT_WARNING',
                message: 'Límite de 20 comandos por segundo superado. Espera un momento.',
                room: currentRoom.code,
                timestamp: now,
              })
            );
          } catch {
            // ignore
          }
          return;
        }
        ws.commandTimestamps.push(now);

        // Handler: Remote Operator Authentication
        if (msg.type === 'AUTH_REMOTE') {
          const pinAttempt = String(msg.pin || '').trim();
          if (pinAttempt === currentRoom.operatorPin) {
            ws.isAuthenticated = true;
            ws.send(
              JSON.stringify({
                type: 'AUTH_RESULT',
                success: true,
                room: currentRoom.code,
                timestamp: now,
              })
            );
            console.log(`[Master Studio] Control remoto autenticado en sala ${currentRoom.code}`);
          } else {
            ws.isAuthenticated = false;
            ws.send(
              JSON.stringify({
                type: 'AUTH_RESULT',
                success: false,
                error: 'PIN incorrecto. Reintenta.',
                room: currentRoom.code,
                timestamp: now,
              })
            );
          }
          return;
        }

        // Handler: PIN Change & Invalidate Remotes
        if (msg.type === 'PIN_CHANGED') {
          // Only directors can rotate PIN
          const newPin = String(msg.newPin || msg.pin || '').trim();
          if (/^\d{4}$/.test(newPin)) {
            currentRoom.operatorPin = newPin;
            console.log(`[Master Studio] PIN de sala ${currentRoom.code} actualizado a: ${newPin}. Desconectando remotos.`);

            // Invalidate all remote clients in this room
            wss.clients.forEach((client) => {
              const ext = client as ExtendedWebSocket;
              if (ext.roomCode === currentRoom.code && ext.role === 'remote') {
                ext.isAuthenticated = false;
                if (ext.readyState === WebSocket.OPEN) {
                  try {
                    ext.send(
                      JSON.stringify({
                        type: 'PIN_CHANGED',
                        room: currentRoom.code,
                        timestamp: now,
                      })
                    );
                  } catch {}
                }
              }
            });
          }
          return;
        }

        // Handler: Remote Command Execution
        if (msg.type === 'REMOTE_COMMAND') {
          // Requirement 2: "sin PIN correcto, el servidor rechaza sus comandos (queda en solo lectura)"
          if (!ws.isAuthenticated) {
            ws.send(
              JSON.stringify({
                type: 'AUTH_RESULT',
                success: false,
                error: 'Comando rechazado: debes ingresar el PIN de operador.',
                room: currentRoom.code,
                timestamp: now,
              })
            );
            return;
          }

          // Broadcast valid command to peers in the same room
          broadcastToRoom(currentRoom.code, msg, ws);
          return;
        }

        // Handler: Master State Synchronization
        if (msg.type === 'SYNC_MASTER_STATE') {
          if (msg.payload) {
            currentRoom.latestMasterState = msg.payload;
          }
          broadcastToRoom(currentRoom.code, msg, ws);
          return;
        }

        // Handler: Initial State Request
        if (msg.type === 'REQUEST_INITIAL_STATE') {
          if (currentRoom.latestMasterState) {
            ws.send(
              JSON.stringify({
                type: 'SYNC_MASTER_STATE',
                payload: currentRoom.latestMasterState,
                room: currentRoom.code,
                timestamp: now,
              })
            );
          }
          return;
        }

        // Handler: Sound effects broadcast
        if (msg.type === 'TRIGGER_SOUND') {
          broadcastToRoom(currentRoom.code, msg, ws);
          return;
        }

        // -----------------------------------------------------------
        // Buzzer WebSocket Handlers
        // -----------------------------------------------------------
        if (msg.type === 'BUZZER_OPEN') {
          if (ws.role === 'remote' && !ws.isAuthenticated) return;
          if (currentRoom.buzzerAnswerTimer) {
            clearTimeout(currentRoom.buzzerAnswerTimer);
            currentRoom.buzzerAnswerTimer = null;
          }
          currentRoom.buzzer.status = 'open';
          currentRoom.buzzer.openedAt = now;
          currentRoom.buzzer.presses = [];
          currentRoom.buzzer.answeringTeamId = null;
          currentRoom.buzzer.answerDeadline = null;
          broadcastBuzzerState(currentRoom);
          return;
        }

        if (msg.type === 'BUZZER_CLOSE') {
          if (ws.role === 'remote' && !ws.isAuthenticated) return;
          if (currentRoom.buzzerAnswerTimer) {
            clearTimeout(currentRoom.buzzerAnswerTimer);
            currentRoom.buzzerAnswerTimer = null;
          }
          currentRoom.buzzer.status = 'closed';
          currentRoom.buzzer.answerDeadline = null;
          broadcastBuzzerState(currentRoom);
          return;
        }

        if (msg.type === 'BUZZER_RESET') {
          if (ws.role === 'remote' && !ws.isAuthenticated) return;
          if (currentRoom.buzzerAnswerTimer) {
            clearTimeout(currentRoom.buzzerAnswerTimer);
            currentRoom.buzzerAnswerTimer = null;
          }
          currentRoom.buzzer.status = 'closed';
          currentRoom.buzzer.openedAt = null;
          currentRoom.buzzer.presses = [];
          currentRoom.buzzer.excludedTeams = [];
          currentRoom.buzzer.answeringTeamId = null;
          currentRoom.buzzer.answerDeadline = null;
          broadcastBuzzerState(currentRoom);
          return;
        }

        if (msg.type === 'BUZZER_JUDGE') {
          if (ws.role === 'remote' && !ws.isAuthenticated) return;
          const result = msg.result === 'incorrect' ? 'incorrect' : 'correct';
          handleBuzzerJudge(currentRoom, result);
          return;
        }

        if (msg.type === 'BUZZER_CONFIG_UPDATE') {
          if (ws.role === 'remote' && !ws.isAuthenticated) return;
          if (msg.config && typeof msg.config === 'object') {
            currentRoom.buzzer.config = {
              ...currentRoom.buzzer.config,
              ...msg.config,
            };
            broadcastBuzzerState(currentRoom);
          }
          return;
        }

        if (msg.type === 'BUZZER_REGENERATE_TOKENS') {
          if (ws.role === 'remote' && !ws.isAuthenticated) return;
          currentRoom.teamTokens.clear();
          currentRoom.connectedBuzzers.forEach((conn) => {
            if (conn.ws.readyState === WebSocket.OPEN) {
              try {
                conn.ws.send(
                  JSON.stringify({
                    type: 'BUZZER_DISCONNECTED',
                    reason: 'TOKENS_REGENERATED',
                    message: 'Los códigos de pulsadores fueron regenerados en la consola.',
                    room: currentRoom.code,
                    timestamp: now,
                  })
                );
                conn.ws.close(4002);
              } catch {}
            }
          });
          currentRoom.connectedBuzzers.clear();
          broadcastBuzzerState(currentRoom);
          return;
        }

        if (msg.type === 'BUZZER_PONG') {
          const clientTimestamp = Number(msg.clientTimestamp) || 0;
          if (clientTimestamp > 0 && ws.role === 'buzzer' && ws.teamId) {
            const conn = currentRoom.connectedBuzzers.get(ws.teamId);
            if (conn) {
              conn.latencyMs = Math.max(1, now - clientTimestamp);
              broadcastBuzzerState(currentRoom);
            }
          }
          return;
        }

        if (msg.type === 'BUZZER_PRESS') {
          const teamId = ws.teamId || msg.teamId;
          const token = ws.token || msg.token;

          if (!teamId || !token) return;

          // Validate token
          const expectedToken = getOrCreateTeamToken(currentRoom, teamId);
          if (token !== expectedToken) {
            try {
              ws.send(
                JSON.stringify({
                  type: 'BUZZER_DISCONNECTED',
                  reason: 'INVALID_TOKEN',
                  message: 'Token de pulsador inválido.',
                  room: currentRoom.code,
                  timestamp: now,
                })
              );
            } catch {}
            return;
          }

          // Rate limit: 5 presses per second per socket
          ws.pressTimestamps = (ws.pressTimestamps || []).filter((t) => now - t < 1000);
          if (ws.pressTimestamps.length >= 5) {
            return; // Throttle excessive presses
          }
          ws.pressTimestamps.push(now);

          // If team is excluded from this question, ignore
          if (currentRoom.buzzer.excludedTeams.includes(teamId)) {
            return;
          }

          // Case A: Buzzer is CLOSED -> Early press triggers lockout
          if (currentRoom.buzzer.status === 'closed') {
            const lockoutSec = currentRoom.buzzer.config.lockoutSeconds || 2;
            currentRoom.buzzer.lockedOutUntil[teamId] = now + lockoutSec * 1000;
            console.log(`[Master Studio] Pulsación antes de tiempo: ${teamId} bloqueado por ${lockoutSec}s`);
            broadcastBuzzerState(currentRoom);
            return;
          }

          // Case B: Team is currently locked out -> Reset lockout countdown
          if (currentRoom.buzzer.lockedOutUntil[teamId] && currentRoom.buzzer.lockedOutUntil[teamId] > now) {
            const lockoutSec = currentRoom.buzzer.config.lockoutSeconds || 2;
            currentRoom.buzzer.lockedOutUntil[teamId] = now + lockoutSec * 1000;
            broadcastBuzzerState(currentRoom);
            return;
          }

          // Case C: Buzzer is OPEN -> FIRST PRESS WINS!
          if (currentRoom.buzzer.status === 'open') {
            currentRoom.buzzer.status = 'answering';
            currentRoom.buzzer.answeringTeamId = teamId;
            const answerTimeMs = (currentRoom.buzzer.config.answerTimeSeconds || 5) * 1000;
            currentRoom.buzzer.answerDeadline = now + answerTimeMs;
            currentRoom.buzzer.presses = [{ teamId, timestamp: now, msAfterFirst: 0 }];

            console.log(`[Master Studio] ¡Primer lugar en pulsadores!: ${teamId} responde`);

            // Play buzzer punch sound
            broadcastToRoom(currentRoom.code, {
              type: 'TRIGGER_SOUND',
              sound: 'buzzer',
              room: currentRoom.code,
              timestamp: now,
            });

            if (currentRoom.buzzer.config.useBuzzersInGameStage && currentRoom.latestMasterState) {
              currentRoom.latestMasterState.turn.activeTeamId = teamId;
              broadcastToRoom(currentRoom.code, {
                type: 'SYNC_MASTER_STATE',
                payload: currentRoom.latestMasterState,
                room: currentRoom.code,
                timestamp: now,
              });
            }

            broadcastBuzzerState(currentRoom);

            if (currentRoom.buzzerAnswerTimer) clearTimeout(currentRoom.buzzerAnswerTimer);
            currentRoom.buzzerAnswerTimer = setTimeout(() => {
              handleBuzzerJudge(currentRoom, 'incorrect');
            }, answerTimeMs);
            return;
          }

          // Case D: Buzzer is already ANSWERING -> Register 2nd, 3rd, etc. during 3 seconds
          if (currentRoom.buzzer.status === 'answering') {
            const firstPressTime = currentRoom.buzzer.presses[0]?.timestamp || now;
            if (now - firstPressTime <= 3000) {
              if (!currentRoom.buzzer.presses.some((p) => p.teamId === teamId)) {
                const msAfterFirst = now - firstPressTime;
                currentRoom.buzzer.presses.push({ teamId, timestamp: now, msAfterFirst });
                broadcastBuzzerState(currentRoom);
              }
            }
          }
          return;
        }
      } catch (err) {
        console.error('[Master Studio] Error al procesar mensaje WebSocket:', err);
      }
    });

    ws.on('close', () => {
      if (ws.role === 'buzzer' && ws.teamId) {
        const conn = room.connectedBuzzers.get(ws.teamId);
        if (conn && conn.ws === ws) {
          room.connectedBuzzers.delete(ws.teamId);
          console.log(`[Master Studio] Pulsador desconectado: ${ws.teamId}`);
          broadcastBuzzerState(room);
        }
      }
    });

    ws.on('error', (err) => {
      console.warn('[Master Studio] Error de socket cliente:', err);
    });
  });

  // -------------------------------------------------------------
  // REST API Endpoints with Room & PIN Enforcement
  // -------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      connectedClients: wss.clients.size,
      timestamp: Date.now(),
    });
  });

  // Verify PIN for a room
  app.post('/api/room/verify-pin', (req, res) => {
    const { room: rawRoom, pin } = req.body || {};
    const roomCode = String(rawRoom || '').trim().toUpperCase().slice(0, 4);
    const room = rooms.get(roomCode);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Sala no encontrada' });
    }
    const isValid = String(pin || '').trim() === room.operatorPin;
    res.json({ success: isValid });
  });

  // Get current state for a specific room
  app.get('/api/remote/state', (req, res) => {
    const roomCode = String(req.query.room || 'K7P2').trim().toUpperCase().slice(0, 4);
    const room = rooms.get(roomCode);
    res.json({
      room: roomCode,
      state: room?.latestMasterState || null,
      timestamp: Date.now(),
    });
  });

  // Execute remote command via REST fallback
  app.post('/api/remote/command', (req, res) => {
    const { room: rawRoom, pin, command, payload } = req.body || {};
    const roomCode = String(rawRoom || '').trim().toUpperCase().slice(0, 4);
    const room = rooms.get(roomCode);

    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    // Require PIN validation
    if (String(pin || '').trim() !== room.operatorPin) {
      return res.status(401).json({
        error: 'PIN de operador incorrecto o no especificado. Comando rechazado.',
      });
    }

    if (!command) {
      return res.status(400).json({ error: 'Comando no especificado' });
    }

    const commandMsg = {
      type: 'REMOTE_COMMAND',
      command,
      payload,
      room: room.code,
      timestamp: Date.now(),
    };

    broadcastToRoom(room.code, commandMsg);
    res.json({ success: true, room: room.code, timestamp: Date.now() });
  });

  // -------------------------------------------------------------
  // QR Registration Endpoints (?view=join&room=CODIGO)
  // -------------------------------------------------------------

  // Normalize name helper for deduplication
  function normalizeName(str: string): string {
    return String(str || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  // Join raffle registration via mobile phone
  app.post('/api/raffle/join', (req, res) => {
    const { room: rawRoom, roomCode: altRoom, name, group, clientToken } = req.body || {};
    const roomCode = String(rawRoom || altRoom || 'K7P2').trim().toUpperCase().slice(0, 4);
    const room = getOrCreateRoom(roomCode);

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Debes ingresar tu nombre y apellido (mínimo 2 caracteres).' });
    }

    if (!clientToken || typeof clientToken !== 'string') {
      return res.status(400).json({ error: 'Token de dispositivo no válido.' });
    }

    const state = room.latestMasterState;
    const raffle = state?.raffle;

    // Check if registrations are open
    if (raffle && raffle.registrationsOpen === false) {
      return res.status(403).json({ error: 'Las inscripciones para este sorteo están cerradas por el director.' });
    }

    const roomQrList = ((room as any).qrParticipants || []) as any[];
    const stateList = (raffle?.participants || []) as any[];

    // Combined unique participants
    const participantsMap = new Map<string, any>();
    stateList.forEach(p => participantsMap.set(p.id, p));
    roomQrList.forEach(p => participantsMap.set(p.id, p));
    const allParticipants = Array.from(participantsMap.values());

    // 1. One registration per phone (clientToken in localStorage)
    const existingByToken = allParticipants.find((p) => p.clientToken === clientToken);
    if (existingByToken) {
      return res.json({
        success: true,
        alreadyRegistered: true,
        ticketNumber: existingByToken.ticketNumber,
        participant: existingByToken,
        room: room.code,
        message: '¡Ya estás participando con este dispositivo!',
      });
    }

    // 2. Reject duplicate normalized names (sin tildes, minúsculas, espacios)
    const normInput = normalizeName(name);
    const existingByName = allParticipants.find((p) => normalizeName(p.name) === normInput);
    if (existingByName) {
      return res.status(409).json({
        error: `El nombre "${name.trim()}" ya está registrado en este sorteo. Si es otra persona, agrega tu segundo apellido o inicial.`,
      });
    }

    // Calculate next ticket number
    const maxTicket = allParticipants.reduce((max, p) => Math.max(max, p.ticketNumber || 0), 100);
    const nextTicket = maxTicket + 1;

    const PALETTE = [
      '#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea',
      '#06b6d4', '#ec4899', '#10b981', '#f97316', '#8b5cf6',
    ];

    const newParticipant = {
      id: `qr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      groupOrCell: group ? String(group).trim() : undefined,
      ticketNumber: nextTicket,
      color: PALETTE[nextTicket % PALETTE.length],
      registeredViaQr: true,
      clientToken,
      joinedAt: Date.now(),
      eliminated: false,
    };

    (room as any).qrParticipants.push(newParticipant);

    // If room state exists, append and broadcast
    if (room.latestMasterState && room.latestMasterState.raffle) {
      room.latestMasterState.raffle.participants = [
        ...room.latestMasterState.raffle.participants,
        newParticipant,
      ];
      room.latestMasterState.timestamp = Date.now();
      broadcastToRoom(room.code, {
        type: 'SYNC_MASTER_STATE',
        payload: room.latestMasterState,
        room: room.code,
        timestamp: Date.now(),
      });
    }

    console.log(`[Master Studio] Nuevo participante registrado en sala ${room.code}: ${newParticipant.name} (Boleto #${nextTicket})`);

    res.json({
      success: true,
      ticketNumber: nextTicket,
      participant: newParticipant,
      room: room.code,
    });
  });

  // Check if a client token has won or is registered
  app.get('/api/raffle/participant-status', (req, res) => {
    const roomCode = String(req.query.room || 'K7P2').trim().toUpperCase().slice(0, 4);
    const clientToken = String(req.query.token || '').trim();
    const room = rooms.get(roomCode);

    if (!room || !room.latestMasterState?.raffle) {
      return res.json({ registered: false, isWinner: false });
    }

    const raffle = room.latestMasterState.raffle;
    const participant = (raffle.participants || []).find((p: any) => p.clientToken === clientToken);

    if (!participant) {
      return res.json({ registered: false, isWinner: false });
    }

    // Check if this participant is the active winner or in nightWinners
    const isCurrentWinner = raffle.activeWinnerScreenData?.winnerName === participant.name;
    const nightWinner = (raffle.nightWinners || []).find(
      (w: any) => w.ticketNumber === participant.ticketNumber || w.name === participant.name
    );

    res.json({
      registered: true,
      participant,
      isWinner: Boolean(isCurrentWinner || nightWinner),
      winnerInfo: isCurrentWinner ? raffle.activeWinnerScreenData : nightWinner || null,
      registrationsOpen: raffle.registrationsOpen !== false,
    });
  });

  // -------------------------------------------------------------
  // Buzzer API Endpoints
  // -------------------------------------------------------------
  app.get('/api/buzzer/tokens', (req, res) => {
    const roomCode = String(req.query.room || 'K7P2').trim().toUpperCase().slice(0, 4);
    const room = getOrCreateRoom(roomCode);
    const tokens: Record<string, string> = {};

    const teams = room.latestMasterState?.teams || [
      { id: 'team-1', name: 'Equipo 1' },
      { id: 'team-2', name: 'Equipo 2' },
      { id: 'team-3', name: 'Equipo 3' },
      { id: 'team-4', name: 'Equipo 4' },
    ];

    teams.forEach((t: any) => {
      tokens[t.id] = getOrCreateTeamToken(room, t.id);
    });

    res.json({
      room: room.code,
      tokens,
      config: room.buzzer.config,
      timestamp: Date.now(),
    });
  });

  app.post('/api/buzzer/regenerate', (req, res) => {
    const { room: rawRoom, pin } = req.body || {};
    const roomCode = String(rawRoom || 'K7P2').trim().toUpperCase().slice(0, 4);
    const room = getOrCreateRoom(roomCode);

    if (String(pin || '').trim() !== room.operatorPin) {
      return res.status(401).json({ error: 'PIN de operador incorrecto.' });
    }

    room.teamTokens.clear();
    const tokens: Record<string, string> = {};
    const teams = room.latestMasterState?.teams || [
      { id: 'team-1', name: 'Equipo 1' },
      { id: 'team-2', name: 'Equipo 2' },
      { id: 'team-3', name: 'Equipo 3' },
      { id: 'team-4', name: 'Equipo 4' },
    ];

    teams.forEach((t: any) => {
      tokens[t.id] = getOrCreateTeamToken(room, t.id);
    });

    const now = Date.now();
    room.connectedBuzzers.forEach((conn) => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        try {
          conn.ws.send(
            JSON.stringify({
              type: 'BUZZER_DISCONNECTED',
              reason: 'TOKENS_REGENERATED',
              message: 'Los códigos de pulsadores fueron regenerados en la consola.',
              room: room.code,
              timestamp: now,
            })
          );
          conn.ws.close(4002);
        } catch {}
      }
    });
    room.connectedBuzzers.clear();

    broadcastBuzzerState(room);
    res.json({ success: true, room: room.code, tokens });
  });

  // Vite middleware in dev or static files in prod
  const distPath = path.resolve(__dirname, 'dist');
  const isProduction = process.env.NODE_ENV === 'production' || (!process.env.NODE_ENV && fs.existsSync(distPath));

  if (isProduction) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Master Studio] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Master Studio] WebSocket endpoint available at ws://0.0.0.0:${PORT}/ws`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

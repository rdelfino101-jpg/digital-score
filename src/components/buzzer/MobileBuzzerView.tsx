import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lock, Radio, Zap, AlertTriangle, ShieldAlert, Award, Clock } from 'lucide-react';
import { createMasterSyncChannel } from '../../utils/masterStorageSync';
import { BuzzerServerState, MasterSyncMessage, StudioTeam } from '../../types/masterStudio';
import { formatMsDiff } from '../../utils/buzzerRules';

export const MobileBuzzerView: React.FC = () => {
  // Query parameters: ?room=K7P2&team=team-1&token=abc
  const { roomCode, teamId, token } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { roomCode: 'K7P2', teamId: 'team-1', token: '' };
    }
    const params = new URL(window.location.href).searchParams;
    return {
      roomCode: (params.get('room') || 'K7P2').trim().toUpperCase().slice(0, 4),
      teamId: (params.get('team') || 'team-1').trim(),
      token: (params.get('token') || '').trim(),
    };
  }, []);

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [buzzerState, setBuzzerState] = useState<BuzzerServerState | null>(null);
  const [teamInfo, setTeamInfo] = useState<StudioTeam | null>(null);
  const [disconnectedReason, setDisconnectedReason] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isPressing, setIsPressing] = useState(false);

  const prevStatusRef = useRef<string | null>(null);
  const syncChannelRef = useRef<any>(null);

  // Request Screen Wake Lock so mobile display does not turn off
  useEffect(() => {
    let wakeLockSentinel: any = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator && typeof (navigator as any).wakeLock.request === 'function') {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // WakeLock not supported or denied
      }
    };
    requestLock();

    return () => {
      if (wakeLockSentinel && typeof wakeLockSentinel.release === 'function') {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, []);

  // Live timer tick for countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Sync Channel Setup with role="buzzer", teamId and token
  useEffect(() => {
    if (!token) return;

    const sync = createMasterSyncChannel({
      roomCode,
      role: 'buzzer',
      teamId,
      token,
      onConnectionChange: (status) => {
        setConnectionStatus(status);
        if (status === 'connected') {
          setDisconnectedReason(null);
        }
      },
      onMessage: (msg: MasterSyncMessage) => {
        if (msg.type === 'BUZZER_STATE') {
          setBuzzerState(msg.state);
        } else if (msg.type === 'SYNC_MASTER_STATE') {
          if (msg.payload && Array.isArray(msg.payload.teams)) {
            const current = msg.payload.teams.find((t) => t.id === teamId);
            if (current) setTeamInfo(current);
          }
          if (msg.payload && msg.payload.buzzer) {
            setBuzzerState(msg.payload.buzzer);
          }
        } else if (msg.type === 'BUZZER_PING') {
          // Reply with pong for latency measurement
          sync.sendBuzzerPong(msg.clientTimestamp, Date.now());
          const calculated = Math.max(1, Date.now() - msg.clientTimestamp);
          setLatencyMs(calculated);
        } else if (msg.type === 'BUZZER_DISCONNECTED') {
          setDisconnectedReason(msg.message || 'Desconectado del servidor.');
          setConnectionStatus('disconnected');
        }
      },
    });

    syncChannelRef.current = sync;

    return () => {
      sync.close();
    };
  }, [roomCode, teamId, token]);

  // Vibrate phone when buzzer transitions from closed to open
  useEffect(() => {
    const currentStatus = buzzerState?.status;
    if (prevStatusRef.current === 'closed' && currentStatus === 'open') {
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate?.([200]);
        }
      } catch {}
    }
    prevStatusRef.current = currentStatus || null;
  }, [buzzerState?.status]);

  // Handle immediate pointerdown press
  const handleBuzzerPress = () => {
    if (connectionStatus !== 'connected' || !token) return;
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 200);

    // Haptic feedback on tap
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate?.(60);
      }
    } catch {}

    syncChannelRef.current?.sendBuzzerPress(teamId, token);
  };

  // Team visual styling
  const teamColor = teamInfo?.color || '#2563eb';
  const teamName = teamInfo?.name || `Equipo ${teamId.replace('team-', '')}`;
  const teamScore = teamInfo?.score ?? 0;

  // Lockout calculation
  const lockoutUntil = buzzerState?.lockedOutUntil?.[teamId] || 0;
  const isLockedOut = lockoutUntil > now;
  const lockoutRemainingSec = isLockedOut ? ((lockoutUntil - now) / 1000).toFixed(1) : null;

  // Ordering and answering calculations
  const status = buzzerState?.status || 'closed';
  const isExcluded = buzzerState?.excludedTeams?.includes(teamId) || false;
  const presses = buzzerState?.presses || [];
  const myPressIndex = presses.findIndex((p) => p.teamId === teamId);
  const didPress = myPressIndex !== -1;
  const isFirst = didPress && myPressIndex === 0;
  const isAnswering = status === 'answering' && buzzerState?.answeringTeamId === teamId;

  // Answer countdown seconds
  const answerDeadline = buzzerState?.answerDeadline || 0;
  const answerSecRemaining = Math.max(0, (answerDeadline - now) / 1000).toFixed(1);
  const totalAnswerSec = buzzerState?.config?.answerTimeSeconds || 5;
  const answerProgressPct = Math.min(100, Math.max(0, ((answerDeadline - now) / (totalAnswerSec * 1000)) * 100));

  // If another device replaced this phone or tokens were regenerated
  if (disconnectedReason) {
    return (
      <div className="min-h-screen bg-[#070814] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-24 h-24 rounded-full bg-red-950/80 border-2 border-red-500/60 flex items-center justify-center mb-6 shadow-2xl shadow-red-900/50">
          <ShieldAlert className="w-12 h-12 text-red-400" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-red-300 mb-3">Conexión Finalizada</h1>
        <p className="text-lg text-slate-300 max-w-sm font-medium mb-6 leading-relaxed">
          {disconnectedReason}
        </p>
        <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-sm text-slate-400 max-w-xs">
          Para volver a ingresar, escanea el código QR de este equipo que aparece en la Consola del Director.
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col select-none touch-manipulation overflow-hidden"
      style={{
        backgroundColor:
          isAnswering
            ? teamColor
            : status === 'open'
            ? '#0b0f24'
            : '#070814',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Header Bar */}
      <header className="px-4 py-3 bg-black/40 backdrop-blur border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Sala:</span>
          <span className="font-mono text-sm font-black px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-500/30">
            {roomCode}
          </span>
        </div>

        {/* Connection status indicator */}
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Conectado</span>
              {latencyMs > 0 && (
                <span
                  className={`text-[10px] ml-1 font-mono ${
                    latencyMs > 150 ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {latencyMs}ms
                </span>
              )}
            </div>
          ) : connectionStatus === 'connecting' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Reconectando…</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Sin conexión</span>
            </div>
          )}
        </div>
      </header>

      {/* Latency warning if > 150ms */}
      {latencyMs > 150 && connectionStatus === 'connected' && (
        <div className="bg-amber-500/90 text-slate-950 text-xs font-bold px-3 py-1.5 flex items-center justify-center gap-1.5 shadow-md">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Latencia alta ({latencyMs}ms) · Conéctate a la red Wi-Fi del evento para responder más rápido.</span>
        </div>
      )}

      {/* Team Card */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl shadow-lg border-2 border-white/20 flex items-center justify-center text-white font-black text-lg"
            style={{ backgroundColor: teamColor }}
          >
            {teamName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-tight drop-shadow">{teamName}</h2>
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Pulsador Oficial</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-white/60 uppercase font-black tracking-wider">Puntos</div>
          <div className="text-2xl font-black text-amber-300 font-mono drop-shadow">{teamScore}</div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        {/* CASE 1: THIS TEAM IS ANSWERING (1ST PLACE!) */}
        {isAnswering ? (
          <div className="w-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
            <div className="text-8xl font-black text-white mb-2 drop-shadow-2xl tracking-tighter">1º</div>
            <div className="text-3xl font-black text-white uppercase tracking-wider mb-6 drop-shadow">
              ¡Fueron los primeros!
            </div>

            {/* Answer countdown ring */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-8 border-white/20" />
              <div className="text-5xl font-mono font-black text-white drop-shadow">
                {answerSecRemaining}s
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-64 h-3 bg-black/30 rounded-full overflow-hidden border border-white/30 p-0.5">
              <div
                className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${answerProgressPct}%` }}
              />
            </div>

            <p className="mt-6 text-sm text-white/90 font-bold uppercase tracking-wider bg-black/30 px-4 py-2 rounded-full border border-white/20">
              ¡Respondan ahora al micrófono!
            </p>
          </div>
        ) : isExcluded ? (
          /* CASE 2: TEAM WAS EXCLUDED FROM THIS QUESTION */
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-red-950/60 border border-red-500/40 flex items-center justify-center mb-4 text-red-400">
              <Lock className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-red-300 mb-2">Ya respondieron esta pregunta</h3>
            <p className="text-slate-400 text-sm max-w-xs font-medium">
              Esperen a que el director pase a la siguiente pregunta para volver a pulsar.
            </p>
          </div>
        ) : isLockedOut ? (
          /* CASE 3: TEAM LOCKED OUT FOR PRESSING EARLY */
          <div className="w-full flex flex-col items-center justify-center">
            <button
              onPointerDown={handleBuzzerPress}
              className="w-[280px] h-[280px] rounded-full bg-red-600 border-8 border-red-400 text-white flex flex-col items-center justify-center shadow-2xl shadow-red-900/60 active:scale-95 transition-all select-none"
            >
              <ShieldAlert className="w-16 h-16 mb-2 animate-bounce" />
              <span className="text-3xl font-black uppercase tracking-wider">BLOQUEADO</span>
              <span className="text-5xl font-mono font-black mt-1">{lockoutRemainingSec}s</span>
            </button>
            <p className="mt-6 text-sm text-red-400 font-bold max-w-xs">
              Pulsaron antes de tiempo. Si vuelven a pulsar mientras está bloqueado, el tiempo se reinicia.
            </p>
          </div>
        ) : status === 'open' ? (
          /* CASE 4: BUZZER IS OPEN (READY TO PRESS!) */
          <div className="w-full flex flex-col items-center justify-center">
            <button
              onPointerDown={handleBuzzerPress}
              disabled={connectionStatus !== 'connected'}
              className={`w-[290px] h-[290px] rounded-full text-white flex flex-col items-center justify-center shadow-2xl transition-all select-none touch-manipulation cursor-pointer ${
                isPressing ? 'scale-90 brightness-150' : 'scale-100 hover:scale-105 active:scale-95'
              }`}
              style={{
                backgroundColor: teamColor,
                boxShadow: `0 0 60px ${teamColor}88, 0 0 100px ${teamColor}44`,
                border: '10px solid rgba(255, 255, 255, 0.4)',
              }}
            >
              <Zap className="w-16 h-16 mb-1 animate-pulse text-yellow-300" />
              <span className="text-6xl font-black tracking-tight drop-shadow-lg">¡PULSA!</span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-white/80 mt-1">Toca aquí</span>
            </button>
            <p className="mt-6 text-sm text-emerald-300 font-bold uppercase tracking-wider animate-pulse">
              ⚡ ¡PREGUNTA ABIERTA! ¡Sé el más rápido!
            </p>
          </div>
        ) : status === 'answering' && didPress ? (
          /* CASE 5: BUZZER PRESSED BUT WAS 2ND, 3RD, ETC. */
          <div className="w-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-amber-400 mb-4">
              <Clock className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              Llegaron {myPressIndex + 1}º · {formatMsDiff(presses[myPressIndex]?.msAfterFirst || 0)}
            </h3>
            <p className="text-slate-400 text-sm max-w-xs font-medium">
              Si el primer equipo se equivoca, la palabra pasará automáticamente a ustedes.
            </p>
          </div>
        ) : (
          /* CASE 6: BUZZER IS CLOSED (WAITING FOR DIRECTOR) */
          <div className="w-full flex flex-col items-center justify-center">
            <button
              onPointerDown={handleBuzzerPress}
              className={`w-[280px] h-[280px] rounded-full bg-slate-800/90 border-8 border-slate-700/80 text-slate-400 flex flex-col items-center justify-center shadow-xl active:scale-95 transition-all select-none ${
                isPressing ? 'scale-95 bg-red-950/60 border-red-500' : ''
              }`}
            >
              <Lock className="w-16 h-16 mb-2 text-slate-500" />
              <span className="text-4xl font-black tracking-tight text-slate-300">Espera…</span>
              <span className="text-xs uppercase font-bold text-slate-500 mt-2">Pulsador cerrado</span>
            </button>
            <p className="mt-6 text-sm text-slate-400 font-medium max-w-xs leading-relaxed">
              El director abrirá la pregunta. Si pulsas antes de tiempo, tu equipo queda{' '}
              <strong className="text-red-400 font-bold">bloqueado 2 segundos</strong>.
            </p>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="p-3 bg-black/40 text-center text-[11px] text-slate-400 border-t border-white/10 flex items-center justify-between">
        <span>Master Studio · Modo Pulsador</span>
        <span className="font-mono text-slate-400">ID: {teamId}</span>
      </footer>
    </div>
  );
};

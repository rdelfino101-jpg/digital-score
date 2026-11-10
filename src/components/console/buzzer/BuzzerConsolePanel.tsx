import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Zap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Sliders,
  QrCode,
  Radio,
  Clock,
  ShieldAlert,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import QRCode from 'qrcode';
import { BuzzerRuleConfig, BuzzerServerState, StudioTeam } from '../../../types/masterStudio';
import { DEFAULT_BUZZER_CONFIG, formatMsDiff } from '../../../utils/buzzerRules';

interface BuzzerConsolePanelProps {
  roomCode: string;
  pin: string;
  teams: StudioTeam[];
  buzzerState: BuzzerServerState | null;
  onOpen: () => void;
  onClose: () => void;
  onReset: () => void;
  onJudge: (result: 'correct' | 'incorrect') => void;
  onConfigUpdate: (config: Partial<BuzzerRuleConfig>) => void;
  onRegenerateTokens: () => void;
}

export const BuzzerConsolePanel: React.FC<BuzzerConsolePanelProps> = ({
  roomCode,
  pin,
  teams,
  buzzerState,
  onOpen,
  onClose,
  onReset,
  onJudge,
  onConfigUpdate,
  onRegenerateTokens,
}) => {
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [selectedTeamQr, setSelectedTeamQr] = useState<string | null>(null);
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [now, setNow] = useState(Date.now());

  const config = buzzerState?.config || DEFAULT_BUZZER_CONFIG;
  const status = buzzerState?.status || 'closed';
  const answeringTeamId = buzzerState?.answeringTeamId;
  const answerDeadline = buzzerState?.answerDeadline || 0;
  const presses = buzzerState?.presses || [];
  const excludedTeams = buzzerState?.excludedTeams || [];
  const connectedClients = buzzerState?.connectedClients || {};

  // Fetch or refresh team tokens from server
  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch(`/api/buzzer/tokens?room=${encodeURIComponent(roomCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tokens) {
          setTokens(data.tokens);
        }
      }
    } catch (err) {
      console.warn('Error fetching buzzer tokens:', err);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Generate QR code data URLs for each team
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;

    teams.forEach(async (team) => {
      const token = tokens[team.id] || connectedClients[team.id]?.token || '';
      if (!token) return;

      const buzzerUrl = `${origin}/?view=buzzer&room=${encodeURIComponent(
        roomCode
      )}&team=${encodeURIComponent(team.id)}&token=${encodeURIComponent(token)}`;

      try {
        const dataUrl = await QRCode.toDataURL(buzzerUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrDataUrls((prev) => ({ ...prev, [team.id]: dataUrl }));
      } catch (err) {
        console.warn('Failed to generate QR for team:', team.id, err);
      }
    });
  }, [teams, tokens, connectedClients, roomCode]);

  // Live countdown update
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  // Keyboard Shortcuts (A = Abrir, C = Correcto, X = Incorrecto, R = Reiniciar)
  // Ignored while typing in input/textarea/editable
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'a') {
        e.preventDefault();
        onOpen();
      } else if (key === 'c') {
        e.preventDefault();
        onJudge('correct');
      } else if (key === 'x') {
        e.preventDefault();
        onJudge('incorrect');
      } else if (key === 'r') {
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen, onJudge, onReset]);

  // Regenerate all tokens
  const handleRegenerate = async () => {
    if (!confirm('¿Deseas invalidar los códigos actuales de todos los equipos y generar nuevos? Los celulares conectados deberán volver a escanear su QR.')) {
      return;
    }
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/buzzer/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomCode, pin }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tokens) {
          setTokens(data.tokens);
        }
      }
      onRegenerateTokens();
    } catch (err) {
      console.warn('Error regenerating tokens:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyBuzzerLink = (teamId: string) => {
    const token = tokens[teamId] || connectedClients[teamId]?.token || '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/?view=buzzer&room=${encodeURIComponent(roomCode)}&team=${encodeURIComponent(
      teamId
    )}&token=${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(url);
    setCopiedTeamId(teamId);
    setTimeout(() => setCopiedTeamId(null), 2000);
  };

  const answeringTeam = teams.find((t) => t.id === answeringTeamId);
  const secLeft = Math.max(0, (answerDeadline - now) / 1000).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Action Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Sistema de Pulsadores (Buzzer Show)</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300">
                  Sala {roomCode}
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium">
                Un celular por equipo con botón gigante · El servidor determina el orden exacto en milisegundos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Reglas & Configuración</span>
              {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-bold border border-red-800/40 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerar Códigos</span>
            </button>
          </div>
        </div>

        {/* Live Status Stage Banner */}
        <div className="mb-6 p-4 rounded-xl border flex items-center justify-between gap-4 transition-all"
          style={{
            backgroundColor:
              status === 'answering'
                ? `${answeringTeam?.color || '#2563eb'}20`
                : status === 'open'
                ? '#064e3b33'
                : '#1e293b66',
            borderColor:
              status === 'answering'
                ? answeringTeam?.color || '#3b82f6'
                : status === 'open'
                ? '#10b981'
                : '#334155',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                status === 'open'
                  ? 'bg-emerald-400 animate-ping'
                  : status === 'answering'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">Estado Actual:</div>
              <div className="text-lg font-black text-white">
                {status === 'open' ? (
                  <span className="text-emerald-400">⚡ PULSADORES ABIERTOS (Esperando pulsación...)</span>
                ) : status === 'answering' && answeringTeam ? (
                  <span className="text-amber-300">
                    🎤 {answeringTeam.name} tiene la palabra · Restan {secLeft}s
                  </span>
                ) : (
                  <span className="text-slate-400">🔒 Pulsadores Cerrados</span>
                )}
              </div>
            </div>
          </div>

          {status === 'answering' && (
            <div className="px-4 py-1.5 rounded-xl bg-slate-900/90 border border-amber-400/50 text-amber-300 font-mono font-black text-2xl shadow-lg">
              {secLeft}s
            </div>
          )}
        </div>

        {/* Big Action Buttons (with Keyboard Shortcut Badges) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* ABRIR PULSADORES */}
          <button
            onClick={onOpen}
            className={`py-4 px-4 rounded-2xl font-black text-base flex flex-col items-center justify-center gap-1 shadow-lg transition-all active:scale-95 ${
              status === 'open'
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 fill-current" />
              <span>Abrir Pulsadores</span>
            </div>
            <span className="text-[11px] font-mono opacity-80 uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
              Tecla [ A ]
            </span>
          </button>

          {/* CORRECTO */}
          <button
            onClick={() => onJudge('correct')}
            disabled={status !== 'answering'}
            className="py-4 px-4 rounded-2xl font-black text-base flex flex-col items-center justify-center gap-1 shadow-lg transition-all bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white shadow-blue-900/40 active:scale-95"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Correcto (+{config.pointsForCorrect} pts)</span>
            </div>
            <span className="text-[11px] font-mono opacity-80 uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
              Tecla [ C ]
            </span>
          </button>

          {/* INCORRECTO */}
          <button
            onClick={() => onJudge('incorrect')}
            disabled={status !== 'answering'}
            className="py-4 px-4 rounded-2xl font-black text-base flex flex-col items-center justify-center gap-1 shadow-lg transition-all bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white shadow-rose-900/40 active:scale-95"
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>Incorrecto ({config.penaltyForIncorrect} pts)</span>
            </div>
            <span className="text-[11px] font-mono opacity-80 uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
              Tecla [ X ]
            </span>
          </button>

          {/* REINICIAR */}
          <button
            onClick={onReset}
            className="py-4 px-4 rounded-2xl font-black text-base flex flex-col items-center justify-center gap-1 shadow-lg transition-all bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              <span>Reiniciar Pregunta</span>
            </div>
            <span className="text-[11px] font-mono opacity-80 uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
              Tecla [ R ]
            </span>
          </button>
        </div>
      </div>

      {/* Rules & Settings Accordion */}
      {showSettings && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
          <h3 className="text-base font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Configuración de Reglas del Buzzer</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Puntos por Acierto */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Puntos por Acierto
              </label>
              <select
                value={config.pointsForCorrect}
                onChange={(e) => onConfigUpdate({ pointsForCorrect: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-400 focus:outline-none"
              >
                <option value={50}>50 puntos</option>
                <option value={100}>100 puntos (Estándar)</option>
                <option value={200}>200 puntos</option>
                <option value={300}>300 puntos</option>
                <option value={500}>500 puntos</option>
              </select>
            </div>

            {/* Penalización por Fallo */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Penalización por Fallo
              </label>
              <select
                value={config.penaltyForIncorrect}
                onChange={(e) => onConfigUpdate({ penaltyForIncorrect: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-400 focus:outline-none"
              >
                <option value={0}>0 pts (Sin penalización)</option>
                <option value={-25}>-25 puntos</option>
                <option value={-50}>-50 puntos</option>
                <option value={-100}>-100 puntos</option>
              </select>
            </div>

            {/* Tiempo para Responder */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tiempo para Responder
              </label>
              <select
                value={config.answerTimeSeconds}
                onChange={(e) => onConfigUpdate({ answerTimeSeconds: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-400 focus:outline-none"
              >
                <option value={3}>3 segundos (Rápido)</option>
                <option value={5}>5 segundos (Estándar)</option>
                <option value={8}>8 segundos</option>
                <option value={10}>10 segundos</option>
              </select>
            </div>

            {/* Bloqueo por Pulsar Antes de Tiempo */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Bloqueo si Pulsa Antes de Tiempo
              </label>
              <select
                value={config.lockoutSeconds}
                onChange={(e) => onConfigUpdate({ lockoutSeconds: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-amber-400 focus:outline-none"
              >
                <option value={1}>1 segundo</option>
                <option value={2}>2 segundos (Estándar)</option>
                <option value={3}>3 segundos</option>
                <option value={5}>5 segundos</option>
              </select>
            </div>

            {/* Pasar la Palabra al Siguiente */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.passToNext}
                  onChange={(e) => onConfigUpdate({ passToNext: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                />
                <span className="text-xs font-bold text-slate-200">
                  Pasar palabra al 2º/3º si falla (Recomendado)
                </span>
              </label>
            </div>

            {/* Usar Pulsadores en Escenario de Juegos */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.useBuzzersInGameStage}
                  onChange={(e) => onConfigUpdate({ useBuzzersInGameStage: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                />
                <span className="text-xs font-bold text-slate-200">
                  Integrar con Escenario de Juegos (cambia el turno activo)
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Connected Teams Grid with QRs and Latencies */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-400" />
              <span>Conexión de Equipos ({teams.length} Equipos)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Cada equipo escanea su QR personal para tomar el control de su botón. Si otro celular escanea el mismo QR, reemplaza al anterior.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map((team) => {
            const client = connectedClients[team.id];
            const isConnected = !!client?.connected;
            const latency = client?.latencyMs || 0;
            const isExcl = excludedTeams.includes(team.id);
            const isAnsw = answeringTeamId === team.id;
            const qrUrl = qrDataUrls[team.id];

            return (
              <div
                key={team.id}
                className="rounded-2xl p-4 border bg-slate-800/60 transition-all flex flex-col justify-between"
                style={{
                  borderColor: isAnsw ? team.color : isConnected ? `${team.color}66` : '#334155',
                  boxShadow: isAnsw ? `0 0 25px ${team.color}44` : 'none',
                }}
              >
                <div>
                  {/* Team Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs shadow"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.name.charAt(0)}
                      </div>
                      <span className="font-black text-sm text-white truncate max-w-[120px]">
                        {team.name}
                      </span>
                    </div>

                    {/* Connection indicator */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                        }`}
                      />
                      <span className="text-[11px] font-bold text-slate-400">
                        {isConnected ? 'En Vivo' : 'Desconectado'}
                      </span>
                    </div>
                  </div>

                  {/* Latency badge */}
                  {isConnected && (
                    <div className="mb-3 flex items-center justify-between text-xs font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700/80">
                      <span className="text-slate-400 text-[10px]">Latencia:</span>
                      <span
                        className={`font-bold ${
                          latency > 150 ? 'text-amber-400 font-extrabold animate-pulse' : 'text-emerald-400'
                        }`}
                      >
                        {latency} ms
                      </span>
                    </div>
                  )}

                  {latency > 150 && isConnected && (
                    <div className="mb-3 px-2 py-1 rounded bg-amber-950/40 border border-amber-600/50 text-amber-300 text-[10px] font-bold">
                      ⚠️ Conectar a Wi-Fi local
                    </div>
                  )}

                  {/* QR Preview Thumbnail */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl mb-3 shadow-inner">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`QR ${team.name}`}
                        className="w-32 h-32 object-contain cursor-pointer hover:scale-105 transition"
                        onClick={() => setSelectedTeamQr(team.id)}
                        title="Click para ampliar QR"
                      />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center text-slate-400 text-xs">
                        Generando QR…
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Footer Actions */}
                <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setSelectedTeamQr(team.id)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Ampliar QR</span>
                    </button>

                    <button
                      onClick={() => copyBuzzerLink(team.id)}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition"
                      title="Copiar enlace directo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {copiedTeamId === team.id && (
                    <div className="text-[10px] text-center text-emerald-400 font-bold">
                      ¡Enlace copiado al portapapeles!
                    </div>
                  )}

                  {isExcl && (
                    <div className="text-[10px] text-center text-rose-400 font-bold uppercase tracking-wider bg-rose-950/30 py-0.5 rounded">
                      Excluido de esta pregunta
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal to view enlarged QR Code */}
      {selectedTeamQr && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
            {(() => {
              const team = teams.find((t) => t.id === selectedTeamQr);
              const qrUrl = qrDataUrls[selectedTeamQr];
              if (!team) return null;

              return (
                <>
                  <div
                    className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-black text-xl shadow"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-1">{team.name}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-6">
                    Escanea este código con la cámara del celular para conectar el pulsador de este equipo.
                  </p>

                  <div className="p-4 bg-white rounded-2xl shadow-xl inline-block mb-6">
                    {qrUrl && <img src={qrUrl} alt={team.name} className="w-64 h-64" />}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyBuzzerLink(team.id)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copiar Link</span>
                    </button>
                    <button
                      onClick={() => setSelectedTeamQr(null)}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

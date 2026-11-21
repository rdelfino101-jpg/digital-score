import React, { useEffect, useState } from 'react';
import {
  MasterLiveState,
  MasterViewMode,
  ActiveGameId,
  RemoteCommandType,
  RaffleMode,
} from '../../types/masterStudio';
import {
  Users,
  Gamepad2,
  Zap,
  Monitor,
  Gift,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Vibrate,
  LogOut,
  Lock,
  KeyRound,
  X,
  Tv,
  Trophy,
  Award,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Check,
  Eye,
  Radio,
} from 'lucide-react';
import { formatTimeDisplay } from '../../utils/gameEngineRules';
import { mensajeErrorRemoto, nombreEscena } from '../../utils/textosInterfaz';

interface MobileTactileRemoteViewProps {
  masterState: MasterLiveState | null;
  onSendCommand: (command: RemoteCommandType, payload?: any) => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  onExitRemote?: () => void;
  roomCode?: string;
  isAuthenticated?: boolean;
  authError?: string | null;
  onAuthenticate?: (pin: string) => void;
}

type Pestana = 'equipos' | 'juego' | 'pulsadores' | 'pantalla' | 'sorteo' | 'sonidos';

const PESTANAS: Array<{ id: Pestana; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'equipos', label: 'Equipos', icon: Users },
  { id: 'juego', label: 'Juego', icon: Gamepad2 },
  { id: 'pulsadores', label: 'Pulsador', icon: Zap },
  { id: 'pantalla', label: 'Pantalla', icon: Monitor },
  { id: 'sorteo', label: 'Sorteo', icon: Gift },
  { id: 'sonidos', label: 'Sonidos', icon: Volume2 },
];

const JUEGOS: Array<{ id: ActiveGameId; label: string }> = [
  { id: 'bible_book', label: '¿En qué libro?' },
  { id: 'who_said_it', label: '¿Quién lo dijo?' },
  { id: 'hangman', label: 'Ahorcado' },
  { id: 'charades', label: 'Charadas' },
  { id: 'family_feud', label: '100 Dijeron' },
  { id: 'trivia_show', label: 'Trivia' },
  { id: 'anagram_wheel', label: 'Anagrama' },
  { id: 'music_karaoke', label: 'Música' },
  { id: 'millionaire_show', label: 'Millonario' },
  { id: 'deal_or_nodeal', label: 'Trato Hecho' },
];

const ESCENAS: Array<{ mode: MasterViewMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { mode: 'SCOREBOARD_ONLY', label: 'Marcador', icon: Tv },
  { mode: 'GAME_STAGE', label: 'Juego', icon: Gamepad2 },
  { mode: 'RAFFLE_STAGE', label: 'Sorteo', icon: Gift },
  { mode: 'LEADERBOARD_FULL', label: 'Posiciones', icon: Trophy },
  { mode: 'PODIUM_CELEBRATION', label: 'Podio', icon: Award },
  { mode: 'BLACKOUT', label: 'Pausa', icon: EyeOff },
];

const MODOS_SORTEO: Array<{ id: RaffleMode; label: string }> = [
  { id: 'wheel', label: 'Ruleta' },
  { id: 'slot_machine', label: 'Retos' },
  { id: 'tombola_numbers', label: 'Tómbola' },
  { id: 'team_matcher', label: 'Emparejador' },
];

const SONIDOS: Array<{ id: string; label: string; icon: string }> = [
  { id: 'correct', label: 'Acierto', icon: '🔔' },
  { id: 'error', label: 'Error', icon: '❌' },
  { id: 'turn', label: 'Cambio de turno', icon: '🔄' },
  { id: 'timesUp', label: 'Fin del tiempo', icon: '🎺' },
  { id: 'fanfare', label: 'Fanfarria', icon: '🎉' },
  { id: 'drumroll', label: 'Redoble', icon: '🥁' },
  { id: 'splash', label: 'Al agua', icon: '💦' },
  { id: 'wheel', label: 'Ruleta', icon: '🎡' },
];

const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

/**
 * Reloj que avanza en el celular entre una sincronización y otra.
 * La consola manda el tiempo una vez por segundo; sin esto el número se veía a saltos
 * o atrasado. Cuando llega un valor nuevo de la consola, se corrige.
 */
function useRelojEnVivo(segundos: number, corriendo: boolean, sentido: 'baja' | 'sube'): number {
  const [base, setBase] = useState({ valor: segundos, desde: Date.now() });
  const [, setTic] = useState(0);
  useEffect(() => {
    setBase({ valor: segundos, desde: Date.now() });
  }, [segundos, corriendo]);
  useEffect(() => {
    if (!corriendo) return;
    const id = setInterval(() => setTic((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [corriendo]);
  if (!corriendo) return segundos;
  // Como mucho 1 s de adelanto: si la consola deja de mandar, el reloj no se inventa el tiempo
  const pasado = Math.min(1, Math.floor((Date.now() - base.desde) / 1000));
  return sentido === 'baja' ? Math.max(0, base.valor - pasado) : base.valor + pasado;
}
const sinAcento = (c: string) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

/**
 * Control remoto para el celular del director.
 * Tiene todo lo que se usa en vivo: equipos y puntos, el juego activo con su ficha
 * secreta, pulsadores, pantalla (escenas, reloj, ronda, cintillo), sorteo y sonidos.
 */
export const MobileTactileRemoteView: React.FC<MobileTactileRemoteViewProps> = ({
  masterState,
  onSendCommand,
  connectionStatus,
  onExitRemote,
  roomCode = 'K7P2',
  isAuthenticated = false,
  authError,
  onAuthenticate,
}) => {
  const [vibracion, setVibracion] = useState(true);
  const [pestana, setPestana] = useState<Pestana>('equipos');
  const [verPin, setVerPin] = useState<boolean>(!isAuthenticated);
  const [pin, setPin] = useState('');
  const [errorPin, setErrorPin] = useState<string | null>(() => mensajeErrorRemoto(authError));
  const [borradorCintillo, setBorradorCintillo] = useState<string | null>(null);
  const [confirmarReinicioSorteo, setConfirmarReinicioSorteo] = useState(false);
  const [cantidadLibre, setCantidadLibre] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      setVerPin(false);
      setErrorPin(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authError) setErrorPin(mensajeErrorRemoto(authError));
  }, [authError]);

  const bloqueado = connectionStatus !== 'connected' || !isAuthenticated;
  const relojPrincipal = useRelojEnVivo(
    masterState ? (masterState.timer.mode === 'countdown' ? masterState.timer.secondsRemaining : masterState.timer.stopwatchSeconds) : 0,
    Boolean(masterState?.timer.isRunning && masterState.timer.mode !== 'off'),
    masterState?.timer.mode === 'stopwatch' ? 'sube' : 'baja'
  );

  const vibrar = (ms = 35) => {
    if (vibracion && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // sin vibración
      }
    }
  };

  const enviar = (cmd: RemoteCommandType, payload?: any, ms = 40) => {
    if (bloqueado) {
      if (!isAuthenticated) setVerPin(true);
      return;
    }
    vibrar(ms);
    onSendCommand(cmd, payload);
  };

  const enviarPin = (e?: React.FormEvent) => {
    e?.preventDefault();
    const limpio = pin.trim();
    if (!/^\d{4}$/.test(limpio)) {
      setErrorPin('El PIN tiene 4 números.');
      return;
    }
    setErrorPin(null);
    onAuthenticate?.(limpio);
  };

  if (!masterState) {
    return (
      <div className="consola flex min-h-screen flex-col items-center justify-center p-6 text-center select-none">
        <Radio className="mb-4 h-10 w-10 text-[var(--c-text-3)]" />
        <h1 className="text-[18px] font-bold">Conectando el control remoto…</h1>
        <p className="mt-2 text-[14px] text-[var(--c-text-3)]">
          Sala <strong className="font-mono text-[var(--c-text)]">{roomCode}</strong> ·{' '}
          {connectionStatus === 'connected' ? 'Conectado' : 'Sin conexión, reintentando'}
        </p>
      </div>
    );
  }

  const s = masterState;
  const enTurno = s.teams.find((t) => t.id === s.turn.activeTeamId) || s.teams[0];
  const b = s.buzzer;
  const nombreEquipo = (id?: string | null) => s.teams.find((t) => t.id === id)?.name || 'Equipo';
  const conectados = Object.values(b?.connectedClients || {}).filter((c) => c.connected).length;

  return (
    <div className="consola flex min-h-screen select-none flex-col pb-[76px] touch-manipulation">
      {/* Encabezado */}
      <header className="sticky top-0 z-40 border-b border-[var(--c-line)] bg-[var(--c-panel)]/95 px-3 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                connectionStatus !== 'connected' ? 'bg-red-500' : isAuthenticated ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold leading-tight">
                Sala <span className="font-mono tracking-[0.08em]">{roomCode}</span>
              </p>
              <p className="truncate text-[12px] leading-tight text-[var(--c-text-3)]">
                {connectionStatus !== 'connected'
                  ? 'Sin conexión, reintentando…'
                  : !isAuthenticated
                  ? 'Solo lectura: falta el PIN'
                  : `En pantalla: ${nombreEscena(s.viewMode)}`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!isAuthenticated && (
              <button
                onClick={() => setVerPin(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-[13px] font-bold text-slate-950"
              >
                <Lock className="h-4 w-4" />
                PIN
              </button>
            )}
            <BotonIcono etiqueta="Deshacer" onClick={() => enviar('UNDO_LAST_ACTION', null, 50)} disabled={bloqueado}>
              <Undo2 className="h-5 w-5" />
            </BotonIcono>
            <BotonIcono
              etiqueta={vibracion ? 'Vibración activada' : 'Vibración apagada'}
              onClick={() => setVibracion((v) => !v)}
              activo={vibracion}
            >
              <Vibrate className="h-5 w-5" />
            </BotonIcono>
            {onExitRemote && (
              <BotonIcono etiqueta="Salir del control remoto" onClick={onExitRemote}>
                <LogOut className="h-5 w-5" />
              </BotonIcono>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-4 p-3">
        {/* ---------------- EQUIPOS ---------------- */}
        {pestana === 'equipos' && (
          <>
            {enTurno && (
              <section className="relative overflow-hidden rounded-2xl border border-amber-500/50 bg-amber-500/10 p-3.5">
                <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: enTurno.color }} aria-hidden />
                <div className="flex items-center justify-between gap-3 pl-1">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-amber-300">En turno</p>
                    <p className="line-clamp-2 text-[19px] font-bold leading-tight">{enTurno.name}</p>
                  </div>
                  <p className="font-mono text-[34px] font-black leading-none">{enTurno.score}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Boton tipo="neutro" grande onClick={() => enviar('PREV_TURN')} disabled={bloqueado}>
                    <ChevronLeft className="h-5 w-5" /> Anterior
                  </Boton>
                  <Boton tipo="accion" grande onClick={() => enviar('NEXT_TURN')} disabled={bloqueado}>
                    Siguiente <ChevronRight className="h-5 w-5" />
                  </Boton>
                </div>
                <div className="mt-3 space-y-1">
                  <Interruptor activo={s.turn.stealMode} etiqueta="Robo de puntos" onClick={() => enviar('TOGGLE_STEAL')} disabled={bloqueado} />
                  <Interruptor
                    activo={s.turn.autoAdvanceOnScore}
                    etiqueta="Pasar turno al sumar puntos"
                    onClick={() => enviar('TOGGLE_AUTO_ADVANCE')}
                    disabled={bloqueado}
                  />
                </div>
              </section>
            )}

            <section className="space-y-2">
              <Titulo>Puntos por equipo</Titulo>
              {s.teams.map((t) => {
                const tieneTurno = t.id === s.turn.activeTeamId;
                return (
                  <div
                    key={t.id}
                    className={`relative overflow-hidden rounded-2xl border bg-[var(--c-panel)] p-3 ${
                      tieneTurno ? 'border-amber-500/50' : 'border-[var(--c-line)]'
                    }`}
                  >
                    <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: t.color }} aria-hidden />
                    <div className="mb-2.5 flex items-center justify-between gap-2 pl-1">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[16px] font-bold leading-tight">{t.name}</p>
                        <button
                          onClick={() => enviar('SELECT_TURN', { teamId: t.id })}
                          disabled={bloqueado || tieneTurno}
                          className={`mt-0.5 text-[13px] font-semibold ${tieneTurno ? 'text-amber-300' : 'text-[var(--c-accent)]'}`}
                        >
                          {tieneTurno ? 'En turno' : 'Dar turno'}
                        </button>
                      </div>
                      <p className="font-mono text-[28px] font-black leading-none">{t.score}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pl-1">
                      {[-5, -1, 1, 5, 10, 20, 50, 100].map((d) => (
                        <button
                          key={d}
                          onClick={() => enviar('QUICK_ADJUST', { teamId: t.id, delta: d }, d > 0 ? 30 : 20)}
                          disabled={bloqueado}
                          className={`h-11 rounded-xl font-mono text-[16px] font-bold transition-transform active:scale-95 disabled:opacity-40 ${
                            d < 0 ? 'bg-[var(--c-panel-2)] text-[var(--c-text-3)]' : 'bg-[var(--c-panel-2)] text-[var(--c-text)] active:bg-[var(--c-accent)]'
                          }`}
                          aria-label={`${d > 0 ? 'Sumar' : 'Restar'} ${Math.abs(d)} a ${t.name}`}
                        >
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                    {/* Otra cantidad: para correcciones grandes (p. ej. −300) */}
                    <div className="mt-1.5 grid grid-cols-[1fr_auto_auto] gap-1.5 pl-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={cantidadLibre[t.id] ?? ''}
                        onChange={(e) => setCantidadLibre((c) => ({ ...c, [t.id]: e.target.value.replace(/[^0-9]/g, '').slice(0, 5) }))}
                        placeholder="Otra cantidad"
                        aria-label={`Otra cantidad para ${t.name}`}
                        className="h-11 min-w-0 rounded-xl border border-[var(--c-line)] bg-[var(--c-bg)] px-3 font-mono text-[16px] focus:border-[var(--c-accent)] focus:outline-none"
                      />
                      {[-1, 1].map((signo) => {
                        const n = parseInt(cantidadLibre[t.id] || '', 10);
                        return (
                          <button
                            key={signo}
                            onClick={() => {
                              if (!n) return;
                              enviar('QUICK_ADJUST', { teamId: t.id, delta: signo * n }, 40);
                              setCantidadLibre((c) => ({ ...c, [t.id]: '' }));
                            }}
                            disabled={bloqueado || !n}
                            className={`h-11 rounded-xl px-3.5 text-[14px] font-bold disabled:opacity-40 ${
                              signo > 0 ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-panel-2)] text-[var(--c-text)]'
                            }`}
                          >
                            {signo > 0 ? 'Sumar' : 'Restar'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {/* ---------------- JUEGO ---------------- */}
        {pestana === 'juego' && (
          <PanelJuego s={s} enviar={enviar} bloqueado={bloqueado} nombreEquipo={nombreEquipo} />
        )}

        {/* ---------------- PULSADORES ---------------- */}
        {pestana === 'pulsadores' && (
          <>
            <section
              className={`rounded-2xl border p-4 ${
                b?.status === 'answering'
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : b?.status === 'open'
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-[var(--c-line)] bg-[var(--c-panel)]'
              }`}
            >
              <p className="text-[12px] font-semibold text-[var(--c-text-3)]">Pulsadores</p>
              <p className="mt-0.5 text-[22px] font-bold leading-tight">
                {b?.status === 'answering'
                  ? `Responde ${nombreEquipo(b.answeringTeamId)}`
                  : b?.status === 'open'
                  ? 'Abiertos'
                  : 'Cerrados'}
              </p>
              <p className="mt-1 text-[13px] text-[var(--c-text-3)]">
                {conectados} {conectados === 1 ? 'celular conectado' : 'celulares conectados'}
                {b?.excludedTeams?.length ? ` · ${b.excludedTeams.length} fuera en esta pregunta` : ''}
              </p>
              {b?.status === 'answering' && b.presses.length > 1 && (
                <p className="mt-2 text-[13px] text-amber-200">
                  Orden: {b.presses.map((p, i) => `${i + 1}.º ${nombreEquipo(p.teamId)}`).join(' → ')}
                </p>
              )}
            </section>

            <Interruptor
              activo={Boolean(b?.config?.useBuzzersInGameStage)}
              etiqueta="Usar pulsadores en los juegos"
              ayuda="El equipo que pulsa primero toma el turno del juego"
              onClick={() => enviar('BUZZER_TOGGLE_GAME', { active: !b?.config?.useBuzzersInGameStage })}
              disabled={bloqueado}
              tarjeta
            />

            <Boton tipo="verde" enorme onClick={() => enviar('BUZZER_OPEN', null, 60)} disabled={bloqueado}>
              <Zap className="h-6 w-6" /> Abrir pulsadores
            </Boton>

            <div className="grid grid-cols-2 gap-2">
              <Boton
                tipo="verde"
                grande
                onClick={() => enviar('BUZZER_JUDGE', { result: 'correct' }, 60)}
                disabled={bloqueado || b?.status !== 'answering'}
              >
                <Check className="h-5 w-5" /> Correcto
              </Boton>
              <Boton
                tipo="rojo"
                grande
                onClick={() => enviar('BUZZER_JUDGE', { result: 'incorrect' }, 60)}
                disabled={bloqueado || b?.status !== 'answering'}
              >
                <X className="h-5 w-5" /> Incorrecto
              </Boton>
              <Boton tipo="neutro" onClick={() => enviar('BUZZER_CLOSE')} disabled={bloqueado}>
                Cerrar
              </Boton>
              <Boton tipo="neutro" onClick={() => enviar('BUZZER_RESET')} disabled={bloqueado}>
                <RotateCcw className="h-4 w-4" /> Reiniciar
              </Boton>
            </div>
            {b?.config?.useBuzzersInGameStage && (
              <p className="text-[13px] text-[var(--c-text-3)]">
                En los juegos también puedes calificar con «Correcto» y «Fallo» de la pestaña Juego.
              </p>
            )}

            <section className="space-y-1.5">
              <Titulo>Celulares de los equipos</Titulo>
              {s.teams.map((t) => {
                const c = b?.connectedClients?.[t.id];
                return (
                  <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--c-panel)] px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="truncate text-[14px] font-semibold">{t.name}</span>
                    </span>
                    <span className={`shrink-0 text-[13px] ${c?.connected ? 'text-emerald-400' : 'text-[var(--c-text-3)]'}`}>
                      {c?.connected ? `Conectado · ${c.latencyMs} ms` : 'Desconectado'}
                    </span>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {/* ---------------- PANTALLA ---------------- */}
        {pestana === 'pantalla' && (
          <>
            <section>
              <Titulo>Escena al aire</Titulo>
              <div className="grid grid-cols-3 gap-2">
                {ESCENAS.map((e) => {
                  const Icon = e.icon;
                  const alAire = s.viewMode === e.mode;
                  return (
                    <button
                      key={e.mode}
                      onClick={() => enviar('SET_VIEW_MODE', { viewMode: e.mode }, 50)}
                      disabled={bloqueado}
                      className={`flex h-[74px] flex-col items-center justify-center gap-1.5 rounded-xl border text-[13px] font-semibold transition-colors disabled:opacity-40 ${
                        alAire ? 'border-red-500/70 bg-red-500/15 text-[var(--c-text)]' : 'border-[var(--c-line)] bg-[var(--c-panel)]'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${alAire ? 'text-red-400' : 'text-[var(--c-text-3)]'}`} />
                      {e.label}
                      {alAire && <span className="sr-only">(al aire)</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--c-line)] bg-[var(--c-panel)] p-3.5">
              <Titulo>Cronómetro</Titulo>
              <div className="mb-3 flex rounded-lg border border-[var(--c-line)] bg-[var(--c-bg)] p-0.5">
                {[
                  { id: 'countdown', label: 'Regresivo' },
                  { id: 'stopwatch', label: 'Ascendente' },
                  { id: 'off', label: 'Apagado' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => enviar('SET_TIMER_MODE', { mode: m.id })}
                    disabled={bloqueado}
                    className={`h-9 flex-1 rounded-md text-[13px] ${
                      s.timer.mode === m.id ? 'bg-[var(--c-panel-2)] font-bold' : 'font-semibold text-[var(--c-text-3)]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className={`text-center font-mono text-[52px] font-black leading-none ${s.timer.mode === 'off' ? 'opacity-40' : ''}`}>
                {formatTimeDisplay(relojPrincipal)}
              </p>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <Boton
                  tipo={s.timer.isRunning ? 'ambar' : 'verde'}
                  grande
                  onClick={() => enviar('TOGGLE_TIMER', null, 50)}
                  disabled={bloqueado || s.timer.mode === 'off'}
                >
                  {s.timer.isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {s.timer.isRunning ? 'Pausar' : 'Iniciar'}
                </Boton>
                <Boton tipo="neutro" grande onClick={() => enviar('RESET_TIMER')} disabled={bloqueado} etiqueta="Reiniciar cronómetro">
                  <RotateCcw className="h-5 w-5" />
                </Boton>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[-60, -30, 30, 60].map((d) => (
                  <Boton key={d} tipo="neutro" onClick={() => enviar('ADJUST_TIMER', { seconds: d }, 20)} disabled={bloqueado}>
                    {d > 0 ? '+' : '−'}
                    {Math.abs(d) === 60 ? '1 min' : '30 s'}
                  </Boton>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--c-line)] bg-[var(--c-panel)] p-3.5">
              <div className="flex items-end justify-between">
                <Titulo>{s.scoreboard.periodTypeLabel || 'Ronda'}</Titulo>
                <p className="font-mono text-[34px] font-black leading-none">
                  {s.scoreboard.currentRound}
                  {s.scoreboard.totalRounds > 0 && (
                    <span className="text-[16px] font-semibold text-[var(--c-text-3)]"> de {s.scoreboard.totalRounds}</span>
                  )}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Boton tipo="neutro" grande onClick={() => enviar('PREV_ROUND')} disabled={bloqueado}>
                  <ChevronLeft className="h-5 w-5" /> Anterior
                </Boton>
                <Boton tipo="accion" grande onClick={() => enviar('NEXT_ROUND')} disabled={bloqueado}>
                  Siguiente <ChevronRight className="h-5 w-5" />
                </Boton>
              </div>
              <div className="mt-3 flex rounded-lg border border-[var(--c-line)] bg-[var(--c-bg)] p-0.5">
                {[
                  { id: 'one_on_one', label: 'Duelo 1 vs 1' },
                  { id: 'multiplayer', label: 'Tabla (3+)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => enviar('SET_SCOREBOARD_MODE', { mode: m.id })}
                    disabled={bloqueado}
                    className={`h-9 flex-1 rounded-md text-[13px] ${
                      s.scoreboard.mode === m.id ? 'bg-[var(--c-panel-2)] font-bold' : 'font-semibold text-[var(--c-text-3)]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--c-line)] bg-[var(--c-panel)] p-3.5">
              <Interruptor
                activo={s.scene.tickerActive}
                etiqueta="Cintillo inferior"
                onClick={() => enviar('SET_TICKER', { active: !s.scene.tickerActive })}
                disabled={bloqueado}
              />
              <textarea
                value={borradorCintillo ?? s.scene.tickerMessage}
                onChange={(e) => setBorradorCintillo(e.target.value)}
                rows={3}
                maxLength={280}
                className="mt-2 w-full resize-none rounded-xl border border-[var(--c-line)] bg-[var(--c-bg)] p-3 text-[15px] focus:border-[var(--c-accent)] focus:outline-none"
                placeholder="Aviso para la parte de abajo del proyector…"
              />
              <Boton
                tipo="accion"
                onClick={() => {
                  enviar('SET_TICKER', { message: borradorCintillo ?? s.scene.tickerMessage, active: true });
                  setBorradorCintillo(null);
                }}
                disabled={bloqueado || borradorCintillo === null}
              >
                Mostrar este mensaje
              </Boton>
            </section>

            <Boton tipo="ambar" grande onClick={() => enviar('TRIGGER_CELEBRATION', null, 80)} disabled={bloqueado}>
              <Sparkles className="h-5 w-5" /> Celebración con confeti
            </Boton>
          </>
        )}

        {/* ---------------- SORTEO ---------------- */}
        {pestana === 'sorteo' && (
          <>
            {s.viewMode !== 'RAFFLE_STAGE' && (
              <Boton tipo="neutro" onClick={() => enviar('SET_VIEW_MODE', { viewMode: 'RAFFLE_STAGE' })} disabled={bloqueado}>
                <Tv className="h-4 w-4" /> Poner el sorteo en pantalla
              </Boton>
            )}
            <section className="rounded-2xl border border-[var(--c-line)] bg-[var(--c-panel)] p-3.5">
              <p className="text-[12px] font-semibold text-[var(--c-text-3)]">Premio</p>
              <p className="text-[18px] font-bold">{s.raffle.prizeTitle || 'Sorteo'}</p>
              <p className="mt-1 text-[13px] text-[var(--c-text-3)]">
                {s.raffle.participants.filter((p) => !p.eliminated).length} de {s.raffle.participants.length} participantes activos ·{' '}
                {s.raffle.drawRule === 'elimination' ? `eliminación, gana el tiro ${s.raffle.eliminationTargetRound}` : 'gana el que sale'}
              </p>
            </section>
            <div className="grid grid-cols-4 gap-1.5">
              {MODOS_SORTEO.map((m) => (
                <button
                  key={m.id}
                  onClick={() => enviar('SET_RAFFLE_MODE', { mode: m.id })}
                  disabled={bloqueado}
                  className={`h-11 rounded-xl border text-[13px] font-semibold disabled:opacity-40 ${
                    s.raffle.mode === m.id ? 'border-[var(--c-accent)] bg-[var(--c-accent-soft)]' : 'border-[var(--c-line)] bg-[var(--c-panel)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <Boton
              tipo="ambar"
              enorme
              onClick={() => enviar('SPIN_RAFFLE', null, 80)}
              disabled={bloqueado || Boolean(s.raffle.activeSpin?.isSpinning) || s.raffle.mode === 'team_matcher'}
            >
              <Play className="h-6 w-6" /> {s.raffle.activeSpin?.isSpinning ? 'Girando…' : 'Girar'}
            </Boton>
            {s.raffle.mode === 'team_matcher' && (
              <p className="text-[13px] text-[var(--c-text-3)]">El emparejador se maneja desde la consola.</p>
            )}
            {s.raffle.lastWinner && (
              <section className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-3.5">
                <p className="text-[12px] font-semibold text-amber-300">Último ganador</p>
                <p className="text-[20px] font-bold">{s.raffle.lastWinner.name}</p>
                {s.raffle.lastWinner.prize && <p className="text-[13px] text-[var(--c-text-2)]">{s.raffle.lastWinner.prize}</p>}
              </section>
            )}
            <Boton
              tipo={confirmarReinicioSorteo ? 'rojo' : 'neutro'}
              onClick={() => {
                if (!confirmarReinicioSorteo) {
                  setConfirmarReinicioSorteo(true);
                  setTimeout(() => setConfirmarReinicioSorteo(false), 4000);
                  return;
                }
                setConfirmarReinicioSorteo(false);
                enviar('RESET_RAFFLE', null, 60);
              }}
              disabled={bloqueado}
            >
              <RotateCcw className="h-4 w-4" />
              {confirmarReinicioSorteo ? 'Toca otra vez para reactivar a todos' : 'Reactivar participantes'}
            </Boton>
          </>
        )}

        {/* ---------------- SONIDOS ---------------- */}
        {pestana === 'sonidos' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {SONIDOS.map((x) => (
                <button
                  key={x.id}
                  onClick={() => enviar('TRIGGER_SOUND', x.id, 30)}
                  disabled={bloqueado}
                  className="flex h-16 items-center gap-3 rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] px-3.5 text-left text-[15px] font-semibold active:scale-[0.98] disabled:opacity-40"
                >
                  <span className="text-[22px] leading-none">{x.icon}</span>
                  {x.label}
                </button>
              ))}
            </div>
            <Boton tipo="ambar" grande onClick={() => enviar('TRIGGER_CELEBRATION', null, 80)} disabled={bloqueado}>
              <Sparkles className="h-5 w-5" /> Celebración con confeti
            </Boton>
          </>
        )}
      </main>

      {/* Navegación inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-[var(--c-line)] bg-[var(--c-panel)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {PESTANAS.map((p) => {
          const Icon = p.icon;
          const activa = pestana === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                vibrar(15);
                setPestana(p.id);
              }}
              aria-current={activa ? 'page' : undefined}
              className={`flex h-[64px] flex-col items-center justify-center gap-1 text-[11px] ${
                activa ? 'font-bold text-[var(--c-text)]' : 'font-medium text-[var(--c-text-3)]'
              }`}
            >
              <Icon className={`h-5 w-5 ${activa ? 'text-[var(--c-accent)]' : ''}`} />
              {p.label}
            </button>
          );
        })}
      </nav>

      {/* PIN */}
      {verPin && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center">
          <form onSubmit={enviarPin} className="w-full max-w-sm rounded-2xl border border-[var(--c-line-strong)] bg-[var(--c-panel)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[17px] font-bold">
                <KeyRound className="h-5 w-5 text-amber-400" /> PIN de operador
              </h2>
              <button type="button" onClick={() => setVerPin(false)} className="rounded-lg p-1.5 text-[var(--c-text-3)]" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-[14px] text-[var(--c-text-2)]">
              Está en la consola, en «⋯ → Control remoto». Sin el PIN solo puedes ver.
            </p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full rounded-xl border border-[var(--c-line-strong)] bg-[var(--c-bg)] py-3 text-center font-mono text-[28px] tracking-[0.5em] focus:border-[var(--c-accent)] focus:outline-none"
              placeholder="••••"
              aria-label="PIN de 4 números"
            />
            {errorPin && <p className="mt-2 text-[14px] text-red-400">{errorPin}</p>}
            <button type="submit" className="mt-3 h-12 w-full rounded-xl bg-[var(--c-accent)] text-[16px] font-bold text-white">
              Entrar
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

/* =============================================================
 * Panel del juego activo
 * ============================================================= */
const PanelJuego: React.FC<{
  s: MasterLiveState;
  enviar: (cmd: RemoteCommandType, payload?: any, ms?: number) => void;
  bloqueado: boolean;
  nombreEquipo: (id?: string | null) => string;
}> = ({ s, enviar, bloqueado, nombreEquipo }) => {
  const g = s.gameStage;
  const id = g.activeGameId;
  const b = s.buzzer;
  const especial = id === 'millionaire_show' || id === 'deal_or_nodeal';

  let etiquetaCorrecto = '¡Correcto!';
  let etiquetaFallo = 'Fallo';
  if (id === 'family_feud') {
    etiquetaCorrecto = g.familyFeud.potScore ? `Dar pozo (${g.familyFeud.potScore})` : 'Pozo vacío';
    etiquetaFallo = `Strike (${g.familyFeud.strikes}/3)`;
  } else if (id === 'charades') {
    etiquetaCorrecto = 'Acierto';
    etiquetaFallo = 'Pasar';
  } else if (id === 'hangman') {
    etiquetaCorrecto = 'Resolvió la palabra';
  }

  return (
    <>
      {s.viewMode !== 'GAME_STAGE' && (
        <Boton tipo="neutro" onClick={() => enviar('SET_VIEW_MODE', { viewMode: 'GAME_STAGE' })} disabled={bloqueado}>
          <Tv className="h-4 w-4" /> Poner el juego en pantalla
        </Boton>
      )}

      {/* Elegir dinámica */}
      <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1">
        {JUEGOS.map((j) => (
          <button
            key={j.id}
            onClick={() => enviar('SET_ACTIVE_GAME', { gameId: j.id })}
            disabled={bloqueado}
            className={`h-10 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[14px] font-semibold disabled:opacity-40 ${
              id === j.id ? 'border-[var(--c-accent)] bg-[var(--c-accent-soft)] text-[var(--c-text)]' : 'border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text-2)]'
            }`}
          >
            {j.label}
          </button>
        ))}
      </div>

      {b?.config?.useBuzzersInGameStage && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-2">
          <span className="min-w-0 truncate text-[13px] font-semibold">
            <Zap className="mr-1 inline h-4 w-4 text-[var(--c-text-3)]" />
            {b.status === 'answering' ? `Responde ${nombreEquipo(b.answeringTeamId)}` : b.status === 'open' ? 'Pulsadores abiertos' : 'Pulsadores cerrados'}
          </span>
          <button
            onClick={() => enviar('BUZZER_OPEN', null, 60)}
            disabled={bloqueado}
            className="h-9 shrink-0 rounded-lg bg-emerald-600 px-3 text-[13px] font-bold text-white disabled:opacity-40"
          >
            Abrir
          </button>
        </div>
      )}

      {/* Ficha secreta: solo la ve el director en su celular */}
      <section className="rounded-2xl border border-amber-500/40 bg-[var(--c-panel)] p-3.5">
        <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-amber-300">
          <Eye className="h-3.5 w-3.5" /> Ficha del director · {JUEGOS.find((j) => j.id === id)?.label}
        </p>
        <FichaJuego s={s} enviar={enviar} bloqueado={bloqueado} />
      </section>

      {id === 'millionaire_show' && <ControlesMillonario s={s} enviar={enviar} bloqueado={bloqueado} />}
      {id === 'deal_or_nodeal' && <ControlesTratoHecho s={s} enviar={enviar} bloqueado={bloqueado} />}

      {/* Navegación del juego */}
      {!especial && (
      <div className="grid grid-cols-3 gap-2">
        <Boton tipo="neutro" grande onClick={() => enviar('PREV_GAME_ITEM')} disabled={bloqueado}>
          <ChevronLeft className="h-5 w-5" /> Anterior
        </Boton>
        <Boton tipo="neutro" grande onClick={() => enviar('REVEAL_GAME_ANSWER')} disabled={bloqueado || id === 'family_feud'}>
          <Eye className="h-5 w-5" /> Revelar
        </Boton>
        <Boton tipo="neutro" grande onClick={() => enviar('NEXT_GAME_ITEM')} disabled={bloqueado}>
          Siguiente <ChevronRight className="h-5 w-5" />
        </Boton>
      </div>
      )}

      {especial ? null : (
        <div className="grid grid-cols-2 gap-2">
          <Boton
            tipo="verde"
            enorme
            onClick={() => enviar('GAME_CORRECT', null, 70)}
            disabled={bloqueado || (id === 'family_feud' && !g.familyFeud.potScore)}
          >
            <Check className="h-6 w-6" /> {etiquetaCorrecto}
          </Boton>
          <Boton
            tipo={id === 'charades' ? 'neutro' : 'rojo'}
            enorme
            onClick={() => enviar(id === 'charades' ? 'CHARADES_SKIP' : 'GAME_ERROR', null, 70)}
            disabled={bloqueado}
          >
            <X className="h-6 w-6" /> {etiquetaFallo}
          </Boton>
        </div>
      )}

      {id === 'charades' && (
        <div className="grid grid-cols-3 gap-2">
          <Boton tipo={g.charades.isRunning ? 'ambar' : 'accion'} onClick={() => enviar('CHARADES_TOGGLE_TIMER')} disabled={bloqueado}>
            {g.charades.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {g.charades.isRunning ? 'Pausar' : 'Iniciar'}
          </Boton>
          <Boton tipo="neutro" onClick={() => enviar('CHARADES_RESET', { seconds: 60 })} disabled={bloqueado}>
            <RotateCcw className="h-4 w-4" /> 60 s
          </Boton>
          <Boton tipo="verde" onClick={() => enviar('CHARADES_AWARD', null, 70)} disabled={bloqueado || g.charades.correctCount === 0}>
            +{g.charades.correctCount * 50}
          </Boton>
        </div>
      )}
    </>
  );
};

const FichaJuego: React.FC<{
  s: MasterLiveState;
  enviar: (cmd: RemoteCommandType, payload?: any, ms?: number) => void;
  bloqueado: boolean;
}> = ({ s, enviar, bloqueado }) => {
  const g = s.gameStage;
  const Pregunta = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[17px] font-semibold leading-snug">{children}</p>
  );
  const Respuesta = ({ children }: { children: React.ReactNode }) => (
    <p className="mt-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-[16px] font-bold text-emerald-300">{children}</p>
  );
  const Pie = ({ children }: { children: React.ReactNode }) => (
    <p className="mt-2 text-[13px] text-[var(--c-text-3)]">{children}</p>
  );
  const pos = (i: number, n: number) => `${i + 1} de ${n}`;

  switch (g.activeGameId) {
    case 'bible_book': {
      const st = g.bibleBook;
      const it = st.items[st.currentIndex];
      if (!it) return <Pie>Sin preguntas cargadas.</Pie>;
      return (
        <>
          <Pregunta>{it.verseOrEvent}</Pregunta>
          <Respuesta>
            {it.book}
            {it.reference ? ` · ${it.reference}` : ''}
          </Respuesta>
          <Pie>
            {pos(st.currentIndex, st.items.length)} · {it.points} pts{st.revealed ? ' · revelada' : ''}
            {st.pointsAwarded ? ' · puntos dados' : ''}
          </Pie>
        </>
      );
    }
    case 'who_said_it': {
      const st = g.whoSaidIt;
      const it = st.items[st.currentIndex];
      if (!it) return <Pie>Sin frases cargadas.</Pie>;
      return (
        <>
          <Pregunta>{it.quote}</Pregunta>
          <Respuesta>{it.author}</Respuesta>
          {it.context && <Pie>{it.context}</Pie>}
          <Pie>
            {pos(st.currentIndex, st.items.length)} · {it.points} pts{st.pointsAwarded ? ' · puntos dados' : ''}
          </Pie>
        </>
      );
    }
    case 'hangman': {
      const st = g.hangman;
      const it = st.items[st.currentIndex];
      if (!it) return <Pie>Sin palabras cargadas.</Pie>;
      const usadas = st.guessedLetters.map(sinAcento);
      const mascara = it.word
        .split('')
        .map((c) => (c === ' ' ? '  ' : usadas.includes(sinAcento(c)) || st.solved ? c : '_'))
        .join(' ');
      return (
        <>
          <p className="font-mono text-[22px] font-bold tracking-wider">{mascara}</p>
          <Respuesta>{it.word}</Respuesta>
          <Pie>
            {it.category} · intentos fallidos {st.strikes}/{st.maxStrikes}
            {st.solved ? ' · resuelta' : st.gameOver ? ' · se acabaron los intentos' : ''}
          </Pie>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {LETRAS.map((l) => {
              const usada = usadas.includes(sinAcento(l));
              const enPalabra = it.word.split('').some((c) => sinAcento(c) === sinAcento(l));
              return (
                <button
                  key={l}
                  onClick={() => enviar('HANGMAN_GUESS', { letter: l }, 25)}
                  disabled={bloqueado || usada || st.solved || st.gameOver}
                  className={`h-10 rounded-lg text-[15px] font-bold ${
                    usada
                      ? enPalabra
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/15 text-red-300/70 line-through'
                      : 'bg-[var(--c-panel-2)] active:bg-[var(--c-accent)]'
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </>
      );
    }
    case 'charades': {
      const st = g.charades;
      const it = st.items[st.currentIndex];
      if (!it) return <Pie>Sin palabras cargadas.</Pie>;
      return <FichaCharadas s={s} />;
    }
    case 'family_feud': {
      const st = g.familyFeud;
      const it = st.items[st.currentIndex];
      if (!it) return <Pie>Sin encuestas cargadas.</Pie>;
      return (
        <>
          <Pregunta>{it.question}</Pregunta>
          <div className="mt-3 space-y-1.5">
            {it.answers.map((a, i) => {
              const destapada = st.revealedAnswerIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => enviar('FEUD_REVEAL', { answerId: a.id }, 40)}
                  disabled={bloqueado}
                  className={`flex h-12 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-[15px] font-semibold ${
                    destapada ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200' : 'border-[var(--c-line)] bg-[var(--c-panel-2)]'
                  }`}
                >
                  <span className="min-w-0 truncate">
                    {i + 1}. {a.text}
                  </span>
                  <span className="shrink-0 font-mono">{a.points}</span>
                </button>
              );
            })}
          </div>
          <Pie>
            Toca una respuesta para destaparla · Pozo {st.potScore} · Strikes {st.strikes}/3
          </Pie>
        </>
      );
    }
    case 'trivia_show': {
      const st = g.triviaShow;
      const it = st.items[st.currentIndex];
      if (!it) return <Pie>Sin preguntas cargadas.</Pie>;
      return (
        <>
          <Pregunta>{it.question}</Pregunta>
          <div className="mt-3 grid grid-cols-1 gap-1.5">
            {(['A', 'B', 'C', 'D'] as const).map((k) => {
              const correcta = it.correctAnswer === k;
              const elegida = st.selectedOption === k;
              const oculta = st.hiddenOptions5050.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => enviar('TRIVIA_SELECT', { option: k }, 30)}
                  disabled={bloqueado || oculta}
                  className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-left text-[15px] ${
                    elegida ? 'border-[var(--c-accent)] bg-[var(--c-accent-soft)]' : 'border-[var(--c-line)] bg-[var(--c-panel-2)]'
                  } ${oculta ? 'opacity-30' : ''}`}
                >
                  <span className="font-bold">{k}.</span>
                  <span className="min-w-0 flex-1">{it.options[k]}</span>
                  {correcta && <Check className="h-5 w-5 shrink-0 text-emerald-400" aria-label="Correcta" />}
                </button>
              );
            })}
          </div>
          <Pie>
            Toca la opción que eligió el equipo (se marca en pantalla). {it.points} pts
            {st.revealed ? ' · revelada' : ''}
          </Pie>
        </>
      );
    }
    case 'anagram_wheel': {
      const st = g.anagramWheel;
      const it = st.items[st.currentIndex];
      if (!it) return <Pie>Sin palabras cargadas.</Pie>;
      return (
        <>
          <p className="font-mono text-[24px] font-bold tracking-[0.2em]">{it.scrambledWord}</p>
          <Respuesta>{it.originalWord}</Respuesta>
          <Pie>
            {it.category} · {it.points} pts
            {st.selectedReward ? ` · ruleta: ${st.selectedReward.label}` : ''}
          </Pie>
        </>
      );
    }
    case 'music_karaoke': {
      const st = g.musicKaraoke;
      const it = st.items[st.currentIndex];
      if (!it) return <Pie>Sin canciones cargadas.</Pie>;
      return (
        <>
          <Respuesta>
            {it.title} · {it.artist}
          </Respuesta>
          <Pie>
            {it.category} · la reproducción se controla desde la consola{st.revealedSong ? ' · revelada' : ''}
          </Pie>
        </>
      );
    }
    case 'millionaire_show': {
      const st = g.millionaireShow;
      const it = st.items[st.currentIndex];
      if (!it) return <Pie>Sin preguntas cargadas.</Pie>;
      return (
        <>
          <Pie>
            Nivel {st.currentLevel} de {st.items.length} · vale {it.points} pts · acumulado {st.accumulatedPoints}
            {st.gameStatus === 'failed' ? ' · falló' : st.gameStatus === 'walked_away' ? ' · se retiró' : st.gameStatus === 'won_top' ? ' · ¡ganó todo!' : ''}
          </Pie>
          <Pregunta>{it.question}</Pregunta>
          <div className="mt-3 grid grid-cols-1 gap-1.5">
            {(['A', 'B', 'C', 'D'] as const).map((k) => {
              const correcta = it.correctAnswer === k;
              const elegida = st.selectedOption === k;
              const oculta = st.hiddenOptions5050.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => enviar('MIL_SELECT', { option: k }, 30)}
                  disabled={bloqueado || oculta || st.revealed}
                  className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-left text-[15px] ${
                    elegida
                      ? st.isFinalAnswer
                        ? 'border-amber-400 bg-amber-500/20'
                        : 'border-[var(--c-accent)] bg-[var(--c-accent-soft)]'
                      : 'border-[var(--c-line)] bg-[var(--c-panel-2)]'
                  } ${oculta ? 'opacity-30' : ''}`}
                >
                  <span className="font-bold">{k}.</span>
                  <span className="min-w-0 flex-1">{it.options[k]}</span>
                  {st.audiencePollResults && <span className="shrink-0 font-mono text-[13px] text-[var(--c-text-3)]">{st.audiencePollResults[k]}%</span>}
                  {correcta && <Check className="h-5 w-5 shrink-0 text-emerald-400" aria-label="Correcta" />}
                </button>
              );
            })}
          </div>
          {st.showPhoneCall && <LlamadaEnVivo s={s} />}
        </>
      );
    }
    case 'deal_or_nodeal': {
      const st = g.dealOrNoDeal;
      const abiertos = st.briefcases.filter((x) => x.isOpen).length;
      const eligiendo = st.gameStatus === 'selecting_own' || st.contestantBriefcaseNumber === null;
      const textoEstado = eligiendo
        ? 'Toca el maletín que elige el concursante'
        : st.gameStatus === 'opening_cases'
        ? `Ronda ${st.currentRound}: abrir ${st.briefcasesToOpenThisRound - st.briefcasesOpenedThisRound} más`
        : st.gameStatus === 'banker_offer'
        ? 'La banca hace su oferta'
        : st.gameStatus === 'deal_accepted'
        ? `¡Trato hecho! ${st.finalWinnings ?? st.bankerOffer} pts`
        : `Su maletín tenía ${st.finalWinnings ?? '—'}`;
      return (
        <>
          <Pregunta>{textoEstado}</Pregunta>
          <Pie>
            {abiertos} de {st.briefcases.length} abiertos · su maletín: {st.contestantBriefcaseNumber ?? '—'} · los valores solo los ves tú
          </Pie>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {st.briefcases.map((m) => {
              const abriendo = st.revealingBriefcaseId === m.id;
              const propio = m.isContestantBriefcase;
              return (
                <button
                  key={m.id}
                  onClick={() =>
                    eligiendo ? enviar('DEAL_SELECT_OWN', { number: m.number }, 40) : enviar('DEAL_OPEN', { id: m.id }, 50)
                  }
                  disabled={
                    bloqueado ||
                    m.isOpen ||
                    (!eligiendo && (propio || st.gameStatus !== 'opening_cases' || st.revealingBriefcaseId !== null))
                  }
                  className={`flex h-14 flex-col items-center justify-center rounded-xl border text-center ${
                    m.isOpen
                      ? 'border-transparent bg-[var(--c-bg)] text-[var(--c-text-3)] line-through'
                      : propio
                      ? 'border-amber-400 bg-amber-500/15'
                      : abriendo
                      ? 'border-[var(--c-accent)] bg-[var(--c-accent-soft)]'
                      : 'border-[var(--c-line)] bg-[var(--c-panel-2)]'
                  }`}
                >
                  <span className="text-[15px] font-bold leading-none">{m.number}</span>
                  <span className="mt-0.5 font-mono text-[11px] leading-none text-[var(--c-text-3)]">{m.value}</span>
                </button>
              );
            })}
          </div>
        </>
      );
    }
    default:
      return null;
  }
};

/* =============================================================
 * Charadas, llamada, Millonario y Trato hecho
 * ============================================================= */
const FichaCharadas: React.FC<{ s: MasterLiveState }> = ({ s }) => {
  const st = s.gameStage.charades;
  const it = st.items[st.currentIndex];
  const restante = useRelojEnVivo(st.remainingSeconds, st.isRunning, 'baja');
  if (!it) return null;
  return (
    <>
      <p className="text-[24px] font-bold leading-tight">{it.word}</p>
      <p className="mt-2 text-[13px] text-[var(--c-text-3)]">{it.category}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-[14px] text-[var(--c-text-2)]">
          Aciertos <strong className="font-mono text-[20px] text-[var(--c-text)]">{st.correctCount}</strong> · Pasadas {st.skippedCount}
        </p>
        <p className={`font-mono text-[34px] font-black leading-none ${restante <= 10 ? 'text-amber-300' : ''}`}>
          {formatTimeDisplay(restante)}
        </p>
      </div>
    </>
  );
};

const LlamadaEnVivo: React.FC<{ s: MasterLiveState }> = ({ s }) => {
  const m = s.gameStage.millionaireShow;
  const restante = useRelojEnVivo(m.phoneCallSecondsRemaining ?? 0, m.showPhoneCall, 'baja');
  return (
    <p className="mt-3 rounded-lg bg-amber-500/15 px-3 py-2 text-[15px] font-bold text-amber-200">
      📞 Llamada en curso: {restante} s
    </p>
  );
};

const ControlesMillonario: React.FC<{
  s: MasterLiveState;
  enviar: (cmd: RemoteCommandType, payload?: any, ms?: number) => void;
  bloqueado: boolean;
}> = ({ s, enviar, bloqueado }) => {
  const m = s.gameStage.millionaireShow;
  const terminado = m.gameStatus !== 'playing';
  const comodines: Array<{ cmd: RemoteCommandType; label: string; usado: boolean }> = [
    { cmd: 'MIL_5050', label: '50:50', usado: m.lifelines.fiftyFifty },
    { cmd: 'MIL_AUDIENCE', label: 'Público', usado: m.lifelines.audiencePoll },
    { cmd: 'MIL_PHONE', label: 'Llamada', usado: m.lifelines.phoneCall },
    { cmd: 'MIL_SWITCH', label: 'Cambiar', usado: m.lifelines.switchQuestion },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Boton
          tipo={m.isFinalAnswer ? 'ambar' : 'neutro'}
          grande
          onClick={() => enviar('MIL_FINAL', null, 50)}
          disabled={bloqueado || !m.selectedOption || m.revealed}
        >
          {m.isFinalAnswer ? '¿Definitiva? Sí' : '¿Respuesta definitiva?'}
        </Boton>
        <Boton tipo="accion" grande onClick={() => enviar('MIL_REVEAL', null, 70)} disabled={bloqueado || !m.selectedOption || m.revealed}>
          <Eye className="h-5 w-5" /> Revelar
        </Boton>
      </div>

      {m.revealed && m.isCorrect && m.gameStatus === 'playing' && (
        <Boton tipo="verde" enorme onClick={() => enviar('MIL_NEXT_LEVEL', null, 60)} disabled={bloqueado}>
          Siguiente nivel <ChevronRight className="h-6 w-6" />
        </Boton>
      )}

      <section>
        <Titulo>Comodines</Titulo>
        <div className="grid grid-cols-4 gap-1.5">
          {comodines.map((c) => (
            <button
              key={c.cmd}
              onClick={() => enviar(c.cmd, null, 50)}
              disabled={bloqueado || c.usado || m.revealed}
              className={`h-12 rounded-xl border text-[13px] font-bold disabled:opacity-35 ${
                c.usado ? 'border-transparent bg-[var(--c-bg)] text-[var(--c-text-3)] line-through' : 'border-[var(--c-line)] bg-[var(--c-panel)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          <Boton tipo="neutro" onClick={() => enviar('MIL_TOGGLE_POLL')} disabled={bloqueado || !m.audiencePollResults}>
            {m.showAudiencePoll ? 'Ocultar encuesta' : 'Ver encuesta'}
          </Boton>
          <Boton tipo="neutro" onClick={() => enviar('MIL_PHONE_STOP')} disabled={bloqueado || !m.showPhoneCall}>
            Colgar
          </Boton>
          <Boton tipo="neutro" onClick={() => enviar('MIL_RESET_LIFELINES')} disabled={bloqueado}>
            Restaurar
          </Boton>
        </div>
      </section>

      <section>
        <Titulo>Premio (acumulado {m.accumulatedPoints} pts)</Titulo>
        <div className="grid grid-cols-2 gap-2">
          <Boton
            tipo="ambar"
            grande
            onClick={() => enviar('MIL_WALK_AWAY', null, 70)}
            disabled={bloqueado || terminado || m.accumulatedPoints <= 0}
          >
            Retirarse
          </Boton>
          <Boton
            tipo="verde"
            grande
            onClick={() => enviar('MIL_AWARD', null, 70)}
            disabled={bloqueado || m.pointsAwarded || m.accumulatedPoints <= 0 || m.gameStatus === 'playing'}
          >
            Dar {m.accumulatedPoints} pts
          </Boton>
        </div>
        <div className="mt-2">
          <Boton tipo="neutro" onClick={() => enviar('MIL_RESTART')} disabled={bloqueado}>
            <RotateCcw className="h-4 w-4" /> Juego nuevo desde el nivel 1
          </Boton>
        </div>
      </section>
    </>
  );
};

const ControlesTratoHecho: React.FC<{
  s: MasterLiveState;
  enviar: (cmd: RemoteCommandType, payload?: any, ms?: number) => void;
  bloqueado: boolean;
}> = ({ s, enviar, bloqueado }) => {
  const d = s.gameStage.dealOrNoDeal;
  const [oferta, setOferta] = useState('');
  const quedanCerrados = d.briefcases.filter((b) => !b.isOpen && !b.isContestantBriefcase).length;
  return (
    <>
      {d.gameStatus === 'banker_offer' && (
        <section className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-3.5">
          <p className="text-[12px] font-semibold text-amber-300">Oferta de la banca</p>
          <p className="font-mono text-[36px] font-black leading-none">{d.bankerOffer}</p>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              value={oferta}
              onChange={(e) => setOferta(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="Cambiar oferta"
              aria-label="Cambiar la oferta de la banca"
              className="h-11 min-w-0 rounded-xl border border-[var(--c-line)] bg-[var(--c-bg)] px-3 font-mono text-[16px] focus:border-[var(--c-accent)] focus:outline-none"
            />
            <button
              onClick={() => {
                const n = parseInt(oferta, 10);
                if (!isNaN(n)) enviar('DEAL_SET_OFFER', { offer: n });
                setOferta('');
              }}
              disabled={bloqueado || !oferta}
              className="h-11 rounded-xl bg-[var(--c-panel-2)] px-3.5 text-[14px] font-bold disabled:opacity-40"
            >
              Usar
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Boton tipo="verde" enorme onClick={() => enviar('DEAL_ACCEPT', null, 80)} disabled={bloqueado || d.pointsAwarded}>
              ¡Trato hecho!
            </Boton>
            <Boton tipo="rojo" enorme onClick={() => enviar('DEAL_REJECT', null, 60)} disabled={bloqueado}>
              No hay trato
            </Boton>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Boton
          tipo="neutro"
          onClick={() => enviar('DEAL_BANKER_CALL', null, 50)}
          disabled={bloqueado || d.contestantBriefcaseNumber === null || d.gameStatus === 'deal_accepted' || d.gameStatus === 'final_case_opened'}
        >
          📞 Llamar a la banca
        </Boton>
        <Boton
          tipo="ambar"
          onClick={() => enviar('DEAL_OPEN_OWN', null, 70)}
          disabled={bloqueado || d.contestantBriefcaseNumber === null || quedanCerrados > 0 || d.gameStatus === 'final_case_opened'}
        >
          Abrir su maletín
        </Boton>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Interruptor activo={d.suspenseActive} etiqueta="Suspenso al abrir" onClick={() => enviar('DEAL_TOGGLE_SUSPENSE')} disabled={bloqueado} tarjeta />
        <Boton tipo="neutro" grande onClick={() => enviar('DEAL_SHUFFLE', null, 50)} disabled={bloqueado}>
          <RotateCcw className="h-4 w-4" /> Mezclar y empezar
        </Boton>
      </div>
    </>
  );
};

/* =============================================================
 * Piezas
 * ============================================================= */
const Titulo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mb-2 text-[13px] font-bold text-[var(--c-text-2)]">{children}</h2>
);

const Boton: React.FC<{
  tipo: 'accion' | 'neutro' | 'verde' | 'rojo' | 'ambar';
  grande?: boolean;
  enorme?: boolean;
  disabled?: boolean;
  etiqueta?: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ tipo, grande, enorme, disabled, etiqueta, onClick, children }) => {
  const colores = {
    accion: 'bg-[var(--c-accent)] text-white',
    neutro: 'border border-[var(--c-line)] bg-[var(--c-panel)] text-[var(--c-text)]',
    verde: 'bg-emerald-600 text-white',
    rojo: 'bg-red-600 text-white',
    ambar: 'bg-amber-500 text-slate-950',
  }[tipo];
  const alto = enorme ? 'h-[72px] text-[17px]' : grande ? 'h-14 text-[16px]' : 'h-11 text-[14px]';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 font-bold transition-transform active:scale-[0.97] disabled:opacity-40 ${colores} ${alto}`}
    >
      {children}
    </button>
  );
};

const BotonIcono: React.FC<{
  etiqueta: string;
  onClick: () => void;
  disabled?: boolean;
  activo?: boolean;
  children: React.ReactNode;
}> = ({ etiqueta, onClick, disabled, activo, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={etiqueta}
    aria-label={etiqueta}
    aria-pressed={activo}
    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
      activo === false ? 'text-[var(--c-text-3)]' : 'text-[var(--c-text-2)]'
    } active:bg-[var(--c-panel-2)]`}
  >
    {children}
  </button>
);

const Interruptor: React.FC<{
  activo: boolean;
  etiqueta: string;
  ayuda?: string;
  onClick: () => void;
  disabled?: boolean;
  tarjeta?: boolean;
}> = ({ activo, etiqueta, ayuda, onClick, disabled, tarjeta }) => (
  <button
    role="switch"
    aria-checked={activo}
    onClick={onClick}
    disabled={disabled}
    className={`flex w-full items-center justify-between gap-3 text-left disabled:opacity-40 ${
      tarjeta ? 'rounded-2xl border border-[var(--c-line)] bg-[var(--c-panel)] px-3.5 py-3' : 'py-1.5'
    }`}
  >
    <span className="min-w-0">
      <span className="block text-[15px] font-semibold">{etiqueta}</span>
      {ayuda && <span className="block text-[13px] text-[var(--c-text-3)]">{ayuda}</span>}
    </span>
    <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${activo ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-line-strong)]'}`} aria-hidden>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${activo ? 'left-6' : 'left-1'}`} />
    </span>
  </button>
);

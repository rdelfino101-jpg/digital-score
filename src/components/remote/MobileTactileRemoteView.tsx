import React, { useState, useEffect } from 'react';
import {
  MasterLiveState,
  MasterViewMode,
  ActiveGameId,
  StudioTeam,
  RemoteCommandType,
} from '../../types/masterStudio';
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  Flame,
  Volume2,
  Tv,
  Gamepad2,
  Trophy,
  Award,
  EyeOff,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Wifi,
  WifiOff,
  Vibrate,
  BookOpen,
  MessageSquareQuote,
  Keyboard,
  Hourglass,
  Users2,
  HelpCircle,
  Dices,
  CheckCircle,
  XCircle,
  Eye,
  Radio,
  Gift,
  Music,
  Briefcase,
  Lock,
  Unlock,
  KeyRound,
  X,
} from 'lucide-react';
import { formatTimeDisplay } from '../../utils/gameEngineRules';

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
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'points' | 'scenes' | 'games' | 'sounds' | 'buzzers'>('points');
  const [showPinModal, setShowPinModal] = useState<boolean>(!isAuthenticated);
  const [pinInput, setPinInput] = useState('');
  const [localPinError, setLocalPinError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setShowPinModal(false);
      setLocalPinError(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authError) {
      setLocalPinError(authError);
    }
  }, [authError]);

  // Requirement 4: buttons disabled while disconnected or without operator PIN
  const isActionDisabled = connectionStatus !== 'connected' || !isAuthenticated;

  // Trigger tactile vibration on phone tap
  const triggerHaptic = (ms = 35) => {
    if (hapticEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore
      }
    }
  };

  const handleCommand = (cmd: RemoteCommandType, payload?: any, hapticMs = 40) => {
    if (isActionDisabled) {
      if (!isAuthenticated) {
        setShowPinModal(true);
      }
      return;
    }
    triggerHaptic(hapticMs);
    onSendCommand(cmd, payload);
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = pinInput.trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setLocalPinError('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }
    setLocalPinError(null);
    onAuthenticate?.(cleanPin);
  };

  if (!masterState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#070b14] p-6 text-center text-slate-100 select-none">
        <div className="mb-4 h-16 w-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <Radio className="h-8 w-8 animate-pulse" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-wider text-white">
          Conectando Control Remoto...
        </h1>
        <p className="mt-2 text-xs text-slate-400">
          Sala <strong className="text-amber-400 font-mono tracking-widest">{roomCode}</strong> &bull; {connectionStatus === 'connected' ? 'Conectado' : 'Sin conexión – reintentando'}
        </p>
      </div>
    );
  }

  const activeTeam =
    masterState.teams.find((t) => t.id === masterState.turn.activeTeamId) ||
    masterState.teams[0];

  const gameOptions: Array<{ id: ActiveGameId; label: string; icon: any }> = [
    { id: 'bible_book', label: 'Biblia', icon: BookOpen },
    { id: 'who_said_it', label: 'Citas', icon: MessageSquareQuote },
    { id: 'hangman', label: 'Ahorcado', icon: Keyboard },
    { id: 'charades', label: 'Charadas', icon: Hourglass },
    { id: 'family_feud', label: '100 Dijeron', icon: Users2 },
    { id: 'trivia_show', label: 'Trivia', icon: HelpCircle },
    { id: 'anagram_wheel', label: 'Ruleta', icon: Dices },
    { id: 'music_karaoke', label: 'Música & Karaoke', icon: Music },
    { id: 'millionaire_show', label: 'Millonario', icon: Trophy },
    { id: 'deal_or_nodeal', label: 'Trato Hecho', icon: Briefcase },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#050811] text-white font-sans select-none pb-24 touch-manipulation">
      {/* Top Mobile Bar: Honest connection status, Room badge, PIN button, Haptic toggle, Exit */}
      <header className="sticky top-0 z-40 bg-[#090e1d]/95 backdrop-blur-md border-b border-slate-800 px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Requirement 4: Honest Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              connectionStatus === 'connected'
                ? isAuthenticated
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
            }`}
          >
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span>
              {connectionStatus === 'connected'
                ? isAuthenticated
                  ? 'Conectado'
                  : 'Conectado (Lectura)'
                : 'Sin conexión – reintentando'}
            </span>
          </div>

          <span className="text-[10px] font-black font-mono tracking-wider text-amber-400 px-1.5 py-0.5 rounded bg-slate-900 border border-amber-500/30">
            {roomCode}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* PIN Lock status / re-auth button */}
          <button
            onClick={() => setShowPinModal(true)}
            className={`px-2 py-1 rounded-xl text-xs flex items-center gap-1 font-bold border transition-colors ${
              isAuthenticated
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/80 border-amber-500/60 text-amber-200 animate-pulse'
            }`}
            title={isAuthenticated ? 'PIN verificado. Modo Operador Activo.' : 'Haz clic para ingresar PIN de Operador'}
          >
            {isAuthenticated ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
            <span className="text-[10px]">{isAuthenticated ? 'PIN OK' : 'PIN'}</span>
          </button>

          <button
            onClick={() => setHapticEnabled(!hapticEnabled)}
            className={`p-2 rounded-xl text-xs transition-colors ${
              hapticEnabled
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'bg-slate-800 text-slate-500'
            }`}
            title="Vibración táctil al presionar botones"
          >
            <Vibrate className="w-4 h-4" />
          </button>

          {onExitRemote && (
            <button
              onClick={onExitRemote}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:text-white"
            >
              Salir
            </button>
          )}
        </div>
      </header>

      {/* Disconnected / Unauthenticated Warning Banners */}
      {connectionStatus !== 'connected' && (
        <div className="bg-red-950/90 border-b border-red-500/50 px-3.5 py-2 flex items-center gap-2 text-xs text-red-200">
          <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
          <span>Sin conexión – reintentando sincronizar. Los controles táctiles están inhabilitados.</span>
        </div>
      )}

      {connectionStatus === 'connected' && !isAuthenticated && (
        <div className="bg-amber-950/80 border-b border-amber-500/50 px-3.5 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Modo Solo Lectura. Ingresa el PIN de operador para sumar puntos.</span>
          </div>
          <button
            onClick={() => setShowPinModal(true)}
            className="ml-2 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shrink-0"
          >
            Ingresar PIN
          </button>
        </div>
      )}

      {/* Hero Active Team & Big Turn Switcher */}
      <section className="p-3.5 bg-gradient-to-b from-[#0c1329] to-[#080d1a] border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-amber-400" />
            <span>Turno Activo</span>
          </span>

          <div className="flex items-center gap-1.5">
            {/* Requirement 6: Botón Deshacer en Remoto */}
            <button
              onClick={() => handleCommand('UNDO_LAST_ACTION', null, 50)}
              disabled={isActionDisabled}
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow flex items-center gap-1 ${
                isActionDisabled
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border border-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 active:scale-95'
              }`}
              title="Deshacer último puntaje / turno"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Deshacer</span>
            </button>

            {/* Steal Mode Button */}
            <button
              onClick={() => handleCommand('TOGGLE_STEAL', null, 60)}
              disabled={isActionDisabled}
              className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow ${
                isActionDisabled
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500'
                  : masterState.turn.stealMode
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              🔥 Robo: {masterState.turn.stealMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Big Active Team Card */}
        {activeTeam && (
          <div
            className="p-3.5 rounded-2xl border-2 flex items-center justify-between shadow-2xl transition-all"
            style={{
              borderColor: activeTeam.color,
              backgroundColor: `${activeTeam.color}22`,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-5 h-5 rounded-full block shrink-0 shadow-md ring-2 ring-white/30"
                style={{ backgroundColor: activeTeam.color }}
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Respondiendo ahora:
                </span>
                <span className="text-lg font-black text-white truncate block">
                  {activeTeam.name}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-3xl font-black font-mono text-white leading-none">
                {activeTeam.score}
              </span>
              <span className="text-[10px] uppercase font-black text-slate-400 block">PTS</span>
            </div>
          </div>
        )}

        {/* Massive Turn Navigation Touch Targets */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => handleCommand('PREV_TURN', null, 50)}
            disabled={isActionDisabled}
            className={`py-3.5 px-3 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shadow transition-all border ${
              isActionDisabled
                ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                : 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border-slate-700'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>&lt;&lt; Turno Anterior</span>
          </button>
          <button
            onClick={() => handleCommand('NEXT_TURN', null, 50)}
            disabled={isActionDisabled}
            className={`py-3.5 px-3 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shadow-lg transition-all ${
              isActionDisabled
                ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border border-slate-800'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white shadow-blue-600/30'
            }`}
          >
            <span>Siguiente Turno &gt;&gt;</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Team Chips Selector */}
        <div className="flex overflow-x-auto gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80 no-scrollbar">
          {masterState.teams.map((team) => {
            const isSelected = team.id === masterState.turn.activeTeamId;
            return (
              <button
                key={team.id}
                onClick={() => handleCommand('SELECT_TURN', { teamId: team.id }, 35)}
                disabled={isActionDisabled}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                  isActionDisabled
                    ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border border-slate-800'
                    : isSelected
                    ? 'bg-blue-600 text-white shadow ring-2 ring-white/30'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span>{team.name}</span>
                <span className="font-mono text-[11px] font-black opacity-80">
                  {team.score}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Tactile Content based on selected Tab */}
      <main className="flex-1 p-3.5 space-y-4">
        {/* Tab 1: Giant Scoring Buttons */}
        {activeTab === 'points' && (
          <div className="space-y-3 animate-fadeIn">
            {/* Primary Action Buttons: Big Green Correct & Big Red Strike */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  handleCommand(
                    'AWARD_POINTS',
                    {
                      teamId: activeTeam?.id,
                      points: 100,
                      actionName: 'Acierto Móvil',
                    },
                    70
                  )
                }
                disabled={isActionDisabled}
                className={`py-5 px-3 rounded-2xl font-black text-base shadow-lg border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                  isActionDisabled
                    ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                    : 'bg-gradient-to-b from-emerald-500 to-emerald-700 active:scale-95 text-white shadow-emerald-900/40 border-emerald-400/50'
                }`}
              >
                <CheckCircle className="w-7 h-7" />
                <span>¡CORRECTO!</span>
                <span className="text-xs font-normal opacity-90">+100 PTS</span>
              </button>

              <button
                onClick={() => handleCommand('TRIGGER_SOUND', 'error', 70)}
                disabled={isActionDisabled}
                className={`py-5 px-3 rounded-2xl font-black text-base shadow-lg border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                  isActionDisabled
                    ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                    : 'bg-gradient-to-b from-red-600 to-red-800 active:scale-95 text-white shadow-red-900/40 border-red-500/50'
                }`}
              >
                <XCircle className="w-7 h-7" />
                <span>FALLO / STRIKE</span>
                <span className="text-xs font-normal opacity-90">Buzzer ❌</span>
              </button>
            </div>

            {/* Giant Points Grid */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2 tracking-wider">
                Sumar / Restar Puntos al Turno Actual:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { pts: 1, label: '+1', color: 'from-blue-600 to-blue-700' },
                  { pts: 5, label: '+5', color: 'from-blue-600 to-blue-700' },
                  { pts: 10, label: '+10', color: 'from-indigo-600 to-indigo-700' },
                  { pts: 20, label: '+20', color: 'from-indigo-600 to-indigo-700' },
                  { pts: 50, label: '+50', color: 'from-amber-600 to-amber-700' },
                  { pts: 100, label: '+100', color: 'from-amber-600 to-amber-700' },
                  { pts: -1, label: '-1', color: 'from-slate-800 to-slate-900' },
                  { pts: -5, label: '-5', color: 'from-slate-800 to-slate-900' },
                  { pts: -10, label: '-10', color: 'from-red-950 to-red-900' },
                ].map((item) => (
                  <button
                    key={item.pts}
                    onClick={() =>
                      handleCommand(
                        'QUICK_ADJUST',
                        { teamId: activeTeam?.id, delta: item.pts },
                        item.pts > 0 ? 40 : 25
                      )
                    }
                    disabled={isActionDisabled}
                    className={`py-3.5 rounded-xl font-mono font-black text-lg transition-all border ${
                      isActionDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
                        : `text-white bg-gradient-to-b ${item.color} active:scale-95 shadow border-white/10`
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Context Action Helpers */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2 tracking-wider">
                Acciones del Juego en Pantalla:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCommand('REVEAL_GAME_ANSWER', null, 50)}
                  disabled={isActionDisabled}
                  className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow ${
                    isActionDisabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500'
                      : 'bg-purple-700 hover:bg-purple-600 active:scale-95 text-white'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Revelar Respuesta</span>
                </button>
                <button
                  onClick={() => handleCommand('NEXT_GAME_ITEM', null, 40)}
                  disabled={isActionDisabled}
                  className={`py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow ${
                    isActionDisabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500'
                      : 'bg-blue-700 hover:bg-blue-600 active:scale-95 text-white'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>Siguiente Pregunta</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: TV Master Scene Switcher */}
        {activeTab === 'scenes' && (
          <div className="space-y-2.5 animate-fadeIn">
            <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">
              Cambiar Salida del Proyector en Vivo:
            </span>
            {[
              {
                mode: 'RAFFLE_STAGE' as MasterViewMode,
                label: 'SORTEOS Y RIFAS',
                desc: 'Ruleta de la fortuna, slots, tómbola y emparejador',
                icon: Gift,
                color: 'from-amber-500 to-yellow-500',
              },
              {
                mode: 'GAME_STAGE' as MasterViewMode,
                label: 'ESCENARIO DE JUEGOS',
                desc: 'Muestra la dinámica activa (Biblia, Ahorcado, etc.)',
                icon: Gamepad2,
                color: 'from-amber-600 to-amber-500',
              },
              {
                mode: 'SCOREBOARD_ONLY' as MasterViewMode,
                label: 'MARCADOR GIGANTE',
                desc: 'Marcador deportivo / duelos 1v1 y sets',
                icon: Tv,
                color: 'from-blue-600 to-cyan-500',
              },
              {
                mode: 'LEADERBOARD_FULL' as MasterViewMode,
                label: 'TABLA DE POSICIONES',
                desc: 'Clasificación general de todos los equipos',
                icon: Trophy,
                color: 'from-emerald-600 to-teal-500',
              },
              {
                mode: 'PODIUM_CELEBRATION' as MasterViewMode,
                label: 'PODIO / GANADORES',
                desc: 'Ceremonia de premiación con confeti y fanfarria',
                icon: Award,
                color: 'from-purple-600 to-pink-500',
              },
              {
                mode: 'BLACKOUT' as MasterViewMode,
                label: 'PANTALLA NEGRA / INTERMEDIO',
                desc: 'Pausa momentánea en la proyección',
                icon: EyeOff,
                color: 'from-slate-700 to-slate-800',
              },
            ].map((sc) => {
              const Icon = sc.icon;
              const isActive = masterState.viewMode === sc.mode;
              return (
                <button
                  key={sc.mode}
                  onClick={() => handleCommand('SET_VIEW_MODE', { viewMode: sc.mode }, 50)}
                  disabled={isActionDisabled}
                  className={`w-full p-4 rounded-2xl text-left border-2 flex items-center justify-between transition-all shadow-md ${
                    isActionDisabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                      : isActive
                      ? `bg-gradient-to-r ${sc.color} text-white border-white shadow-xl active:scale-98`
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 active:scale-98'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isActive ? 'bg-black/30' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-sm">{sc.label}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{sc.desc}</div>
                    </div>
                  </div>

                  {isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-black uppercase text-white animate-pulse">
                      AL AIRE
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Celebration Trigger */}
            <div className="pt-2">
              <button
                onClick={() => handleCommand('TRIGGER_CELEBRATION', null, 80)}
                disabled={isActionDisabled}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg ${
                  isActionDisabled
                    ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 active:scale-95 text-slate-950 shadow-amber-500/20'
                }`}
              >
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>Disparar Celebración y Confeti</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Switch Active Game */}
        {activeTab === 'games' && (
          <div className="space-y-2.5 animate-fadeIn">
            <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">
              Seleccionar Dinámica Activa:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {gameOptions.map((g) => {
                const Icon = g.icon;
                const isCurrent = masterState.gameStage.activeGameId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      handleCommand('SET_ACTIVE_GAME', { gameId: g.id }, 40);
                      handleCommand('SET_VIEW_MODE', { viewMode: 'GAME_STAGE' }, 40);
                    }}
                    disabled={isActionDisabled}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      isActionDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
                        : isCurrent
                        ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg ring-1 ring-blue-400 active:scale-98'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 active:scale-98'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-5 h-5 ${isCurrent ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="font-bold text-sm text-slate-200">{g.label}</span>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                        isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCurrent ? '● Seleccionado' : 'Elegir'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Sound FX Launchpad */}
        {activeTab === 'sounds' && (
          <div className="space-y-3 animate-fadeIn">
            <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">
              Efectos de Sonido Inmediatos (Web Audio API):
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { sound: 'correct' as const, label: '🔔 Ding (Acierto)', color: 'bg-emerald-600' },
                { sound: 'error' as const, label: '❌ Buzzer (Error)', color: 'bg-red-600' },
                { sound: 'turn' as const, label: '🔄 Turno Pop', color: 'bg-blue-600' },
                { sound: 'timesUp' as const, label: '🎺 Bocina Final', color: 'bg-amber-600' },
                { sound: 'fanfare' as const, label: '🎉 Fanfarria Campeón', color: 'bg-purple-600' },
                { sound: 'wheel' as const, label: '🎡 Ruleta Click', color: 'bg-pink-600' },
                { sound: 'drumroll' as const, label: '🥁 Redoble Tambor', color: 'bg-indigo-600' },
                { sound: 'splash' as const, label: '💦 Al Agua / Splash', color: 'bg-cyan-700' },
              ].map((s) => (
                <button
                  key={s.sound}
                  onClick={() => handleCommand('TRIGGER_SOUND', s.sound, 50)}
                  disabled={isActionDisabled}
                  className={`py-5 px-3 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center text-center transition-all border ${
                    isActionDisabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-600'
                      : `${s.color} active:scale-95 text-white border-white/20`
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Master Clock Box on phone */}
            <div className="mt-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Cronómetro Maestro</span>
                </span>
                <span className="text-xl font-mono font-black text-white">
                  {formatTimeDisplay(
                    masterState.timer.mode === 'countdown'
                      ? masterState.timer.secondsRemaining
                      : masterState.timer.stopwatchSeconds
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => handleCommand('TOGGLE_TIMER', null, 40)}
                  disabled={isActionDisabled}
                  className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow ${
                    isActionDisabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600'
                      : masterState.timer.isRunning
                      ? 'bg-amber-600 text-slate-950 active:scale-95'
                      : 'bg-emerald-600 text-white active:scale-95'
                  }`}
                >
                  {masterState.timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{masterState.timer.isRunning ? 'Pausar Reloj' : 'Iniciar Reloj'}</span>
                </button>
                <button
                  onClick={() => handleCommand('RESET_TIMER', null, 40)}
                  disabled={isActionDisabled}
                  className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${
                    isActionDisabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600'
                      : 'bg-slate-800 active:scale-95 text-slate-300'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Buzzer Control (Requirement 6) */}
        {activeTab === 'buzzers' && (
          <div className="space-y-4 animate-fadeIn pb-14">
            {/* Buzzer Status Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-xs uppercase font-black text-slate-400 tracking-wider mb-1">
                Estado de Pulsadores
              </div>
              <div className="text-xl font-black text-white">
                {masterState.buzzer?.status === 'open' ? (
                  <span className="text-emerald-400">⚡ ABIERTOS (Esperando)</span>
                ) : masterState.buzzer?.status === 'answering' ? (
                  <span className="text-amber-300">
                    🎤 {masterState.teams.find(t => t.id === masterState.buzzer?.answeringTeamId)?.name || 'Equipo'} Responde
                  </span>
                ) : (
                  <span className="text-slate-400">🔒 Cerrados</span>
                )}
              </div>

              {masterState.buzzer?.status === 'answering' && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 text-xs font-bold">
                  Orden: {masterState.buzzer.presses.map((p, i) => {
                    const tm = masterState.teams.find(t => t.id === p.teamId);
                    return `${i + 1}º ${tm?.name || p.teamId}`;
                  }).join(' → ')}
                </div>
              )}
            </div>

            {/* 4 Big Buzzer Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCommand('BUZZER_OPEN', null, 50)}
                disabled={isActionDisabled}
                className="py-5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm shadow-lg shadow-emerald-900/30 flex flex-col items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Zap className="w-6 h-6 fill-current" />
                <span>Abrir Pulsadores</span>
              </button>

              <button
                onClick={() => handleCommand('BUZZER_RESET', null, 40)}
                disabled={isActionDisabled}
                className="py-5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black text-sm border border-slate-700 flex flex-col items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <RotateCcw className="w-6 h-6" />
                <span>Reiniciar</span>
              </button>

              <button
                onClick={() => handleCommand('BUZZER_JUDGE', { result: 'correct' }, 60)}
                disabled={isActionDisabled || masterState.buzzer?.status !== 'answering'}
                className="py-5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-sm shadow-lg shadow-blue-900/30 flex flex-col items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <CheckCircle className="w-6 h-6" />
                <span>Correcto</span>
              </button>

              <button
                onClick={() => handleCommand('BUZZER_JUDGE', { result: 'incorrect' }, 60)}
                disabled={isActionDisabled || masterState.buzzer?.status !== 'answering'}
                className="py-5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm shadow-lg shadow-rose-900/30 flex flex-col items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <XCircle className="w-6 h-6" />
                <span>Incorrecto</span>
              </button>
            </div>

            {/* Connected teams status list */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Equipos conectados
              </div>
              {masterState.teams.map(team => {
                const client = masterState.buzzer?.connectedClients?.[team.id];
                const isConn = client?.connected;
                const lat = client?.latencyMs || 0;
                return (
                  <div key={team.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className="font-bold text-white">{team.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isConn ? (
                        <>
                          <span className="text-emerald-400 font-bold">En Vivo</span>
                          <span className={`font-mono ${lat > 150 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>{lat}ms</span>
                        </>
                      ) : (
                        <span className="text-slate-500">Desconectado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090e1d]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 flex items-center justify-around">
        {[
          { tab: 'points' as const, label: 'Puntos', icon: Zap },
          { tab: 'buzzers' as const, label: 'Pulsadores', icon: Radio },
          { tab: 'scenes' as const, label: 'Escenas', icon: Tv },
          { tab: 'games' as const, label: 'Juegos', icon: Gamepad2 },
          { tab: 'sounds' as const, label: 'Sonidos', icon: Volume2 },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => {
                triggerHaptic(20);
                setActiveTab(item.tab);
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isSelected
                  ? 'text-amber-400 scale-105 font-black'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* PIN Unlock Modal (Requirement 2) */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm bg-[#0b101f] border border-slate-700 rounded-3xl p-6 text-center shadow-2xl">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white">PIN de Operador</h3>
            <p className="text-xs text-slate-300 mt-1">
              Ingresa el PIN de 4 dígitos configurado en la Consola del Director para habilitar los botones de mando.
            </p>
            <p className="text-[11px] text-amber-400 font-mono mt-0.5">
              Sala: <strong>{roomCode}</strong>
            </p>

            <form onSubmit={handlePinSubmit} className="mt-4 space-y-3">
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                autoFocus
                className="w-full text-center tracking-[0.5em] text-3xl font-mono font-black py-3 px-4 bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-2xl text-white outline-none"
              />

              {localPinError && (
                <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-medium">
                  {localPinError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800"
                >
                  Modo Observador
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30"
                >
                  Desbloquear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

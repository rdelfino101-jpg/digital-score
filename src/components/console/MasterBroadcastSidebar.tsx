import React from 'react';
import {
  MasterLiveState,
  MasterViewMode,
  BroadcastTheme,
} from '../../types/masterStudio';
import { MasterProjectorView } from '../MasterProjectorView';
import { studioAudio } from '../../utils/audioSynth';
import {
  Tv,
  Gamepad2,
  Gift,
  Trophy,
  Award,
  EyeOff,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  Radio,
  Sliders,
  Layers,
  Music,
  Palette,
} from 'lucide-react';

interface MasterBroadcastSidebarProps {
  masterState: MasterLiveState;
  onSetViewMode: (mode: MasterViewMode) => void;
  onOpenProjector: () => void;
  onOpenThemeModal?: () => void;
  onTriggerCelebration: () => void;
  onBroadcastSound: (sound: 'correct' | 'error' | 'turn' | 'tick' | 'timesUp' | 'wheel' | 'fanfare' | 'drumroll' | 'splash') => void;
}

export const MasterBroadcastSidebar: React.FC<MasterBroadcastSidebarProps> = ({
  masterState,
  onSetViewMode,
  onOpenProjector,
  onOpenThemeModal,
  onTriggerCelebration,
  onBroadcastSound,
}) => {
  const [muted, setMuted] = React.useState(studioAudio.isMuted());

  const handleToggleMute = () => {
    const next = studioAudio.toggleMute();
    setMuted(next);
  };

  const handleSound = (sound: 'correct' | 'error' | 'turn' | 'tick' | 'timesUp' | 'wheel' | 'fanfare' | 'drumroll' | 'splash') => {
    if (sound === 'correct') studioAudio.playCorrect();
    else if (sound === 'error') studioAudio.playError();
    else if (sound === 'turn') studioAudio.playTurnChange();
    else if (sound === 'tick') studioAudio.playTick();
    else if (sound === 'timesUp') studioAudio.playTimesUp();
    else if (sound === 'wheel') studioAudio.playWheelClick();
    else if (sound === 'fanfare') studioAudio.playFanfare();
    else if (sound === 'drumroll') studioAudio.playDrumroll();
    else if (sound === 'splash') studioAudio.playEliminatedSplash();

    onBroadcastSound(sound);
  };

  const sceneButtons: Array<{
    mode: MasterViewMode;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    color: string;
    activeBorder: string;
  }> = [
    {
      mode: 'SCOREBOARD_ONLY',
      label: 'Marcador Deportivo',
      sublabel: 'Duelo 1v1 / Sets / Reloj',
      icon: Tv,
      color: 'from-blue-600 to-cyan-600',
      activeBorder: 'border-blue-400 text-white',
    },
    {
      mode: 'GAME_STAGE',
      label: 'Escenario de Juegos',
      sublabel: 'Dinámica Activa (10 Juegos)',
      icon: Gamepad2,
      color: 'from-amber-600 to-yellow-600',
      activeBorder: 'border-amber-400 text-white',
    },
    {
      mode: 'RAFFLE_STAGE',
      label: 'Sorteos y Rifas',
      sublabel: 'Ruleta / Slots / Tómbola',
      icon: Gift,
      color: 'from-yellow-500 to-amber-500',
      activeBorder: 'border-yellow-400 text-white',
    },
    {
      mode: 'LEADERBOARD_FULL',
      label: 'Tabla de Posiciones',
      sublabel: 'Clasificación General',
      icon: Trophy,
      color: 'from-emerald-600 to-teal-600',
      activeBorder: 'border-emerald-400 text-white',
    },
    {
      mode: 'PODIUM_CELEBRATION',
      label: 'Podio / Ganadores',
      sublabel: 'Ceremonia de Premiación',
      icon: Award,
      color: 'from-purple-600 to-pink-600',
      activeBorder: 'border-purple-400 text-white',
    },
    {
      mode: 'BLACKOUT',
      label: 'Pantalla Negra',
      sublabel: 'Pausa / Intermedio',
      icon: EyeOff,
      color: 'from-slate-700 to-slate-800',
      activeBorder: 'border-slate-500 text-slate-200',
    },
  ];

  const soundpadButtons: Array<{
    id: 'correct' | 'error' | 'turn' | 'tick' | 'timesUp' | 'wheel' | 'fanfare' | 'drumroll' | 'splash';
    label: string;
    icon: string;
    bg: string;
    border: string;
  }> = [
    { id: 'correct', label: 'Ding Acierto', icon: '🔔', bg: 'bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200', border: 'border-emerald-700/60' },
    { id: 'error', label: 'Buzzer Strike', icon: '❌', bg: 'bg-red-950/80 hover:bg-red-800 text-red-200', border: 'border-red-700/60' },
    { id: 'turn', label: 'Cambio Turno', icon: '🔄', bg: 'bg-blue-950/80 hover:bg-blue-800 text-blue-200', border: 'border-blue-700/60' },
    { id: 'timesUp', label: 'Bocina Reloj', icon: '🎺', bg: 'bg-amber-950/80 hover:bg-amber-800 text-amber-200', border: 'border-amber-700/60' },
    { id: 'fanfare', label: 'Fanfarria', icon: '🎉', bg: 'bg-purple-950/80 hover:bg-purple-800 text-purple-200', border: 'border-purple-700/60' },
    { id: 'drumroll', label: 'Redoble Suspenso', icon: '🥁', bg: 'bg-indigo-950/80 hover:bg-indigo-800 text-indigo-200', border: 'border-indigo-700/60' },
    { id: 'splash', label: 'Al Agua Splash', icon: '💦', bg: 'bg-cyan-950/80 hover:bg-cyan-800 text-cyan-200', border: 'border-cyan-700/60' },
    { id: 'wheel', label: 'Ruleta Tick', icon: '🎡', bg: 'bg-pink-950/80 hover:bg-pink-800 text-pink-200', border: 'border-pink-700/60' },
  ];

  return (
    <aside className="w-80 shrink-0 bg-[#0a0f1e] border-l border-slate-800/90 flex flex-col h-full overflow-hidden select-none">
      {/* 1. TOP: Integrated Live Preview Monitor (16:9 Fixed) */}
      <div className="p-3 bg-slate-950/90 border-b border-slate-800/90 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              Monitor Salida en Vivo
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
              {masterState.viewMode}
            </span>
            <button
              onClick={onOpenProjector}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Abrir en ventana de Proyección externa"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 16:9 Embedded Projector Container */}
        <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-slate-800 shadow-inner group">
          <div className="pointer-events-none absolute inset-0 transform scale-[0.38] origin-top-left w-[263.2%] h-[263.2%]">
            <MasterProjectorView masterState={masterState} isEmbeddedPreview={true} />
          </div>

          {/* Hover helper badge */}
          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-300 pointer-events-none">
            Vista Proyector 16:9
          </div>
        </div>

        {/* Quick Theme & Background Trigger */}
        <button
          onClick={onOpenThemeModal}
          className="w-full mt-2.5 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/50 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-between transition-all group shadow-sm"
          title="Personalizar los 9 temas o imagen de fondo del proyector"
        >
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" strokeWidth={2.2} />
            <span className="text-[11px] text-slate-300">Tema Proyector:</span>
            <span className="text-[11px] font-extrabold text-white capitalize">{masterState.scene.theme}</span>
          </div>
          <span className="text-[10px] text-purple-300 font-mono">Cambiar 🎨</span>
        </button>
      </div>

      {/* Scrollable Center: Scene Switcher + Soundpad */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* 2. Switcher Maestro de Escenas (TV Director Style) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" strokeWidth={2.2} />
              <span>Escena al Aire</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Proyector</span>
          </div>

          <div className="space-y-1.5">
            {sceneButtons.map((btn) => {
              const Icon = btn.icon;
              const isLive = masterState.viewMode === btn.mode;

              return (
                <button
                  key={btn.mode}
                  onClick={() => onSetViewMode(btn.mode)}
                  className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                    isLive
                      ? `bg-gradient-to-r ${btn.color} ${btn.activeBorder} shadow-lg ring-2 ring-white/20 scale-[1.01]`
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-800/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isLive ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-black truncate ${isLive ? 'text-white' : 'text-slate-100'}`}>
                        {btn.label}
                      </div>
                      <div className="text-[10px] opacity-75 truncate">{btn.sublabel}</div>
                    </div>
                  </div>

                  {isLive && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-black/40 text-white shrink-0 animate-pulse">
                      EN VIVO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Botonera de Sonido FX (Stream Deck) */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Soundpad FX (Web Audio)</span>
            </span>

            <button
              onClick={handleToggleMute}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                muted ? 'bg-red-950 border border-red-800 text-red-300' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={muted ? 'Activar Sonido FX' : 'Silenciar Sonidos FX'}
            >
              {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              <span>{muted ? 'Silenciado' : 'Audio ON'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {soundpadButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleSound(btn.id)}
                className={`py-2 px-2 rounded-xl text-xs font-bold border ${btn.border} ${btn.bg} active:scale-95 shadow transition-all flex items-center gap-1.5`}
              >
                <span className="text-sm">{btn.icon}</span>
                <span className="truncate text-[11px] font-sans">{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Champion Celebration Button */}
          <button
            onClick={onTriggerCelebration}
            className="w-full mt-2.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-98 transition-all"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Disparar Celebración y Confeti</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

import React from 'react';
import {
  MasterLiveState,
  MasterViewMode,
  BroadcastTheme,
} from '../../types/masterStudio';
import { MasterProjectorView } from '../MasterProjectorView';
import { studioAudio } from '../../utils/audioSynth';
import { resolveEventBrand } from '../../styles/eventBrand';
import { nombreEscena } from '../../utils/textosInterfaz';
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
  }> = [
    { mode: 'SCOREBOARD_ONLY', label: 'Marcador', sublabel: 'Duelo o tabla con reloj', icon: Tv },
    { mode: 'GAME_STAGE', label: 'Juego', sublabel: 'La dinámica activa', icon: Gamepad2 },
    { mode: 'RAFFLE_STAGE', label: 'Sorteo', sublabel: 'Ruleta, tómbola, retos', icon: Gift },
    { mode: 'LEADERBOARD_FULL', label: 'Tabla de posiciones', sublabel: 'Clasificación general', icon: Trophy },
    { mode: 'PODIUM_CELEBRATION', label: 'Podio', sublabel: 'Premiación', icon: Award },
    { mode: 'BLACKOUT', label: 'Pantalla en pausa', sublabel: 'Intermedio', icon: EyeOff },
  ];

  const soundpadButtons: Array<{
    id: 'correct' | 'error' | 'turn' | 'tick' | 'timesUp' | 'wheel' | 'fanfare' | 'drumroll' | 'splash';
    label: string;
    icon: string;
  }> = [
    { id: 'correct', label: 'Acierto', icon: '🔔' },
    { id: 'error', label: 'Error', icon: '❌' },
    { id: 'turn', label: 'Cambio de turno', icon: '🔄' },
    { id: 'timesUp', label: 'Fin del tiempo', icon: '🎺' },
    { id: 'fanfare', label: 'Fanfarria', icon: '🎉' },
    { id: 'drumroll', label: 'Redoble', icon: '🥁' },
    { id: 'splash', label: 'Al agua', icon: '💦' },
    { id: 'wheel', label: 'Ruleta', icon: '🎡' },
  ];

  const brand = resolveEventBrand(masterState.scene.eventBrand);

  return (
    <aside className="flex h-full w-[288px] shrink-0 select-none flex-col overflow-hidden border-l border-[var(--c-line)] bg-[var(--c-panel)] 2xl:w-80">
      {/* Monitor del proyector */}
      <div className="shrink-0 border-b border-[var(--c-line)] p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
            <span className="text-[13px] font-bold text-[var(--c-text)]">En pantalla</span>
            <span className="text-[12px] text-[var(--c-text-3)]">· {nombreEscena(masterState.viewMode)}</span>
          </div>
          <button
            onClick={onOpenProjector}
            className="rounded-md p-1 text-[var(--c-text-3)] transition-colors hover:bg-[var(--c-panel-2)] hover:text-[var(--c-text)]"
            title="Abrir el proyector en otra ventana"
            aria-label="Abrir el proyector en otra ventana"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {/* El proyector se escala solo a esta caja (antes se encogía dos veces) */}
        <div
          className="pointer-events-none relative aspect-video w-full overflow-hidden rounded-lg border border-[var(--c-line)] bg-black"
          data-proyector
        >
          <MasterProjectorView masterState={masterState} isEmbeddedPreview={true} />
        </div>

        <button
          onClick={onOpenThemeModal}
          className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--c-line)] bg-[var(--c-panel-2)] px-3 py-2 text-left transition-colors hover:border-[var(--c-line-strong)]"
          title="Editar nombre, logo, colores y fondo del proyector"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Palette className="h-4 w-4 shrink-0 text-[var(--c-text-3)]" strokeWidth={2.2} />
            <span className="truncate text-[13px] font-semibold text-[var(--c-text)]">{brand.name}</span>
          </span>
          <span className="shrink-0 text-[12px] font-semibold text-[var(--c-accent)]">Editar marca</span>
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-3">
        {/* Escena al aire */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-[12px] font-bold text-[var(--c-text-2)]">
            <Layers className="h-4 w-4" strokeWidth={2.2} />
            Escena al aire
          </h2>
          <div className="space-y-1">
            {sceneButtons.map((btn) => {
              const Icon = btn.icon;
              const isLive = masterState.viewMode === btn.mode;
              return (
                <button
                  key={btn.mode}
                  onClick={() => onSetViewMode(btn.mode)}
                  aria-pressed={isLive}
                  className={`relative flex w-full items-center gap-3 overflow-hidden rounded-lg border px-3 py-2 text-left transition-colors ${
                    isLive
                      ? 'border-red-500/60 bg-red-500/10'
                      : 'border-transparent hover:border-[var(--c-line)] hover:bg-[var(--c-panel-2)]'
                  }`}
                >
                  {isLive && <span className="absolute inset-y-0 left-0 w-1 bg-red-500" aria-hidden />}
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isLive ? 'text-red-400' : 'text-[var(--c-text-3)]'}`}
                    strokeWidth={2.2}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] font-semibold ${isLive ? 'text-[var(--c-text)]' : 'text-[var(--c-text)]'}`}>
                      {btn.label}
                    </span>
                    <span className="block truncate text-[12px] text-[var(--c-text-3)]">{btn.sublabel}</span>
                  </span>
                  {isLive && (
                    <span className="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">Al aire</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Sonidos */}
        <section className="border-t border-[var(--c-line)] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[12px] font-bold text-[var(--c-text-2)]">
              <Music className="h-4 w-4" strokeWidth={2.2} />
              Sonidos
            </h2>
            <button
              onClick={handleToggleMute}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-semibold transition-colors ${
                muted ? 'bg-red-500/15 text-red-300' : 'text-[var(--c-text-3)] hover:bg-[var(--c-panel-2)] hover:text-[var(--c-text)]'
              }`}
              title={muted ? 'Activar sonidos' : 'Silenciar sonidos'}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{muted ? 'Silenciado' : 'Activos'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {soundpadButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleSound(btn.id)}
                className="flex items-center gap-2 rounded-lg border border-[var(--c-line)] bg-[var(--c-panel-2)] px-2.5 py-2 text-left text-[12px] font-semibold text-[var(--c-text)] transition-colors hover:border-[var(--c-line-strong)] active:scale-[0.98]"
              >
                <span className="text-[14px] leading-none">{btn.icon}</span>
                <span className="min-w-0 leading-tight">{btn.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={onTriggerCelebration}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-[13px] font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
          >
            <Sparkles className="h-4 w-4" />
            Celebración con confeti
          </button>
        </section>
      </div>
    </aside>
  );
};

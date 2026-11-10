import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MasterLiveState } from '../types/masterStudio';
import { CelebrationCanvas } from './CelebrationCanvas';
import { GameStageDisplay } from './projector/GameStageDisplay';
import { ScoreboardViewDisplay } from './projector/ScoreboardViewDisplay';
import { PodiumCelebrationDisplay } from './projector/PodiumCelebrationDisplay';
import { RaffleStageDisplay } from './projector/raffle/RaffleStageDisplay';
import { BuzzerProjectorOverlay } from './projector/BuzzerProjectorOverlay';
import { Radio, Flame, ArrowLeft, RadioTower, Maximize, Minimize, Clock, Trophy } from 'lucide-react';
import { useScreenWakeLock } from '../utils/wakeLock';
import { useProjectorScale } from '../hooks/useProjectorScale';
import { formatTimeDisplay, rankStudioTeams } from '../utils/gameEngineRules';
import {
  PROJECTOR_DEFAULT_THEME,
  PROJECTOR_HIGH_CONTRAST_THEME,
} from '../styles/projectorTheme';

interface MasterProjectorViewProps {
  masterState: MasterLiveState | null;
  onExitProjector?: () => void;
  isEmbeddedPreview?: boolean;
}

export const MasterProjectorView: React.FC<MasterProjectorViewProps> = ({
  masterState,
  onExitProjector,
  isEmbeddedPreview = false,
}) => {
  // Screen Wake Lock for Projector
  useScreenWakeLock(!isEmbeddedPreview);

  // Outer container ref for 1920x1080 fixed scaling
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scale = useProjectorScale(containerRef);

  // Fullscreen & Mouse Activity Management
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    return typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false;
  });
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-attempt fullscreen on load when opened directly
  useEffect(() => {
    if (typeof document !== 'undefined' && !isEmbeddedPreview) {
      try {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } catch {}
    }
  }, [isEmbeddedPreview]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Auto-hide controls after 3 seconds of mouse inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // High contrast theme detection (pure black background, #111 panels, white borders)
  const isHighContrast =
    masterState?.scene.theme === 'high-contrast' ||
    (masterState?.scene.theme === 'custom' && (!masterState.scene.customBgImage || masterState.scene.customBgImage === ''));

  const themeTokens = isHighContrast ? PROJECTOR_HIGH_CONTRAST_THEME : PROJECTOR_DEFAULT_THEME;

  // Custom Background Image support
  const customBgImage = masterState?.scene.customBgImage || '';
  const customOverlayOpacity = masterState?.scene.customOverlayOpacity ?? 40;
  const customBgBlur = masterState?.scene.customBgBlur ?? 0;

  // If state is not loaded yet, show standby connecting screen
  if (!masterState) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0A0B1E] p-12 text-center select-none font-projector">
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-[#2A2D5C] bg-[#15173A] text-blue-400 shadow-2xl">
          <RadioTower className="h-16 w-16 animate-pulse" />
        </div>
        <h2 className="font-projector-title text-[48px] text-white">
          CONECTANDO CON LA SALA DE TRANSMISIÓN...
        </h2>
        <p className="mt-3 text-[24px] text-[#B8BCE6] font-medium">
          Esperando señal sincronizada de la consola del director
        </p>
      </div>
    );
  }

  const { viewMode, scene, hudToggles, timer, teams, scoreboard, gameStage } = masterState;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black select-none font-projector"
      style={{
        width: isEmbeddedPreview ? '100%' : '100vw',
        height: isEmbeddedPreview ? '100%' : '100vh',
      }}
    >
      {/* 
        FIXED 1920x1080 CANVAS
        Scaled via CSS transform: scale(${scale}) with transformOrigin 'center center'.
        Safe margin: padding 54px top/bottom and 96px left/right.
      */}
      <div
        id="projector-canvas"
        className="relative flex flex-col justify-between overflow-hidden shadow-2xl"
        style={{
          width: '1920px',
          height: '1080px',
          minWidth: '1920px',
          minHeight: '1080px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          padding: '54px 96px',
          backgroundColor: themeTokens.background,
          color: themeTokens.text,
        }}
      >
        {/* CUSTOM BACKGROUND IMAGE LAYER */}
        {customBgImage && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-300"
              style={{
                backgroundImage: `url(${customBgImage})`,
                filter: customBgBlur > 0 ? `blur(${customBgBlur}px)` : 'none',
                transform: customBgBlur > 0 ? 'scale(1.05)' : 'none',
              }}
            />
            <div
              className="absolute inset-0 bg-black transition-opacity duration-300"
              style={{ opacity: customOverlayOpacity / 100 }}
            />
          </div>
        )}

        {/* BROADCAST AMBIENT GLOW (Only on non-high-contrast) */}
        {!isHighContrast && (
          <>
            <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
            <div className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
          </>
        )}

        {/* FLOATING UPPER CONTROLS (AUTO-HIDES AFTER 3s OF INACTIVITY) */}
        {!isEmbeddedPreview && (
          <div
            className={`absolute top-4 right-6 z-50 flex items-center gap-3 transition-opacity duration-300 ${
              showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Salir de Pantalla Completa (F11)' : 'Pantalla Completa (F11)'}
              className="flex items-center gap-2 rounded-2xl border-2 border-white/20 bg-black/85 px-4 py-2 font-projector text-[18px] font-bold text-white shadow-2xl backdrop-blur-md transition-all hover:border-[#FFC53D] hover:bg-black"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="h-5 w-5 text-[#FFC53D]" />
                  <span>Salir F11</span>
                </>
              ) : (
                <>
                  <Maximize className="h-5 w-5 text-[#FFC53D]" />
                  <span>Pantalla Completa (F11)</span>
                </>
              )}
            </button>

            {onExitProjector && (
              <button
                onClick={onExitProjector}
                title="Regresar a la Consola"
                className="group flex items-center gap-2 rounded-2xl border-2 border-white/20 bg-black/85 px-4 py-2 font-projector text-[18px] font-bold text-white shadow-2xl backdrop-blur-md transition-all hover:border-white hover:bg-black"
              >
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                <span>Consola</span>
              </button>
            )}
          </div>
        )}

        {/* CELEBRATION CONFETTI EFFECTS */}
        <CelebrationCanvas
          active={Boolean(scene.celebrationActive || viewMode === 'PODIUM_CELEBRATION')}
          accentColor={scene.celebrationWinner?.color || '#FFC53D'}
        />

        {/* BUZZER STAGE OVERLAY & PULSING INDICATOR */}
        <BuzzerProjectorOverlay
          buzzerState={masterState.buzzer || null}
          teams={masterState.teams}
        />

        {/* VIEW SWITCHER ROUTING (ANIMATED WITH 400ms CURTAIN WIPE) */}
        <div key={viewMode} className="relative z-10 flex flex-1 min-h-0 w-full flex-col justify-between animate-projector-wipe">
          {viewMode === 'BLACKOUT' ? (
            /* INTERMISSION / PAUSE SCREEN OR PURE BLACKOUT */
            <IntermissionDisplay state={masterState} />
          ) : viewMode === 'RAFFLE_STAGE' ? (
            /* RAFFLE & GIVEAWAY STAGE */
            <RaffleStageDisplay state={masterState} />
          ) : viewMode === 'SCOREBOARD_ONLY' || viewMode === 'LEADERBOARD_FULL' ? (
            /* FULL SCOREBOARD / LEADERBOARD */
            <ScoreboardViewDisplay state={masterState} />
          ) : viewMode === 'PODIUM_CELEBRATION' ? (
            /* PODIUM CEREMONY */
            <PodiumCelebrationDisplay state={masterState} />
          ) : (
            /* GAME STAGE + ACTIVE GAME ARENA */
            <GameStageDisplay state={masterState} />
          )}
        </div>

        {/* LOWER THIRD TICKER BANNER */}
        {hudToggles.showTicker && scene.tickerActive && scene.tickerMessage && viewMode !== 'BLACKOUT' && (
          <div className="relative z-30 mt-3 -mx-[96px] -mb-[20px] shrink-0 border-t-2 border-[#2A2D5C] bg-[#0A0B1E]/95 px-12 py-2.5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-6">
              <span className="flex shrink-0 items-center gap-2 rounded-xl bg-red-600 px-4 py-1.5 font-projector text-[22px] font-black uppercase tracking-wider text-white shadow-md">
                <Flame className="h-5 w-5 text-[#FFC53D]" />
                EN VIVO
              </span>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-projector text-[28px] font-bold text-white tracking-wide">
                  {scene.tickerMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * Intermission / Pause Screen with 300px Countdown & Next Game
 * ------------------------------------------------------------- */
const IntermissionDisplay: React.FC<{ state: MasterLiveState }> = ({ state }) => {
  const { timer, teams, gameStage, scoreboard } = state;
  const ranked = rankStudioTeams(teams, true).slice(0, 3);

  // If timer is not running and remaining is 0, show standby pause screen
  const secondsLeft = timer.secondsRemaining;
  const isCountdown = timer.mode === 'countdown' && secondsLeft > 0;

  const nextGameLabel = getNextGameLabel(gameStage.activeGameId);

  return (
    <div className="flex h-full w-full flex-col items-center justify-between py-4 text-center select-none animate-projector-wipe">
      {/* Top Header */}
      <div className="flex items-center gap-3 rounded-full border-2 border-red-500/60 bg-[#15173A] px-8 py-2.5 shadow-2xl">
        <Radio className="h-7 w-7 text-red-500 animate-pulse" />
        <span className="font-projector text-[24px] font-black uppercase tracking-widest text-red-400">
          SEÑAL EN ESPERA • INTERMEDIO OFICIAL
        </span>
      </div>

      {/* Center Hero: "Volvemos en" + Giant Countdown (300px) */}
      <div className="my-auto flex flex-col items-center justify-center">
        <p className="font-projector text-[32px] font-extrabold uppercase tracking-widest text-[#B8BCE6]">
          {isCountdown ? 'VOLVEMOS EN' : 'REGRESAMOS EN BREVES MOMENTOS'}
        </p>

        {isCountdown ? (
          <div className="font-projector tabular-numbers text-[280px] font-black leading-none text-white drop-shadow-[0_10px_40px_rgba(0,0,0,0.9)] my-2">
            {formatTimeDisplay(secondsLeft)}
          </div>
        ) : (
          <div className="my-6 flex h-40 w-40 items-center justify-center rounded-full border-4 border-[#2A2D5C] bg-[#15173A] shadow-2xl">
            <Clock className="h-20 w-20 text-[#FFC53D] animate-pulse" />
          </div>
        )}

        {/* A continuación: [juego o dinámica] */}
        <div className="mt-4 flex items-center gap-4 rounded-3xl border-2 border-[#FFC53D] bg-[#15173A] px-10 py-3 shadow-xl">
          <span className="font-projector text-[24px] font-bold text-[#B8BCE6]">
            A CONTINUACIÓN:
          </span>
          <span className="font-projector-title text-[36px] text-[#FFC53D]">
            {nextGameLabel}
          </span>
        </div>
      </div>

      {/* Bottom: Top 3 Teams Standings */}
      {ranked.length > 0 && (
        <div className="flex w-full max-w-4xl flex-col items-center border-t-2 border-[#2A2D5C] pt-6">
          <span className="font-projector text-[20px] font-bold uppercase tracking-widest text-[#B8BCE6] mb-3">
            LÍDERES DE LA TABLA
          </span>
          <div className="flex w-full items-center justify-center gap-6">
            {ranked.map((t) => (
              <div
                key={t.id}
                className="flex flex-1 items-center justify-between rounded-2xl border-2 border-[#2A2D5C] bg-[#15173A] px-6 py-3 shadow-md"
                style={{ borderLeftColor: t.color, borderLeftWidth: '8px' }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-projector text-[22px] font-black text-[#B8BCE6]">
                    #{t.rank}
                  </span>
                  <span className="font-projector text-[24px] font-black uppercase text-white truncate max-w-[140px]">
                    {t.name}
                  </span>
                </div>
                <span className="font-projector tabular-numbers text-[32px] font-black text-[#FFC53D]">
                  {t.score} PTS
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function getNextGameLabel(activeGameId: string): string {
  switch (activeGameId) {
    case 'bible_book':
      return '¿En qué libro está?';
    case 'who_said_it':
      return '¿Quién lo dijo?';
    case 'hangman':
      return 'Ahorcado Pro';
    case 'charades':
      return 'Charadas en Vivo';
    case 'family_feud':
      return '100 Personas Dijeron';
    case 'trivia_show':
      return 'Trivia Show';
    case 'anagram_wheel':
      return 'Anagrama & Ruleta';
    case 'music_karaoke':
      return 'Música & Karaoke Show';
    case 'millionaire_show':
      return '¿Quién Quiere Ser Millonario?';
    case 'deal_or_nodeal':
      return 'Trato Hecho (Deal or No Deal)';
    default:
      return 'Próxima Ronda Competitiva';
  }
}

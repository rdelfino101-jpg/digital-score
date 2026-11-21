import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MasterLiveState } from '../types/masterStudio';
import { CelebrationCanvas } from './CelebrationCanvas';
import { GameStageDisplay } from './projector/GameStageDisplay';
import { ScoreboardViewDisplay } from './projector/ScoreboardViewDisplay';
import { PodiumCelebrationDisplay } from './projector/PodiumCelebrationDisplay';
import { RaffleStageDisplay } from './projector/raffle/RaffleStageDisplay';
import { BuzzerProjectorOverlay } from './projector/BuzzerProjectorOverlay';
import { ArrowLeft, RadioTower, Maximize, Minimize, Clock } from 'lucide-react';
import { useScreenWakeLock } from '../utils/wakeLock';
import { useProjectorScale } from '../hooks/useProjectorScale';
import { formatTimeDisplay, rankStudioTeams } from '../utils/gameEngineRules';
import { resolveEventBrand, brandCssVars } from '../styles/eventBrand';
import { ProjectorBrandContext, useProjectorBrand } from './projector/common/brandContext';
import { BrandMark } from './projector/common/BrandMark';
import { FitText } from './projector/common/FitText';

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

  // High contrast theme detection (when theme is 'high-contrast')
  const isHighContrast = masterState?.scene.theme === 'high-contrast';

  const brand = resolveEventBrand(masterState?.scene.eventBrand);
  const brandVars = brandCssVars(brand, isHighContrast);

  // Custom Background Image support
  const customBgImage = masterState?.scene.customBgImage || '';
  const customOverlayOpacity = masterState?.scene.customOverlayOpacity ?? 40;
  const customBgBlur = masterState?.scene.customBgBlur ?? 0;

  // If state is not loaded yet, show standby connecting screen
  if (!masterState) {
    const waitingVars = brandCssVars(null, false);
    return (
      <div
        className="flex h-screen w-screen flex-col items-center justify-center p-12 text-center select-none font-projector"
        style={{
          ...(waitingVars as React.CSSProperties),
          backgroundColor: 'var(--p-bg)',
          color: 'var(--p-text)',
        }}
      >
        <div
          className="mb-6 flex h-28 w-28 items-center justify-center rounded-3xl border-2 shadow-lg"
          style={{
            borderColor: 'var(--p-line)',
            backgroundColor: 'var(--p-panel)',
            color: 'var(--p-brand)',
          }}
        >
          <RadioTower className="h-16 w-16 animate-pulse" />
        </div>
        <h2 className="font-projector-title text-[48px]" style={{ color: 'var(--p-text)' }}>
          Conectando con la consola…
        </h2>
        <p className="mt-3 text-[24px] font-medium" style={{ color: 'var(--p-text-2)' }}>
          La pantalla aparecerá en cuanto la consola del director esté abierta.
        </p>
      </div>
    );
  }

  const { viewMode, scene, hudToggles } = masterState;

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
          ...(brandVars as React.CSSProperties),
          width: '1920px',
          height: '1080px',
          minWidth: '1920px',
          minHeight: '1080px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          padding: '54px 96px',
          backgroundColor: 'var(--p-bg)',
          color: 'var(--p-text)',
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
              className="flex items-center gap-2 rounded-2xl border-2 border-[var(--p-line-strong)] bg-[var(--p-panel)] px-4 py-2 font-projector text-[18px] font-bold text-[var(--p-text)] shadow-lg transition-all hover:border-[var(--p-accent-ink)]"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="h-5 w-5 text-[var(--p-accent-ink)]" />
                  <span>Salir F11</span>
                </>
              ) : (
                <>
                  <Maximize className="h-5 w-5 text-[var(--p-accent-ink)]" />
                  <span>Pantalla Completa (F11)</span>
                </>
              )}
            </button>

            {onExitProjector && (
              <button
                onClick={onExitProjector}
                title="Regresar a la Consola"
                className="group flex items-center gap-2 rounded-2xl border-2 border-[var(--p-line-strong)] bg-[var(--p-panel)] px-4 py-2 font-projector text-[18px] font-bold text-[var(--p-text)] shadow-lg transition-all hover:border-[var(--p-text)]"
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
          accentColor={scene.celebrationWinner?.color || brand.accent}
        />

        {/* BUZZER STAGE OVERLAY & PULSING INDICATOR */}
        <BuzzerProjectorOverlay
          buzzerState={masterState.buzzer || null}
          teams={masterState.teams}
        />

        {/* VIEW SWITCHER ROUTING (ANIMATED WITH 400ms CURTAIN WIPE) */}
        <ProjectorBrandContext.Provider value={brand}>
          <div key={viewMode} className="relative z-10 flex flex-1 min-h-0 w-full flex-col justify-between animate-projector-wipe">
            {viewMode === 'BLACKOUT' ? (
              /* INTERMISSION / PAUSE SCREEN */
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
        </ProjectorBrandContext.Provider>

        {/* LOWER THIRD TICKER BANNER */}
        {hudToggles.showTicker && scene.tickerActive && scene.tickerMessage && viewMode !== 'BLACKOUT' && viewMode !== 'PODIUM_CELEBRATION' && (
          <div
            className="relative z-30 mt-3 -mx-[96px] -mb-[54px] shrink-0 px-[96px] py-3.5 shadow-md"
            style={{
              backgroundColor: 'var(--p-brand)',
              color: 'var(--p-on-brand)',
            }}
          >
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                <BrandMark brand={brand} size={44} inverse />
              </div>
              <div className="flex-1 overflow-hidden">
                <p
                  className="truncate font-projector text-[30px] font-bold tracking-tight"
                  style={{ color: 'var(--p-on-brand)' }}
                >
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
 * Intermission / Pause Screen with BrandMark, Countdown & Top 3
 * ------------------------------------------------------------- */
const IntermissionDisplay: React.FC<{ state: MasterLiveState }> = ({ state }) => {
  const { timer, teams, gameStage } = state;
  const brand = useProjectorBrand();
  const ranked = rankStudioTeams(teams, true).slice(0, 3);

  const secondsLeft = timer.secondsRemaining;
  const isCountdown = timer.mode === 'countdown' && secondsLeft > 0;

  const nextGameLabel = getNextGameLabel(gameStage.activeGameId);

  return (
    <div className="flex h-full w-full flex-col items-center justify-between py-2 text-center select-none animate-projector-wipe">
      {/* Top Brand Header: BrandMark (72px) + Event Name + "Intermedio" */}
      <div className="flex items-center gap-5 rounded-3xl border-2 border-[var(--p-line)] bg-[var(--p-panel)] px-8 py-4 shadow-md">
        <BrandMark brand={brand} size={72} />
        <div className="flex flex-col items-start text-left">
          <span className="font-projector-title text-[36px] leading-tight text-[var(--p-text)]">
            {brand.name}
          </span>
          <span className="font-projector text-[24px] font-bold text-[var(--p-accent-ink)]">
            Intermedio
          </span>
        </div>
      </div>

      {/* Center Hero: "Volvemos en" + Giant Countdown */}
      <div className="my-auto flex flex-col items-center justify-center">
        <p className="font-projector text-[30px] font-bold tracking-wide text-[var(--p-text-2)]">
          {isCountdown ? 'Volvemos en' : 'Regresamos en breves momentos'}
        </p>

        {isCountdown ? (
          <div className="font-projector tabular-numbers text-[260px] font-black leading-none text-[var(--p-text)] my-2">
            {formatTimeDisplay(secondsLeft)}
          </div>
        ) : (
          <div className="my-6 flex h-36 w-36 items-center justify-center rounded-full border-4 border-[var(--p-line)] bg-[var(--p-panel)] shadow-md">
            <Clock className="h-18 w-18 text-[var(--p-accent-ink)] animate-pulse" />
          </div>
        )}

        {/* A continuación: [juego o dinámica] */}
        <div className="mt-4 flex items-center gap-4 rounded-3xl border-2 border-[var(--p-accent-ink)] bg-[var(--p-panel)] px-10 py-3.5 shadow-md">
          <span className="font-projector text-[24px] font-bold text-[var(--p-text-2)]">
            A continuación:
          </span>
          <span className="font-projector-title text-[36px] text-[var(--p-accent-ink)]">
            {nextGameLabel}
          </span>
        </div>
      </div>

      {/* Bottom: Top 3 Teams Standings */}
      {ranked.length > 0 && (
        <div className="flex w-full max-w-[1560px] flex-col items-center border-t-2 border-[var(--p-line)] pt-5">
          <span className="font-projector text-[20px] font-bold tracking-wider text-[var(--p-text-3)] mb-3">
            Líderes de la tabla
          </span>
          <div className="flex w-full items-center justify-center gap-6">
            {ranked.map((t) => (
              <div
                key={t.id}
                className="flex flex-1 min-w-0 items-center justify-between gap-4 rounded-2xl border-2 border-[var(--p-line)] bg-[var(--p-panel)] px-6 py-3.5 shadow-sm"
                style={{ borderLeftColor: t.color, borderLeftWidth: '8px' }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-projector text-[22px] font-black text-[var(--p-text-2)] shrink-0">
                    #{t.rank}
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <FitText max={26} min={16} className="font-projector font-extrabold text-[var(--p-text)]">
                      {t.name}
                    </FitText>
                  </div>
                </div>
                <span className="font-projector tabular-numbers text-[26px] font-black text-[var(--p-accent-ink)] shrink-0">
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

import React from 'react';
import {
  Cast,
  HelpCircle,
  RotateCcw,
  ExternalLink,
  SplitSquareVertical,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface ConsoleHeaderProps {
  isSplitView: boolean;
  onToggleSplitView: () => void;
  onOpenProjectorWindow: () => void;
  onOpenHelpModal: () => void;
  onResetDefaults: () => void;
  liveScoreboardTitle: string;
  autoSync: boolean;
  onToggleAutoSync: () => void;
  onForceSync: () => void;
  lastSyncText: string;
  isSyncFlash?: boolean;
}

export const ConsoleHeader: React.FC<ConsoleHeaderProps> = ({
  isSplitView,
  onToggleSplitView,
  onOpenProjectorWindow,
  onOpenHelpModal,
  onResetDefaults,
  liveScoreboardTitle,
  autoSync,
  onToggleAutoSync,
  onForceSync,
  lastSyncText,
  isSyncFlash = false,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/90 px-4 py-2.5 sm:px-6 backdrop-blur-md">
      {/* Brand & Live Indicator */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
            <Cast className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-scoreboard text-base sm:text-lg font-black tracking-wide text-white">
                SCOREBOARD STUDIO
              </span>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400">Consola de Control de Producción</p>
          </div>
        </div>

        {/* Live on air badge */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-bold tracking-wider">AL AIRE:</span>
          <span className="text-slate-200 truncate max-w-[170px]">{liveScoreboardTitle}</span>
        </div>

        {/* Live Sync Health & Diagnostic Indicator */}
        <div
          className={`flex items-center gap-2 rounded-xl border px-2.5 py-1 text-xs transition-colors ${
            isSyncFlash
              ? 'border-emerald-400 bg-emerald-950/60 shadow-sm shadow-emerald-500/30'
              : 'border-slate-800 bg-slate-900/80'
          }`}
          title="Monitorea la emisión continua hacia la pantalla secundaria"
        >
          <span
            className={`h-2 w-2 rounded-full transition-all ${
              isSyncFlash ? 'bg-emerald-300 scale-125' : 'bg-emerald-500'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Sync:</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-200">{lastSyncText}</span>
        </div>
      </div>

      {/* Action Buttons & Sync Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Auto-Sync Toggle Switch */}
        <label
          className="flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800/80 transition-colors select-none"
          title="Auto-sincronizar: Transmite instantáneamente cada clic (+1, -1, reloj, capas) a la pantalla secundaria"
        >
          <input
            type="checkbox"
            checked={autoSync}
            onChange={onToggleAutoSync}
            className="sr-only"
          />
          <div
            className={`relative h-4 w-7 rounded-full transition-colors ${
              autoSync ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                autoSync ? 'translate-x-3' : ''
              }`}
            />
          </div>
          <span className="text-[11px] font-bold text-slate-200 hidden sm:inline">Auto-Sync</span>
        </label>

        {/* Force Manual Sync Button */}
        <button
          onClick={onForceSync}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 hover:text-emerald-100 active:scale-95 transition-all shadow-sm"
          title="Forzar sincronización inmediata del estado actual a la pantalla de proyección"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncFlash ? 'animate-spin text-emerald-200' : ''}`} />
          <span className="hidden md:inline">Forzar Envío Live</span>
          <span className="md:hidden">Sync</span>
        </button>

        {/* Open Projector Window (Primary Launcher) */}
        <button
          onClick={onOpenProjectorWindow}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-600/25 transition-all hover:from-red-500 hover:to-rose-500 hover:shadow-red-600/40 active:scale-95"
          title="Abre la ventana secundaria para enviar al proyector (#projector)"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Abrir Pantalla de Proyección</span>
          <span className="sm:hidden">Proyector</span>
        </button>

        {/* Split View Toggle */}
        <button
          onClick={onToggleSplitView}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-all ${
            isSplitView
              ? 'border-blue-500 bg-blue-500/20 text-blue-300 shadow-sm'
              : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
          title="Activa la vista dividida en una sola pantalla para pruebas"
        >
          <SplitSquareVertical className="h-4 w-4 text-blue-400" />
          <span className="hidden lg:inline">Modo Prueba (Vista Dividida)</span>
          <span className="lg:hidden">Dividida</span>
        </button>

        {/* User Manual */}
        <button
          onClick={onOpenHelpModal}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title="Manual y atajos"
        >
          <HelpCircle className="h-4 w-4 text-amber-400" />
          <span className="hidden sm:inline">Manual</span>
        </button>

        {/* Reset to defaults */}
        <button
          onClick={onResetDefaults}
          className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
          title="Restablecer marcadores de ejemplo"
          aria-label="Restablecer marcadores de ejemplo"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

import React from 'react';
import { BroadcastTheme } from '../../types/masterStudio';
import {
  Tv,
  Gamepad2,
  Gift,
  Zap,
  ExternalLink,
  Columns,
  HelpCircle,
  Sparkles,
  Smartphone,
  Radio,
  Cast,
  Palette,
  FileSpreadsheet,
  Cloud,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

export type ActiveConsoleTab = 'scoreboard' | 'games' | 'raffle' | 'buzzers';

interface DirectorHeaderProps {
  activeTab: ActiveConsoleTab;
  onSelectTab: (tab: ActiveConsoleTab) => void;
  autoSyncToProjector: boolean;
  onToggleAutoSync: () => void;
  theme: BroadcastTheme;
  onOpenThemeModal: () => void;
  isSplitView: boolean;
  onToggleSplitView: () => void;
  onOpenProjectorWindow: () => void;
  onOpenRemoteModal: () => void;
  onOpenHelp: () => void;
  lastSyncText: string;
  isSyncFlash: boolean;
  projectorToast?: string | null;
  onOpenExcelModal: () => void;
  totalBankItems: number;
  roomCode?: string;
  canUndo?: boolean;
  undoCount?: number;
  onUndo?: () => void;
}

export const DirectorHeader: React.FC<DirectorHeaderProps> = ({
  activeTab,
  onSelectTab,
  autoSyncToProjector,
  onToggleAutoSync,
  theme,
  onOpenThemeModal,
  isSplitView,
  onToggleSplitView,
  onOpenProjectorWindow,
  onOpenRemoteModal,
  onOpenHelp,
  lastSyncText,
  isSyncFlash,
  projectorToast,
  onOpenExcelModal,
  totalBankItems,
  roomCode = 'K7P2',
  canUndo = false,
  undoCount = 0,
  onUndo,
}) => {
  const moduleTabs: Array<{
    id: ActiveConsoleTab;
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    activeColor: string;
    activeRing: string;
  }> = [
    {
      id: 'scoreboard',
      label: '1. Marcador',
      sub: 'Duelos 1v1 y Tabla',
      icon: Tv,
      activeColor: 'from-blue-600 to-indigo-600 text-white',
      activeRing: 'ring-blue-400/50 shadow-blue-500/20',
    },
    {
      id: 'games',
      label: '2. Game Show',
      sub: '10 Juegos TV',
      icon: Gamepad2,
      activeColor: 'from-amber-600 to-amber-500 text-slate-950',
      activeRing: 'ring-amber-400/50 shadow-amber-500/20',
    },
    {
      id: 'raffle',
      label: '3. Sorteos',
      sub: 'Ruleta, Retos, QR',
      icon: Gift,
      activeColor: 'from-yellow-500 to-amber-500 text-slate-950',
      activeRing: 'ring-yellow-400/50 shadow-yellow-500/20',
    },
    {
      id: 'buzzers',
      label: '4. Pulsadores',
      sub: 'Celulares y TV',
      icon: Zap,
      activeColor: 'from-amber-500 to-orange-500 text-slate-950',
      activeRing: 'ring-amber-400/50 shadow-amber-500/20',
    },
  ];

  // Human-readable theme label
  const themeLabels: Record<BroadcastTheme, string> = {
    'broadcast-dark': 'Nocturno',
    'sports-neon': 'Sports',
    'tv-game-gold': 'Game Show',
    'cyber-arcade': 'Cyber',
    'parchment-gold': 'Papiro',
    'versus-fire': 'Versus',
    'broadcast-light': 'Diurno',
    'chroma-green': 'Croma OBS',
    'high-contrast': 'Alto Contraste',
    custom: 'Personalizado',
  };

  return (
    <header className="h-16 shrink-0 bg-[#0c1222] border-b border-slate-800/90 shadow-xl px-3 flex items-center justify-between gap-2 z-40 select-none">
      {/* 1. LEFT ZONE: Brand, AL AIRE badge & Sync Heartbeat */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" strokeWidth={2.2} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm tracking-wider text-white uppercase font-sans whitespace-nowrap">
                Master Studio Pro
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white animate-pulse">
                AL AIRE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Consola del Director</p>
          </div>
        </div>

        {/* Room Code Badge (Prominently displayed) */}
        <button
          onClick={onOpenRemoteModal}
          className="flex items-center gap-2 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white transition-all shadow-md shadow-amber-500/10 cursor-pointer group shrink-0"
          title={`Sala Activa: ${roomCode}. Clic para ver QR, PIN de Operador y conectar Remotos.`}
          aria-label={`Sala ${roomCode}`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">SALA</span>
            <span className="font-mono font-black text-base text-white tracking-widest bg-slate-950 px-2 py-0.5 rounded-lg border border-amber-500/60 shadow-inner">
              {roomCode}
            </span>
          </div>
        </button>

        {/* Sync heartbeat badge */}
        <div
          className={`hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono transition-all ${
            isSyncFlash
              ? 'bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-400'
              : 'bg-slate-900/80 text-slate-300 border border-slate-800'
          }`}
          title="Sincronización en tiempo real vía BroadcastChannel y localStorage"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isSyncFlash ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'
            }`}
          />
          <span className="text-[10px] font-semibold">{lastSyncText}</span>
        </div>

        {/* Cloud bank counter badge with 1-click modal opener */}
        <button
          onClick={onOpenExcelModal}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-indigo-950/90 border border-indigo-600/70 text-indigo-200 hover:bg-indigo-900 hover:text-white transition-all shadow-sm cursor-pointer hover:border-indigo-400 group"
          title={`Banco Guardado: ${totalBankItems} reactivos activos. Clic para abrir el Gestor Excel y Nube.`}
        >
          <Cloud className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-[11px] whitespace-nowrap">
            <span className="hidden xl:inline">Banco Guardado </span>({totalBankItems} reactivos)
          </span>
        </button>
      </div>

      {/* 2. CENTER ZONE: Large Primary Module Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/90 shadow-inner">
        {moduleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? `bg-gradient-to-r ${tab.activeColor} shadow-md ring-2 ${tab.activeRing} font-black scale-[1.02]`
                  : 'text-slate-200 hover:text-white hover:bg-slate-850 font-bold'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 text-white" strokeWidth={2.2} />
              <div className="text-left">
                <div className="text-xs leading-tight whitespace-nowrap">{tab.label}</div>
              </div>
            </button>
          );
        })}

        {/* Compact Auto-Sync Toggle (Single line, whitespace-nowrap) */}
        <button
          onClick={onToggleAutoSync}
          className={`hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors whitespace-nowrap ${
            autoSyncToProjector
              ? 'bg-blue-950/80 border-blue-600/70 text-blue-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Al cambiar de pestaña, cambia automáticamente la escena de salida del proyector"
        >
          <Cast className={`w-3.5 h-3.5 shrink-0 ${autoSyncToProjector ? 'text-blue-400' : 'text-slate-300'}`} strokeWidth={2.2} />
          <span className="whitespace-nowrap">Auto-Sync: {autoSyncToProjector ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 3. RIGHT ZONE: Global Actions (Excel, Theme, Remote, Split View, Open Window, Help) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Gestor Excel y Nube Master Button */}
        <button
          onClick={onOpenExcelModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/40 transition-all hover:scale-102 active:scale-98 shrink-0"
          title="📊 Gestor Excel (.xlsx / .csv) y Sincronización en la Nube Multi-Dispositivo"
          aria-label="Gestor Excel y Nube"
        >
          <FileSpreadsheet className="w-4 h-4 text-white shrink-0" strokeWidth={2.2} />
          <span className="hidden xl:inline whitespace-nowrap">Gestor Excel & Nube</span>
        </button>

        {/* Projector Theme Modal Launcher */}
        <button
          onClick={onOpenThemeModal}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 hover:border-purple-500/40 shadow-sm transition-all hover:scale-102 shrink-0"
          title="🎨 Abrir selector de 9 temas y fondo personalizado del proyector"
          aria-label="Tema y Fondo de Proyección"
        >
          <Palette className="w-4 h-4 text-purple-400 shrink-0" strokeWidth={2.2} />
          <span className="hidden xl:inline text-slate-300 text-[11px]">Tema:</span>
          <span className="font-extrabold text-white text-[11px]">{themeLabels[theme] || 'Nocturno'}</span>
        </button>

        {/* Remote Control Modal Button (Compact square icon) */}
        <button
          onClick={onOpenRemoteModal}
          className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/40 shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
          title="Control Remoto Móvil para Smartphones (Código QR y Wi-Fi)"
          aria-label="Control Remoto Móvil"
        >
          <Smartphone className="w-5 h-5 text-amber-400" strokeWidth={2.2} />
        </button>

        {/* Undo Action Button (Deshacer) */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2.5 rounded-lg border transition-all flex items-center justify-center shrink-0 ${
            canUndo
              ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 hover:border-cyan-400 hover:scale-105 active:scale-95 shadow-sm cursor-pointer'
              : 'bg-slate-950/60 text-slate-600 border-slate-850 cursor-not-allowed opacity-40'
          }`}
          title={
            canUndo
              ? `↩️ Deshacer último cambio de puntaje o turno (Ctrl+Z) [${undoCount} disponibles]`
              : 'Deshacer último cambio (Ctrl+Z) - Sin acciones'
          }
          aria-label="Deshacer último cambio"
        >
          <RotateCcw className="w-5 h-5 text-current" strokeWidth={2.2} />
        </button>

        {/* Split View Toggle (Compact square icon) */}
        <button
          onClick={onToggleSplitView}
          className={`p-2.5 rounded-lg border transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0 ${
            isSplitView
              ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm ring-1 ring-blue-500/40'
              : 'bg-slate-900 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800'
          }`}
          title="Vista Dividida (Ver pantalla de proyección al lado de la consola)"
          aria-label="Vista Dividida"
        >
          <Columns className="w-5 h-5 text-blue-300" strokeWidth={2.2} />
        </button>

        {/* Projector Toast Notification Badge */}
        {projectorToast && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/90 border border-blue-400 text-blue-200 text-xs font-black shadow-lg shadow-blue-500/30 animate-pulse shrink-0 whitespace-nowrap">
            <span>{projectorToast}</span>
          </div>
        )}

        {/* Primary Projector Launcher Button - Standout blue compact square button */}
        <button
          onClick={onOpenProjectorWindow}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
          title="Abrir Pantalla de Proyección (Pantalla Secundaria / Proyector)"
          aria-label="Abrir Pantalla de Proyección"
        >
          <ExternalLink className="w-5 h-5 text-white" strokeWidth={2.2} />
        </button>

        {/* Help Manual Button (Compact square icon) */}
        <button
          onClick={onOpenHelp}
          className="p-2.5 text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
          title="Manual de Operación y Atajos de Teclado"
          aria-label="Manual de Operación y Atajos"
        >
          <HelpCircle className="w-5 h-5 text-slate-200" strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
};

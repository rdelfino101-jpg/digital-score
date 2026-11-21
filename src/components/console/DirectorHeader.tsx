import React, { useEffect, useRef, useState } from 'react';
import { BroadcastTheme } from '../../types/masterStudio';
import {
  Tv,
  Gamepad2,
  Gift,
  Zap,
  MonitorUp,
  Columns2,
  HelpCircle,
  Smartphone,
  Cast,
  Palette,
  FileSpreadsheet,
  Undo2,
  MoreHorizontal,
  Check,
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

const PESTANAS: Array<{
  id: ActiveConsoleTab;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
  { id: 'scoreboard', label: 'Marcador', icon: Tv },
  { id: 'games', label: 'Juegos', icon: Gamepad2 },
  { id: 'raffle', label: 'Sorteos', icon: Gift },
  { id: 'buzzers', label: 'Pulsadores', icon: Zap },
];

/**
 * Barra superior de la consola.
 * Pensada para laptop de 13–15": lo que se usa en vivo queda a la vista
 * (pestañas, deshacer, proyector) y lo que se configura una vez vive en "Más".
 */
export const DirectorHeader: React.FC<DirectorHeaderProps> = ({
  activeTab,
  onSelectTab,
  autoSyncToProjector,
  onToggleAutoSync,
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
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuAbierto) return;
    const alClic = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAbierto(false);
    };
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    document.addEventListener('mousedown', alClic);
    document.addEventListener('keydown', alTecla);
    return () => {
      document.removeEventListener('mousedown', alClic);
      document.removeEventListener('keydown', alTecla);
    };
  }, [menuAbierto]);

  const ejecutar = (accion: () => void) => () => {
    setMenuAbierto(false);
    accion();
  };

  return (
    <header className="relative z-40 flex h-14 shrink-0 select-none items-center gap-3 border-b border-[var(--c-line)] bg-[var(--c-panel)] px-3">
      {/* Marca de la app + sala */}
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--c-accent)] text-[13px] font-black text-white">
          SS
        </div>
        <div className="hidden min-w-0 2xl:block">
          <p className="text-[13px] font-bold leading-tight text-[var(--c-text)]">Scoreboard Studio</p>
          <p className="text-[11px] leading-tight text-[var(--c-text-3)]">Consola del director</p>
        </div>

        <button
          onClick={onOpenRemoteModal}
          className="flex items-center gap-2 rounded-lg border border-[var(--c-line)] bg-[var(--c-panel-2)] px-2.5 py-1.5 transition-colors hover:border-[var(--c-line-strong)]"
          title={`Sala ${roomCode}. ${lastSyncText ? `Última sincronización ${lastSyncText}. ` : ''}Clic para ver el QR y el PIN del control remoto.`}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full transition-colors ${isSyncFlash ? 'bg-emerald-300' : 'bg-emerald-500'}`}
            aria-hidden
          />
          <span className="text-[12px] text-[var(--c-text-2)]">Sala</span>
          <span className="font-mono text-[14px] font-bold tracking-[0.08em] text-[var(--c-text)]">{roomCode}</span>
        </button>
      </div>

      {/* Pestañas de módulo */}
      <nav
        className="mx-auto flex min-w-0 items-center gap-1 rounded-xl border border-[var(--c-line)] bg-[var(--c-bg)] p-1"
        aria-label="Módulos de la consola"
      >
        {PESTANAS.map((tab) => {
          const Icon = tab.icon;
          const activa = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              aria-current={activa ? 'page' : undefined}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] transition-colors xl:px-4 ${
                activa
                  ? 'bg-[var(--c-panel-2)] font-bold text-[var(--c-text)] shadow-[inset_0_0_0_1px_var(--c-line-strong)]'
                  : 'font-semibold text-[var(--c-text-2)] hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${activa ? 'text-[var(--c-accent)]' : ''}`} strokeWidth={2.2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Acciones en vivo */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="relative flex h-9 items-center gap-1.5 rounded-lg border border-[var(--c-line)] bg-[var(--c-panel-2)] px-2.5 text-[13px] font-semibold text-[var(--c-text)] transition-colors enabled:hover:border-[var(--c-line-strong)] disabled:cursor-not-allowed disabled:opacity-40"
          title={canUndo ? `Deshacer el último cambio de puntos o turno (Ctrl+Z). ${undoCount} disponibles.` : 'Nada que deshacer'}
          aria-label="Deshacer"
        >
          <Undo2 className="h-4 w-4" strokeWidth={2.2} />
          <span className="hidden xl:inline">Deshacer</span>
          {canUndo && undoCount > 0 && (
            <span className="rounded bg-[var(--c-line)] px-1 text-[11px] font-bold text-[var(--c-text-2)]">{undoCount}</span>
          )}
        </button>

        <button
          onClick={onOpenProjectorWindow}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[var(--c-accent)] px-3 text-[13px] font-bold text-white transition-colors hover:bg-blue-500"
          title="Abrir la pantalla del proyector en otra ventana"
        >
          <MonitorUp className="h-4 w-4" strokeWidth={2.2} />
          <span>Proyector</span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              menuAbierto
                ? 'border-[var(--c-line-strong)] bg-[var(--c-panel-2)] text-[var(--c-text)]'
                : 'border-[var(--c-line)] bg-[var(--c-panel-2)] text-[var(--c-text-2)] hover:text-[var(--c-text)]'
            }`}
            title="Más opciones"
            aria-label="Más opciones"
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={2.2} />
          </button>

          {menuAbierto && (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] w-72 overflow-hidden rounded-xl border border-[var(--c-line-strong)] bg-[var(--c-panel)] py-1.5 shadow-2xl shadow-black/50"
            >
              <MenuItem icon={Smartphone} onClick={ejecutar(onOpenRemoteModal)} label="Control remoto" detalle="QR y PIN para el celular" />
              <MenuItem
                icon={Columns2}
                onClick={ejecutar(onToggleSplitView)}
                label="Vista dividida"
                detalle="Ver el proyector junto a la consola"
                activo={isSplitView}
              />
              <MenuItem
                icon={Cast}
                onClick={ejecutar(onToggleAutoSync)}
                label="Cambiar escena con la pestaña"
                detalle="Al cambiar de módulo, el proyector lo sigue"
                activo={autoSyncToProjector}
              />
              <div className="my-1.5 border-t border-[var(--c-line)]" />
              <MenuItem
                icon={FileSpreadsheet}
                onClick={ejecutar(onOpenExcelModal)}
                label="Banco de preguntas"
                detalle={`${totalBankItems} preguntas · Excel y nube`}
              />
              <MenuItem icon={Palette} onClick={ejecutar(onOpenThemeModal)} label="Marca y fondo del proyector" detalle="Nombre, logo y colores" />
              <div className="my-1.5 border-t border-[var(--c-line)]" />
              <MenuItem icon={HelpCircle} onClick={ejecutar(onOpenHelp)} label="Manual y atajos" />
            </div>
          )}
        </div>
      </div>

      {projectorToast && (
        <div className="pointer-events-none absolute right-3 top-[calc(100%+8px)] rounded-lg border border-[var(--c-line-strong)] bg-[var(--c-panel)] px-3 py-2 text-[13px] font-semibold text-[var(--c-text)] shadow-xl">
          {projectorToast}
        </div>
      )}
    </header>
  );
};

const MenuItem: React.FC<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  detalle?: string;
  activo?: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, detalle, activo, onClick }) => (
  <button
    role={activo === undefined ? 'menuitem' : 'menuitemcheckbox'}
    aria-checked={activo}
    onClick={onClick}
    className="flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-[var(--c-panel-2)]"
  >
    <Icon className="h-4 w-4 shrink-0 text-[var(--c-text-2)]" strokeWidth={2.2} />
    <span className="min-w-0 flex-1">
      <span className="block text-[13px] font-semibold text-[var(--c-text)]">{label}</span>
      {detalle && <span className="block text-[12px] text-[var(--c-text-3)]">{detalle}</span>}
    </span>
    {activo !== undefined && (
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          activo ? 'border-[var(--c-accent)] bg-[var(--c-accent)] text-white' : 'border-[var(--c-line-strong)]'
        }`}
      >
        {activo && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
    )}
  </button>
);

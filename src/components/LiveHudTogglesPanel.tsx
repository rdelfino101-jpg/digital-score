import React from 'react';
import { LiveHudToggles } from '../types/scoreboard';
import {
  Layers,
  Timer,
  Hash,
  History,
  ShieldAlert,
  Flame,
  Heading,
  Eye,
  EyeOff,
  MessageSquare,
  LayoutTemplate,
  SlidersHorizontal,
} from 'lucide-react';

interface LiveHudTogglesPanelProps {
  toggles: LiveHudToggles;
  onChange: (updated: Partial<LiveHudToggles>) => void;
}

export const LiveHudTogglesPanel: React.FC<LiveHudTogglesPanelProps> = ({
  toggles,
  onChange,
}) => {
  const toggleItems: {
    key: keyof Omit<LiveHudToggles, 'viewMode'>;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'showTimer',
      label: 'Reloj / Cronómetro',
      description: 'Muestra u oculta el reloj principal en pantalla',
      icon: <Timer className="h-4 w-4 text-emerald-400" />,
    },
    {
      key: 'showPeriod',
      label: 'Ronda / Periodo Actual',
      description: 'Badge de Cuarto, Tiempo, Set o Ronda activa',
      icon: <Hash className="h-4 w-4 text-amber-400" />,
    },
    {
      key: 'showRoundHistory',
      label: 'Historial de Rondas/Sets',
      description: 'Muestra parciales de sets previos (ej. 25-21)',
      icon: <History className="h-4 w-4 text-blue-400" />,
    },
    {
      key: 'showScores',
      label: 'Puntajes Principales',
      description: 'Oculta puntos para crear suspenso o dinámicas',
      icon: <Eye className="h-4 w-4 text-indigo-400" />,
    },
    {
      key: 'showPossession',
      label: 'Posesión / Saque / Turno',
      description: 'Indicador del equipo al saque o turno activo',
      icon: <Flame className="h-4 w-4 text-amber-500" />,
    },
    {
      key: 'showFouls',
      label: 'Faltas / Tarjetas',
      description: 'Contador de faltas de equipo o tarjetas',
      icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
    },
    {
      key: 'showEventTitles',
      label: 'Título y Subtítulo',
      description: 'Encabezado superior del evento o torneo',
      icon: <Heading className="h-4 w-4 text-slate-300" />,
    },
    {
      key: 'showTicker',
      label: 'Banner Ticker (Lower Third)',
      description: 'Avisos y anuncios en franja inferior',
      icon: <MessageSquare className="h-4 w-4 text-cyan-400" />,
    },
  ];

  const handleApplyPreset = (preset: 'all' | 'minimal' | 'suspense') => {
    if (preset === 'all') {
      onChange({
        showTimer: true,
        showPeriod: true,
        showRoundHistory: true,
        showFouls: true,
        showPossession: true,
        showEventTitles: true,
        showScores: true,
        showTicker: true,
        viewMode: 'standard',
      });
    } else if (preset === 'minimal') {
      onChange({
        showTimer: false,
        showPeriod: true,
        showRoundHistory: false,
        showFouls: false,
        showPossession: true,
        showEventTitles: false,
        showScores: true,
        showTicker: false,
        viewMode: 'standard',
      });
    } else if (preset === 'suspense') {
      onChange({
        showScores: false, // Hide scores for tension
        showPeriod: true,
        showEventTitles: true,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-400" />
          <h3 className="font-scoreboard text-sm font-bold uppercase tracking-wider text-white">
            Control de Capas en Vivo (Live HUD Toggles)
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Visibilidad Proyección
        </span>
      </div>

      {/* Mode View Switcher: Standard vs Summary Table */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-purple-400" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Modo de Visualización</span>
            <span className="text-[10px] text-slate-400">
              {toggles.viewMode === 'standard' ? 'Marcador Estándar' : 'Solo Tabla Resumen'}
            </span>
          </div>
        </div>

        <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
          <button
            onClick={() => onChange({ viewMode: 'standard' })}
            className={`rounded-md px-2.5 py-1 font-bold ${
              toggles.viewMode === 'standard'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Marcador
          </button>
          <button
            onClick={() => onChange({ viewMode: 'summary_table' })}
            className={`rounded-md px-2.5 py-1 font-bold ${
              toggles.viewMode === 'summary_table'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tabla Resumen
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
        <button
          onClick={() => handleApplyPreset('all')}
          className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Todo Visible
        </button>
        <button
          onClick={() => handleApplyPreset('minimal')}
          className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Clean Feed (Minimal)
        </button>
        <button
          onClick={() => handleApplyPreset('suspense')}
          className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold transition-all ${
            !toggles.showScores
              ? 'border-indigo-500 bg-indigo-950/60 text-indigo-300'
              : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
          }`}
          title="Oculta los puntos en proyección mientras sumas en la consola"
        >
          {!toggles.showScores ? 'Modo Suspenso (ON)' : 'Modo Suspenso'}
        </button>
      </div>

      {/* Grid of Toggle Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {toggleItems.map((item) => {
          const isActive = toggles[item.key];

          return (
            <label
              key={item.key}
              className={`flex items-center justify-between rounded-xl border p-2 cursor-pointer transition-all ${
                isActive
                  ? 'border-slate-700 bg-slate-950/90 text-white'
                  : 'border-slate-800/60 bg-slate-950/40 text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                {item.icon}
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold truncate">{item.label}</span>
                  <span className="text-[9px] text-slate-400 truncate">{item.description}</span>
                </div>
              </div>

              {/* Toggle switch checkbox */}
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => onChange({ [item.key]: e.target.checked })}
                className="h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
};

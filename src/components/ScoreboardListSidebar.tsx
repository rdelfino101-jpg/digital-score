import React from 'react';
import { Scoreboard } from '../types/scoreboard';
import {
  Users,
  Swords,
  Radio,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ScoreboardListSidebarProps {
  scoreboards: Scoreboard[];
  activeEditingId: string;
  liveScoreboardId: string;
  onSelectEditing: (id: string) => void;
  onSetLive: (id: string) => void;
  onCreate1v1: () => void;
  onCreateMultiplayer: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ScoreboardListSidebar: React.FC<ScoreboardListSidebarProps> = ({
  scoreboards,
  activeEditingId,
  liveScoreboardId,
  onSelectEditing,
  onSetLive,
  onCreate1v1,
  onCreateMultiplayer,
  onDuplicate,
  onDelete,
}) => {
  return (
    <aside className="flex w-full lg:w-80 shrink-0 flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/70 p-4">
      {/* Sidebar Header & Add Buttons */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Marcadores Creados ({scoreboards.length})
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onCreate1v1}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-950/40 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-900/50 hover:border-blue-400 transition-all shadow-sm"
          >
            <Swords className="h-3.5 w-3.5" />
            <span>+ 1 vs 1</span>
          </button>
          <button
            onClick={onCreateMultiplayer}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400 transition-all shadow-sm"
          >
            <Users className="h-3.5 w-3.5" />
            <span>+ Multijugador</span>
          </button>
        </div>
      </div>

      {/* List of Scoreboards */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto max-h-[360px] lg:max-h-none pr-1">
        {scoreboards.map((sb) => {
          const isEditing = sb.id === activeEditingId;
          const isLive = sb.id === liveScoreboardId;

          return (
            <div
              key={sb.id}
              onClick={() => onSelectEditing(sb.id)}
              className={`group relative flex flex-col rounded-2xl border p-3.5 transition-all cursor-pointer ${
                isEditing
                  ? 'border-blue-500 bg-slate-900/90 shadow-md ring-1 ring-blue-500/30'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
              }`}
            >
              {/* Card Header: Type Badge & LIVE Pill */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  {sb.type === 'one_on_one' ? (
                    <>
                      <Swords className="h-3 w-3 text-blue-400" />
                      <span>{sb.sportPreset ? sb.sportPreset.toUpperCase() : '1 vs 1'}</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3 text-emerald-400" />
                      <span>{sb.sportPreset ? sb.sportPreset.toUpperCase() : 'MULTI'} ({sb.participants.length})</span>
                    </>
                  )}
                </span>

                <div className="flex items-center gap-1.5">
                  {isLive && (
                    <span className="flex items-center gap-1 rounded bg-red-600/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      EN VIVO
                    </span>
                  )}
                  {isEditing && !isLive && (
                    <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/30">
                      EDITANDO
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Preview info */}
              <div className="mt-2">
                <h3 className="font-scoreboard text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                  {sb.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-400 truncate">
                  {sb.type === 'one_on_one'
                    ? `${sb.teamA.name} (${sb.teamA.score}) vs ${sb.teamB.name} (${sb.teamB.score})`
                    : sb.participants.map((p) => p.name).slice(0, 3).join(', ') +
                      (sb.participants.length > 3 ? '...' : '')}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div
                className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Make LIVE Button */}
                <button
                  onClick={() => onSetLive(sb.id)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    isLive
                      ? 'bg-red-600 text-white shadow-sm shadow-red-600/40'
                      : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-red-500 hover:bg-red-950/40 hover:text-red-400'
                  }`}
                  title={isLive ? 'Actualmente en la pantalla secundaria' : 'Transmitir este marcador a la pantalla de proyección'}
                >
                  <Radio className={`h-3 w-3 ${isLive ? 'animate-pulse' : ''}`} />
                  <span>{isLive ? 'Al Aire' : 'Enviar a Vivo'}</span>
                </button>

                <div className="flex items-center gap-1">
                  {/* Duplicate */}
                  <button
                    onClick={() => onDuplicate(sb.id)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    title="Duplicar marcador"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete */}
                  {scoreboards.length > 1 && (
                    <button
                      onClick={() => onDelete(sb.id)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                      title="Eliminar marcador"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

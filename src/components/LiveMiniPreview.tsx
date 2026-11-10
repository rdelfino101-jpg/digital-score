import React, { useState } from 'react';
import { ProjectorView } from './ProjectorView';
import { Scoreboard, BroadcastSettings, TimerState } from '../types/scoreboard';
import { Maximize2, Minimize2, Tv, ExternalLink } from 'lucide-react';

interface LiveMiniPreviewProps {
  scoreboard?: Scoreboard;
  broadcast: BroadcastSettings;
  timer: TimerState;
  onOpenProjector: () => void;
}

export const LiveMiniPreview: React.FC<LiveMiniPreviewProps> = ({
  scoreboard,
  broadcast,
  timer,
  onOpenProjector,
}) => {
  const [minimized, setMinimized] = useState(false);

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-950/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        minimized ? 'w-64 h-12' : 'w-80 sm:w-96 h-52 sm:h-60'
      }`}
    >
      {/* Mini Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-2 text-xs font-bold text-slate-300">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-scoreboard tracking-wider text-white">LIVE PREVIEW</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenProjector}
            className="rounded p-1 text-slate-400 hover:text-white transition-colors"
            title="Abrir en pantalla completa / ventana emergente"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setMinimized(!minimized)}
            className="rounded p-1 text-slate-400 hover:text-white transition-colors"
            title={minimized ? 'Expandir monitor' : 'Minimizar monitor'}
          >
            {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Embedded Live Output View */}
      {!minimized && (
        <div className="relative h-[calc(100%-36px)] w-full overflow-hidden bg-black pointer-events-none transform scale-[0.98] origin-top-left">
          <ProjectorView
            scoreboard={scoreboard}
            broadcast={broadcast}
            timer={timer}
            isEmbeddedPreview={true}
          />
        </div>
      )}
    </div>
  );
};

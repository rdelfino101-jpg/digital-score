import React, { useState } from 'react';
import { MasterLiveState } from '../../types/masterStudio';
import { MasterProjectorView } from '../MasterProjectorView';
import { ExternalLink, Maximize2, Minimize2, Radio } from 'lucide-react';

interface MasterLiveMiniPreviewProps {
  masterState: MasterLiveState;
  onOpenProjector: () => void;
}

export const MasterLiveMiniPreview: React.FC<MasterLiveMiniPreviewProps> = ({
  masterState,
  onOpenProjector,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden sm:flex flex-col rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
            Monitor Live (PiP)
          </span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
            {masterState.viewMode}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenProjector}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Abrir en ventana de Proyección separada"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title={collapsed ? 'Expandir monitor' : 'Minimizar monitor'}
          >
            {collapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Mini live screen */}
      {!collapsed && (
        <div className="relative h-44 w-76 bg-black overflow-hidden flex items-center justify-center">
          <div className="pointer-events-none absolute inset-0 transform scale-[0.38] origin-top-left w-[263%] h-[263%]">
            <MasterProjectorView masterState={masterState} isEmbeddedPreview={true} />
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { MasterLiveState, WhoSaidItItem } from '../../../types/masterStudio';
import { Quote, CheckCircle, XCircle, Eye, Lightbulb, Plus } from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

interface WhoSaidItControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
  onTriggerError: () => void;
}

export const WhoSaidItController: React.FC<WhoSaidItControllerProps> = ({
  state,
  onUpdateState,
  onAwardActiveTeam,
  onTriggerError,
}) => {
  const stage = state.gameStage.whoSaidIt;
  const currentItem = stage.items[stage.currentIndex];
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuote, setNewQuote] = useState({
    quote: '',
    author: '',
    context: '',
    hint: '',
    options: ['', '', '', ''],
    points: 100,
  });

  const handleSelectIndex = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        whoSaidIt: {
          ...prev.gameStage.whoSaidIt,
          currentIndex: idx,
          revealed: false,
          showHint: false,
          selectedOption: null,
          pointsAwarded: false,
        },
      },
    }));
  };

  const handleToggleHint = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        whoSaidIt: {
          ...prev.gameStage.whoSaidIt,
          showHint: !prev.gameStage.whoSaidIt.showHint,
        },
      },
    }));
  };

  const handleCorrect = () => {
    if (!currentItem) return;
    studioAudio.playCorrect();
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        whoSaidIt: {
          ...prev.gameStage.whoSaidIt,
          revealed: true,
          pointsAwarded: true,
        },
      },
    }));
    onAwardActiveTeam(currentItem.points, `Acierto en ¿Quién lo dijo? (${currentItem.author})`);
  };

  const handleRevealOnly = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        whoSaidIt: {
          ...prev.gameStage.whoSaidIt,
          revealed: !prev.gameStage.whoSaidIt.revealed,
        },
      },
    }));
  };

  const handleSaveCustom = () => {
    if (!newQuote.quote || !newQuote.author) return;
    const item: WhoSaidItItem = {
      id: `wsi-custom-${Date.now()}`,
      quote: newQuote.quote,
      author: newQuote.author,
      context: newQuote.context,
      hint: newQuote.hint,
      options: newQuote.options && newQuote.options[0] ? newQuote.options : [newQuote.author, 'Moisés', 'David', 'Pablo'],
      points: Number(newQuote.points) || 100,
    };

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        whoSaidIt: {
          ...prev.gameStage.whoSaidIt,
          items: [...prev.gameStage.whoSaidIt.items, item],
          currentIndex: prev.gameStage.whoSaidIt.items.length,
          revealed: false,
          pointsAwarded: false,
        },
      },
    }));
    setIsAddingNew(false);
  };

  if (!currentItem) return <div>Sin citas</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Quote className="h-5 w-5 text-blue-400" />
          <span className="font-scoreboard text-base font-bold text-white uppercase">
            Cita {stage.currentIndex + 1} de {stage.items.length}
          </span>
          <select
            value={stage.currentIndex}
            onChange={(e) => handleSelectIndex(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200"
          >
            {stage.items.map((item, i) => (
              <option key={item.id} value={i}>
                #{i + 1}: {item.author} - {item.quote.slice(0, 35)}...
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleHint}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
              stage.showHint
                ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            <span>{stage.showHint ? 'Pista Visible' : 'Mostrar Pista'}</span>
          </button>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Cita</span>
          </button>
        </div>
      </div>

      {/* Add Custom Quote Modal/Box */}
      {isAddingNew && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-4 animate-scale-up">
          <h4 className="font-scoreboard text-sm font-bold uppercase text-blue-300 mb-3">
            Agregar Nueva Frase / Cita al Vuelo
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Frase o Cita:</label>
              <textarea
                value={newQuote.quote}
                onChange={(e) => setNewQuote({ ...newQuote, quote: e.target.value })}
                rows={2}
                placeholder="Ej. 'La verdad os hará libres...'"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Autor Real:</label>
              <input
                type="text"
                value={newQuote.author}
                onChange={(e) => setNewQuote({ ...newQuote, author: e.target.value })}
                placeholder="Ej. Jesús"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Pista Opcional:</label>
              <input
                type="text"
                value={newQuote.hint}
                onChange={(e) => setNewQuote({ ...newQuote, hint: e.target.value })}
                placeholder="Ej. En el Evangelio de Juan..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setIsAddingNew(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveCustom}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
            >
              Guardar y Usar
            </button>
          </div>
        </div>
      )}

      {/* Secret Card */}
      <div className="rounded-2xl border-2 border-blue-400/30 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-blue-400">
            Ficha del Director
          </span>
          <span className="rounded bg-blue-400/20 px-2 py-0.5 text-xs font-bold text-blue-300">
            Valor: +{currentItem.points} PTS
          </span>
        </div>

        <p className="text-base sm:text-xl font-bold text-white italic">
          {currentItem.quote}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 font-scoreboard font-black text-emerald-300">
            AUTOR: {currentItem.author}
          </div>
          {currentItem.context && (
            <div className="text-xs text-slate-400">
              Contexto: <strong className="text-slate-200">{currentItem.context}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleCorrect}
          disabled={stage.pointsAwarded}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 font-scoreboard text-sm font-black uppercase text-white shadow-lg transition-all active:scale-95 ${
            stage.pointsAwarded
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
          }`}
        >
          <CheckCircle className="h-5 w-5" />
          <span>¡Correcto! (+{currentItem.points} pts al Turno)</span>
        </button>

        <button
          onClick={onTriggerError}
          className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 font-scoreboard text-sm font-black uppercase text-red-300 hover:bg-red-900/60 transition-all active:scale-95"
        >
          <XCircle className="h-5 w-5 text-red-400" />
          <span>Fallo / Robo de Turno</span>
        </button>

        <button
          onClick={handleRevealOnly}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <Eye className="h-4 w-4 text-blue-400" />
          <span>{stage.revealed ? 'Ocultar Autor' : 'Revelar Autor'}</span>
        </button>
      </div>
    </div>
  );
};

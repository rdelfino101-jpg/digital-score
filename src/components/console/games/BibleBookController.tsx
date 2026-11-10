import React, { useState } from 'react';
import {
  MasterLiveState,
  BibleBookGameState,
  BibleBookItem,
} from '../../../types/masterStudio';
import { BookOpen, CheckCircle, XCircle, Eye, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

interface BibleBookControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
  onTriggerError: () => void;
}

export const BibleBookController: React.FC<BibleBookControllerProps> = ({
  state,
  onUpdateState,
  onAwardActiveTeam,
  onTriggerError,
}) => {
  const stage = state.gameStage.bibleBook;
  const currentItem = stage.items[stage.currentIndex];
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<BibleBookItem>>({
    verseOrEvent: '',
    book: '',
    reference: '',
    testament: 'Antiguo Testamento',
    options: ['', '', '', ''],
    points: 100,
  });

  const handleSelectIndex = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        bibleBook: {
          ...prev.gameStage.bibleBook,
          currentIndex: idx,
          revealed: false,
          selectedOption: null,
          pointsAwarded: false,
        },
      },
    }));
  };

  const handleChangeLevel = (level: 'testament' | 'options' | 'blind') => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        bibleBook: {
          ...prev.gameStage.bibleBook,
          level,
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
        bibleBook: {
          ...prev.gameStage.bibleBook,
          revealed: true,
          pointsAwarded: true,
        },
      },
    }));
    onAwardActiveTeam(currentItem.points, `Acierto en ¿En qué libro está? (${currentItem.book})`);
  };

  const handleRevealOnly = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        bibleBook: {
          ...prev.gameStage.bibleBook,
          revealed: !prev.gameStage.bibleBook.revealed,
        },
      },
    }));
  };

  const handleAddNewItem = () => {
    if (!newQuestion.verseOrEvent || !newQuestion.book) return;
    const item: BibleBookItem = {
      id: `bb-custom-${Date.now()}`,
      verseOrEvent: newQuestion.verseOrEvent,
      book: newQuestion.book,
      reference: newQuestion.reference || 'Referencia bíblica',
      testament: newQuestion.testament || 'Antiguo Testamento',
      options: newQuestion.options && newQuestion.options[0] ? newQuestion.options : [newQuestion.book, 'Génesis', 'Salmos', 'Hechos'],
      points: Number(newQuestion.points) || 100,
    };

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        bibleBook: {
          ...prev.gameStage.bibleBook,
          items: [...prev.gameStage.bibleBook.items, item],
          currentIndex: prev.gameStage.bibleBook.items.length,
          revealed: false,
          pointsAwarded: false,
        },
      },
    }));

    setIsAddingNew(false);
    setNewQuestion({ verseOrEvent: '', book: '', reference: '', testament: 'Antiguo Testamento', options: ['', '', '', ''], points: 100 });
  };

  if (!currentItem) return <div>Sin reactivos</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Controls: Selector & Level */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-400" />
          <span className="font-scoreboard text-base font-bold text-white uppercase">
            Pregunta {stage.currentIndex + 1} de {stage.items.length}
          </span>
          <select
            value={stage.currentIndex}
            onChange={(e) => handleSelectIndex(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200"
          >
            {stage.items.map((item, i) => (
              <option key={item.id} value={i}>
                #{i + 1}: {item.book} - {item.verseOrEvent.slice(0, 35)}...
              </option>
            ))}
          </select>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => handleChangeLevel('testament')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
              stage.level === 'testament' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Testamento
          </button>
          <button
            onClick={() => handleChangeLevel('options')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
              stage.level === 'options' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            4 Opciones
          </button>
          <button
            onClick={() => handleChangeLevel('blind')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
              stage.level === 'blind' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            A Ciegas
          </button>
        </div>

        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Pregunta</span>
        </button>
      </div>

      {/* Add New Question Form (Inline) */}
      {isAddingNew && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-4 animate-scale-up">
          <h4 className="font-scoreboard text-sm font-bold uppercase text-blue-300 mb-3">
            Agregar Nueva Pregunta Bíblica al Vuelo
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Versículo o Evento:</label>
              <textarea
                value={newQuestion.verseOrEvent}
                onChange={(e) => setNewQuestion({ ...newQuestion, verseOrEvent: e.target.value })}
                rows={2}
                placeholder="Ej. La alimentación de los cinco mil hombres con cinco panes y dos peces..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Libro Correcto:</label>
              <input
                type="text"
                value={newQuestion.book}
                onChange={(e) => setNewQuestion({ ...newQuestion, book: e.target.value })}
                placeholder="Ej. Juan"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Referencia y Testamento:</label>
              <input
                type="text"
                value={newQuestion.reference}
                onChange={(e) => setNewQuestion({ ...newQuestion, reference: e.target.value })}
                placeholder="Ej. Juan 6:1-14"
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
              onClick={handleAddNewItem}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
            >
              Guardar y Usar
            </button>
          </div>
        </div>
      )}

      {/* Operator Secret Prompter Card */}
      <div className="rounded-2xl border-2 border-amber-400/30 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
            Ficha Secreta del Director
          </span>
          <span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">
            Valor: +{currentItem.points} PTS
          </span>
        </div>

        <p className="text-base sm:text-lg font-bold text-white italic">
          "{currentItem.verseOrEvent}"
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 font-scoreboard font-black text-emerald-300">
            RESPUESTA: {currentItem.book} ({currentItem.reference})
          </div>
          <div className="text-xs text-slate-400">
            Testamento: <strong className="text-slate-200">{currentItem.testament}</strong>
          </div>
        </div>
      </div>

      {/* Action Buttons: Correct / Error / Reveal */}
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
          <span>Fallo / Strike (Robo)</span>
        </button>

        <button
          onClick={handleRevealOnly}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <Eye className="h-4 w-4 text-blue-400" />
          <span>{stage.revealed ? 'Ocultar Respuesta' : 'Revelar en Proyector'}</span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => handleSelectIndex((stage.currentIndex - 1 + stage.items.length) % stage.items.length)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            &lt;&lt; Anterior
          </button>
          <button
            onClick={() => handleSelectIndex((stage.currentIndex + 1) % stage.items.length)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            Siguiente &gt;&gt;
          </button>
        </div>
      </div>
    </div>
  );
};

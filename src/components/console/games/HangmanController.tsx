import React, { useState } from 'react';
import { MasterLiveState, HangmanItem } from '../../../types/masterStudio';
import { processHangmanGuess, normalizeChar } from '../../../utils/gameEngineRules';
import { CheckCircle, XCircle, RotateCcw, Plus, Sparkles } from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

interface HangmanControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
  onTriggerError: () => void;
}

export const HangmanController: React.FC<HangmanControllerProps> = ({
  state,
  onUpdateState,
  onAwardActiveTeam,
  onTriggerError,
}) => {
  const stage = state.gameStage.hangman;
  const currentItem = stage.items[stage.currentIndex];
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newWord, setNewWord] = useState({ word: '', category: '', hint: '', pointsSolve: 100 });

  const handleGuessLetter = (letter: string) => {
    const norm = normalizeChar(letter);
    if (!currentItem || stage.guessedLetters.some((l) => normalizeChar(l) === norm) || stage.solved || stage.gameOver) return;

    const isHit = currentItem.word.split('').some((ch) => normalizeChar(ch) === norm);
    if (isHit) {
      studioAudio.playCorrect();
    } else {
      studioAudio.playError();
      if (state.turn.stealMode || stage.strikes + 1 >= stage.maxStrikes) {
        onTriggerError();
      }
    }

    onUpdateState((prev) => {
      const nextHangman = processHangmanGuess(prev.gameStage.hangman, letter);
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          hangman: nextHangman,
        },
      };
    });
  };

  const handleSolveWord = () => {
    if (!currentItem) return;
    studioAudio.playFanfare();
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        hangman: {
          ...prev.gameStage.hangman,
          solved: true,
          pointsAwarded: true,
        },
      },
    }));
    onAwardActiveTeam(currentItem.pointsSolve, `Palabra resuelta en Ahorcado (${currentItem.word})`);
  };

  const handleResetWord = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        hangman: {
          ...prev.gameStage.hangman,
          guessedLetters: [],
          strikes: 0,
          solved: false,
          gameOver: false,
          pointsAwarded: false,
        },
      },
    }));
  };

  const handleSelectIndex = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        hangman: {
          ...prev.gameStage.hangman,
          currentIndex: idx,
          guessedLetters: [],
          strikes: 0,
          solved: false,
          gameOver: false,
          pointsAwarded: false,
        },
      },
    }));
  };

  const handleSaveCustom = () => {
    if (!newWord.word) return;
    const item: HangmanItem = {
      id: `hm-custom-${Date.now()}`,
      word: newWord.word.toUpperCase().trim(),
      category: newWord.category || 'General',
      hint: newWord.hint,
      pointsPerLetter: 10,
      pointsSolve: Number(newWord.pointsSolve) || 100,
    };

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        hangman: {
          ...prev.gameStage.hangman,
          items: [...prev.gameStage.hangman.items, item],
          currentIndex: prev.gameStage.hangman.items.length,
          guessedLetters: [],
          strikes: 0,
          solved: false,
          gameOver: false,
          pointsAwarded: false,
        },
      },
    }));
    setIsAddingNew(false);
  };

  if (!currentItem) return <div>Sin palabras</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-scoreboard text-base font-bold text-white uppercase">
            Palabra {stage.currentIndex + 1} de {stage.items.length}
          </span>
          <select
            value={stage.currentIndex}
            onChange={(e) => handleSelectIndex(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200"
          >
            {stage.items.map((item, i) => (
              <option key={item.id} value={i}>
                #{i + 1}: {item.word} ({item.category})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* Strikes Badge */}
          <div className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-1.5 text-xs font-bold text-red-300">
            <span>Fallos: {stage.strikes} / {stage.maxStrikes}</span>
          </div>

          <button
            onClick={handleResetWord}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reiniciar</span>
          </button>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Palabra</span>
          </button>
        </div>
      </div>

      {/* Secret Word Overview */}
      <div className="rounded-2xl border-2 border-purple-400/30 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-purple-400">
            Palabra Oculta: <strong className="text-white text-lg tracking-widest">{currentItem.word}</strong>
          </span>
          <span className="rounded bg-purple-400/20 px-2 py-0.5 text-xs font-bold text-purple-300">
            Categoría: {currentItem.category} • Premio: +{currentItem.pointsSolve} PTS
          </span>
        </div>

        {currentItem.hint && (
          <p className="text-xs text-slate-300">
            Pista: <em>{currentItem.hint}</em>
          </p>
        )}
      </div>

      {/* Virtual A-Z Keyboard */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-3">
          Teclado Virtual de Selección:
        </span>
        <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-13 gap-2">
          {ALPHABET.map((letter) => {
            const normLetter = normalizeChar(letter);
            const isUsed = stage.guessedLetters.some((l) => normalizeChar(l) === normLetter);
            const inWord = currentItem.word.split('').some((ch) => normalizeChar(ch) === normLetter);

            return (
              <button
                key={letter}
                onClick={() => handleGuessLetter(letter)}
                disabled={isUsed || stage.solved || stage.gameOver}
                className={`flex h-11 items-center justify-center rounded-xl font-scoreboard text-base font-black uppercase transition-all shadow-md active:scale-90 ${
                  isUsed
                    ? inWord
                      ? 'border border-emerald-500/50 bg-emerald-500/20 text-emerald-300 opacity-60'
                      : 'border border-red-500/50 bg-red-500/20 text-red-400 opacity-60'
                    : 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:border-amber-400'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSolveWord}
          disabled={stage.pointsAwarded || stage.solved}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-scoreboard text-sm font-black uppercase text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <CheckCircle className="h-5 w-5" />
          <span>¡Palabra Resuelta! (+{currentItem.pointsSolve} pts al Turno)</span>
        </button>

        <button
          onClick={onTriggerError}
          className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 font-scoreboard text-sm font-black uppercase text-red-300 hover:bg-red-900/60 transition-all active:scale-95"
        >
          <XCircle className="h-5 w-5 text-red-400" />
          <span>Fallo / Pasar Turno</span>
        </button>
      </div>

      {/* Add Custom Word Inline */}
      {isAddingNew && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-4 animate-scale-up">
          <h4 className="font-scoreboard text-sm font-bold uppercase text-purple-300 mb-3">
            Agregar Nueva Palabra para Ahorcado
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Palabra (sin tildes complejas):</label>
              <input
                type="text"
                value={newWord.word}
                onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                placeholder="Ej. RESURRECCIÓN"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white uppercase font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Categoría:</label>
              <input
                type="text"
                value={newWord.category}
                onChange={(e) => setNewWord({ ...newWord, category: e.target.value })}
                placeholder="Ej. Teología"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Puntos por Resolver:</label>
              <input
                type="number"
                value={newWord.pointsSolve}
                onChange={(e) => setNewWord({ ...newWord, pointsSolve: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setIsAddingNew(false)} className="rounded-lg px-3 py-1 text-slate-400 hover:text-white text-xs">
              Cancelar
            </button>
            <button onClick={handleSaveCustom} className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-500">
              Guardar y Usar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

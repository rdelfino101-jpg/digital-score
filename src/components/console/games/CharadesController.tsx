import React, { useEffect } from 'react';
import { MasterLiveState, CharadesItem } from '../../../types/masterStudio';
import { Play, Pause, RotateCcw, CheckCircle, SkipForward, Clock, Trophy } from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

interface CharadesControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
  onNextTurn: () => void;
}

export const CharadesController: React.FC<CharadesControllerProps> = ({
  state,
  onUpdateState,
  onAwardActiveTeam,
  onNextTurn,
}) => {
  const stage = state.gameStage.charades;
  const currentItem = stage.items[stage.currentIndex];

  // Round timer loop in operator console
  useEffect(() => {
    if (!stage.isRunning) return;

    const interval = setInterval(() => {
      onUpdateState((prev) => {
        const nextRem = Math.max(0, prev.gameStage.charades.remainingSeconds - 1);
        if (nextRem === 0) {
          studioAudio.playTimesUp();
        } else if (nextRem <= 5) {
          studioAudio.playTick();
        }

        return {
          ...prev,
          gameStage: {
            ...prev.gameStage,
            charades: {
              ...prev.gameStage.charades,
              remainingSeconds: nextRem,
              isRunning: nextRem > 0,
            },
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage.isRunning]);

  const handleToggleTimer = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        charades: {
          ...prev.gameStage.charades,
          isRunning: !prev.gameStage.charades.isRunning,
        },
      },
    }));
  };

  const handleResetTimer = (seconds: number = 60) => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        charades: {
          ...prev.gameStage.charades,
          roundSeconds: seconds,
          remainingSeconds: seconds,
          isRunning: false,
          correctCount: 0,
          skippedCount: 0,
          pointsAwarded: false,
        },
      },
    }));
  };

  const handleCorrectWord = () => {
    if (!currentItem) return;
    studioAudio.playCorrect();

    onUpdateState((prev) => {
      const nextIndex = (prev.gameStage.charades.currentIndex + 1) % prev.gameStage.charades.items.length;
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          charades: {
            ...prev.gameStage.charades,
            currentIndex: nextIndex,
            correctCount: prev.gameStage.charades.correctCount + 1,
            guessedWordIds: [...prev.gameStage.charades.guessedWordIds, currentItem.id],
          },
        },
      };
    });
  };

  const handleSkipWord = () => {
    onUpdateState((prev) => {
      const nextIndex = (prev.gameStage.charades.currentIndex + 1) % prev.gameStage.charades.items.length;
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          charades: {
            ...prev.gameStage.charades,
            currentIndex: nextIndex,
            skippedCount: prev.gameStage.charades.skippedCount + 1,
          },
        },
      };
    });
  };

  const handleAwardRoundPoints = () => {
    const totalPoints = stage.correctCount * 50;
    studioAudio.playFanfare();
    onAwardActiveTeam(totalPoints, `Ronda de Charadas completada (${stage.correctCount} aciertos)`);
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        charades: {
          ...prev.gameStage.charades,
          pointsAwarded: true,
          isRunning: false,
        },
      },
    }));
    // Prepare for next team
    handleResetTimer(60);
    onNextTurn();
  };

  if (!currentItem) return <div>Sin palabras de charadas</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Timer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-emerald-400" />
          <span className="font-scoreboard text-3xl font-black text-white">
            {stage.remainingSeconds}s
          </span>
          <span className="text-xs text-slate-400 font-semibold uppercase">
            {stage.isRunning ? 'EN MARCHA' : 'EN PAUSA'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTimer}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-95 ${
              stage.isRunning
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {stage.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{stage.isRunning ? 'Pausar Reloj' : 'Iniciar Ronda'}</span>
          </button>

          <button
            onClick={() => handleResetTimer(60)}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>60s</span>
          </button>

          <button
            onClick={() => handleResetTimer(90)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            90s
          </button>
        </div>
      </div>

      {/* Current Word to Act Prompter */}
      <div className="rounded-2xl border-2 border-emerald-500/30 bg-slate-900/90 p-6 text-center shadow-xl">
        <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-300 border border-blue-500/30">
          {currentItem.category} • Dificultad: {currentItem.difficulty}
        </span>
        <h2 className="font-scoreboard mt-3 text-3xl sm:text-5xl font-black uppercase text-white drop-shadow">
          {currentItem.word}
        </h2>
      </div>

      {/* Big Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleCorrectWord}
          className="flex h-20 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-scoreboard text-xl font-black uppercase text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-102 active:scale-95"
        >
          <CheckCircle className="h-8 w-8" />
          <span>¡CORRECTO! (+1 Y SIGUIENTE)</span>
        </button>

        <button
          onClick={handleSkipWord}
          className="flex h-20 items-center justify-center gap-3 rounded-2xl border-2 border-slate-700 bg-slate-800 font-scoreboard text-xl font-black uppercase text-slate-300 shadow-xl transition-all hover:bg-slate-700 active:scale-95"
        >
          <SkipForward className="h-8 w-8 text-amber-400" />
          <span>PASAR PALABRA</span>
        </button>
      </div>

      {/* Round Summary & Final Award */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/80 p-4">
        <div className="flex items-center gap-4 text-sm font-bold">
          <span className="text-emerald-400 font-scoreboard text-lg">
            Aciertos: {stage.correctCount} (+{stage.correctCount * 50} pts)
          </span>
          <span className="text-slate-400 font-scoreboard text-lg">
            Pasadas: {stage.skippedCount}
          </span>
        </div>

        <button
          onClick={handleAwardRoundPoints}
          disabled={stage.correctCount === 0}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2.5 font-scoreboard text-sm font-black uppercase text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-102 active:scale-95 disabled:opacity-40"
        >
          <Trophy className="h-4 w-4" />
          <span>Adjudicar {stage.correctCount * 50} pts y Pasar Turno</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { MasterLiveState } from '../../../types/masterStudio';
import { processTrivia5050 } from '../../../utils/gameEngineRules';
import { CheckCircle, XCircle, Sparkles, HelpCircle, Eye } from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

interface TriviaShowControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
  onTriggerError: () => void;
}

export const TriviaShowController: React.FC<TriviaShowControllerProps> = ({
  state,
  onUpdateState,
  onAwardActiveTeam,
  onTriggerError,
}) => {
  const stage = state.gameStage.triviaShow;
  const currentItem = stage.items[stage.currentIndex];

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    studioAudio.playTurnChange();
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        triviaShow: {
          ...prev.gameStage.triviaShow,
          selectedOption: key,
          revealed: false,
        },
      },
    }));
  };

  const handleUse5050 = () => {
    studioAudio.playWheelClick();
    onUpdateState((prev) => {
      const nextTrivia = processTrivia5050(prev.gameStage.triviaShow);
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          triviaShow: nextTrivia,
        },
      };
    });
  };

  const handleRevealAnswer = () => {
    if (!currentItem) return;
    const isCorrect = stage.selectedOption === currentItem.correctAnswer;

    if (isCorrect) {
      studioAudio.playCorrect();
      onAwardActiveTeam(currentItem.points, `Acierto en Trivia Show (${currentItem.question.slice(0, 25)}...)`);
    } else {
      studioAudio.playError();
      onTriggerError();
    }

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        triviaShow: {
          ...prev.gameStage.triviaShow,
          revealed: true,
          pointsAwarded: isCorrect,
        },
      },
    }));
  };

  const handleSelectIndex = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        triviaShow: {
          ...prev.gameStage.triviaShow,
          currentIndex: idx,
          selectedOption: null,
          revealed: false,
          hiddenOptions5050: [],
          used5050: false,
          pointsAwarded: false,
        },
      },
    }));
  };

  if (!currentItem) return <div>Sin trivia</div>;

  const optionsKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col gap-5">
      {/* Top Selector & 50/50 Lifeline */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-scoreboard text-base font-bold text-white uppercase">
            Trivia {stage.currentIndex + 1} de {stage.items.length}
          </span>
          <select
            value={stage.currentIndex}
            onChange={(e) => handleSelectIndex(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 max-w-[280px] truncate"
          >
            {stage.items.map((item, i) => (
              <option key={item.id} value={i}>
                #{i + 1}: {item.category} - {item.question}
              </option>
            ))}
          </select>
        </div>

        {/* 50/50 Lifeline Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUse5050}
            disabled={stage.used5050}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-black uppercase transition-all ${
              stage.used5050
                ? 'border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
                : 'border-amber-400/50 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Comodín 50 / 50</span>
          </button>
        </div>
      </div>

      {/* Secret Card */}
      <div className="rounded-2xl border-2 border-amber-400/30 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
            Ficha de Trivia
          </span>
          <span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">
            Respuesta Correcta: {currentItem.correctAnswer} (+{currentItem.points} PTS)
          </span>
        </div>

        <p className="text-base sm:text-xl font-bold text-white">
          {currentItem.question}
        </p>

        {currentItem.explanation && (
          <p className="mt-2 text-xs text-slate-400 italic">
            Explicación: {currentItem.explanation}
          </p>
        )}
      </div>

      {/* 4 Options Selection in Console */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {optionsKeys.map((key) => {
          const isSelected = stage.selectedOption === key;
          const isCorrect = currentItem.correctAnswer === key;
          const isHidden5050 = stage.hiddenOptions5050.includes(key);

          return (
            <button
              key={key}
              onClick={() => handleSelectOption(key)}
              disabled={isHidden5050}
              className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left font-scoreboard transition-all active:scale-98 ${
                isHidden5050
                  ? 'opacity-30 border-slate-800 bg-black/40 text-slate-600 cursor-not-allowed'
                  : stage.revealed
                  ? isCorrect
                    ? 'border-emerald-400 bg-emerald-950/80 text-emerald-300 ring-2 ring-emerald-400'
                    : isSelected
                    ? 'border-red-500 bg-red-950/80 text-red-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                  : isSelected
                  ? 'border-amber-400 bg-amber-400/20 text-white ring-2 ring-amber-400'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-black text-xs">
                {key}
              </span>
              <span className="font-bold text-sm uppercase truncate">
                {currentItem.options[key]}
              </span>
              {isCorrect && (
                <span className="ml-auto rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  CORRECTA
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleRevealAnswer}
          disabled={!stage.selectedOption}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-scoreboard text-sm font-black uppercase text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-40"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Revelar Respuesta y Calificar</span>
        </button>

        <button
          onClick={onTriggerError}
          className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 font-scoreboard text-sm font-black uppercase text-red-300 hover:bg-red-900/60 transition-all active:scale-95"
        >
          <XCircle className="h-5 w-5 text-red-400" />
          <span>Fallo / Robo</span>
        </button>
      </div>
    </div>
  );
};

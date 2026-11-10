import React from 'react';
import { MasterLiveState } from '../../../types/masterStudio';
import { processFamilyFeudReveal, processFamilyFeudStrike } from '../../../utils/gameEngineRules';
import { Trophy, Check, X, RotateCcw, AlertOctagon, Sparkles } from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

interface FamilyFeudControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
  onNextTurn: () => void;
}

export const FamilyFeudController: React.FC<FamilyFeudControllerProps> = ({
  state,
  onUpdateState,
  onAwardActiveTeam,
  onNextTurn,
}) => {
  const stage = state.gameStage.familyFeud;
  const currentItem = stage.items[stage.currentIndex];

  const handleToggleAnswer = (ansId: string) => {
    const isAlreadyRevealed = stage.revealedAnswerIds.includes(ansId);
    if (!isAlreadyRevealed) {
      studioAudio.playCorrect();
    }

    onUpdateState((prev) => {
      const nextFeud = processFamilyFeudReveal(prev.gameStage.familyFeud, ansId);
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          familyFeud: nextFeud,
        },
      };
    });
  };

  const handleStrike = () => {
    studioAudio.playError();
    onUpdateState((prev) => {
      const nextFeud = processFamilyFeudStrike(prev.gameStage.familyFeud);
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          familyFeud: nextFeud,
        },
        turn: {
          ...prev.turn,
          stealMode: nextFeud.strikes >= 3,
        },
      };
    });
  };

  const handleAwardPot = (isSteal: boolean = false) => {
    if (stage.potScore === 0) return;
    studioAudio.playFanfare();

    const actionText = isSteal
      ? `¡Robo de Pozo en 100 Personas Dijeron! (+${stage.potScore} pts)`
      : `Pozo ganado en 100 Personas Dijeron (+${stage.potScore} pts)`;

    onAwardActiveTeam(stage.potScore, actionText);

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        familyFeud: {
          ...prev.gameStage.familyFeud,
          potScore: 0,
          potAwardedTeamId: prev.turn.activeTeamId,
        },
      },
      turn: {
        ...prev.turn,
        stealMode: false,
      },
    }));
  };

  const handleResetRound = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        familyFeud: {
          ...prev.gameStage.familyFeud,
          potScore: 0,
          strikes: 0,
          revealedAnswerIds: [],
          potAwardedTeamId: null,
        },
      },
      turn: {
        ...prev.turn,
        stealMode: false,
      },
    }));
  };

  const handleSelectIndex = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        familyFeud: {
          ...prev.gameStage.familyFeud,
          currentIndex: idx,
          potScore: 0,
          strikes: 0,
          revealedAnswerIds: [],
          potAwardedTeamId: null,
        },
      },
      turn: {
        ...prev.turn,
        stealMode: false,
      },
    }));
  };

  if (!currentItem) return <div>Sin encuestas</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Selector & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-scoreboard text-base font-bold text-white uppercase">
            Encuesta {stage.currentIndex + 1} de {stage.items.length}
          </span>
          <select
            value={stage.currentIndex}
            onChange={(e) => handleSelectIndex(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 max-w-[280px] truncate"
          >
            {stage.items.map((item, i) => (
              <option key={item.id} value={i}>
                #{i + 1}: {item.question}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetRound}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Resetear Ronda</span>
          </button>
        </div>
      </div>

      {/* Pot Score & Strikes Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-amber-400/40 bg-amber-950/20 p-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-amber-400" />
          <div>
            <span className="text-xs uppercase font-bold text-amber-300 tracking-wider">
              POZO ACUMULADO DE LA RONDA:
            </span>
            <div className="font-scoreboard text-3xl font-black text-white">
              {stage.potScore} PUNTOS
            </div>
          </div>
        </div>

        {/* Strikes Control */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-red-400 uppercase">Strikes:</span>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={handleStrike}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 font-scoreboard text-xl font-black transition-all ${
                  s <= stage.strikes
                    ? 'border-red-500 bg-red-600 text-white shadow-lg shadow-red-600/40 scale-105'
                    : 'border-slate-700 bg-slate-900 text-slate-600 hover:border-red-500/50'
                }`}
              >
                X
              </button>
            ))}
          </div>
          <button
            onClick={handleStrike}
            className="rounded-xl border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs font-black uppercase text-red-300 hover:bg-red-900/60 transition-colors"
          >
            +1 Strike
          </button>
        </div>
      </div>

      {/* Answers Table with Click-to-Reveal */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4">
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-3">
          Tablero de Respuestas (Haz clic para revelar / ocultar en el proyector):
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentItem.answers.map((ans, idx) => {
            const isRevealed = stage.revealedAnswerIds.includes(ans.id);

            return (
              <button
                key={ans.id}
                onClick={() => handleToggleAnswer(ans.id)}
                className={`flex items-center justify-between rounded-xl border-2 p-3.5 text-left font-scoreboard transition-all active:scale-98 ${
                  isRevealed
                    ? 'border-blue-400 bg-blue-950/60 text-white shadow-md'
                    : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-xs font-black">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm sm:text-base uppercase tracking-wide">
                    {ans.text}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-400 text-base">+{ans.points} pts</span>
                  <span
                    className={`rounded-full p-1 ${
                      isRevealed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pot Award Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleAwardPot(false)}
          disabled={stage.potScore === 0}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-scoreboard text-sm font-black uppercase text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Trophy className="h-5 w-5" />
          <span>Adjudicar Pozo ({stage.potScore} pts) al Turno</span>
        </button>

        <button
          onClick={() => handleAwardPot(true)}
          disabled={stage.potScore === 0}
          className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-950/50 px-5 py-3 font-scoreboard text-sm font-black uppercase text-red-300 hover:bg-red-900/60 shadow-lg shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <AlertOctagon className="h-5 w-5" />
          <span>¡Robo de Pozo! (+{stage.potScore} pts)</span>
        </button>

        <button
          onClick={onNextTurn}
          className="ml-auto rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-300 hover:text-white"
        >
          Siguiente Turno &gt;&gt;
        </button>
      </div>
    </div>
  );
};

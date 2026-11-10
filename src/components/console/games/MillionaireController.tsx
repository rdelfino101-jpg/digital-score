import React, { useState, useEffect } from 'react';
import { MasterLiveState, MillionaireItem } from '../../../types/masterStudio';
import { generateAudiencePoll } from '../../../utils/gameEngineRules';
import {
  Sparkles,
  Users,
  PhoneCall,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Trophy,
  Plus,
  Trash2,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

interface MillionaireControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
  onTriggerError: () => void;
}

export const MillionaireController: React.FC<MillionaireControllerProps> = ({
  state,
  onUpdateState,
  onAwardActiveTeam,
  onTriggerError,
}) => {
  const stage = state.gameStage.millionaireShow;
  const currentItem = stage.items[stage.currentIndex];

  // Editor modal state
  const [showEditor, setShowEditor] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newOptC, setNewOptC] = useState('');
  const [newOptD, setNewOptD] = useState('');
  const [newCorrect, setNewCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [newPoints, setNewPoints] = useState(100);

  // Phone timer interval
  useEffect(() => {
    let interval: any;
    if (stage.showPhoneCall && stage.phoneCallSecondsRemaining !== null && stage.phoneCallSecondsRemaining > 0) {
      interval = setInterval(() => {
        onUpdateState((prev) => {
          const mil = prev.gameStage.millionaireShow;
          const rem = mil.phoneCallSecondsRemaining;
          if (rem === null || rem <= 1) {
            studioAudio.playTimesUp();
            return {
              ...prev,
              gameStage: {
                ...prev.gameStage,
                millionaireShow: {
                  ...mil,
                  phoneCallSecondsRemaining: 0,
                  showPhoneCall: false,
                },
              },
            };
          }
          if (rem <= 5) studioAudio.playTick();
          return {
            ...prev,
            gameStage: {
              ...prev.gameStage,
              millionaireShow: {
                ...mil,
                phoneCallSecondsRemaining: rem - 1,
              },
            },
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage.showPhoneCall, stage.phoneCallSecondsRemaining, onUpdateState]);

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    studioAudio.playTurnChange();
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          selectedOption: key,
          isFinalAnswer: false,
          revealed: false,
          isCorrect: null,
        },
      },
    }));
  };

  const handleToggleFinalAnswer = () => {
    studioAudio.playDrumroll();
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          isFinalAnswer: !prev.gameStage.millionaireShow.isFinalAnswer,
        },
      },
    }));
  };

  // 1. Comodín 50:50
  const handleUse5050 = () => {
    if (!currentItem || stage.lifelines.fiftyFifty) return;
    studioAudio.playWheelClick();

    const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const wrongs = keys.filter((k) => k !== currentItem.correctAnswer);
    const shuffled = [...wrongs].sort(() => 0.5 - Math.random());
    const toHide = shuffled.slice(0, 2);

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          lifelines: {
            ...prev.gameStage.millionaireShow.lifelines,
            fiftyFifty: true,
          },
          hiddenOptions5050: toHide,
        },
      },
    }));
  };

  // 2. Comodín Pregunta al Público
  const handleUseAudiencePoll = () => {
    if (!currentItem || stage.lifelines.audiencePoll) return;
    studioAudio.playFanfare();
    const poll = generateAudiencePoll(currentItem.correctAnswer);

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          lifelines: {
            ...prev.gameStage.millionaireShow.lifelines,
            audiencePoll: true,
          },
          audiencePollResults: poll,
          showAudiencePoll: true,
        },
      },
    }));
  };

  const handleToggleAudiencePollDisplay = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          showAudiencePoll: !prev.gameStage.millionaireShow.showAudiencePoll,
        },
      },
    }));
  };

  // 3. Comodín Llamada a un Amigo (30s)
  const handleUsePhoneCall = () => {
    if (stage.lifelines.phoneCall) return;
    studioAudio.playWheelClick();
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          lifelines: {
            ...prev.gameStage.millionaireShow.lifelines,
            phoneCall: true,
          },
          showPhoneCall: true,
          phoneCallSecondsRemaining: 30,
        },
      },
    }));
  };

  const handleStopPhoneCall = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          showPhoneCall: false,
          phoneCallSecondsRemaining: 0,
        },
      },
    }));
  };

  // 4. Comodín Cambio de Pregunta
  const handleUseSwitchQuestion = () => {
    if (stage.lifelines.switchQuestion) return;
    studioAudio.playWheelClick();
    const nextIdx = (stage.currentIndex + 1) % stage.items.length;

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          lifelines: {
            ...prev.gameStage.millionaireShow.lifelines,
            switchQuestion: true,
          },
          currentIndex: nextIdx,
          selectedOption: null,
          isFinalAnswer: false,
          revealed: false,
          isCorrect: null,
          hiddenOptions5050: [],
          audiencePollResults: null,
          showAudiencePoll: false,
        },
      },
    }));
  };

  // Restaurar todos los comodines
  const handleResetLifelines = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          lifelines: {
            fiftyFifty: false,
            audiencePoll: false,
            phoneCall: false,
            switchQuestion: false,
          },
          hiddenOptions5050: [],
          audiencePollResults: null,
          showAudiencePoll: false,
          showPhoneCall: false,
          phoneCallSecondsRemaining: null,
        },
      },
    }));
  };

  // Revelar y Calificar
  const handleRevealAnswer = () => {
    if (!currentItem || !stage.selectedOption) return;
    const isCorrect = stage.selectedOption === currentItem.correctAnswer;

    if (isCorrect) {
      studioAudio.playCorrect();
      const pointsWon = currentItem.points;
      const nextLevel = stage.currentLevel + 1;
      const isTopWon = nextLevel > stage.items.length;

      onUpdateState((prev) => ({
        ...prev,
        gameStage: {
          ...prev.gameStage,
          millionaireShow: {
            ...prev.gameStage.millionaireShow,
            revealed: true,
            isCorrect: true,
            accumulatedPoints: pointsWon,
            gameStatus: isTopWon ? 'won_top' : 'playing',
          },
        },
      }));
    } else {
      studioAudio.playError();
      onTriggerError();

      // Drop to safe haven
      let safePoints = 0;
      const activeLvl = stage.currentLevel;
      if (activeLvl > 10 && stage.items[9]) {
        safePoints = stage.items[9].points;
      } else if (activeLvl > 5 && stage.items[4]) {
        safePoints = stage.items[4].points;
      }

      onUpdateState((prev) => ({
        ...prev,
        gameStage: {
          ...prev.gameStage,
          millionaireShow: {
            ...prev.gameStage.millionaireShow,
            revealed: true,
            isCorrect: false,
            accumulatedPoints: safePoints,
            gameStatus: 'failed',
          },
        },
      }));
    }
  };

  // Avanzar a la siguiente pregunta de la escalera
  const handleAdvanceNextLevel = () => {
    const nextIdx = (stage.currentIndex + 1) % stage.items.length;
    const nextLvl = stage.currentLevel + 1;

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          currentIndex: nextIdx,
          currentLevel: Math.min(nextLvl, prev.gameStage.millionaireShow.items.length),
          selectedOption: null,
          isFinalAnswer: false,
          revealed: false,
          isCorrect: null,
          hiddenOptions5050: [],
          audiencePollResults: null,
          showAudiencePoll: false,
          showPhoneCall: false,
        },
      },
    }));
  };

  // Retirarse / Plantarse
  const handleWalkAway = () => {
    studioAudio.playFanfare();
    const finalPts = stage.accumulatedPoints;
    if (finalPts > 0) {
      onAwardActiveTeam(finalPts, `Se retira con ${finalPts} PTS en ¿Quién Quiere Ser Millonario?`);
    }
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          gameStatus: 'walked_away',
          pointsAwarded: true,
        },
      },
    }));
  };

  // Reiniciar juego
  const handleRestartGame = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          currentIndex: 0,
          currentLevel: 1,
          selectedOption: null,
          isFinalAnswer: false,
          revealed: false,
          isCorrect: null,
          hiddenOptions5050: [],
          audiencePollResults: null,
          showAudiencePoll: false,
          showPhoneCall: false,
          accumulatedPoints: 0,
          gameStatus: 'playing',
          pointsAwarded: false,
        },
      },
    }));
  };

  // Asignar puntos acumulados al equipo activo
  const handleAwardAccumulated = () => {
    if (stage.accumulatedPoints <= 0) return;
    studioAudio.playFanfare();
    onAwardActiveTeam(stage.accumulatedPoints, `Premio Millonario (+${stage.accumulatedPoints} PTS)`);
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          pointsAwarded: true,
        },
      },
    }));
  };

  // Agregar pregunta al CRUD
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newOptA.trim() || !newOptB.trim()) return;

    const newItem: MillionaireItem = {
      id: `mil-custom-${Date.now()}`,
      level: stage.items.length + 1,
      question: newQuestion.trim(),
      options: {
        A: newOptA.trim(),
        B: newOptB.trim(),
        C: newOptC.trim() || 'Opción C',
        D: newOptD.trim() || 'Opción D',
      },
      correctAnswer: newCorrect,
      points: Number(newPoints) || 100,
    };

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        millionaireShow: {
          ...prev.gameStage.millionaireShow,
          items: [...prev.gameStage.millionaireShow.items, newItem],
        },
      },
    }));

    setNewQuestion('');
    setNewOptA('');
    setNewOptB('');
    setNewOptC('');
    setNewOptD('');
    setShowEditor(false);
  };

  const handleDeleteItem = (id: string) => {
    if (stage.items.length <= 1) return;
    onUpdateState((prev) => {
      const filtered = prev.gameStage.millionaireShow.items.filter((item) => item.id !== id);
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          millionaireShow: {
            ...prev.gameStage.millionaireShow,
            items: filtered,
            currentIndex: Math.min(prev.gameStage.millionaireShow.currentIndex, filtered.length - 1),
          },
        },
      };
    });
  };

  if (!currentItem) return <div className="text-slate-400 p-4">No hay preguntas configuradas.</div>;

  const optionsKeys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col gap-4">
      {/* Top Bar: Selector, Escalera Info y Estado */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1 text-amber-300 font-scoreboard font-black text-xs">
            <Trophy className="h-4 w-4" />
            <span>NIVEL {stage.currentLevel} / {stage.items.length}</span>
          </div>
          <span className="text-xs font-bold text-slate-300">
            Escalera: <span className="text-emerald-400 font-mono font-black">{currentItem.points} PTS</span>
          </span>
          {stage.safeHavenLevels.includes(stage.currentLevel) && (
            <span className="flex items-center gap-1 rounded bg-blue-500/20 px-2 py-0.5 text-[11px] font-bold text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              ZONA SEGURA
            </span>
          )}
        </div>

        {/* Acumulado & Acciones Rápidas */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1">
            <span className="text-[11px] text-slate-400 font-semibold">Acumulado:</span>
            <span className="text-sm font-black text-amber-400 font-mono">{stage.accumulatedPoints} PTS</span>
          </div>
          <button
            onClick={handleRestartGame}
            title="Reiniciar Juego de Millonario"
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 text-xs font-bold transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Barra de los 4 Comodines */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* 50:50 */}
        <button
          onClick={handleUse5050}
          disabled={stage.lifelines.fiftyFifty}
          className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-black uppercase transition-all ${
            stage.lifelines.fiftyFifty
              ? 'border-slate-800 bg-slate-900/60 text-slate-600 line-through cursor-not-allowed'
              : 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 shadow-md'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>50 : 50</span>
        </button>

        {/* Público */}
        <button
          onClick={stage.lifelines.audiencePoll ? handleToggleAudiencePollDisplay : handleUseAudiencePoll}
          className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-black uppercase transition-all ${
            stage.lifelines.audiencePoll
              ? stage.showAudiencePoll
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-400'
                : 'border-slate-800 bg-slate-900 text-slate-400'
              : 'border-violet-500/50 bg-violet-950/40 text-violet-300 hover:bg-violet-900/50 hover:border-violet-400 shadow-md'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{stage.lifelines.audiencePoll ? (stage.showAudiencePoll ? 'Ocultar Público' : 'Ver Público') : 'Público'}</span>
        </button>

        {/* Llamada */}
        <button
          onClick={stage.showPhoneCall ? handleStopPhoneCall : handleUsePhoneCall}
          disabled={stage.lifelines.phoneCall && !stage.showPhoneCall}
          className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-black uppercase transition-all ${
            stage.showPhoneCall
              ? 'border-amber-400 bg-amber-950 text-amber-300 animate-pulse ring-2 ring-amber-400'
              : stage.lifelines.phoneCall
              ? 'border-slate-800 bg-slate-900/60 text-slate-600 line-through cursor-not-allowed'
              : 'border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 hover:border-amber-400 shadow-md'
          }`}
        >
          <PhoneCall className="h-4 w-4" />
          <span>{stage.showPhoneCall ? `Llamada (${stage.phoneCallSecondsRemaining}s)` : 'Llamada'}</span>
        </button>

        {/* Cambio */}
        <button
          onClick={handleUseSwitchQuestion}
          disabled={stage.lifelines.switchQuestion}
          className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-black uppercase transition-all ${
            stage.lifelines.switchQuestion
              ? 'border-slate-800 bg-slate-900/60 text-slate-600 line-through cursor-not-allowed'
              : 'border-pink-500/50 bg-pink-950/40 text-pink-300 hover:bg-pink-900/50 hover:border-pink-400 shadow-md'
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Cambiar Preg.</span>
        </button>
      </div>

      {/* Tarjeta de Pregunta Activa */}
      <div className="rounded-2xl border-2 border-amber-400/30 bg-slate-900/90 p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            Pregunta #{stage.currentIndex + 1} • Nivel {stage.currentLevel}
          </span>
          <span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-300">
            Respuesta: {currentItem.correctAnswer} (+{currentItem.points} PTS)
          </span>
        </div>
        <p className="text-base sm:text-lg font-bold text-white leading-snug">
          {currentItem.question}
        </p>
      </div>

      {/* 4 Opciones Hexagonales en Consola */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                  ? 'opacity-25 border-slate-800 bg-black/40 text-slate-600 cursor-not-allowed line-through'
                  : stage.revealed
                  ? isCorrect
                    ? 'border-emerald-400 bg-emerald-950/90 text-emerald-300 ring-2 ring-emerald-400'
                    : isSelected
                    ? 'border-red-500 bg-red-950/90 text-red-300'
                    : 'border-slate-800 bg-slate-900 text-slate-500'
                  : stage.isFinalAnswer && isSelected
                  ? 'border-amber-400 bg-amber-950/90 text-amber-300 ring-2 ring-amber-400 animate-pulse'
                  : isSelected
                  ? 'border-amber-400 bg-amber-400/20 text-white ring-2 ring-amber-400'
                  : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg font-black text-xs ${
                stage.revealed && isCorrect
                  ? 'bg-emerald-400 text-slate-950'
                  : isSelected
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-amber-400 border border-amber-400/30'
              }`}>
                {key}
              </span>
              <span className="font-bold text-xs sm:text-sm uppercase truncate flex-1">
                {currentItem.options[key]}
              </span>
              {isCorrect && (
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  CORRECTA
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Controles de Tensión y Resolución */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* ¿Respuesta Definitiva? */}
        <button
          onClick={handleToggleFinalAnswer}
          disabled={!stage.selectedOption || stage.revealed}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-scoreboard text-xs sm:text-sm font-black uppercase transition-all active:scale-95 ${
            stage.isFinalAnswer
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300'
              : 'border-2 border-amber-400/70 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Flame className="h-4 w-4" />
          <span>{stage.isFinalAnswer ? '¡Respuesta Definitiva Fijada!' : '¿Respuesta Definitiva?'}</span>
        </button>

        {/* Revelar y Calificar */}
        <button
          onClick={handleRevealAnswer}
          disabled={!stage.selectedOption}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-scoreboard text-xs sm:text-sm font-black uppercase text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-40"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Revelar Respuesta</span>
        </button>

        {/* Si ya se reveló y fue correcto: Avanzar Siguiente Nivel */}
        {stage.revealed && stage.isCorrect && (
          <button
            onClick={handleAdvanceNextLevel}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-scoreboard text-xs sm:text-sm font-black uppercase text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all active:scale-95 animate-bounce"
          >
            <Trophy className="h-4 w-4" />
            <span>Avanzar al Nivel {stage.currentLevel + 1}</span>
          </button>
        )}

        {/* Plantarse / Retirarse */}
        <button
          onClick={handleWalkAway}
          disabled={stage.accumulatedPoints <= 0 || stage.gameStatus === 'walked_away'}
          className="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-950/40 px-3.5 py-2.5 font-scoreboard text-xs sm:text-sm font-black uppercase text-amber-300 hover:bg-amber-900/50 transition-all active:scale-95 disabled:opacity-40"
        >
          <LogOut className="h-4 w-4" />
          <span>Plantarse ({stage.accumulatedPoints} PTS)</span>
        </button>

        {/* Asignar puntos al marcador */}
        {stage.accumulatedPoints > 0 && !stage.pointsAwarded && (
          <button
            onClick={handleAwardAccumulated}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-4 py-2.5 font-scoreboard text-xs sm:text-sm font-black uppercase shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all active:scale-95"
          >
            <Trophy className="h-4 w-4" />
            <span>Sumar +{stage.accumulatedPoints} PTS a Equipo</span>
          </button>
        )}
      </div>

      {/* Editor & CRUD de Preguntas */}
      <div className="mt-2 border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">
            Banco de Preguntas ({stage.items.length} en escalera)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetLifelines}
              className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-all"
            >
              Restaurar Comodines
            </button>
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 text-xs font-bold transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showEditor ? 'Cerrar' : '+ Agregar Pregunta'}</span>
            </button>
          </div>
        </div>

        {showEditor && (
          <form onSubmit={handleAddQuestion} className="mt-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase">Pregunta</label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="¿En qué año se fundó...?"
                className="w-full mt-1 rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-amber-400">Opción A</label>
                <input
                  type="text"
                  value={newOptA}
                  onChange={(e) => setNewOptA(e.target.value)}
                  className="w-full mt-0.5 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-400">Opción B</label>
                <input
                  type="text"
                  value={newOptB}
                  onChange={(e) => setNewOptB(e.target.value)}
                  className="w-full mt-0.5 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-400">Opción C</label>
                <input
                  type="text"
                  value={newOptC}
                  onChange={(e) => setNewOptC(e.target.value)}
                  className="w-full mt-0.5 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-amber-400">Opción D</label>
                <input
                  type="text"
                  value={newOptD}
                  onChange={(e) => setNewOptD(e.target.value)}
                  className="w-full mt-0.5 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[10px] font-bold text-emerald-400 uppercase">Correcta</label>
                <select
                  value={newCorrect}
                  onChange={(e) => setNewCorrect(e.target.value as any)}
                  className="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 uppercase">Puntos</label>
                <input
                  type="number"
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  className="ml-2 w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="ml-auto rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
              >
                Guardar Pregunta
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

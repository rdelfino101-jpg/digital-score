import React, { useState } from 'react';
import { MasterLiveState, DealBriefcase } from '../../../types/masterStudio';
import { calculateBankerOffer, shuffleBriefcases } from '../../../utils/gameEngineRules';
import {
  Briefcase,
  Eye,
  EyeOff,
  Phone,
  CheckCircle,
  XCircle,
  RotateCcw,
  Shuffle,
  Trophy,
  DollarSign,
  Sparkles,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

interface DealOrNoDealControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
  onTriggerError: () => void;
}

export const DealOrNoDealController: React.FC<DealOrNoDealControllerProps> = ({
  state,
  onUpdateState,
  onAwardActiveTeam,
  onTriggerError,
}) => {
  const stage = state.gameStage.dealOrNoDeal;
  const [customOfferInput, setCustomOfferInput] = useState<number>(stage.bankerOffer || 0);
  const [showConfig, setShowConfig] = useState(false);

  // Remaining unopened briefcases (excluding contestant's case until the end)
  const unopenedBriefcases = stage.briefcases.filter((b) => !b.isOpen);
  const remainingValues = unopenedBriefcases.map((b) => b.value);

  // 1. Elegir maletín propio
  const handleSelectContestantCase = (briefcaseNumber: number) => {
    studioAudio.playTurnChange();
    onUpdateState((prev) => {
      const deal = prev.gameStage.dealOrNoDeal;
      const updated = deal.briefcases.map((b) => ({
        ...b,
        isContestantBriefcase: b.number === briefcaseNumber,
      }));
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          dealOrNoDeal: {
            ...deal,
            briefcases: updated,
            contestantBriefcaseNumber: briefcaseNumber,
            gameStatus: 'opening_cases',
            briefcasesOpenedThisRound: 0,
          },
        },
      };
    });
  };

  // 2. Abrir un maletín
  const handleOpenBriefcase = (id: number) => {
    const target = stage.briefcases.find((b) => b.id === id);
    if (!target || target.isOpen || target.isContestantBriefcase) return;

    // Trigger suspense or direct sound
    if (stage.suspenseActive) {
      studioAudio.playDrumroll();
      onUpdateState((prev) => ({
        ...prev,
        gameStage: {
          ...prev.gameStage,
          dealOrNoDeal: {
            ...prev.gameStage.dealOrNoDeal,
            revealingBriefcaseId: id,
          },
        },
      }));

      setTimeout(() => {
        finishOpeningBriefcase(id);
      }, 2500);
    } else {
      finishOpeningBriefcase(id);
    }
  };

  const finishOpeningBriefcase = (id: number) => {
    const target = stage.briefcases.find((b) => b.id === id);
    if (!target) return;

    // Sound feedback: Good if low value eliminated, bad if high value eliminated
    if (target.value <= 100) {
      studioAudio.playFanfare();
    } else if (target.value >= 1000) {
      studioAudio.playError();
    } else {
      studioAudio.playWheelClick();
    }

    onUpdateState((prev) => {
      const deal = prev.gameStage.dealOrNoDeal;
      const updated = deal.briefcases.map((b) =>
        b.id === id ? { ...b, isOpen: true } : b
      );
      const newOpened = deal.briefcasesOpenedThisRound + 1;
      const roundComplete = newOpened >= deal.briefcasesToOpenThisRound;

      // Auto compute banker offer when round is ready
      const remVals = updated.filter((b) => !b.isOpen).map((b) => b.value);
      const computedOffer = calculateBankerOffer(remVals, deal.currentRound);

      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          dealOrNoDeal: {
            ...deal,
            briefcases: updated,
            lastOpenedBriefcaseId: id,
            revealingBriefcaseId: null,
            briefcasesOpenedThisRound: newOpened,
            bankerOffer: computedOffer,
            // If round target reached, suggest entering banker offer
            gameStatus: roundComplete ? 'banker_offer' : deal.gameStatus,
          },
        },
      };
    });
  };

  // 3. Abrir el maletín del participante al final del juego
  const handleOpenContestantCase = () => {
    const contestantCase = stage.briefcases.find((b) => b.isContestantBriefcase);
    if (!contestantCase) return;

    studioAudio.playFanfare();
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        dealOrNoDeal: {
          ...prev.gameStage.dealOrNoDeal,
          briefcases: prev.gameStage.dealOrNoDeal.briefcases.map((b) =>
            b.id === contestantCase.id ? { ...b, isOpen: true } : b
          ),
          finalWinnings: contestantCase.value,
          gameStatus: 'final_case_opened',
        },
      },
    }));
  };

  // 4. Activar llamada de La Banca (Teléfono sonando)
  const handleTriggerBankerCall = () => {
    studioAudio.playWheelClick();
    const computedOffer = calculateBankerOffer(remainingValues, stage.currentRound);
    setCustomOfferInput(computedOffer);

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        dealOrNoDeal: {
          ...prev.gameStage.dealOrNoDeal,
          isBankerCallActive: true,
          isBankerOfferPending: true,
          bankerOffer: computedOffer,
          gameStatus: 'banker_offer',
        },
      },
    }));
  };

  // Modificar oferta de la banca
  const handleUpdateBankerOffer = (offer: number) => {
    setCustomOfferInput(offer);
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        dealOrNoDeal: {
          ...prev.gameStage.dealOrNoDeal,
          bankerOffer: offer,
        },
      },
    }));
  };

  // 5. ¡Trato Hecho! (DEAL)
  const handleAcceptDeal = () => {
    studioAudio.playFanfare();
    const winningPoints = stage.bankerOffer;
    onAwardActiveTeam(winningPoints, `¡Trato Hecho con La Banca! (+${winningPoints} PTS)`);

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        dealOrNoDeal: {
          ...prev.gameStage.dealOrNoDeal,
          isBankerCallActive: false,
          isBankerOfferPending: false,
          bankerOfferAccepted: true,
          gameStatus: 'deal_accepted',
          finalWinnings: winningPoints,
          pointsAwarded: true,
        },
      },
    }));
  };

  // 6. ¡No Hay Trato! (NO DEAL)
  const handleRejectDeal = () => {
    studioAudio.playTurnChange();
    const nextRound = stage.currentRound + 1;
    // Cases to open in subsequent rounds decreases: 4 -> 3 -> 2 -> 1
    const nextToOpen = Math.max(1, stage.briefcasesToOpenThisRound - 1);

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        dealOrNoDeal: {
          ...prev.gameStage.dealOrNoDeal,
          isBankerCallActive: false,
          isBankerOfferPending: false,
          bankerOfferAccepted: false,
          currentRound: nextRound,
          briefcasesToOpenThisRound: nextToOpen,
          briefcasesOpenedThisRound: 0,
          gameStatus: 'opening_cases',
        },
      },
    }));
  };

  // 7. Toggle Modo Rayos X (Host Only)
  const handleToggleXray = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        dealOrNoDeal: {
          ...prev.gameStage.dealOrNoDeal,
          xrayMode: !prev.gameStage.dealOrNoDeal.xrayMode,
        },
      },
    }));
  };

  // 8. Toggle Suspense (3s drumroll)
  const handleToggleSuspense = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        dealOrNoDeal: {
          ...prev.gameStage.dealOrNoDeal,
          suspenseActive: !prev.gameStage.dealOrNoDeal.suspenseActive,
        },
      },
    }));
  };

  // 9. Mezclar y Reiniciar Maletines
  const handleShuffleBriefcases = () => {
    studioAudio.playWheelClick();
    onUpdateState((prev) => {
      const deal = prev.gameStage.dealOrNoDeal;
      const shuffled = shuffleBriefcases(deal.briefcases);
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          dealOrNoDeal: {
            ...deal,
            briefcases: shuffled,
            contestantBriefcaseNumber: null,
            lastOpenedBriefcaseId: null,
            revealingBriefcaseId: null,
            bankerOffer: 0,
            isBankerCallActive: false,
            isBankerOfferPending: false,
            bankerOfferAccepted: null,
            currentRound: 1,
            briefcasesToOpenThisRound: 4,
            briefcasesOpenedThisRound: 0,
            gameStatus: 'selecting_own',
            finalWinnings: null,
            pointsAwarded: false,
          },
        },
      };
    });
  };

  const contestantCase = stage.briefcases.find((b) => b.isContestantBriefcase);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header: Estado, Ronda, Rayos X y Mezclar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-2.5 py-1 text-amber-300 font-scoreboard font-black text-xs">
            <Briefcase className="h-4 w-4" />
            <span>RONDA {stage.currentRound}</span>
          </div>

          <span className="text-xs text-slate-300 font-semibold">
            {stage.gameStatus === 'selecting_own' && '⏳ Elige el maletín del participante'}
            {stage.gameStatus === 'opening_cases' && (
              <>
                Abrir <span className="text-amber-400 font-bold">{stage.briefcasesToOpenThisRound - stage.briefcasesOpenedThisRound}</span> maletines en esta ronda
              </>
            )}
            {stage.gameStatus === 'banker_offer' && '📞 ¡Oferta de La Banca en Proyección!'}
            {stage.gameStatus === 'deal_accepted' && '🤝 ¡Trato Hecho Aceptado!'}
            {stage.gameStatus === 'final_case_opened' && '🎉 ¡Maletín Revelado!'}
          </span>
        </div>

        {/* Botones de Operador: Modo Rayos X, Suspense, Mezclar */}
        <div className="flex items-center gap-2">
          {/* Toggle Rayos X */}
          <button
            onClick={handleToggleXray}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
              stage.xrayMode
                ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-400'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Ver los valores secretos en la consola (sin revelarlos al público)"
          >
            {stage.xrayMode ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>Rayos X {stage.xrayMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Toggle Suspense */}
          <button
            onClick={handleToggleSuspense}
            className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-bold transition-all ${
              stage.suspenseActive
                ? 'border-amber-500 bg-amber-950 text-amber-300 ring-1 ring-amber-400'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
            title="Activar 2.5s de redoble de suspenso antes de mostrar el valor"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Suspenso</span>
          </button>

          {/* Mezclar */}
          <button
            onClick={handleShuffleBriefcases}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 text-xs font-bold transition-all"
            title="Mezclar maletines y reiniciar juego"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span>Mezclar</span>
          </button>
        </div>
      </div>

      {/* Tarjeta de Maletín Elegido y La Banca */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Maletín del Concursante */}
        <div className="rounded-xl border border-amber-400/30 bg-slate-900/90 p-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
              <Briefcase className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Maletín del Jugador</span>
              <p className="text-base font-black text-white">
                {contestantCase ? (
                  <>
                    Maletín #{contestantCase.number}{' '}
                    {stage.xrayMode && (
                      <span className="text-emerald-400 text-xs font-mono">({contestantCase.value} PTS)</span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 italic text-sm font-normal">Ninguno seleccionado</span>
                )}
              </p>
            </div>
          </div>

          {contestantCase && !contestantCase.isOpen && (
            <button
              onClick={handleOpenContestantCase}
              className="rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30 px-3 py-1.5 text-xs font-bold transition-all"
            >
              Revelar al Final
            </button>
          )}
        </div>

        {/* Panel de La Banca */}
        <div className="rounded-xl border border-blue-500/30 bg-slate-900/90 p-3.5 flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-1.5">
              <Phone className={`h-4 w-4 ${stage.isBankerCallActive ? 'text-amber-400 animate-bounce' : 'text-blue-400'}`} />
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Oferta de La Banca</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="number"
                value={customOfferInput}
                onChange={(e) => handleUpdateBankerOffer(Number(e.target.value))}
                className="w-24 rounded border border-slate-700 bg-slate-950 px-2 py-0.5 text-sm font-mono font-black text-amber-300 text-center"
              />
              <span className="text-xs text-slate-400 font-bold">PTS</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerBankerCall}
              className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 text-xs font-black uppercase shadow transition-all active:scale-95"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>📞 Llamar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Maletines Interactivos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400">
            Maletines en Juego ({stage.briefcases.filter((b) => !b.isOpen).length} sin abrir)
          </span>
          {stage.gameStatus === 'selecting_own' && (
            <span className="text-xs text-amber-400 font-bold animate-pulse">
              Haz clic en cualquier maletín para asignarlo al participante
            </span>
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {stage.briefcases.map((b) => {
            const isContestant = b.isContestantBriefcase;
            const isOpen = b.isOpen;
            const isRevealing = stage.revealingBriefcaseId === b.id;

            return (
              <button
                key={b.id}
                onClick={() => {
                  if (stage.gameStatus === 'selecting_own') {
                    handleSelectContestantCase(b.number);
                  } else {
                    handleOpenBriefcase(b.id);
                  }
                }}
                disabled={isOpen}
                className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 font-scoreboard transition-all active:scale-95 ${
                  isOpen
                    ? 'border-2 border-slate-800 bg-slate-950/40 text-slate-600 opacity-40 cursor-default'
                    : isContestant
                    ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-500/30 to-amber-900/40 text-amber-300 ring-2 ring-amber-400 shadow-lg'
                    : isRevealing
                    ? 'border-2 border-yellow-400 bg-yellow-950 text-yellow-300 animate-pulse ring-2 ring-yellow-400'
                    : 'border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 text-white hover:border-amber-400/80 hover:brightness-110 shadow-md'
                }`}
              >
                <Briefcase className={`h-6 w-6 mb-1 ${isContestant ? 'text-amber-400' : isOpen ? 'text-slate-600' : 'text-slate-200'}`} />
                <span className="text-base font-black">#{b.number}</span>

                {/* Mostrar valor si está abierto o si Rayos X está activo */}
                {(isOpen || stage.xrayMode) && (
                  <span className={`text-[11px] font-mono font-bold mt-0.5 ${
                    b.value >= 1000
                      ? 'text-amber-400'
                      : b.value >= 200
                      ? 'text-cyan-400'
                      : 'text-slate-300'
                  }`}>
                    {b.value} PTS
                  </span>
                )}

                {isContestant && (
                  <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 shadow">
                    TUYO
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Botones de Decisión: ¿Trato Hecho o No Hay Trato? */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {/* Trato Hecho */}
        <button
          onClick={handleAcceptDeal}
          disabled={!stage.bankerOffer || stage.gameStatus === 'deal_accepted'}
          className="flex-1 min-w-[160px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 font-scoreboard text-sm font-black uppercase text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-40"
        >
          <CheckCircle className="h-5 w-5" />
          <span>¡TRATO HECHO! ({stage.bankerOffer} PTS)</span>
        </button>

        {/* No Hay Trato */}
        <button
          onClick={handleRejectDeal}
          disabled={stage.gameStatus === 'deal_accepted'}
          className="flex-1 min-w-[160px] flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-3 font-scoreboard text-sm font-black uppercase text-white shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-40"
        >
          <XCircle className="h-5 w-5" />
          <span>¡NO HAY TRATO! (SEGUIR)</span>
        </button>
      </div>

      {/* Valores del Tablero (Eliminados vs Disponibles) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Tablero de Premios ({unopenedBriefcases.length} restantes)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {stage.briefcases
            .slice()
            .sort((a, b) => a.value - b.value)
            .map((b) => (
              <span
                key={b.id}
                className={`rounded px-2 py-0.5 text-xs font-mono font-bold transition-all ${
                  b.isOpen
                    ? 'bg-slate-950 text-slate-700 line-through'
                    : b.value >= 1000
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {b.value} PTS
              </span>
            ))}
        </div>
      </div>
    </div>
  );
};

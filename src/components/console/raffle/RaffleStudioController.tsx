import React, { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  MasterLiveState,
  MasterViewMode,
  RaffleMode,
  RaffleDrawRule,
  RaffleParticipant,
  StudioTeam,
  RaffleWinnerHistoryItem,
  NightWinnerItem,
  RaffleDrawRecord,
} from '../../../types/masterStudio';
import {
  calculateDeterministicWheelSpin,
  calculateDeterministicChallengeSpin,
  calculateDeterministicNumberDraw,
  generateTeamMatchups,
  advanceTournamentWinner,
  parseParticipantsFromText,
  DEFAULT_RAFFLE_PARTICIPANTS,
  DEFAULT_CHALLENGES,
  DEFAULT_PRIZES,
  RAFFLE_PALETTE,
} from '../../../utils/raffleEngineRules';
import {
  exportRaffleWinnersWorkbook,
  exportRaffleChallengesAndPrizesWorkbook,
} from '../../../utils/excelContentEngine';
import { studioAudio } from '../../../utils/audioSynth';
import {
  Sparkles,
  Play,
  RotateCcw,
  Users,
  Trophy,
  Ticket,
  Dices,
  Tv,
  Plus,
  Trash2,
  FileText,
  Import,
  Layers,
  Clock,
  Droplets,
  CheckCircle2,
  ArrowRight,
  Send,
  HelpCircle,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Gift,
  Flame,
  Smartphone,
  ExternalLink,
  Download,
  Share2,
  Swords,
  Award,
} from 'lucide-react';

interface RaffleStudioControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onSetViewMode: (mode: MasterViewMode) => void;
  onImportTeamsToScoreboard: (newTeams: StudioTeam[]) => void;
}

export const RaffleStudioController: React.FC<RaffleStudioControllerProps> = ({
  state,
  onUpdateState,
  onSetViewMode,
  onImportTeamsToScoreboard,
}) => {
  const raffle = state.raffle;
  const isRaffleLive = state.viewMode === 'RAFFLE_STAGE';
  const isSpinning = Boolean(raffle.activeSpin?.isSpinning);

  const roomCode = useMemo(() => {
    if (typeof window === 'undefined') return 'K7P2';
    const param = new URL(window.location.href).searchParams.get('room');
    return param ? param.toUpperCase().trim().slice(0, 4) : 'K7P2';
  }, []);

  const [bulkInputText, setBulkInputText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantGroup, setNewParticipantGroup] = useState('');

  // Editing state for existing participant
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingParticipantName, setEditingParticipantName] = useState('');
  const [editingParticipantColor, setEditingParticipantColor] = useState('');

  // Combinador de Retos management modals
  const [showChallengeEditor, setShowChallengeEditor] = useState(false);
  const [newChallengeText, setNewChallengeText] = useState('');
  const [newPrizeText, setNewPrizeText] = useState('');

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalDataUrl, setQrModalDataUrl] = useState('');

  const activeParticipants = useMemo(
    () => raffle.participants.filter((p) => !p.eliminated),
    [raffle.participants]
  );

  const challengesList = raffle.challengesList || DEFAULT_CHALLENGES;
  const prizesList = raffle.prizesList || DEFAULT_PRIZES;

  const openQrModal = () => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const joinUrl = `${origin}/?view=join&room=${roomCode}`;
    QRCode.toDataURL(joinUrl, { width: 360, margin: 2 })
      .then((url) => {
        setQrModalDataUrl(url);
        setShowQrModal(true);
      })
      .catch((err) => console.error(err));
  };

  // Primary action: Spin / Draw
  const handleSpinOrDraw = () => {
    if (isSpinning) return;

    if (raffle.mode === 'wheel') {
      const prevAngle = raffle.activeSpin?.targetAngle || 0;
      const spinEvent = calculateDeterministicWheelSpin(raffle, prevAngle);
      if (!spinEvent) {
        alert('No hay participantes activos para girar la ruleta.');
        return;
      }

      studioAudio.playDrumroll(raffle.spinDurationSeconds);

      onUpdateState((prev) => {
        const nextRaffle = { ...prev.raffle, activeSpin: spinEvent };

        const isEliminated =
          spinEvent.rule === 'elimination' &&
          spinEvent.eliminationRound < spinEvent.eliminationTotal;

        const winnerHistoryItem: RaffleWinnerHistoryItem = {
          id: `win-${Date.now()}`,
          name: spinEvent.winnerItem.name,
          prize: spinEvent.prizeTitle,
          ticketNumber: spinEvent.winnerItem.ticketNumber,
          groupOrCell: spinEvent.winnerItem.groupOrCell,
          timestamp: Date.now(),
          mode: 'wheel',
          rule: spinEvent.rule,
          isEliminationSplash: isEliminated,
          drawNumber: prev.raffle.raffleDrawCount || 1,
        };

        let updatedParticipants = prev.raffle.participants;
        if (isEliminated) {
          updatedParticipants = prev.raffle.participants.map((p) =>
            p.id === spinEvent.winnerItem.id ? { ...p, eliminated: true } : p
          );
          nextRaffle.currentEliminationCount = spinEvent.eliminationRound;
        } else {
          if (prev.raffle.autoRemoveWinner) {
            updatedParticipants = prev.raffle.participants.filter(
              (p) => p.id !== spinEvent.winnerItem.id
            );
          }
          nextRaffle.currentEliminationCount = 0;
          nextRaffle.winnersHistory = [winnerHistoryItem, ...prev.raffle.winnersHistory];

          // Night winners and audit log
          const nightWinner: NightWinnerItem = {
            id: `night-${Date.now()}`,
            drawNumber: prev.raffle.raffleDrawCount || 1,
            name: spinEvent.winnerItem.name,
            ticketNumber: spinEvent.winnerItem.ticketNumber,
            groupOrCell: spinEvent.winnerItem.groupOrCell,
            title: spinEvent.prizeTitle,
            timestamp: Date.now(),
          };
          nextRaffle.nightWinners = [nightWinner, ...(prev.raffle.nightWinners || [])];

          const drawRecord: RaffleDrawRecord = {
            id: `rec-${Date.now()}`,
            drawNumber: prev.raffle.raffleDrawCount || 1,
            title: spinEvent.prizeTitle,
            mode: 'wheel',
            participantCount: activeParticipants.length,
            winnerName: spinEvent.winnerItem.name,
            ticketNumber: spinEvent.winnerItem.ticketNumber,
            groupOrCell: spinEvent.winnerItem.groupOrCell,
            timestamp: Date.now(),
            dateStr: new Date().toLocaleTimeString(),
          };
          nextRaffle.drawRecords = [drawRecord, ...(prev.raffle.drawRecords || [])];
        }

        nextRaffle.participants = updatedParticipants;
        nextRaffle.lastWinner = winnerHistoryItem;

        return {
          ...prev,
          raffle: nextRaffle,
        };
      });

      // Show Fullscreen Winner celebration on projector when spin completes (if not elimination)
      setTimeout(() => {
        onUpdateState((prev) => {
          if (!prev.raffle.activeSpin) return prev;
          const isElim =
            prev.raffle.activeSpin.rule === 'elimination' &&
            prev.raffle.activeSpin.eliminationRound < prev.raffle.activeSpin.eliminationTotal;
          if (isElim) return prev;

          return {
            ...prev,
            raffle: {
              ...prev.raffle,
              showWinnerCelebrationScreen: true,
              activeWinnerScreenData: {
                drawNumber: prev.raffle.raffleDrawCount || 1,
                title: prev.raffle.prizeTitle,
                winnerName: prev.raffle.activeSpin.winnerItem.name,
                ticketNumber: prev.raffle.activeSpin.winnerItem.ticketNumber,
                group: prev.raffle.activeSpin.winnerItem.groupOrCell,
              },
            },
          };
        });
      }, raffle.spinDurationSeconds * 1000);
    } else if (raffle.mode === 'slot_machine') {
      // Requirement 4: Combinador de Retos (Persona + Reto + Premio)
      const spinEvent = calculateDeterministicChallengeSpin(raffle);
      if (!spinEvent) {
        alert('No hay participantes activos para el Combinador de Retos.');
        return;
      }

      studioAudio.playDrumroll(raffle.spinDurationSeconds);

      onUpdateState((prev) => {
        const nextRaffle = {
          ...prev.raffle,
          activeSpin: spinEvent,
          challengeCombinerResult: {
            person: spinEvent.winnerItem.name,
            challenge: spinEvent.challengeText || '',
            prize: spinEvent.prizeText || '',
            phrase: `${spinEvent.winnerItem.name} ${spinEvent.challengeText} y gana ${spinEvent.prizeText}`,
          },
        };

        const winnerHistoryItem: RaffleWinnerHistoryItem = {
          id: `win-${Date.now()}`,
          name: spinEvent.winnerItem.name,
          prize: `${spinEvent.challengeText} ➔ ${spinEvent.prizeText}`,
          ticketNumber: spinEvent.winnerItem.ticketNumber,
          groupOrCell: spinEvent.winnerItem.groupOrCell,
          timestamp: Date.now(),
          mode: 'slot_machine',
          rule: spinEvent.rule,
          isEliminationSplash: false,
          drawNumber: prev.raffle.raffleDrawCount || 1,
        };

        let updatedParticipants = prev.raffle.participants;
        if (prev.raffle.autoRemoveWinner) {
          updatedParticipants = prev.raffle.participants.filter(
            (p) => p.id !== spinEvent.winnerItem.id
          );
        }

        const nightWinner: NightWinnerItem = {
          id: `night-${Date.now()}`,
          drawNumber: prev.raffle.raffleDrawCount || 1,
          name: spinEvent.winnerItem.name,
          ticketNumber: spinEvent.winnerItem.ticketNumber,
          groupOrCell: spinEvent.winnerItem.groupOrCell,
          title: `${spinEvent.challengeText} (Gana: ${spinEvent.prizeText})`,
          timestamp: Date.now(),
        };

        const drawRecord: RaffleDrawRecord = {
          id: `rec-${Date.now()}`,
          drawNumber: prev.raffle.raffleDrawCount || 1,
          title: prev.raffle.prizeTitle,
          mode: 'slot_machine',
          participantCount: activeParticipants.length,
          winnerName: spinEvent.winnerItem.name,
          ticketNumber: spinEvent.winnerItem.ticketNumber,
          groupOrCell: spinEvent.winnerItem.groupOrCell,
          challengePhrase: `${spinEvent.winnerItem.name} ${spinEvent.challengeText} y gana ${spinEvent.prizeText}`,
          timestamp: Date.now(),
          dateStr: new Date().toLocaleTimeString(),
        };

        nextRaffle.participants = updatedParticipants;
        nextRaffle.winnersHistory = [winnerHistoryItem, ...prev.raffle.winnersHistory];
        nextRaffle.nightWinners = [nightWinner, ...(prev.raffle.nightWinners || [])];
        nextRaffle.drawRecords = [drawRecord, ...(prev.raffle.drawRecords || [])];
        nextRaffle.lastWinner = winnerHistoryItem;

        return {
          ...prev,
          raffle: nextRaffle,
        };
      });

      // Show Fullscreen Winner celebration on projector when spin completes
      setTimeout(() => {
        onUpdateState((prev) => {
          if (!prev.raffle.activeSpin) return prev;
          return {
            ...prev,
            raffle: {
              ...prev.raffle,
              showWinnerCelebrationScreen: true,
              activeWinnerScreenData: {
                drawNumber: prev.raffle.raffleDrawCount || 1,
                title: prev.raffle.prizeTitle,
                winnerName: prev.raffle.activeSpin.winnerItem.name,
                ticketNumber: prev.raffle.activeSpin.winnerItem.ticketNumber,
                group: prev.raffle.activeSpin.winnerItem.groupOrCell,
              },
            },
          };
        });
      }, raffle.spinDurationSeconds * 1000);
    } else if (raffle.mode === 'tombola_numbers') {
      const drawResult = calculateDeterministicNumberDraw(raffle);
      if (!drawResult) {
        alert('Se han sorteado todos los números del rango disponible.');
        return;
      }

      studioAudio.playDrumroll(raffle.spinDurationSeconds);

      const spinEvent: any = {
        spinId: Date.now(),
        isSpinning: true,
        winnerIndex: drawResult.drawnNumber,
        winnerItem: drawResult.participant,
        targetAngle: 0,
        slotFinalIndices: [drawResult.drawnNumber],
        durationMs: raffle.spinDurationSeconds * 1000,
        startTime: Date.now(),
        rule: raffle.drawRule,
        eliminationRound: 1,
        eliminationTotal: 1,
        prizeTitle: raffle.prizeTitle,
      };

      onUpdateState((prev) => {
        const nextRaffle = {
          ...prev.raffle,
          activeSpin: spinEvent,
          drawnNumbersHistory: [...prev.raffle.drawnNumbersHistory, drawResult.drawnNumber],
        };

        const winnerHistoryItem: RaffleWinnerHistoryItem = {
          id: `win-${Date.now()}`,
          name: drawResult.participant.name,
          prize: raffle.prizeTitle,
          ticketNumber: drawResult.drawnNumber,
          groupOrCell: drawResult.participant.groupOrCell,
          timestamp: Date.now(),
          mode: 'tombola_numbers',
          rule: 'direct_win',
          drawNumber: prev.raffle.raffleDrawCount || 1,
        };

        const nightWinner: NightWinnerItem = {
          id: `night-${Date.now()}`,
          drawNumber: prev.raffle.raffleDrawCount || 1,
          name: drawResult.participant.name,
          ticketNumber: drawResult.drawnNumber,
          groupOrCell: drawResult.participant.groupOrCell,
          title: prev.raffle.prizeTitle,
          timestamp: Date.now(),
        };

        const drawRecord: RaffleDrawRecord = {
          id: `rec-${Date.now()}`,
          drawNumber: prev.raffle.raffleDrawCount || 1,
          title: prev.raffle.prizeTitle,
          mode: 'tombola_numbers',
          participantCount: activeParticipants.length,
          winnerName: drawResult.participant.name,
          ticketNumber: drawResult.drawnNumber,
          groupOrCell: drawResult.participant.groupOrCell,
          timestamp: Date.now(),
          dateStr: new Date().toLocaleTimeString(),
        };

        nextRaffle.winnersHistory = [winnerHistoryItem, ...prev.raffle.winnersHistory];
        nextRaffle.nightWinners = [nightWinner, ...(prev.raffle.nightWinners || [])];
        nextRaffle.drawRecords = [drawRecord, ...(prev.raffle.drawRecords || [])];
        nextRaffle.lastWinner = winnerHistoryItem;

        return {
          ...prev,
          raffle: nextRaffle,
        };
      });

      // Show Fullscreen celebration
      setTimeout(() => {
        onUpdateState((prev) => {
          if (!prev.raffle.activeSpin) return prev;
          return {
            ...prev,
            raffle: {
              ...prev.raffle,
              showWinnerCelebrationScreen: true,
              activeWinnerScreenData: {
                drawNumber: prev.raffle.raffleDrawCount || 1,
                title: prev.raffle.prizeTitle,
                winnerName: drawResult.participant.name,
                ticketNumber: drawResult.drawnNumber,
                group: drawResult.participant.groupOrCell,
              },
            },
          };
        });
      }, raffle.spinDurationSeconds * 1000);
    } else if (raffle.mode === 'team_matcher') {
      handleGenerateMatchups();
    }
  };

  const handleGenerateMatchups = () => {
    studioAudio.playWheelClick();
    const result = generateTeamMatchups(
      raffle.participants,
      raffle.matcherType,
      raffle.matcherNumTeams,
      raffle.matcherBracketSize || 8
    );

    onUpdateState((prev) => ({
      ...prev,
      raffle: {
        ...prev.raffle,
        lastMatcherResult: result,
      },
    }));
  };

  const handleAdvanceBracketWinner = (matchId: string, winnerTeam: string) => {
    if (!raffle.lastMatcherResult?.bracket) return;
    studioAudio.playDing();
    const updated = advanceTournamentWinner(raffle.lastMatcherResult.bracket, matchId, winnerTeam);
    onUpdateState((prev) => ({
      ...prev,
      raffle: {
        ...prev.raffle,
        lastMatcherResult: {
          ...prev.raffle.lastMatcherResult!,
          bracket: updated,
        },
      },
    }));
  };

  const handleIncrementDrawCount = () => {
    onUpdateState((prev) => ({
      ...prev,
      raffle: {
        ...prev.raffle,
        raffleDrawCount: (prev.raffle.raffleDrawCount || 1) + 1,
        showWinnerCelebrationScreen: false,
        activeWinnerScreenData: null,
      },
    }));
  };

  const handleToggleWinnerCelebrationScreen = () => {
    onUpdateState((prev) => ({
      ...prev,
      raffle: {
        ...prev.raffle,
        showWinnerCelebrationScreen: !prev.raffle.showWinnerCelebrationScreen,
      },
    }));
  };

  const handleToggleRegistrations = () => {
    onUpdateState((prev) => ({
      ...prev,
      raffle: {
        ...prev.raffle,
        registrationsOpen: !prev.raffle.registrationsOpen,
      },
    }));
  };

  const handleToggleQrScene = () => {
    onUpdateState((prev) => ({
      ...prev,
      raffle: {
        ...prev.raffle,
        showQrRegistrationScene: !prev.raffle.showQrRegistrationScene,
      },
    }));
  };

  const handleRemoveParticipant = (id: string, name: string) => {
    if (window.confirm(`¿Dar de baja a "${name}" del sorteo?`)) {
      onUpdateState((prev) => ({
        ...prev,
        raffle: {
          ...prev.raffle,
          participants: prev.raffle.participants.filter((p) => p.id !== id),
        },
      }));
    }
  };

  const handleAddSingle = () => {
    if (!newParticipantName.trim()) return;
    const maxTicket = raffle.participants.reduce((max, p) => Math.max(max, p.ticketNumber || 0), 100);
    const newParticipant: RaffleParticipant = {
      id: `p-${Date.now()}`,
      name: newParticipantName.trim(),
      groupOrCell: newParticipantGroup.trim() || undefined,
      color: RAFFLE_PALETTE[raffle.participants.length % RAFFLE_PALETTE.length],
      ticketNumber: maxTicket + 1,
      eliminated: false,
      joinedAt: Date.now(),
    };

    onUpdateState((prev) => ({
      ...prev,
      raffle: {
        ...prev.raffle,
        participants: [...prev.raffle.participants, newParticipant],
      },
    }));

    setNewParticipantName('');
    setNewParticipantGroup('');
  };

  const handleExportWinnersExcel = () => {
    exportRaffleWinnersWorkbook(
      raffle.nightWinners || [],
      raffle.drawRecords || [],
      `Ganadores_Sorteos_Sala_${roomCode}.xlsx`
    );
  };

  const handleExportChallengesPrizesExcel = () => {
    exportRaffleChallengesAndPrizesWorkbook(
      challengesList,
      prizesList,
      `Retos_Y_Premios_Combinador_${roomCode}.xlsx`
    );
  };

  return (
    <div className="flex flex-col gap-6 text-white select-none">
      {/* 
        TOP ACTION BAR:
        - Mode buttons
        - Sorteo counter ("SORTEO N DE LA NOCHE")
        - Buttons: QR scene, Winner screen, Excel exports
      */}
      <div className="p-5 rounded-3xl bg-[#15173A] border border-[#2A2D5C] flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#FFC53D] text-slate-950 font-black shadow-lg">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black uppercase tracking-widest text-[#FFC53D]">
                CENTRO DE SORTEOS
              </span>
              <span className="text-slate-500">•</span>
              <span className="px-2 py-0.5 rounded bg-[#1C1F47] text-white text-[12px] font-bold">
                Sala {roomCode}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[26px] font-black text-white leading-none">
                SORTEO {raffle.raffleDrawCount || 1} DE LA NOCHE
              </span>
              <button
                onClick={handleIncrementDrawCount}
                title="Avanzar número de sorteo para el siguiente premio"
                className="px-3 py-1 rounded-xl bg-[#1C1F47] hover:bg-[#2A2D5C] text-[#FFC53D] border border-[#FFC53D]/40 text-[13px] font-black transition-all cursor-pointer"
              >
                + Siguiente Sorteo
              </button>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Winner celebration screen toggle */}
          <button
            onClick={handleToggleWinnerCelebrationScreen}
            className={`px-4 py-2.5 rounded-xl font-black text-[14px] flex items-center gap-2 border transition-all cursor-pointer ${
              raffle.showWinnerCelebrationScreen
                ? 'bg-[#3A2A05] border-[#FFC53D] text-[#FFC53D] shadow-lg animate-pulse'
                : 'bg-[#1C1F47] border-[#2A2D5C] text-white hover:border-[#FFC53D]'
            }`}
          >
            <Trophy className="w-4 h-4 text-[#FFC53D]" />
            <span>{raffle.showWinnerCelebrationScreen ? 'Cerrar Ganador Proyector' : 'Ver Ganador Proyector'}</span>
          </button>

          {/* QR Registration projector scene toggle */}
          <button
            onClick={handleToggleQrScene}
            className={`px-4 py-2.5 rounded-xl font-black text-[14px] flex items-center gap-2 border transition-all cursor-pointer ${
              raffle.showQrRegistrationScene
                ? 'bg-[#0F5132] border-[#4ADE80] text-[#4ADE80] shadow-lg'
                : 'bg-[#1C1F47] border-[#2A2D5C] text-white hover:border-[#4ADE80]'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>{raffle.showQrRegistrationScene ? 'Cerrar Escena QR' : 'Proyectar QR Registro'}</span>
          </button>

          {/* Registrations Open/Close toggle */}
          <button
            onClick={handleToggleRegistrations}
            className={`px-4 py-2.5 rounded-xl font-black text-[14px] flex items-center gap-2 border transition-all cursor-pointer ${
              raffle.registrationsOpen
                ? 'bg-[#0F5132]/60 border-[#4ADE80] text-[#4ADE80]'
                : 'bg-[#3F1216]/60 border-[#EF4444] text-[#EF4444]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{raffle.registrationsOpen ? 'Inscripciones Abiertas' : 'Inscripciones Cerradas'}</span>
          </button>

          {/* QR code modal button */}
          <button
            onClick={openQrModal}
            className="px-4 py-2.5 rounded-xl bg-[#1C1F47] border border-[#2A2D5C] text-[#B8BCE6] hover:text-white hover:border-[#4B5299] font-bold text-[14px] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#FFC53D]" />
            <span>Ver QR</span>
          </button>

          {/* Excel Export Winners button */}
          <button
            onClick={handleExportWinnersExcel}
            title="Exportar la lista de ganadores de la noche e historial completo a un archivo Excel (.xlsx)"
            className="px-4 py-2.5 rounded-xl bg-[#0F5132] border-2 border-[#4ADE80] text-white font-black text-[14px] flex items-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#4ADE80]" />
            <span>Exportar Ganadores (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Warning if > 24 participants in Ruleta (Requirement 1) */}
      {raffle.mode === 'wheel' && activeParticipants.length > 24 && (
        <div className="p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500 text-amber-200 flex items-start gap-3 shadow-xl">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-black text-amber-300 text-[16px] block mb-0.5">
              ⚠️ ALERTA DE LEGIBILIDAD EN LA RULETA
            </span>
            <p className="text-[14px] leading-relaxed">
              Hay <strong>{activeParticipants.length} participantes activos</strong>. Te sugerimos usar{' '}
              <strong>Tómbola de Números</strong> o <strong>Modo Eliminación</strong>, porque los nombres
              ya no se leen con claridad en los segmentos del proyector.
            </p>
          </div>
        </div>
      )}

      {/* MODE SELECTOR (4 MODES) */}
      <div className="grid grid-cols-4 gap-3 w-full">
        <button
          onClick={() => onUpdateState((prev) => ({ ...prev, raffle: { ...prev.raffle, mode: 'wheel' } }))}
          className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
            raffle.mode === 'wheel'
              ? 'bg-[#3A2A05] border-[#FFC53D] text-[#FFC53D] shadow-xl scale-[1.02]'
              : 'bg-[#15173A] border-[#2A2D5C] text-[#B8BCE6] hover:border-[#4B5299]'
          }`}
        >
          <RotateCcw className="w-7 h-7" />
          <span className="font-black text-[17px] text-white">1. Ruleta de la Fortuna</span>
          <span className="text-[12px] opacity-80">Giro con flecha a las 3</span>
        </button>

        <button
          onClick={() => onUpdateState((prev) => ({ ...prev, raffle: { ...prev.raffle, mode: 'slot_machine' } }))}
          className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
            raffle.mode === 'slot_machine'
              ? 'bg-[#3A2A05] border-[#FFC53D] text-[#FFC53D] shadow-xl scale-[1.02]'
              : 'bg-[#15173A] border-[#2A2D5C] text-[#B8BCE6] hover:border-[#4B5299]'
          }`}
        >
          <Flame className="w-7 h-7" />
          <span className="font-black text-[17px] text-white">2. Combinador de Retos</span>
          <span className="text-[12px] opacity-80">Persona + Reto + Premio</span>
        </button>

        <button
          onClick={() => onUpdateState((prev) => ({ ...prev, raffle: { ...prev.raffle, mode: 'tombola_numbers' } }))}
          className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
            raffle.mode === 'tombola_numbers'
              ? 'bg-[#3A2A05] border-[#FFC53D] text-[#FFC53D] shadow-xl scale-[1.02]'
              : 'bg-[#15173A] border-[#2A2D5C] text-[#B8BCE6] hover:border-[#4B5299]'
          }`}
        >
          <Dices className="w-7 h-7" />
          <span className="font-black text-[17px] text-white">3. Tómbola de Números</span>
          <span className="text-[12px] opacity-80">Bola gigante de 520px</span>
        </button>

        <button
          onClick={() => onUpdateState((prev) => ({ ...prev, raffle: { ...prev.raffle, mode: 'team_matcher' } }))}
          className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
            raffle.mode === 'team_matcher'
              ? 'bg-[#3A2A05] border-[#FFC53D] text-[#FFC53D] shadow-xl scale-[1.02]'
              : 'bg-[#15173A] border-[#2A2D5C] text-[#B8BCE6] hover:border-[#4B5299]'
          }`}
        >
          <Swords className="w-7 h-7" />
          <span className="font-black text-[17px] text-white">4. Emparejador & Torneos</span>
          <span className="text-[12px] opacity-80">Duelos y Cuadro de Llaves</span>
        </button>
      </div>

      {/* ACTIVE MODE CONFIGURATION & SPIN CONTROLLER */}
      <div className="p-6 rounded-3xl bg-[#15173A] border border-[#2A2D5C] shadow-2xl space-y-6">
        {/* Title and Prize input */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-[13px] font-black uppercase tracking-wider text-[#B8BCE6] mb-1.5">
              Título del Sorteo / Premio a Entregar
            </label>
            <input
              type="text"
              value={raffle.prizeTitle}
              onChange={(e) =>
                onUpdateState((prev) => ({
                  ...prev,
                  raffle: { ...prev.raffle, prizeTitle: e.target.value },
                }))
              }
              placeholder="Ej. Gran Premio Sorpresa #1 • Canasta Familiar..."
              className="w-full px-4 py-3 rounded-xl bg-[#0A0B1E] border border-[#2A2D5C] text-white font-bold text-[16px] focus:outline-none focus:border-[#FFC53D]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-black uppercase tracking-wider text-[#B8BCE6] mb-1.5">
              Regla de Selección
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    raffle: { ...prev.raffle, drawRule: 'direct_win' },
                  }))
                }
                className={`py-3 rounded-xl font-bold text-[14px] border transition-all cursor-pointer ${
                  raffle.drawRule === 'direct_win'
                    ? 'bg-[#0F5132] border-[#4ADE80] text-white font-black'
                    : 'bg-[#0A0B1E] border-[#2A2D5C] text-[#B8BCE6]'
                }`}
              >
                Giro Directo
              </button>
              <button
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    raffle: { ...prev.raffle, drawRule: 'elimination' },
                  }))
                }
                className={`py-3 rounded-xl font-bold text-[14px] border transition-all cursor-pointer ${
                  raffle.drawRule === 'elimination'
                    ? 'bg-[#3F1216] border-[#EF4444] text-white font-black'
                    : 'bg-[#0A0B1E] border-[#2A2D5C] text-[#B8BCE6]'
                }`}
              >
                Eliminación
              </button>
            </div>
          </div>
        </div>

        {/* Mode Specific Settings: Combinador de Retos, Tómbola, or Torneo */}
        {raffle.mode === 'slot_machine' && (
          <div className="p-4 rounded-2xl bg-[#0A0B1E] border border-[#2A2D5C] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-[#FF8A1F]" />
                <span className="font-black text-[16px] text-white uppercase tracking-wider">
                  Combinador de Retos: {challengesList.length} Retos • {prizesList.length} Premios
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChallengeEditor(!showChallengeEditor)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1C1F47] hover:bg-[#2A2D5C] text-[#FFC53D] font-bold text-[13px] border border-[#FFC53D]/40 transition-all cursor-pointer"
                >
                  {showChallengeEditor ? 'Ocultar Editor' : 'Editar Retos y Premios'}
                </button>
                <button
                  onClick={handleExportChallengesPrizesExcel}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1C1F47] hover:bg-[#2A2D5C] text-white font-bold text-[13px] border border-[#2A2D5C] transition-all cursor-pointer"
                >
                  Exportar a Excel
                </button>
              </div>
            </div>

            {/* Inline Editor for Challenges and Prizes */}
            {showChallengeEditor && (
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#2A2D5C]">
                {/* Column Retos */}
                <div className="space-y-2">
                  <span className="text-[13px] font-black uppercase text-[#FF8A1F] block">
                    Lista de Retos (Rodillo 2)
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nuevo reto..."
                      value={newChallengeText}
                      onChange={(e) => setNewChallengeText(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#15173A] border border-[#2A2D5C] text-white text-[14px]"
                    />
                    <button
                      onClick={() => {
                        if (!newChallengeText.trim()) return;
                        onUpdateState((prev) => ({
                          ...prev,
                          raffle: {
                            ...prev.raffle,
                            challengesList: [...(prev.raffle.challengesList || DEFAULT_CHALLENGES), newChallengeText.trim()],
                          },
                        }));
                        setNewChallengeText('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#FF8A1F] text-slate-950 font-black text-[13px]"
                    >
                      +
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {challengesList.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-[#15173A] text-[13px]">
                        <span className="truncate">{c}</span>
                        <button
                          onClick={() => {
                            onUpdateState((prev) => ({
                              ...prev,
                              raffle: {
                                ...prev.raffle,
                                challengesList: (prev.raffle.challengesList || DEFAULT_CHALLENGES).filter((_, idx) => idx !== i),
                              },
                            }));
                          }}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column Premios */}
                <div className="space-y-2">
                  <span className="text-[13px] font-black uppercase text-[#FFC53D] block">
                    Lista de Premios (Rodillo 3)
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nuevo premio..."
                      value={newPrizeText}
                      onChange={(e) => setNewPrizeText(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#15173A] border border-[#2A2D5C] text-white text-[14px]"
                    />
                    <button
                      onClick={() => {
                        if (!newPrizeText.trim()) return;
                        onUpdateState((prev) => ({
                          ...prev,
                          raffle: {
                            ...prev.raffle,
                            prizesList: [...(prev.raffle.prizesList || DEFAULT_PRIZES), newPrizeText.trim()],
                          },
                        }));
                        setNewPrizeText('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#FFC53D] text-slate-950 font-black text-[13px]"
                    >
                      +
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {prizesList.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-[#15173A] text-[13px]">
                        <span className="truncate">{p}</span>
                        <button
                          onClick={() => {
                            onUpdateState((prev) => ({
                              ...prev,
                              raffle: {
                                ...prev.raffle,
                                prizesList: (prev.raffle.prizesList || DEFAULT_PRIZES).filter((_, idx) => idx !== i),
                              },
                            }));
                          }}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Emparejador & Torneos Bracket Management */}
        {raffle.mode === 'team_matcher' && (
          <div className="p-4 rounded-2xl bg-[#0A0B1E] border border-[#2A2D5C] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Swords className="w-5 h-5 text-[#FFC53D]" />
                <span className="font-black text-[16px] text-white uppercase tracking-wider">
                  Tipo de Emparejamiento
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={raffle.matcherType}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      raffle: { ...prev.raffle, matcherType: e.target.value as any },
                    }))
                  }
                  className="px-3 py-1.5 rounded-xl bg-[#15173A] border border-[#2A2D5C] text-white font-bold text-[14px]"
                >
                  <option value="tournament_bracket">Llaves de Torneo (Cuartos, Semis, Final)</option>
                  <option value="duels_1v1">Duelos 1 vs 1</option>
                  <option value="n_teams">Grupos por Equipos</option>
                </select>

                {raffle.matcherType === 'tournament_bracket' && (
                  <select
                    value={raffle.matcherBracketSize || 8}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        raffle: { ...prev.raffle, matcherBracketSize: Number(e.target.value) as any },
                      }))
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#15173A] border border-[#2A2D5C] text-white font-bold text-[14px]"
                  >
                    <option value={4}>Llave de 4 Equipos</option>
                    <option value={8}>Llave de 8 Equipos</option>
                    <option value={16}>Llave de 16 Equipos</option>
                  </select>
                )}

                <button
                  onClick={handleGenerateMatchups}
                  className="px-4 py-1.5 rounded-xl bg-[#FFC53D] text-slate-950 font-black text-[14px] shadow cursor-pointer"
                >
                  Generar Emparejamiento
                </button>
              </div>
            </div>

            {/* Bracket Advancement Controller (Requirement 12) */}
            {raffle.matcherType === 'tournament_bracket' && raffle.lastMatcherResult?.bracket && (
              <div className="pt-3 border-t border-[#2A2D5C] space-y-3">
                <span className="text-[13px] font-black uppercase text-[#4ADE80] block">
                  Haz clic en el equipo ganador para avanzar a la siguiente ronda:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {raffle.lastMatcherResult.bracket.matches.map((match) => (
                    <div key={match.id} className="p-3 rounded-xl bg-[#15173A] border border-[#2A2D5C] flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        Ronda {match.roundIndex + 1} • Partido {match.matchIndex + 1}
                      </span>
                      <button
                        onClick={() => match.teamA && handleAdvanceBracketWinner(match.id, match.teamA)}
                        disabled={!match.teamA}
                        className={`px-3 py-1.5 rounded-lg text-left text-[14px] font-black transition-all cursor-pointer ${
                          match.winner === match.teamA
                            ? 'bg-[#0F5132] text-[#4ADE80] border border-[#4ADE80]'
                            : 'bg-[#0A0B1E] text-white hover:bg-slate-800'
                        }`}
                      >
                        {match.teamA || '---'} {match.winner === match.teamA ? '✓' : ''}
                      </button>
                      <button
                        onClick={() => match.teamB && handleAdvanceBracketWinner(match.id, match.teamB)}
                        disabled={!match.teamB}
                        className={`px-3 py-1.5 rounded-lg text-left text-[14px] font-black transition-all cursor-pointer ${
                          match.winner === match.teamB
                            ? 'bg-[#0F5132] text-[#4ADE80] border border-[#4ADE80]'
                            : 'bg-[#0A0B1E] text-white hover:bg-slate-800'
                        }`}
                      >
                        {match.teamB || '---'} {match.winner === match.teamB ? '✓' : ''}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SPIN BUTTON */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSpinOrDraw}
            disabled={isSpinning || activeParticipants.length === 0}
            className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-[#FFC53D] to-amber-400 text-slate-950 font-black text-[22px] uppercase tracking-wider shadow-2xl hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-3"
          >
            <Play className="w-8 h-8 fill-slate-950" />
            <span>
              {isSpinning
                ? '¡Sorteo en Proceso...!'
                : raffle.mode === 'wheel'
                ? '¡Girar Ruleta!'
                : raffle.mode === 'slot_machine'
                ? '¡Girar Combinador de Retos!'
                : raffle.mode === 'tombola_numbers'
                ? '¡Extraer Bola de Tómbola!'
                : '¡Sorteo de Emparejamientos!'}
            </span>
          </button>
        </div>
      </div>

      {/* PARTICIPANTS MANAGEMENT TABLE & REMOVE CONTROL */}
      <div className="p-6 rounded-3xl bg-[#15173A] border border-[#2A2D5C] shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2D5C]">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#FFC53D]" />
            <h3 className="text-[20px] font-black text-white">
              Participantes del Sorteo ({raffle.participants.length})
            </h3>
            <span className="text-[14px] text-[#4ADE80] font-bold">
              • {activeParticipants.length} activos
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onUpdateState((prev) => ({
                  ...prev,
                  raffle: {
                    ...prev.raffle,
                    participants: prev.raffle.participants.map((p) => ({ ...p, eliminated: false })),
                  },
                }));
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#1C1F47] hover:bg-[#2A2D5C] text-[#B8BCE6] text-[13px] font-bold border border-[#2A2D5C] transition-all cursor-pointer"
            >
              Reactivar Todos
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Vaciar la lista de participantes?')) {
                  onUpdateState((prev) => ({
                    ...prev,
                    raffle: { ...prev.raffle, participants: [] },
                  }));
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 text-[13px] font-bold border border-red-500/30 transition-all cursor-pointer"
            >
              Limpiar Todo
            </button>
          </div>
        </div>

        {/* Add single participant row */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Nombre y apellido..."
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#0A0B1E] border border-[#2A2D5C] text-white text-[15px] font-semibold"
          />
          <input
            type="text"
            placeholder="Grupo / Célula (opcional)..."
            value={newParticipantGroup}
            onChange={(e) => setNewParticipantGroup(e.target.value)}
            className="w-60 px-4 py-2.5 rounded-xl bg-[#0A0B1E] border border-[#2A2D5C] text-white text-[15px] font-semibold"
          />
          <button
            onClick={handleAddSingle}
            className="px-5 py-2.5 rounded-xl bg-[#FFC53D] text-slate-950 font-black text-[15px] shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            + Agregar
          </button>
        </div>

        {/* Participants Table */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {raffle.participants.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay participantes inscritos todavía. Comparte el QR o agrega nombres arriba.
            </div>
          ) : (
            raffle.participants.map((p) => (
              <div
                key={p.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  p.eliminated
                    ? 'bg-[#0A0B1E]/40 border-[#2A2D5C]/30 text-slate-500 opacity-60'
                    : 'bg-[#0A0B1E] border-[#2A2D5C] text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-8 rounded-lg bg-[#1C1F47] text-[#FFC53D] font-black text-[13px] flex items-center justify-center shrink-0">
                    #{p.ticketNumber || '---'}
                  </span>
                  <div className="min-w-0">
                    <span className={`text-[16px] font-bold block truncate ${p.eliminated ? 'line-through' : ''}`}>
                      {p.name}
                    </span>
                    {p.groupOrCell && (
                      <span className="text-[12px] text-[#B8BCE6] block truncate">
                        {p.groupOrCell}
                      </span>
                    )}
                  </div>
                  {p.registeredViaQr && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0F5132] text-[#4ADE80] text-[10px] font-black uppercase shrink-0">
                      QR Celular
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onUpdateState((prev) => ({
                        ...prev,
                        raffle: {
                          ...prev.raffle,
                          participants: prev.raffle.participants.map((it) =>
                            it.id === p.id ? { ...it, eliminated: !it.eliminated } : it
                          ),
                        },
                      }));
                    }}
                    className={`px-3 py-1 rounded-lg text-[12px] font-bold border transition-all cursor-pointer ${
                      p.eliminated
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {p.eliminated ? 'Restaurar' : 'Al Agua'}
                  </button>

                  {/* Requirement 9: "opción de quitar a alguien" */}
                  <button
                    onClick={() => handleRemoveParticipant(p.id, p.name)}
                    title="Dar de baja / quitar a este participante del sorteo"
                    className="p-1.5 rounded-lg bg-[#3F1216] text-[#EF4444] hover:bg-[#EF4444] hover:text-white border border-[#EF4444]/40 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#15173A] border-4 border-[#FFC53D] shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2A2D5C]">
              <span className="text-[18px] font-black text-white">QR de Inscripción para Celulares</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white text-[20px] font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white mx-auto inline-block border-2 border-slate-300">
              {qrModalDataUrl && <img src={qrModalDataUrl} alt="QR" className="w-64 h-64 mx-auto" />}
            </div>

            <div className="p-3 rounded-xl bg-[#0A0B1E] border border-[#2A2D5C] text-center">
              <span className="text-[11px] text-slate-400 uppercase tracking-widest block">SALA</span>
              <span className="text-[32px] font-black text-[#FFC53D] leading-none">{roomCode}</span>
            </div>

            <p className="text-[13px] text-[#B8BCE6]">
              Apunta la cámara de los celulares al código QR para abrir el formulario oficial de inscripción.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

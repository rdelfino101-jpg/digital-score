import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MasterLiveState,
  MasterSyncMessage,
  MasterViewMode,
  StudioTeam,
  TurnEngineState,
  ScoreboardConfig,
  TimerState,
  LiveHudToggles,
  LiveSceneSettings,
  GameStageState,
  BroadcastTheme,
  RemoteCommandType,
  StudioContentBank,
  CloudSyncConfig,
  BuzzerRuleConfig,
} from './types/masterStudio';
import {
  createInitialMasterLiveState,
  awardPointsToTeam,
  getNextTurnTeamId,
  getPrevTurnTeamId,
  rankStudioTeams,
  formatTimeDisplay,
} from './utils/gameEngineRules';
import {
  createMasterSyncChannel,
  loadMasterLiveState,
  saveMasterLiveState,
  MASTER_STUDIO_STORAGE_KEY,
} from './utils/masterStorageSync';
import { studioAudio } from './utils/audioSynth';
import { MasterProjectorView } from './components/MasterProjectorView';
import { MobileTactileRemoteView } from './components/remote/MobileTactileRemoteView';
import { DirectorHeader, ActiveConsoleTab } from './components/console/DirectorHeader';
import { TeamManagerSidebar } from './components/console/TeamManagerSidebar';
import { GameStudioPanel } from './components/console/GameStudioPanel';
import { ScoreboardConfigController } from './components/console/ScoreboardConfigController';
import { MasterBroadcastSidebar } from './components/console/MasterBroadcastSidebar';
import { HelpMasterManualModal } from './components/console/HelpMasterManualModal';
import { RemoteQrModal } from './components/console/RemoteQrModal';
import { ProjectorThemeModal } from './components/console/ProjectorThemeModal';
import { ExcelCloudManagerModal } from './components/console/modals/ExcelCloudManagerModal';
import { MobileJoinRegistrationView } from './components/raffle/MobileJoinRegistrationView';
import { MobileBuzzerView } from './components/buzzer/MobileBuzzerView';
import { BuzzerConsolePanel } from './components/console/buzzer/BuzzerConsolePanel';
import {
  getDefaultContentBank,
  countTotalBankItems,
  applyBankToMasterState,
  mergeContentBank,
} from './utils/excelContentEngine';
import {
  loadContentBankLocally,
  saveContentBankLocally,
  loadCloudConfig,
  saveCloudConfig,
  fetchContentBankFromGoogleSheets,
  fetchContentBankFromSupabase,
} from './utils/cloudSyncService';
import { RaffleStudioController } from './components/console/raffle/RaffleStudioController';
import {
  calculateDeterministicWheelSpin,
  calculateDeterministicSlotSpin,
  calculateDeterministicNumberDraw,
} from './utils/raffleEngineRules';
import { openSmartProjector } from './utils/smartProjector';
import {
  generateRoomCode,
  isValidRoomCode,
  generatePin,
  isValidPin,
  pushUndoSnapshot,
  popUndoSnapshot,
  ScoreTurnSnapshot,
} from './utils/roomSecurityRules';
import { Gamepad2, Tv, Award, Columns, ExternalLink, X, Smartphone, Gift } from 'lucide-react';

type AppActiveRoute = 'console' | 'projector' | 'remote' | 'join' | 'buzzer';

export default function App() {
  // -------------------------------------------------------------
  // 1. DUAL SCREEN & REMOTE URL ROUTE DETECTION
  // -------------------------------------------------------------
  const [currentRoute, setCurrentRoute] = useState<AppActiveRoute>(() => {
    if (typeof window === 'undefined') return 'console';
    const url = new URL(window.location.href);
    if (url.searchParams.get('view') === 'projector' || window.location.hash.includes('projector')) {
      return 'projector';
    }
    if (url.searchParams.get('view') === 'remote' || window.location.hash.includes('remote')) {
      return 'remote';
    }
    if (url.searchParams.get('view') === 'join' || window.location.hash.includes('join')) {
      return 'join';
    }
    if (url.searchParams.get('view') === 'buzzer' || window.location.hash.includes('buzzer')) {
      return 'buzzer';
    }
    return 'console';
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const url = new URL(window.location.href);
      if (url.searchParams.get('view') === 'projector' || window.location.hash.includes('projector')) {
        setCurrentRoute('projector');
      } else if (url.searchParams.get('view') === 'remote' || window.location.hash.includes('remote')) {
        setCurrentRoute('remote');
      } else if (url.searchParams.get('view') === 'join' || window.location.hash.includes('join')) {
        setCurrentRoute('join');
      } else if (url.searchParams.get('view') === 'buzzer' || window.location.hash.includes('buzzer')) {
        setCurrentRoute('buzzer');
      } else {
        setCurrentRoute('console');
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // -------------------------------------------------------------
  // ROUTE 0A: PARTICIPANT REGISTRATION VIA QR (?view=join&room=CODIGO)
  // -------------------------------------------------------------
  if (currentRoute === 'join') {
    return <MobileJoinRegistrationView />;
  }

  // -------------------------------------------------------------
  // ROUTE 0B: MOBILE TEAM BUZZER (?view=buzzer&room=CODIGO&team=ID&token=TOKEN)
  // -------------------------------------------------------------
  if (currentRoute === 'buzzer') {
    return <MobileBuzzerView />;
  }

  // -------------------------------------------------------------
  // ROUTE 1: REMOTE CONTROL (Mobile / Smartphone Mode)
  // -------------------------------------------------------------
  if (currentRoute === 'remote') {
    return <MobileRemoteRuntime />;
  }

  // -------------------------------------------------------------
  // ROUTE 2: FULLSCREEN PROJECTOR VIEW (Projector / Screen 2)
  // -------------------------------------------------------------
  if (currentRoute === 'projector') {
    return <ProjectorRuntime />;
  }

  // -------------------------------------------------------------
  // ROUTE 3: DIRECTOR OPERATOR STUDIO (PC Console)
  // -------------------------------------------------------------
  return <DirectorOperatorStudio />;
}

/**
 * Mobile Remote Controller Runtime (?view=remote)
 * Connects via WebSocket / BroadcastChannel to PC Director Console.
 */
function MobileRemoteRuntime() {
  const roomCode = useMemo(() => {
    if (typeof window === 'undefined') return 'K7P2';
    const param = new URL(window.location.href).searchParams.get('room');
    return param ? param.toUpperCase() : 'K7P2';
  }, []);

  const [remoteState, setRemoteState] = useState<MasterLiveState | null>(() => {
    return loadMasterLiveState(roomCode);
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const syncRef = useRef<ReturnType<typeof createMasterSyncChannel> | null>(null);

  useEffect(() => {
    const sync = createMasterSyncChannel({
      roomCode,
      role: 'remote',
      onMessage: (msg) => {
        if (msg.type === 'SYNC_MASTER_STATE' && msg.payload) {
          setRemoteState(msg.payload);
        } else if (msg.type === 'BUZZER_STATE') {
          const bState = msg.buzzer || msg.state;
          if (bState) setRemoteState((prev) => (prev ? { ...prev, buzzer: bState } : prev));
        }
      },
      onConnectionChange: (status) => setConnectionStatus(status),
      onAuthChange: (authed: boolean, err?: string) => {
        setIsAuthenticated(authed);
        setAuthError(err || null);
      },
    });
    syncRef.current = sync;
    sync.requestInitialState();

    // Cross-window storage fallback
    const storageKey = `master_studio_state_${roomCode}`;
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === storageKey || e.key === MASTER_STUDIO_STORAGE_KEY) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed.timestamp === 'number') {
            setRemoteState(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      sync.close();
    };
  }, [roomCode]);

  const handleSendCommand = (command: RemoteCommandType, payload?: any) => {
    if (syncRef.current) {
      syncRef.current.sendCommand(command, payload);
    }
  };

  const handleAuthenticate = (pin: string) => {
    if (syncRef.current) {
      syncRef.current.authenticate(pin);
    }
  };

  const handleExitRemote = () => {
    window.location.hash = '';
    window.location.search = '';
    window.location.reload();
  };

  return (
    <MobileTactileRemoteView
      masterState={remoteState}
      onSendCommand={handleSendCommand}
      connectionStatus={connectionStatus}
      onExitRemote={handleExitRemote}
      roomCode={roomCode}
      isAuthenticated={isAuthenticated}
      authError={authError}
      onAuthenticate={handleAuthenticate}
    />
  );
}

/**
 * Fullscreen Projector Runtime (?view=projector)
 */
function ProjectorRuntime() {
  const roomCode = useMemo(() => {
    if (typeof window === 'undefined') return 'K7P2';
    const param = new URL(window.location.href).searchParams.get('room');
    return param ? param.toUpperCase() : 'K7P2';
  }, []);

  const [projectorState, setProjectorState] = useState<MasterLiveState | null>(() => {
    return loadMasterLiveState(roomCode);
  });

  const lastReceivedTimestampRef = useRef<number>(projectorState?.timestamp || 0);

  useEffect(() => {
    // 1. Initial local load
    const immediate = loadMasterLiveState(roomCode);
    if (immediate) {
      setProjectorState(immediate);
      lastReceivedTimestampRef.current = immediate.timestamp;
    }

    // 2. Channel sync + Handshake
    const sync = createMasterSyncChannel({
      roomCode,
      role: 'projector',
      onMessage: (msg: MasterSyncMessage) => {
        if (msg.type === 'SYNC_MASTER_STATE' && msg.payload) {
          lastReceivedTimestampRef.current = msg.payload.timestamp;
          setProjectorState(msg.payload);
        } else if (msg.type === 'BUZZER_STATE') {
          const bState = msg.buzzer || msg.state;
          if (bState) setProjectorState((prev) => (prev ? { ...prev, buzzer: bState } : prev));
        } else if (msg.type === 'TRIGGER_SOUND') {
          if (msg.sound === 'correct') studioAudio.playCorrect();
          else if (msg.sound === 'error') studioAudio.playError();
          else if (msg.sound === 'turn') studioAudio.playTurnChange();
          else if (msg.sound === 'tick') studioAudio.playTick();
          else if (msg.sound === 'timesUp') studioAudio.playTimesUp();
          else if (msg.sound === 'wheel') studioAudio.playWheelClick();
          else if (msg.sound === 'fanfare') studioAudio.playFanfare();
          else if (msg.sound === 'drumroll') studioAudio.playDrumroll();
          else if (msg.sound === 'splash') studioAudio.playEliminatedSplash();
          else if (msg.sound === 'buzzer') studioAudio.playBuzzerPress();
        }
      },
    });

    sync.requestInitialState();

    // 3. Storage event listener (cross-window event)
    const storageKey = `master_studio_state_${roomCode}`;
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === storageKey || e.key === MASTER_STUDIO_STORAGE_KEY) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as MasterLiveState;
          if (parsed && typeof parsed.timestamp === 'number') {
            if (parsed.timestamp > lastReceivedTimestampRef.current) {
              lastReceivedTimestampRef.current = parsed.timestamp;
              setProjectorState(parsed);
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Lightweight fallback polling every 200ms
    const pollInterval = setInterval(() => {
      try {
        const raw = localStorage.getItem(storageKey) || localStorage.getItem(MASTER_STUDIO_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as MasterLiveState;
          if (parsed && parsed.timestamp > lastReceivedTimestampRef.current) {
            lastReceivedTimestampRef.current = parsed.timestamp;
            setProjectorState(parsed);
          }
        }
      } catch {
        // ignore
      }
    }, 200);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
      sync.close();
    };
  }, [roomCode]);

  return (
    <MasterProjectorView
      masterState={projectorState}
      onExitProjector={() => {
        window.location.hash = '';
        window.location.search = '';
        window.location.reload();
      }}
    />
  );
}

/**
 * Main Production Operator Console (Director Studio)
 */
function DirectorOperatorStudio() {
  const [roomCode] = useState<string>(() => {
    if (typeof window === 'undefined') return 'K7P2';
    const param = new URL(window.location.href).searchParams.get('room');
    if (param && isValidRoomCode(param)) return param.toUpperCase();
    const stored = localStorage.getItem('master_studio_active_room');
    if (stored && isValidRoomCode(stored)) return stored;
    const generated = generateRoomCode();
    localStorage.setItem('master_studio_active_room', generated);
    return generated;
  });

  // Ensure URL query has ?room=ROOMCODE without full page reload
  useEffect(() => {
    if (typeof window !== 'undefined' && roomCode) {
      const url = new URL(window.location.href);
      if (url.searchParams.get('room') !== roomCode) {
        url.searchParams.set('room', roomCode);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [roomCode]);

  const [operatorPin, setOperatorPin] = useState<string>(() => {
    if (typeof window === 'undefined') return '1234';
    return localStorage.getItem(`master_studio_pin_${roomCode}`) || '1234';
  });

  const [masterState, setMasterState] = useState<MasterLiveState>(() => {
    const loaded = loadMasterLiveState(roomCode);
    saveMasterLiveState(loaded, roomCode);
    return loaded;
  });

  const [activeTab, setActiveTab] = useState<ActiveConsoleTab>('scoreboard');
  const [autoSyncToProjector, setAutoSyncToProjector] = useState(true);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isRemoteQrOpen, setIsRemoteQrOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [projectorToast, setProjectorToast] = useState<string | null>(null);
  const [connectedClientsCount, setConnectedClientsCount] = useState<number>(0);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [contentBank, setContentBank] = useState<StudioContentBank>(() => {
    const local = loadContentBankLocally();
    if (local) return local;
    const def = getDefaultContentBank();
    saveContentBankLocally(def);
    return def;
  });
  const [cloudConfig, setCloudConfig] = useState<CloudSyncConfig>(() => loadCloudConfig());

  // 6. DESHACER (Undo): Store last 20 score and turn changes
  const undoHistoryRef = useRef<ScoreTurnSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [undoCount, setUndoCount] = useState(0);

  const recordUndoSnapshot = useCallback(() => {
    const current = masterStateRef.current;
    undoHistoryRef.current = pushUndoSnapshot(undoHistoryRef.current, {
      teams: current.teams,
      turn: current.turn,
      timestamp: Date.now(),
    });
    setCanUndo(true);
    setUndoCount(undoHistoryRef.current.length);
  }, []);

  // Diagnostic tracking for sync
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());
  const [isSyncFlash, setIsSyncFlash] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  const masterStateRef = useRef<MasterLiveState>(masterState);
  masterStateRef.current = masterState;

  const syncChannelRef = useRef<ReturnType<typeof createMasterSyncChannel> | null>(null);

  const handleRotatePin = useCallback(() => {
    const newPin = generatePin();
    setOperatorPin(newPin);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`master_studio_pin_${roomCode}`, newPin);
    }
    if (syncChannelRef.current) {
      syncChannelRef.current.notifyPinChanged(newPin);
    }
  }, [roomCode]);

  // Update master state and broadcast to all peers (Projector + Remotes)
  const updateMaster = useCallback(
    (updater: (prev: MasterLiveState) => MasterLiveState) => {
      setMasterState((prev) => {
        const next = updater(prev);
        const stamped = { ...next, timestamp: Date.now() };
        masterStateRef.current = stamped;
        saveMasterLiveState(stamped, roomCode);
        if (syncChannelRef.current) {
          syncChannelRef.current.broadcastState(stamped);
        }
        setLastSyncTimestamp(stamped.timestamp);
        setIsSyncFlash(true);
        setTimeout(() => setIsSyncFlash(false), 200);
        return stamped;
      });
    },
    [roomCode]
  );

  const handleUndo = useCallback(() => {
    const { previous, remaining } = popUndoSnapshot(undoHistoryRef.current);
    if (!previous) return;
    undoHistoryRef.current = remaining;
    setCanUndo(remaining.length > 0);
    setUndoCount(remaining.length);
    updateMaster((prev) => ({
      ...prev,
      teams: previous.teams,
      turn: previous.turn,
    }));
    studioAudio.playTurnChange();
  }, [updateMaster]);

  // Keyboard shortcut Ctrl+Z / Cmd+Z for Director Console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  const handleUpdateContentBank = useCallback(
    (newBank: StudioContentBank) => {
      setContentBank(newBank);
      saveContentBankLocally(newBank);
      updateMaster((prev) => applyBankToMasterState(prev, newBank));
    },
    [updateMaster]
  );

  const handleSaveCloudConfig = useCallback((cfg: CloudSyncConfig) => {
    setCloudConfig(cfg);
    saveCloudConfig(cfg);
  }, []);

  const totalBankItems = useMemo(() => countTotalBankItems(contentBank), [contentBank]);

  // Cloud auto-sync on director console startup if configured
  useEffect(() => {
    let isMounted = true;
    const runStartupCloudSync = async () => {
      if (cloudConfig.googleSheetsAutoSync && cloudConfig.googleSheetsUrl) {
        try {
          const res = await fetchContentBankFromGoogleSheets(cloudConfig.googleSheetsUrl);
          if (res.success && res.bank && isMounted) {
            const fullBank = mergeContentBank(getDefaultContentBank(), res.bank, 'replace');
            setContentBank(fullBank);
            saveContentBankLocally(fullBank);
            updateMaster((prev) => applyBankToMasterState(prev, fullBank));
          }
        } catch {
          // fallback silently
        }
      } else if (
        cloudConfig.supabaseConnected &&
        cloudConfig.supabaseUrl &&
        cloudConfig.supabaseAnonKey
      ) {
        try {
          const res = await fetchContentBankFromSupabase(cloudConfig);
          if (res.success && res.bank && isMounted) {
            const fullBank = mergeContentBank(getDefaultContentBank(), res.bank, 'replace');
            setContentBank(fullBank);
            saveContentBankLocally(fullBank);
            updateMaster((prev) => applyBankToMasterState(prev, fullBank));
          }
        } catch {
          // fallback silently
        }
      }
    };

    runStartupCloudSync();
    return () => {
      isMounted = false;
    };
  }, [cloudConfig.googleSheetsAutoSync, cloudConfig.googleSheetsUrl, cloudConfig.supabaseConnected, cloudConfig.supabaseUrl, cloudConfig.supabaseAnonKey, updateMaster]);

  const handleBroadcastSound = useCallback(
    (sound: 'correct' | 'error' | 'turn' | 'tick' | 'timesUp' | 'wheel' | 'fanfare' | 'drumroll' | 'splash') => {
      if (syncChannelRef.current) {
        syncChannelRef.current.broadcastSound(sound);
      }
    },
    []
  );

  const handleSetViewMode = useCallback((viewMode: MasterViewMode) => {
    updateMaster((prev) => ({ ...prev, viewMode }));
  }, [updateMaster]);

  const handleSelectTab = useCallback(
    (tab: ActiveConsoleTab) => {
      setActiveTab(tab);
      if (autoSyncToProjector) {
        if (tab === 'scoreboard') {
          updateMaster((prev) => ({ ...prev, viewMode: 'SCOREBOARD_ONLY' }));
        } else if (tab === 'games') {
          updateMaster((prev) => ({ ...prev, viewMode: 'GAME_STAGE' }));
        } else if (tab === 'raffle') {
          updateMaster((prev) => ({ ...prev, viewMode: 'RAFFLE_STAGE' }));
        }
      }
    },
    [autoSyncToProjector, updateMaster]
  );

  const handleChangeTheme = useCallback((theme: BroadcastTheme) => {
    updateMaster((prev) => ({
      ...prev,
      scene: { ...prev.scene, theme },
    }));
  }, [updateMaster]);

  const handleUpdateTeams = useCallback((teams: StudioTeam[]) => {
    recordUndoSnapshot();
    updateMaster((prev) => ({ ...prev, teams }));
  }, [recordUndoSnapshot, updateMaster]);

  const handleUpdateTurn = useCallback((turn: TurnEngineState) => {
    recordUndoSnapshot();
    updateMaster((prev) => ({ ...prev, turn }));
  }, [recordUndoSnapshot, updateMaster]);

  const handleAwardPoints = useCallback(
    (teamId: string, points: number, advanceTurn = true) => {
      recordUndoSnapshot();
      updateMaster((prev) => {
        const updatedTeams = awardPointsToTeam(prev.teams, teamId, points);
        let nextTurn = { ...prev.turn };
        if (advanceTurn && prev.turn.autoAdvanceOnScore) {
          nextTurn.activeTeamId = getNextTurnTeamId(updatedTeams, prev.turn.activeTeamId);
          nextTurn.stealMode = false;
        }
        return {
          ...prev,
          teams: updatedTeams,
          turn: nextTurn,
        };
      });
    },
    [recordUndoSnapshot, updateMaster]
  );

  const handleAwardActiveTeam = useCallback(
    (points: number, actionName: string) => {
      recordUndoSnapshot();
      studioAudio.playCorrect();
      handleBroadcastSound('correct');
      updateMaster((prev) => {
        const activeTeamId = prev.turn.activeTeamId || prev.teams[0]?.id;
        if (!activeTeamId) return prev;
        const updatedTeams = awardPointsToTeam(prev.teams, activeTeamId, points);
        let nextTurn = { ...prev.turn };
        if (prev.turn.autoAdvanceOnScore) {
          nextTurn.activeTeamId = getNextTurnTeamId(updatedTeams, prev.turn.activeTeamId);
          nextTurn.stealMode = false;
        }
        nextTurn.lastActionMessage = `+${points} pts a ${prev.teams.find((t) => t.id === activeTeamId)?.name || 'Equipo'} (${actionName})`;
        return {
          ...prev,
          teams: updatedTeams,
          turn: nextTurn,
        };
      });
    },
    [handleBroadcastSound, recordUndoSnapshot, updateMaster]
  );

  const handleNextTurn = useCallback(() => {
    recordUndoSnapshot();
    studioAudio.playTurnChange();
    handleBroadcastSound('turn');
    updateMaster((prev) => {
      const nextTeamId = getNextTurnTeamId(prev.teams, prev.turn.activeTeamId);
      return {
        ...prev,
        turn: {
          ...prev.turn,
          activeTeamId: nextTeamId,
          lastActionMessage: `Turno avanzado a ${prev.teams.find((t) => t.id === nextTeamId)?.name || 'Equipo'}`,
        },
      };
    });
  }, [handleBroadcastSound, recordUndoSnapshot, updateMaster]);

  const handlePrevTurn = useCallback(() => {
    recordUndoSnapshot();
    studioAudio.playTurnChange();
    handleBroadcastSound('turn');
    updateMaster((prev) => {
      const prevTeamId = getPrevTurnTeamId(prev.teams, prev.turn.activeTeamId);
      return {
        ...prev,
        turn: {
          ...prev.turn,
          activeTeamId: prevTeamId,
          lastActionMessage: `Turno regresado a ${prev.teams.find((t) => t.id === prevTeamId)?.name || 'Equipo'}`,
        },
      };
    });
  }, [handleBroadcastSound, recordUndoSnapshot, updateMaster]);

  const handleTriggerError = useCallback(() => {
    studioAudio.playError();
    handleBroadcastSound('error');
    updateMaster((prev) => {
      let nextTurn = { ...prev.turn };
      if (nextTurn.stealMode) {
        nextTurn.activeTeamId = getNextTurnTeamId(prev.teams, prev.turn.activeTeamId);
        nextTurn.lastActionMessage = `¡Fallo! Oportunidad de robo para ${prev.teams.find((t) => t.id === nextTurn.activeTeamId)?.name || 'Equipo'}`;
      }
      return {
        ...prev,
        turn: nextTurn,
      };
    });
  }, [handleBroadcastSound, updateMaster]);

  const handleTriggerCelebration = useCallback(() => {
    const ranked = rankStudioTeams(masterStateRef.current.teams);
    const leader = ranked[0];
    updateMaster((prev) => ({
      ...prev,
      scene: {
        ...prev.scene,
        celebrationActive: true,
        celebrationWinner: leader
          ? {
              name: leader.name,
              score: leader.score,
              color: leader.color,
              subtitle: '¡Gran Campeón del Evento!',
            }
          : null,
      },
    }));
    studioAudio.playFanfare();
    handleBroadcastSound('fanfare');
  }, [handleBroadcastSound, updateMaster]);

  // Handle incoming remote commands from mobile devices
  const handleRemoteCommand = useCallback(
    (cmd: RemoteCommandType, payload?: any) => {
      switch (cmd) {
        case 'AWARD_POINTS': {
          const pts = typeof payload?.points === 'number' ? payload.points : 100;
          const targetTeamId =
            payload?.teamId ||
            masterStateRef.current.turn.activeTeamId ||
            masterStateRef.current.teams[0]?.id;
          if (targetTeamId) {
            handleAwardPoints(targetTeamId, pts, true);
            studioAudio.playCorrect();
            handleBroadcastSound('correct');
          }
          break;
        }
        case 'QUICK_ADJUST': {
          const delta = typeof payload?.delta === 'number' ? payload.delta : 1;
          const targetTeamId =
            payload?.teamId ||
            masterStateRef.current.turn.activeTeamId ||
            masterStateRef.current.teams[0]?.id;
          if (targetTeamId) {
            handleAwardPoints(targetTeamId, delta, false);
          }
          break;
        }
        case 'NEXT_TURN': {
          handleNextTurn();
          break;
        }
        case 'PREV_TURN': {
          handlePrevTurn();
          break;
        }
        case 'SELECT_TURN': {
          if (payload?.teamId) {
            updateMaster((prev) => ({
              ...prev,
              turn: {
                ...prev.turn,
                activeTeamId: payload.teamId,
                lastActionMessage: `Turno asignado a ${prev.teams.find((t) => t.id === payload.teamId)?.name || 'Equipo'}`,
              },
            }));
          }
          break;
        }
        case 'TOGGLE_STEAL': {
          updateMaster((prev) => ({
            ...prev,
            turn: {
              ...prev.turn,
              stealMode: !prev.turn.stealMode,
            },
          }));
          break;
        }
        case 'TRIGGER_SOUND': {
          if (payload === 'correct') studioAudio.playCorrect();
          else if (payload === 'error') studioAudio.playError();
          else if (payload === 'turn') studioAudio.playTurnChange();
          else if (payload === 'tick') studioAudio.playTick();
          else if (payload === 'timesUp') studioAudio.playTimesUp();
          else if (payload === 'wheel') studioAudio.playWheelClick();
          else if (payload === 'fanfare') studioAudio.playFanfare();
          handleBroadcastSound(payload);
          break;
        }
        case 'SET_VIEW_MODE': {
          if (payload?.viewMode) {
            handleSetViewMode(payload.viewMode);
          }
          break;
        }
        case 'SET_ACTIVE_GAME': {
          if (payload?.gameId) {
            updateMaster((prev) => ({
              ...prev,
              gameStage: {
                ...prev.gameStage,
                activeGameId: payload.gameId,
              },
            }));
          }
          break;
        }
        case 'TOGGLE_TIMER': {
          updateMaster((prev) => ({
            ...prev,
            timer: {
              ...prev.timer,
              isRunning: !prev.timer.isRunning,
              lastTickTimestamp: Date.now(),
            },
          }));
          break;
        }
        case 'RESET_TIMER': {
          updateMaster((prev) => ({
            ...prev,
            timer: {
              ...prev.timer,
              isRunning: false,
              secondsRemaining: prev.timer.initialSeconds,
              stopwatchSeconds: 0,
            },
          }));
          break;
        }
        case 'TRIGGER_CELEBRATION': {
          handleTriggerCelebration();
          break;
        }
        case 'NEXT_GAME_ITEM': {
          updateMaster((prev) => {
            const activeGame = prev.gameStage.activeGameId;
            const stageKey =
              activeGame === 'bible_book'
                ? 'bibleBook'
                : activeGame === 'who_said_it'
                ? 'whoSaidIt'
                : activeGame === 'hangman'
                ? 'hangman'
                : activeGame === 'charades'
                ? 'charades'
                : activeGame === 'family_feud'
                ? 'familyFeud'
                : activeGame === 'trivia_show'
                ? 'triviaShow'
                : activeGame === 'anagram_wheel'
                ? 'anagramWheel'
                : activeGame === 'millionaire_show'
                ? 'millionaireShow'
                : activeGame === 'deal_or_nodeal'
                ? 'dealOrNoDeal'
                : 'musicKaraoke';

            const currentStage = prev.gameStage[stageKey] as any;
            if (currentStage && Array.isArray(currentStage.items)) {
              const nextIndex = (currentStage.currentIndex + 1) % currentStage.items.length;
              return {
                ...prev,
                gameStage: {
                  ...prev.gameStage,
                  [stageKey]: {
                    ...currentStage,
                    currentIndex: nextIndex,
                    revealed: false,
                    revealedSong: false,
                    isMusicCut: false,
                    selectedOption: null,
                    pointsAwarded: false,
                  },
                },
              };
            }
            return prev;
          });
          break;
        }
        case 'PREV_GAME_ITEM': {
          updateMaster((prev) => {
            const activeGame = prev.gameStage.activeGameId;
            const stageKey =
              activeGame === 'bible_book'
                ? 'bibleBook'
                : activeGame === 'who_said_it'
                ? 'whoSaidIt'
                : activeGame === 'hangman'
                ? 'hangman'
                : activeGame === 'charades'
                ? 'charades'
                : activeGame === 'family_feud'
                ? 'familyFeud'
                : activeGame === 'trivia_show'
                ? 'triviaShow'
                : activeGame === 'anagram_wheel'
                ? 'anagramWheel'
                : activeGame === 'millionaire_show'
                ? 'millionaireShow'
                : activeGame === 'deal_or_nodeal'
                ? 'dealOrNoDeal'
                : 'musicKaraoke';

            const currentStage = prev.gameStage[stageKey] as any;
            if (currentStage && Array.isArray(currentStage.items)) {
              const nextIndex =
                (currentStage.currentIndex - 1 + currentStage.items.length) % currentStage.items.length;
              return {
                ...prev,
                gameStage: {
                  ...prev.gameStage,
                  [stageKey]: {
                    ...currentStage,
                    currentIndex: nextIndex,
                    revealed: false,
                    revealedSong: false,
                    isMusicCut: false,
                    selectedOption: null,
                    pointsAwarded: false,
                  },
                },
              };
            }
            return prev;
          });
          break;
        }
        case 'REVEAL_GAME_ANSWER': {
          updateMaster((prev) => {
            const activeGame = prev.gameStage.activeGameId;
            const stageKey =
              activeGame === 'bible_book'
                ? 'bibleBook'
                : activeGame === 'who_said_it'
                ? 'whoSaidIt'
                : activeGame === 'hangman'
                ? 'hangman'
                : activeGame === 'charades'
                ? 'charades'
                : activeGame === 'family_feud'
                ? 'familyFeud'
                : activeGame === 'trivia_show'
                ? 'triviaShow'
                : activeGame === 'anagram_wheel'
                ? 'anagramWheel'
                : activeGame === 'millionaire_show'
                ? 'millionaireShow'
                : activeGame === 'deal_or_nodeal'
                ? 'dealOrNoDeal'
                : 'musicKaraoke';

            const currentStage = prev.gameStage[stageKey] as any;
            if (currentStage && 'revealed' in currentStage) {
              return {
                ...prev,
                gameStage: {
                  ...prev.gameStage,
                  [stageKey]: {
                    ...currentStage,
                    revealed: !currentStage.revealed,
                  },
                },
              };
            }
            if (currentStage && 'revealedSong' in currentStage) {
              return {
                ...prev,
                gameStage: {
                  ...prev.gameStage,
                  [stageKey]: {
                    ...currentStage,
                    revealedSong: !currentStage.revealedSong,
                  },
                },
              };
            }
            return prev;
          });
          break;
        }
        case 'SPIN_RAFFLE': {
          updateMaster((prev) => {
            const rf = prev.raffle;
            if (rf.activeSpin?.isSpinning) return prev;
            const valid = rf.participants.filter((p) => !p.eliminated);
            if (valid.length === 0 && rf.mode !== 'tombola_numbers') return prev;

            let spinEvent: any = null;
            if (rf.mode === 'wheel') {
              spinEvent = calculateDeterministicWheelSpin(
                rf,
                rf.activeSpin?.targetAngle || 0
              );
            } else if (rf.mode === 'slot_machine') {
              spinEvent = calculateDeterministicSlotSpin(rf);
            } else if (rf.mode === 'tombola_numbers') {
              const res = calculateDeterministicNumberDraw(rf);
              if (res) {
                spinEvent = {
                  spinId: Date.now(),
                  isSpinning: true,
                  winnerIndex: res.drawnNumber,
                  winnerItem: res.participant,
                  targetAngle: 0,
                  slotFinalIndices: [res.drawnNumber, res.drawnNumber, res.drawnNumber],
                  durationMs: rf.spinDurationSeconds * 1000,
                  startTime: Date.now(),
                  rule: rf.drawRule,
                  eliminationRound: rf.currentEliminationCount + 1,
                  eliminationTotal: rf.eliminationTargetRound,
                  prizeTitle: rf.prizeTitle,
                };
              }
            }

            if (!spinEvent) return prev;

            if (rf.drawRule === 'elimination') {
              studioAudio.playDrumroll(rf.spinDurationSeconds);
              handleBroadcastSound('drumroll');
            } else {
              studioAudio.playWheelClick();
              handleBroadcastSound('wheel');
            }

            return {
              ...prev,
              raffle: {
                ...rf,
                activeSpin: spinEvent,
              },
            };
          });
          break;
        }
        case 'SET_RAFFLE_MODE': {
          if (payload?.mode) {
            updateMaster((prev) => ({
              ...prev,
              raffle: {
                ...prev.raffle,
                mode: payload.mode,
              },
            }));
          }
          break;
        }
        case 'RESET_RAFFLE': {
          updateMaster((prev) => ({
            ...prev,
            raffle: {
              ...prev.raffle,
              participants: prev.raffle.participants.map((p) => ({ ...p, eliminated: false })),
              activeSpin: null,
              lastWinner: null,
              currentEliminationCount: 0,
              drawnNumbersHistory: [],
            },
          }));
          break;
        }
        case 'UNDO_LAST_ACTION': {
          handleUndo();
          break;
        }
        case 'BUZZER_OPEN': {
          syncChannelRef.current?.sendBuzzerOpen();
          break;
        }
        case 'BUZZER_CLOSE': {
          syncChannelRef.current?.sendBuzzerClose();
          break;
        }
        case 'BUZZER_RESET': {
          syncChannelRef.current?.sendBuzzerReset();
          break;
        }
        case 'BUZZER_JUDGE': {
          if (payload?.result === 'correct' || payload?.result === 'incorrect') {
            syncChannelRef.current?.sendBuzzerJudge(payload.result);
          }
          break;
        }
      }
    },
    [
      handleAwardPoints,
      handleNextTurn,
      handlePrevTurn,
      handleSetViewMode,
      handleTriggerCelebration,
      handleBroadcastSound,
      handleUndo,
      updateMaster,
    ]
  );

  // Initialize master sync channel (handles handshake and mobile commands)
  useEffect(() => {
    const sync = createMasterSyncChannel({
      roomCode,
      role: 'director',
      onMessage: (msg: MasterSyncMessage) => {
        if (msg.type === 'REQUEST_INITIAL_STATE') {
          sync.broadcastState(masterStateRef.current);
        } else if (msg.type === 'REMOTE_COMMAND') {
          handleRemoteCommand(msg.command, msg.payload);
        } else if (msg.type === 'BUZZER_STATE') {
          const bState = msg.buzzer || msg.state;
          if (bState) {
            updateMaster((prev) => ({
              ...prev,
              buzzer: bState,
            }));
          }
        } else if (msg.type === 'TRIGGER_SOUND') {
          if (msg.sound === 'correct') studioAudio.playCorrect();
          else if (msg.sound === 'error') studioAudio.playError();
          else if (msg.sound === 'turn') studioAudio.playTurnChange();
          else if (msg.sound === 'tick') studioAudio.playTick();
          else if (msg.sound === 'timesUp') studioAudio.playTimesUp();
          else if (msg.sound === 'wheel') studioAudio.playWheelClick();
          else if (msg.sound === 'fanfare') studioAudio.playFanfare();
          else if (msg.sound === 'drumroll') studioAudio.playDrumroll();
          else if (msg.sound === 'splash') studioAudio.playEliminatedSplash();
          else if (msg.sound === 'buzzer') studioAudio.playBuzzerPress();
        }
      },
    });

    syncChannelRef.current = sync;
    return () => {
      sync.close();
    };
  }, [handleRemoteCommand, roomCode]);

  // Master Clock tick interval (Countdown or Stopwatch)
  useEffect(() => {
    if (!masterState.timer.isRunning) return;

    const interval = setInterval(() => {
      setMasterState((prev) => {
        if (!prev.timer.isRunning) return prev;

        let nextTimer = { ...prev.timer };
        if (prev.timer.mode === 'countdown') {
          const nextRemaining = Math.max(0, prev.timer.secondsRemaining - 1);
          if (nextRemaining === 0 && prev.timer.secondsRemaining > 0) {
            studioAudio.playTimesUp();
            handleBroadcastSound('timesUp');
          }
          nextTimer.secondsRemaining = nextRemaining;
        } else if (prev.timer.mode === 'stopwatch') {
          nextTimer.stopwatchSeconds = prev.timer.stopwatchSeconds + 1;
        }
        nextTimer.lastTickTimestamp = Date.now();

        const updated: MasterLiveState = {
          ...prev,
          timer: nextTimer,
          timestamp: Date.now(),
        };
        masterStateRef.current = updated;
        saveMasterLiveState(updated);
        if (syncChannelRef.current) {
          syncChannelRef.current.broadcastState(updated);
        }
        setLastSyncTimestamp(updated.timestamp);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [masterState.timer.isRunning, handleBroadcastSound]);

  // Charades Game internal round timer tick
  useEffect(() => {
    const isCharadesRunning = masterState.gameStage.charades.isRunning;
    if (!isCharadesRunning) return;

    const interval = setInterval(() => {
      setMasterState((prev) => {
        if (!prev.gameStage.charades.isRunning) return prev;
        const currentSec = prev.gameStage.charades.remainingSeconds;
        const nextSec = Math.max(0, currentSec - 1);

        if (nextSec === 0 && currentSec > 0) {
          studioAudio.playTimesUp();
          handleBroadcastSound('timesUp');
        }

        const nextCharades = {
          ...prev.gameStage.charades,
          remainingSeconds: nextSec,
          isRunning: nextSec > 0,
        };

        const updated: MasterLiveState = {
          ...prev,
          gameStage: {
            ...prev.gameStage,
            charades: nextCharades,
          },
          timestamp: Date.now(),
        };
        masterStateRef.current = updated;
        saveMasterLiveState(updated, roomCode);
        if (syncChannelRef.current) {
          syncChannelRef.current.broadcastState(updated);
        }
        setLastSyncTimestamp(updated.timestamp);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [masterState.gameStage.charades.isRunning, handleBroadcastSound]);

  // Auto-dismiss celebration winner after 6s
  useEffect(() => {
    if (!masterState.scene.celebrationActive) return;
    const timeout = setTimeout(() => {
      updateMaster((prev) => ({
        ...prev,
        scene: { ...prev.scene, celebrationActive: false },
      }));
    }, 6000);
    return () => clearTimeout(timeout);
  }, [masterState.scene.celebrationActive, updateMaster]);

  const handleQuickAdjustScore = useCallback(
    (teamId: string, delta: number) => {
      handleAwardPoints(teamId, delta, false);
    },
    [handleAwardPoints]
  );

  const handleUpdateScoreboard = (scoreboard: ScoreboardConfig) => {
    updateMaster((prev) => ({ ...prev, scoreboard }));
  };

  const handleUpdateTimer = (timer: TimerState) => {
    updateMaster((prev) => ({ ...prev, timer }));
  };

  const handleUpdateHudToggles = (hudToggles: LiveHudToggles) => {
    updateMaster((prev) => ({ ...prev, hudToggles }));
  };

  const handleUpdateScene = (scene: LiveSceneSettings) => {
    updateMaster((prev) => ({ ...prev, scene }));
  };

  const handleOpenProjectorWindow = async () => {
    try {
      const result = await openSmartProjector(roomCode);
      setPopupBlocked(result.blocked);
      setProjectorToast(result.message);
      setTimeout(() => {
        setProjectorToast(null);
      }, 4500);
    } catch (err) {
      console.warn('Error opening smart projector:', err);
      setPopupBlocked(true);
    }
  };

  const lastSyncText = useMemo(() => {
    const elapsed = Math.max(0, nowTick - lastSyncTimestamp);
    if (elapsed < 1000) return `hace ${elapsed}ms`;
    if (elapsed < 60000) return `hace ${Math.floor(elapsed / 1000)}s`;
    return `hace ${Math.floor(elapsed / 60000)}m`;
  }, [nowTick, lastSyncTimestamp]);

  const remoteUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?view=remote&room=${encodeURIComponent(roomCode)}`;
  }, [roomCode]);

  return (
    <div className="flex h-screen w-screen flex-col bg-[#070b14] text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* 1. Header Único Compacto (1 Sola Fila Superior de 64px) */}
      <DirectorHeader
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        autoSyncToProjector={autoSyncToProjector}
        onToggleAutoSync={() => setAutoSyncToProjector(!autoSyncToProjector)}
        theme={masterState.scene.theme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        isSplitView={isSplitView}
        onToggleSplitView={() => setIsSplitView(!isSplitView)}
        onOpenProjectorWindow={handleOpenProjectorWindow}
        onOpenRemoteModal={() => setIsRemoteQrOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        lastSyncText={lastSyncText}
        isSyncFlash={isSyncFlash}
        projectorToast={projectorToast}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        totalBankItems={totalBankItems}
        roomCode={roomCode}
        canUndo={canUndo}
        undoCount={undoCount}
        onUndo={handleUndo}
      />

      {/* Discrete Popup Blocked Notification */}
      {popupBlocked && (
        <div className="flex items-center justify-between bg-amber-950/90 border-b border-amber-500/50 px-4 py-1.5 text-xs text-amber-200 shrink-0 z-30">
          <span>
            ⚠️ El navegador bloqueó la ventana emergente. Puedes{' '}
            <a
              href={`${window.location.origin}${window.location.pathname}?view=projector#projector`}
              target="_blank"
              rel="noreferrer"
              className="underline font-bold text-white hover:text-amber-100"
            >
              hacer clic aquí para abrir la Pantalla de Proyección
            </a>{' '}
            o activar <strong>"Vista Dividida"</strong>.
          </span>
          <button
            onClick={() => setPopupBlocked(false)}
            className="rounded p-0.5 text-amber-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Estructura Principal de 3 Columnas Fijas (h-[calc(100vh-64px)] overflow-hidden) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* COLUMNA IZQUIERDA: GESTIÓN DE EQUIPOS Y TURNOS (w-80 Fijo) */}
        <TeamManagerSidebar
          teams={masterState.teams}
          turn={masterState.turn}
          onUpdateTeams={handleUpdateTeams}
          onUpdateTurn={handleUpdateTurn}
          onQuickAdjustScore={handleQuickAdjustScore}
          isRaffleModule={activeTab === 'raffle'}
          raffleWinners={masterState.raffle.winnersHistory}
        />

        {/* COLUMNA CENTRAL: ÁREA DE TRABAJO DEL MÓDULO ACTIVO (flex-1 con scroll interno) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#070b14]">
          {activeTab === 'scoreboard' ? (
            <ScoreboardConfigController
              scoreboard={masterState.scoreboard}
              timer={masterState.timer}
              hudToggles={masterState.hudToggles}
              scene={masterState.scene}
              teams={masterState.teams}
              viewMode={masterState.viewMode}
              onSetViewMode={handleSetViewMode}
              onUpdateScoreboard={handleUpdateScoreboard}
              onUpdateTimer={handleUpdateTimer}
              onUpdateHudToggles={handleUpdateHudToggles}
              onUpdateScene={handleUpdateScene}
              onTriggerCelebration={handleTriggerCelebration}
            />
          ) : activeTab === 'games' ? (
            <GameStudioPanel
              state={masterState}
              onUpdateState={updateMaster}
              onSetViewMode={handleSetViewMode}
              onAwardActiveTeam={handleAwardActiveTeam}
              onTriggerError={handleTriggerError}
              onNextTurn={handleNextTurn}
            />
          ) : activeTab === 'raffle' ? (
            <RaffleStudioController
              state={masterState}
              onUpdateState={updateMaster}
              onSetViewMode={handleSetViewMode}
              onImportTeamsToScoreboard={handleUpdateTeams}
            />
          ) : (
            <BuzzerConsolePanel
              roomCode={roomCode}
              pin={operatorPin}
              teams={masterState.teams}
              buzzerState={masterState.buzzer || null}
              onOpen={() => syncChannelRef.current?.sendBuzzerOpen()}
              onClose={() => syncChannelRef.current?.sendBuzzerClose()}
              onReset={() => syncChannelRef.current?.sendBuzzerReset()}
              onJudge={(result: 'correct' | 'incorrect') =>
                syncChannelRef.current?.sendBuzzerJudge(result)
              }
              onConfigUpdate={(config: Partial<BuzzerRuleConfig>) =>
                syncChannelRef.current?.sendBuzzerConfigUpdate(config)
              }
              onRegenerateTokens={() =>
                syncChannelRef.current?.sendBuzzerRegenerateTokens()
              }
            />
          )}
        </div>

        {/* COLUMNA DERECHA: MASTER BROADCAST, MONITOR PIP INTEGRADO Y SOUNDPAD FX (w-80 Fijo) */}
        {isSplitView ? (
          <div className="flex flex-col w-[540px] shrink-0 border-l border-slate-800 bg-black">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span>SALIDA DE PROYECCIÓN EN VIVO (VISTA DIVIDIDA)</span>
              </div>
              <button
                onClick={() => setIsSplitView(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cerrar Dividida
              </button>
            </div>
            <div className="relative flex-1 overflow-hidden">
              <MasterProjectorView masterState={masterState} isEmbeddedPreview={true} />
            </div>
          </div>
        ) : (
          <MasterBroadcastSidebar
            masterState={masterState}
            onSetViewMode={handleSetViewMode}
            onOpenProjector={handleOpenProjectorWindow}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            onTriggerCelebration={handleTriggerCelebration}
            onBroadcastSound={handleBroadcastSound}
          />
        )}
      </div>

      {/* Modales Globales (Control Remoto QR, Tema y Fondo, y Manual de Operación) */}
      <ProjectorThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        scene={masterState.scene}
        onUpdateScene={handleUpdateScene}
      />

      <RemoteQrModal
        isOpen={isRemoteQrOpen}
        onClose={() => setIsRemoteQrOpen(false)}
        remoteUrl={remoteUrl}
        connectedClients={connectedClientsCount}
        roomCode={roomCode}
        operatorPin={operatorPin}
        onRotatePin={handleRotatePin}
      />

      <HelpMasterManualModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Gestor Excel y Nube Multi-Dispositivo Modal */}
      <ExcelCloudManagerModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        contentBank={contentBank}
        onUpdateContentBank={handleUpdateContentBank}
        cloudConfig={cloudConfig}
        onSaveCloudConfig={handleSaveCloudConfig}
      />
    </div>
  );
}

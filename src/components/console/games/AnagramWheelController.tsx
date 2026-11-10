import React, { useState } from 'react';
import { MasterLiveState, AnagramWheelItem, WheelReward } from '../../../types/masterStudio';
import { WHEEL_REWARDS } from '../../../utils/gameData';
import { scrambleWord } from '../../../utils/gameEngineRules';
import {
  Shuffle,
  Sparkles,
  CheckCircle,
  Eye,
  RotateCw,
  Plus,
  Trash2,
  Zap,
  Edit2,
  FileText,
  RotateCcw,
  ListPlus,
  Check,
  X,
  Dices,
} from 'lucide-react';
import { studioAudio } from '../../../utils/audioSynth';

interface AnagramWheelControllerProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
}

export const AnagramWheelController: React.FC<AnagramWheelControllerProps> = ({
  state,
  onUpdateState,
  onAwardActiveTeam,
}) => {
  const stage = state.gameStage.anagramWheel;
  const currentItem = stage.items[stage.currentIndex];
  const activeRewards = stage.rewards && stage.rewards.length > 0 ? stage.rewards : WHEEL_REWARDS;

  // Active view section in controller: Anagrams vs Wheel
  const [activeTab, setActiveTab] = useState<'anagrams' | 'wheel'>('anagrams');

  // Form state for creating new anagram
  const [newOriginalWord, setNewOriginalWord] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newHint, setNewHint] = useState('');
  const [newPoints, setNewPoints] = useState<number>(100);
  const [scrambledPreview, setScrambledPreview] = useState('');

  // Quick add / mass load state for wheel rewards
  const [newRewardLabel, setNewRewardLabel] = useState('');
  const [newRewardType, setNewRewardType] = useState<WheelReward['type']>('points_bonus');
  const [newRewardValue, setNewRewardValue] = useState<number>(100);
  const [newRewardColor, setNewRewardColor] = useState('#f59e0b');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRewardsText, setBulkRewardsText] = useState('');

  // Editing state for existing reward
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editingRewardLabel, setEditingRewardLabel] = useState('');
  const [editingRewardColor, setEditingRewardColor] = useState('');

  // Auto-scramble when word input changes
  const handleWordChange = (val: string) => {
    setNewOriginalWord(val);
    if (val.trim().length > 1) {
      setScrambledPreview(scrambleWord(val));
    } else {
      setScrambledPreview(val.toUpperCase());
    }
  };

  const handleReScramblePreview = () => {
    if (newOriginalWord.trim().length > 1) {
      setScrambledPreview(scrambleWord(newOriginalWord));
    }
  };

  // Re-scramble an existing item on the list
  const handleReScrambleExisting = (id: string, original: string) => {
    const freshScramble = scrambleWord(original);
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          items: prev.gameStage.anagramWheel.items.map((it) =>
            it.id === id ? { ...it, scrambledWord: freshScramble } : it
          ),
        },
      },
    }));
  };

  // Add new anagram to list
  const handleAddAnagram = () => {
    if (!newOriginalWord.trim()) return;
    const finalOriginal = newOriginalWord.trim().toUpperCase();
    const finalScrambled = scrambledPreview || scrambleWord(finalOriginal);

    const newItem: AnagramWheelItem = {
      id: `an-${Date.now()}`,
      originalWord: finalOriginal,
      scrambledWord: finalScrambled,
      category: newCategory.trim() || 'General',
      hint: newHint.trim() || 'Descubre la palabra desordenada',
      points: Number(newPoints) || 100,
    };

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          items: [...prev.gameStage.anagramWheel.items, newItem],
        },
      },
    }));

    // Reset form
    setNewOriginalWord('');
    setNewCategory('');
    setNewHint('');
    setNewPoints(100);
    setScrambledPreview('');
  };

  // Launch on the fly (Add + Set Active immediately)
  const handleLaunchOnTheFly = () => {
    if (!newOriginalWord.trim()) return;
    const finalOriginal = newOriginalWord.trim().toUpperCase();
    const finalScrambled = scrambledPreview || scrambleWord(finalOriginal);

    const newItem: AnagramWheelItem = {
      id: `an-${Date.now()}`,
      originalWord: finalOriginal,
      scrambledWord: finalScrambled,
      category: newCategory.trim() || 'Al Vuelo',
      hint: newHint.trim() || 'Descubre la palabra desordenada',
      points: Number(newPoints) || 100,
    };

    onUpdateState((prev) => {
      const nextItems = [...prev.gameStage.anagramWheel.items, newItem];
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          anagramWheel: {
            ...prev.gameStage.anagramWheel,
            items: nextItems,
            currentIndex: nextItems.length - 1,
            revealed: false,
            pointsAwarded: false,
            selectedReward: null,
          },
        },
      };
    });

    // Reset form
    setNewOriginalWord('');
    setNewCategory('');
    setNewHint('');
    setNewPoints(100);
    setScrambledPreview('');
  };

  const handleDeleteAnagram = (id: string, idx: number) => {
    if (stage.items.length <= 1) {
      alert('Debe quedar al menos 1 palabra en la lista.');
      return;
    }
    onUpdateState((prev) => {
      const remaining = prev.gameStage.anagramWheel.items.filter((it) => it.id !== id);
      const nextIndex = Math.min(prev.gameStage.anagramWheel.currentIndex, remaining.length - 1);
      return {
        ...prev,
        gameStage: {
          ...prev.gameStage,
          anagramWheel: {
            ...prev.gameStage.anagramWheel,
            items: remaining,
            currentIndex: nextIndex,
            revealed: false,
            pointsAwarded: false,
          },
        },
      };
    });
  };

  // -------------------------------------------------------------------
  // WHEEL REWARDS MANAGEMENT
  // -------------------------------------------------------------------
  const PALETTE = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  const handleAddReward = () => {
    if (!newRewardLabel.trim()) return;
    const newReward: WheelReward = {
      id: `rew-${Date.now()}`,
      label: newRewardLabel.trim(),
      type: newRewardType,
      value: newRewardType === 'points_bonus' || newRewardType === 'points_penalty' ? Number(newRewardValue) || 100 : undefined,
      color: newRewardColor,
    };

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          rewards: [...activeRewards, newReward],
        },
      },
    }));

    setNewRewardLabel('');
    // cycle color
    const nextCol = PALETTE[(activeRewards.length + 1) % PALETTE.length];
    setNewRewardColor(nextCol);
  };

  const handleProcessBulkRewards = (mode: 'replace' | 'append') => {
    if (!bulkRewardsText.trim()) return;
    const lines = bulkRewardsText
      .split(/[\r\n,]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const parsed: WheelReward[] = lines.map((line, idx) => {
      const color = PALETTE[idx % PALETTE.length];
      let type: WheelReward['type'] = 'physical_challenge';
      let value: number | undefined = undefined;

      if (/(\+?\d+)/.test(line)) {
        const match = line.match(/\d+/);
        if (match) {
          value = Number(match[0]);
          type = line.includes('-') ? 'points_penalty' : 'points_bonus';
        }
      } else if (/doble/i.test(line)) {
        type = 'double_points';
      } else if (/pierde|turno/i.test(line)) {
        type = 'lose_turn';
      }

      return {
        id: `rew-bulk-${Date.now()}-${idx}`,
        label: line,
        type,
        value,
        color,
      };
    });

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          rewards: mode === 'replace' ? parsed : [...activeRewards, ...parsed],
        },
      },
    }));

    setBulkRewardsText('');
    setShowBulkModal(false);
  };

  const handleDeleteReward = (id: string) => {
    if (activeRewards.length <= 2) {
      alert('La ruleta debe tener al menos 2 segmentos para girar.');
      return;
    }
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          rewards: activeRewards.filter((r) => r.id !== id),
        },
      },
    }));
  };

  const handleSaveEditReward = (id: string) => {
    if (!editingRewardLabel.trim()) return;
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          rewards: activeRewards.map((r) =>
            r.id === id
              ? {
                  ...r,
                  label: editingRewardLabel.trim(),
                  color: editingRewardColor || r.color,
                }
              : r
          ),
        },
      },
    }));
    setEditingRewardId(null);
  };

  const handleClearRewards = () => {
    if (window.confirm('¿Deseas vaciar todos los segmentos de la ruleta?')) {
      onUpdateState((prev) => ({
        ...prev,
        gameStage: {
          ...prev.gameStage,
          anagramWheel: {
            ...prev.gameStage.anagramWheel,
            rewards: [
              { id: 'rew-base-1', label: 'Bono +100', type: 'points_bonus', value: 100, color: '#f59e0b' },
              { id: 'rew-base-2', label: 'Reto Físico', type: 'physical_challenge', color: '#8b5cf6' },
            ],
          },
        },
      }));
    }
  };

  const handleRestoreDefaultRewards = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          rewards: WHEEL_REWARDS,
        },
      },
    }));
  };

  // -------------------------------------------------------------------
  // WHEEL SPIN ACTION
  // -------------------------------------------------------------------
  const handleSpinWheel = () => {
    if (stage.wheelSpinning) return;

    // Trigger rapid clicks
    studioAudio.playWheelClick();
    setTimeout(() => studioAudio.playWheelClick(), 150);
    setTimeout(() => studioAudio.playWheelClick(), 350);
    setTimeout(() => studioAudio.playWheelClick(), 600);
    setTimeout(() => studioAudio.playWheelClick(), 900);

    const randomReward = activeRewards[Math.floor(Math.random() * activeRewards.length)];
    const additionalAngle = 1080 + Math.floor(Math.random() * 360);
    const nextAngle = stage.wheelAngle + additionalAngle;

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          wheelSpinning: true,
          wheelAngle: nextAngle,
          selectedReward: null,
        },
      },
    }));

    setTimeout(() => {
      studioAudio.playFanfare();
      onUpdateState((prev) => ({
        ...prev,
        gameStage: {
          ...prev.gameStage,
          anagramWheel: {
            ...prev.gameStage.anagramWheel,
            wheelSpinning: false,
            selectedReward: randomReward,
          },
        },
      }));
    }, 1800);
  };

  const handleCorrect = () => {
    if (!currentItem) return;
    studioAudio.playCorrect();

    let bonus = currentItem.points;
    if (stage.selectedReward?.type === 'double_points') {
      bonus *= 2;
    } else if (stage.selectedReward?.type === 'points_bonus' && stage.selectedReward.value) {
      bonus += stage.selectedReward.value;
    }

    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          revealed: true,
          pointsAwarded: true,
        },
      },
    }));

    onAwardActiveTeam(bonus, `Anagrama resuelto (${currentItem.originalWord})`);
  };

  const handleRevealOnly = () => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          revealed: !prev.gameStage.anagramWheel.revealed,
        },
      },
    }));
  };

  const handleSelectIndex = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        anagramWheel: {
          ...prev.gameStage.anagramWheel,
          currentIndex: idx,
          revealed: false,
          selectedReward: null,
          pointsAwarded: false,
        },
      },
    }));
  };

  if (!currentItem) return <div className="text-white p-4">Sin anagramas cargados</div>;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Controller Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('anagrams')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'anagrams'
                ? 'bg-pink-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shuffle className="w-4 h-4 text-pink-300" />
            <span>1. Gestor de Anagramas ({stage.items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wheel')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'wheel'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 font-black shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Dices className="w-4 h-4 text-amber-400" />
            <span>2. Ruleta de Retos ({activeRewards.length})</span>
          </button>
        </div>

        {/* Spin Wheel Quick Action */}
        <button
          onClick={handleSpinWheel}
          disabled={stage.wheelSpinning}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 px-4 py-2 font-scoreboard text-xs font-black uppercase text-white shadow-lg shadow-pink-600/25 hover:scale-102 active:scale-95 disabled:opacity-50"
        >
          <RotateCw className={`h-4 w-4 ${stage.wheelSpinning ? 'animate-spin' : ''}`} />
          <span>{stage.wheelSpinning ? 'Girando...' : 'Girar Ruleta'}</span>
        </button>
      </div>

      {/* ACTIVE WORD PLAY CARD (Always visible for live director control) */}
      <div className="rounded-2xl border-2 border-pink-400/30 bg-slate-900/90 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2 mb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-pink-400">
              Palabra al Aire: #{stage.currentIndex + 1} de {stage.items.length}
            </span>
            <select
              value={stage.currentIndex}
              onChange={(e) => handleSelectIndex(Number(e.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-bold text-slate-200"
            >
              {stage.items.map((item, i) => (
                <option key={item.id} value={i}>
                  #{i + 1}: {item.category} — {item.originalWord}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-pink-400/20 px-2 py-0.5 text-xs font-bold text-pink-300">
              Valor: +{currentItem.points} PTS
            </span>
            <button
              onClick={() => handleReScrambleExisting(currentItem.id, currentItem.originalWord)}
              className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2 py-0.5"
              title="Mezclar de nuevo las letras de esta palabra"
            >
              <Shuffle className="w-3 h-3 text-pink-300" />
              <span>Re-mezclar</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-base">
          <div>
            Desordenada en Pantalla:{' '}
            <strong className="text-pink-300 font-scoreboard text-2xl tracking-widest ml-1">
              {currentItem.scrambledWord}
            </strong>
          </div>
          <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 font-scoreboard font-black text-emerald-300">
            SOLUCIÓN: {currentItem.originalWord}
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-300">
          Pista / Categoría: <em className="text-amber-300 font-bold">{currentItem.category}</em> • {currentItem.hint}
        </p>

        {/* Wheel Result Card */}
        {stage.selectedReward && (
          <div
            className="mt-3 flex items-center justify-between rounded-xl border p-3 font-scoreboard shadow-lg animate-scale-up"
            style={{
              borderColor: stage.selectedReward.color,
              backgroundColor: `${stage.selectedReward.color}22`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <div>
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">
                  Premio / Reto Activo:
                </span>
                <div className="text-lg font-black text-white">{stage.selectedReward.label}</div>
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  gameStage: {
                    ...prev.gameStage,
                    anagramWheel: { ...prev.gameStage.anagramWheel, selectedReward: null },
                  },
                }))
              }
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Descartar
            </button>
          </div>
        )}

        {/* Live Score & Reveal Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleCorrect}
            disabled={stage.pointsAwarded}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-scoreboard text-xs sm:text-sm font-black uppercase text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span>¡Acierto! (+{currentItem.points} pts al Turno)</span>
          </button>

          <button
            onClick={handleRevealOnly}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Eye className="h-4 w-4 text-pink-400" />
            <span>{stage.revealed ? 'Ocultar Solución' : 'Revelar Solución'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GESTOR DE CONTENIDO DE ANAGRAMAS */}
      {activeTab === 'anagrams' && (
        <div className="space-y-4">
          {/* New Anagram Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-pink-400" />
                <span>Agregar Nueva Palabra / Al Vuelo</span>
              </span>
              <span className="text-[10px] text-slate-400">Generación y re-mezcla automática</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Palabra Original:
                </label>
                <input
                  type="text"
                  value={newOriginalWord}
                  onChange={(e) => handleWordChange(e.target.value)}
                  placeholder="Ej: APOCALIPSIS"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white uppercase focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Categoría / Pista:
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ej: Libro de la Biblia"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Puntos Base:
                </label>
                <input
                  type="number"
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Live Scramble Preview and Re-shuffle */}
            {newOriginalWord.trim().length > 1 && (
              <div className="flex flex-wrap items-center justify-between p-3 rounded-xl bg-slate-950 border border-pink-500/30 gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-semibold">Versión Desordenada:</span>
                  <span className="font-scoreboard text-lg font-black tracking-widest text-pink-300">
                    {scrambledPreview}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleReScramblePreview}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-950 border border-pink-500/40 text-pink-300 text-xs font-bold hover:bg-pink-900 transition-colors"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>🔀 Re-mezclar Letras</span>
                </button>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleAddAnagram}
                disabled={!newOriginalWord.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-40 transition-colors"
              >
                <Plus className="w-4 h-4 text-pink-400" />
                <span>+ Agregar a la Lista</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchOnTheFly}
                disabled={!newOriginalWord.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 text-white text-xs font-black uppercase shadow-lg shadow-pink-600/25 disabled:opacity-40 transition-all hover:scale-102"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>⚡ Lanzar Al Vuelo (Jugar Ahora)</span>
              </button>
            </div>
          </div>

          {/* List of Loaded Anagrams */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Palabras Registradas ({stage.items.length})
            </span>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {stage.items.map((item, idx) => {
                const isActive = idx === stage.currentIndex;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      isActive
                        ? 'bg-pink-950/40 border-pink-500/60 ring-1 ring-pink-500/40 text-white'
                        : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div
                      onClick={() => handleSelectIndex(idx)}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded font-black text-[10px] ${
                          isActive ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <strong className="font-scoreboard tracking-wider text-white truncate">
                        {item.originalWord}
                      </strong>
                      <span className="font-scoreboard text-pink-300 tracking-widest text-[11px] truncate hidden sm:inline">
                        ({item.scrambledWord})
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">
                        • {item.category} • +{item.points} pts
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleReScrambleExisting(item.id, item.originalWord)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Re-mezclar letras"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-pink-300" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnagram(item.id, idx)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400"
                        title="Eliminar palabra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTOR DE SEGMENTOS DE LA RULETA DE RETOS */}
      {activeTab === 'wheel' && (
        <div className="space-y-4">
          {/* Quick Add and Mass Load Controls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Dices className="w-4 h-4 text-amber-400" />
                <span>Agregar Segmento a la Ruleta</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  title="Pegar lista masiva de retos o premios"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>📋 Carga Masiva</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearRewards}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-bold"
                >
                  Vaciar
                </button>
                <button
                  type="button"
                  onClick={handleRestoreDefaultRewards}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Restaurar por Defecto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Add Inline Row (Supports Enter key) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={newRewardLabel}
                  onChange={(e) => setNewRewardLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddReward()}
                  placeholder="Nuevo reto / premio (Ej: Canta el Coro, +150 Pts...)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={newRewardType}
                  onChange={(e) => setNewRewardType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-200"
                >
                  <option value="points_bonus">Bono de Puntos (+)</option>
                  <option value="double_points">Doble Puntos (x2)</option>
                  <option value="lose_turn">Pierde Turno (💀)</option>
                  <option value="physical_challenge">Reto Físico (🎭)</option>
                  <option value="points_penalty">Penalización (-)</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <input
                  type="color"
                  value={newRewardColor}
                  onChange={(e) => setNewRewardColor(e.target.value)}
                  className="h-8 w-10 bg-transparent rounded cursor-pointer border border-slate-700 shrink-0"
                  title="Color del segmento"
                />
                <button
                  type="button"
                  onClick={handleAddReward}
                  className="flex-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase transition-colors"
                >
                  + Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable list of rewards */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Segmentos Activos en la Ruleta ({activeRewards.length})
            </span>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {activeRewards.map((reward) => {
                const isEditing = editingRewardId === reward.id;

                if (isEditing) {
                  return (
                    <div
                      key={reward.id}
                      className="p-2 rounded-xl bg-slate-950 border border-amber-500/50 flex items-center justify-between gap-2 text-xs"
                    >
                      <input
                        type="color"
                        value={editingRewardColor}
                        onChange={(e) => setEditingRewardColor(e.target.value)}
                        className="h-7 w-8 bg-transparent rounded cursor-pointer border border-slate-700"
                      />
                      <input
                        type="text"
                        value={editingRewardLabel}
                        onChange={(e) => setEditingRewardLabel(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      />
                      <button
                        onClick={() => handleSaveEditReward(reward.id)}
                        className="p-1 rounded bg-emerald-600 text-white"
                        title="Guardar"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingRewardId(null)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={reward.id}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: reward.color }}
                      />
                      <strong className="text-white truncate font-sans">{reward.label}</strong>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">
                        ({reward.type})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingRewardId(reward.id);
                          setEditingRewardLabel(reward.label);
                          setEditingRewardColor(reward.color);
                        }}
                        className="p-1 text-slate-400 hover:text-amber-400"
                        title="Editar segmento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReward(reward.id)}
                        className="p-1 text-slate-400 hover:text-red-400"
                        title="Eliminar segmento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bulk Import Modal for Wheel Rewards */}
          {showBulkModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-white space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" />
                    <span>Carga Masiva de Retos / Premios</span>
                  </h3>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Pega los retos, castigos o premios, uno por línea o separados por coma:
                </p>

                <textarea
                  value={bulkRewardsText}
                  onChange={(e) => setBulkRewardsText(e.target.value)}
                  rows={7}
                  placeholder="Bono +100&#10;Doble Puntos&#10;Pierde Turno&#10;Reto Físico&#10;Canta una Canción&#10;Bono +200..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleProcessBulkRewards('append')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs"
                  >
                    + Sumar a la Lista Actual
                  </button>
                  <button
                    onClick={() => handleProcessBulkRewards('replace')}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase"
                  >
                    Reemplazar Toda la Lista
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

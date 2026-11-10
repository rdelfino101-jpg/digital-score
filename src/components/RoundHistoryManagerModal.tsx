import React, { useState } from 'react';
import {
  RoundScoreRecord1v1,
  RoundScoreRecordMultiplayer,
  Scoreboard,
  Scoreboard1v1,
  ScoreboardMultiplayer,
} from '../types/scoreboard';
import {
  X,
  History,
  Trash2,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface RoundHistoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreboard: Scoreboard;
  onUpdateHistory1v1?: (newHistory: RoundScoreRecord1v1[]) => void;
  onUpdateHistoryMulti?: (newHistory: RoundScoreRecordMultiplayer[]) => void;
}

export const RoundHistoryManagerModal: React.FC<RoundHistoryManagerModalProps> = ({
  isOpen,
  onClose,
  scoreboard,
  onUpdateHistory1v1,
  onUpdateHistoryMulti,
}) => {
  // Local state for 1v1 history editing
  const [history1v1, setHistory1v1] = useState<RoundScoreRecord1v1[]>(() =>
    scoreboard.type === 'one_on_one' ? [...scoreboard.roundHistory] : []
  );

  // Local state for multiplayer history editing
  const [historyMulti, setHistoryMulti] = useState<RoundScoreRecordMultiplayer[]>(() =>
    scoreboard.type === 'multiplayer' ? [...scoreboard.roundHistory] : []
  );

  if (!isOpen) return null;

  const handleUpdate1v1Record = (
    index: number,
    field: 'scoreA' | 'scoreB' | 'label',
    value: string | number
  ) => {
    const updated = [...history1v1];
    if (field === 'scoreA' || field === 'scoreB') {
      updated[index] = {
        ...updated[index],
        [field]: Math.max(0, parseInt(value as string) || 0),
      };
    } else {
      updated[index] = {
        ...updated[index],
        label: value as string,
      };
    }
    setHistory1v1(updated);
  };

  const handleRemove1v1Record = (index: number) => {
    if (window.confirm(`¿Eliminar el registro histórico de la ronda ${history1v1[index]?.roundNumber || index + 1}?`)) {
      setHistory1v1(history1v1.filter((_, idx) => idx !== index));
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('¿Estás seguro de que deseas vaciar y eliminar todo el historial de rondas anteriores? Esta acción no se puede deshacer.')) {
      setHistory1v1([]);
      setHistoryMulti([]);
    }
  };

  const handleAdd1v1Record = () => {
    const nextRound = history1v1.length + 1;
    const sb1v1 = scoreboard as Scoreboard1v1;
    setHistory1v1([
      ...history1v1,
      {
        roundNumber: nextRound,
        label: `${sb1v1.periodTypeLabel} ${nextRound}`,
        scoreA: 0,
        scoreB: 0,
      },
    ]);
  };

  const handleUpdateMultiScore = (
    roundIndex: number,
    participantId: string,
    score: number
  ) => {
    const updated = [...historyMulti];
    updated[roundIndex] = {
      ...updated[roundIndex],
      scores: {
        ...updated[roundIndex].scores,
        [participantId]: Math.max(0, score),
      },
    };
    setHistoryMulti(updated);
  };

  const handleRemoveMultiRecord = (index: number) => {
    if (window.confirm(`¿Eliminar el registro histórico de la ronda ${historyMulti[index]?.roundNumber || index + 1}?`)) {
      setHistoryMulti(historyMulti.filter((_, idx) => idx !== index));
    }
  };

  const handleSave = () => {
    if (scoreboard.type === 'one_on_one' && onUpdateHistory1v1) {
      onUpdateHistory1v1(history1v1);
    } else if (scoreboard.type === 'multiplayer' && onUpdateHistoryMulti) {
      onUpdateHistoryMulti(historyMulti);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-scoreboard text-xl font-bold text-white">
                Gestor y Corrección de Rondas / Sets
              </h2>
              <p className="text-xs text-slate-400">
                Revisa y edita los puntajes históricos de rondas finalizadas si hubo un error humano
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1 vs 1 History Table */}
        {scoreboard.type === 'one_on_one' && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Historial de Sets / Rondas ({history1v1.length} Registradas)
              </span>
              <button
                onClick={handleAdd1v1Record}
                className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-950/40 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-900/50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Agregar Registro de Ronda</span>
              </button>
            </div>

            {history1v1.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">
                Aún no hay rondas o sets archivados en el historial. Se guardarán automáticamente al pulsar "Siguiente Ronda".
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Ronda / Set</th>
                      <th className="px-4 py-3 text-center" style={{ color: scoreboard.teamA.color }}>
                        {scoreboard.teamA.name}
                      </th>
                      <th className="px-4 py-3 text-center">vs</th>
                      <th className="px-4 py-3 text-center" style={{ color: scoreboard.teamB.color }}>
                        {scoreboard.teamB.name}
                      </th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {history1v1.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-2.5 font-scoreboard font-bold text-amber-400">
                          <input
                            type="text"
                            value={rec.label}
                            onChange={(e) => handleUpdate1v1Record(idx, 'label', e.target.value)}
                            className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="number"
                            min={0}
                            value={rec.scoreA}
                            onChange={(e) =>
                              handleUpdate1v1Record(idx, 'scoreA', e.target.value)
                            }
                            className="font-scoreboard w-16 text-center rounded-lg border border-slate-700 bg-slate-900 py-1 text-sm font-bold text-white focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-500">-</td>
                        <td className="px-4 py-2.5 text-center">
                          <input
                            type="number"
                            min={0}
                            value={rec.scoreB}
                            onChange={(e) =>
                              handleUpdate1v1Record(idx, 'scoreB', e.target.value)
                            }
                            className="font-scoreboard w-16 text-center rounded-lg border border-slate-700 bg-slate-900 py-1 text-sm font-bold text-white focus:border-red-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleRemove1v1Record(idx)}
                            className="rounded p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            title="Eliminar este parcial"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Multiplayer History Table */}
        {scoreboard.type === 'multiplayer' && (
          <div className="mt-6 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Historial de Rondas Multijugador ({historyMulti.length} Rondas)
            </span>

            {historyMulti.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">
                Aún no hay rondas archivadas en el historial. Pulsa "Siguiente Ronda" para guardar un corte parcial.
              </div>
            ) : (
              <div className="space-y-3">
                {historyMulti.map((rec, rIdx) => (
                  <div
                    key={rIdx}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="font-scoreboard text-sm font-bold text-amber-400">
                        {rec.label}
                      </span>
                      <button
                        onClick={() => handleRemoveMultiRecord(rIdx)}
                        className="rounded p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Eliminar esta ronda"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {scoreboard.participants.map((p) => {
                        const sc = rec.scores[p.id] ?? 0;

                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs"
                          >
                            <span className="truncate font-semibold text-white max-w-[90px]">
                              {p.name}
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={sc}
                              onChange={(e) =>
                                handleUpdateMultiScore(
                                  rIdx,
                                  p.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-14 rounded border border-slate-700 bg-slate-950 text-right px-1.5 py-0.5 text-xs font-bold text-amber-300"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 mt-6 flex items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/95 px-6 py-4 backdrop-blur-md">
          {(history1v1.length > 0 || historyMulti.length > 0) ? (
            <button
              onClick={handleClearAllHistory}
              type="button"
              className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-900/60 transition-colors"
            >
              Vaciar Todo el Historial
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30"
            >
              Guardar Correcciones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

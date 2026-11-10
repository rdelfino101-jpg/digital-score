import React, { useState } from 'react';
import {
  RoundProgressionType,
  Scoreboard,
  SportPresetId,
} from '../types/scoreboard';
import { SPORT_PRESETS, SportPresetDefinition } from '../utils/scoreboardRules';
import {
  X,
  Dumbbell,
  Sliders,
  Check,
  CheckCircle2,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface SportPresetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreboard: Scoreboard;
  onApplyConfig: (updated: {
    sportPreset: SportPresetId;
    periodTypeLabel: string;
    totalRounds: number;
    roundProgression: RoundProgressionType;
    quickScoreButtons: number[];
    pointsToWinSet?: number;
  }) => void;
}

export const SportPresetSelectorModal: React.FC<SportPresetSelectorModalProps> = ({
  isOpen,
  onClose,
  scoreboard,
  onApplyConfig,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<SportPresetId>(
    scoreboard.sportPreset || 'custom'
  );
  const [periodTypeLabel, setPeriodTypeLabel] = useState(
    scoreboard.periodTypeLabel || 'Periodo'
  );
  const [totalRounds, setTotalRounds] = useState(scoreboard.totalRounds || 4);
  const [roundProgression, setRoundProgression] = useState<RoundProgressionType>(
    scoreboard.roundProgression || 'cumulative'
  );
  const [quickButtonsString, setQuickButtonsString] = useState(
    scoreboard.quickScoreButtons ? scoreboard.quickScoreButtons.join(', ') : '1, 2, 3'
  );
  const [pointsToWinSet, setPointsToWinSet] = useState<number>(
    'pointsToWinSet' in scoreboard && scoreboard.pointsToWinSet ? scoreboard.pointsToWinSet : 25
  );

  if (!isOpen) return null;

  const handleSelectPreset = (preset: SportPresetDefinition) => {
    setSelectedPresetId(preset.id);
    setPeriodTypeLabel(preset.periodLabel);
    setTotalRounds(preset.defaultRounds);
    setRoundProgression(preset.progression);
    setQuickButtonsString(preset.quickButtons.join(', '));
  };

  const handleSave = () => {
    // Parse quick buttons
    const parsedButtons = quickButtonsString
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n !== 0);

    const finalButtons = parsedButtons.length > 0 ? parsedButtons : [1, 2, 3];

    onApplyConfig({
      sportPreset: selectedPresetId,
      periodTypeLabel: periodTypeLabel.trim() || 'Periodo',
      totalRounds: Math.max(1, totalRounds),
      roundProgression,
      quickScoreButtons: finalButtons,
      pointsToWinSet: roundProgression === 'sets_reset' ? pointsToWinSet : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-scoreboard text-xl font-bold text-white">
                Motor Parametrizable de Deporte / Actividad
              </h2>
              <p className="text-xs text-slate-400">
                Ajusta las reglas, botones rápidos y tipo de rondas en caliente
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

        {/* Presets Grid */}
        <div className="mt-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Seleccionar Plantilla Preconfigurada
          </label>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SPORT_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;

              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-950/30 shadow-md ring-1 ring-blue-500/50'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-scoreboard text-base font-bold text-white group-hover:text-blue-300">
                        {preset.name}
                      </h4>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{preset.description}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-300">
                    <span className="font-semibold text-amber-400">
                      Botones: {preset.quickButtons.map((b) => `+${b}`).join(', ')}
                    </span>
                    <span className="text-slate-400">{preset.periodLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Rules & Live Parameterization */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <h3 className="font-scoreboard text-sm font-bold uppercase tracking-wider text-white">
              2. Parámetros en Caliente para este Marcador
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Period Type Label */}
            <div>
              <label className="text-xs font-semibold text-slate-300">
                Etiqueta de Periodo / Ronda:
              </label>
              <input
                type="text"
                value={periodTypeLabel}
                onChange={(e) => setPeriodTypeLabel(e.target.value)}
                placeholder="ej. Cuarto, Set, Tiempo, Ronda"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">
                Aparecerá en el indicador central ("Cuarto 1", "Set 2")
              </span>
            </div>

            {/* Total Rounds */}
            <div>
              <label className="text-xs font-semibold text-slate-300">
                Total de Rondas / Periodos:
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={totalRounds}
                onChange={(e) => setTotalRounds(parseInt(e.target.value) || 1)}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">ej. 4 cuartos, 2 tiempos, 3 sets</span>
            </div>

            {/* Quick Score Buttons */}
            <div>
              <label className="text-xs font-semibold text-slate-300">
                Botones Rápidos en Consola:
              </label>
              <input
                type="text"
                value={quickButtonsString}
                onChange={(e) => setQuickButtonsString(e.target.value)}
                placeholder="ej. 1, 2, 3 o 100, 200, 500"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Valores numéricos separados por comas</span>
            </div>
          </div>

          {/* Progression Type & Points to win */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            {/* Progression Mode */}
            <div>
              <label className="text-xs font-semibold text-slate-300">
                Comportamiento al Cambiar de Ronda:
              </label>
              <div className="mt-2 flex flex-col gap-2">
                <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="progression"
                    checked={roundProgression === 'cumulative'}
                    onChange={() => setRoundProgression('cumulative')}
                    className="mt-0.5 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white">Opción A: Acumulativo</span>
                    <p className="text-[11px] text-slate-400">
                      Los puntos totales se mantienen entre cuartos o tiempos, guardando el parcial de cada ronda.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="progression"
                    checked={roundProgression === 'sets_reset'}
                    onChange={() => setRoundProgression('sets_reset')}
                    className="mt-0.5 text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white">Opción B: Por Sets / Reset por Ronda</span>
                    <p className="text-[11px] text-slate-400">
                      Al cerrar el set, el ganador suma +1 en sets ganados, se guarda el resultado (ej. 25-21) y el puntaje vuelve a 0.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Points to win set (if sets mode) */}
            {roundProgression === 'sets_reset' && (
              <div>
                <label className="text-xs font-semibold text-slate-300">
                  Puntos Objetivo para Ganar Set:
                </label>
                <input
                  type="number"
                  min={1}
                  value={pointsToWinSet}
                  onChange={(e) => setPointsToWinSet(parseInt(e.target.value) || 25)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  Por ejemplo 25 (Vóley), 11 (Tenis de mesa), 6 (Pádel)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 mt-6 flex justify-end gap-3 border-t border-slate-800 bg-slate-900/95 px-6 py-4 backdrop-blur-md">
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
            Aplicar Reglas al Marcador
          </button>
        </div>
      </div>
    </div>
  );
};

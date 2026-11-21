import React, { useState, useEffect } from 'react';
import { BuzzerServerState, StudioTeam } from '../../types/masterStudio';
import { Zap, Clock, Users } from 'lucide-react';
import { formatMsDiff } from '../../utils/buzzerRules';

interface BuzzerProjectorOverlayProps {
  buzzerState: BuzzerServerState | null;
  teams: StudioTeam[];
}

export const BuzzerProjectorOverlay: React.FC<BuzzerProjectorOverlayProps> = ({
  buzzerState,
  teams,
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!buzzerState) return null;

  const { status, answeringTeamId, answerDeadline, presses, excludedTeams, config } = buzzerState;

  // Header pulsing indicator when status === 'open'
  if (status === 'open') {
    return (
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 px-8 py-3 rounded-full bg-[var(--p-accent)] text-[var(--p-on-accent)] font-black text-2xl tracking-wider uppercase shadow-lg border-2 border-[var(--p-line-strong)] animate-pulse">
          <Zap className="w-8 h-8 fill-current animate-bounce" />
          <span>PULSADORES ABIERTOS · ¡PULSA AHORA!</span>
        </div>
      </div>
    );
  }

  // Fullscreen overlay "¿Quién pulsó primero?" when status === 'answering'
  if (status === 'answering' && answeringTeamId) {
    const answeringTeam = teams.find((t) => t.id === answeringTeamId) || {
      id: answeringTeamId,
      name: `Equipo ${answeringTeamId}`,
      color: '#2563eb',
      score: 0,
    };

    const totalAnswerSec = config?.answerTimeSeconds || 5;
    const deadline = answerDeadline || now;
    const msLeft = Math.max(0, deadline - now);
    const secRemaining = (msLeft / 1000).toFixed(1);
    const progressPct = Math.min(100, Math.max(0, (msLeft / (totalAnswerSec * 1000)) * 100));

    // Order of other presses
    const otherPresses = presses.filter((p) => p.teamId !== answeringTeamId);
    const pressedTeamIds = new Set(presses.map((p) => p.teamId));
    const unpressedTeams = teams.filter((t) => !pressedTeamIds.has(t.id));

    return (
      <div className="absolute inset-0 z-50 bg-[var(--p-bg)] flex flex-col p-14 animate-in fade-in zoom-in-95 duration-200 select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-[var(--p-line)] pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--p-accent)] flex items-center justify-center text-[var(--p-on-accent)] shadow-md">
              <Zap className="w-7 h-7 fill-current" />
            </div>
            <div>
              <h1 className="font-projector-title text-4xl text-[var(--p-text)]">
                ¿Quién pulsó primero?
              </h1>
              <p className="text-lg text-[var(--p-text-2)] font-medium">
                Pulsadores inalámbricos sincronizados en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl font-bold uppercase tracking-wider text-[var(--p-text-2)]">
              Tiempo para responder:
            </span>
            <div className="px-6 py-2 rounded-2xl bg-[var(--p-panel)] border-2 border-[var(--p-accent-ink)] text-[var(--p-accent-ink)] font-mono font-black text-4xl shadow-sm">
              {secRemaining}s
            </div>
          </div>
        </div>

        {/* Content Split: Left Hero Card, Right Subsequent Presses */}
        <div className="flex-1 grid grid-cols-12 gap-8 items-stretch min-h-0">
          {/* Left Column (7 cols): Giant Card for First Place */}
          <div
            className="col-span-7 rounded-3xl p-10 flex flex-col justify-between border-4 bg-[var(--p-panel)] shadow-lg relative overflow-hidden transition-all duration-300"
            style={{
              borderColor: answeringTeam.color,
            }}
          >
            {/* Team Color Top Bar */}
            <div
              className="absolute top-0 left-0 right-0 h-4"
              style={{ backgroundColor: answeringTeam.color }}
            />

            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--p-accent)] text-[var(--p-on-accent)] font-black text-xl tracking-wider uppercase mb-6 shadow-sm">
                <Zap className="w-6 h-6 fill-current" />
                <span>PRIMER LUGAR</span>
              </div>

              {/* Huge team name */}
              <div
                className="font-black text-[var(--p-text)] leading-none tracking-tight break-words"
                style={{ fontSize: '132px' }}
              >
                {answeringTeam.name}
              </div>

              <div className="text-4xl font-extrabold text-[var(--p-text-2)] tracking-wide mt-4 flex items-center gap-3">
                <span>¡Tienen la palabra!</span>
              </div>
            </div>

            {/* Bottom timer progress bar */}
            <div className="mt-8">
              <div className="flex items-center justify-between text-lg font-bold text-[var(--p-text-2)] mb-2">
                <span>Cuenta regresiva</span>
                <span className="font-mono text-[var(--p-accent-ink)] text-2xl font-black">{secRemaining}s</span>
              </div>
              <div className="w-full h-5 rounded-full bg-[var(--p-panel-2)] border border-[var(--p-line)] p-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor:
                      progressPct < 30
                        ? 'var(--p-err)'
                        : progressPct < 60
                        ? 'var(--p-accent)'
                        : 'var(--p-ok)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): 2nd, 3rd place and unpressed teams */}
          <div className="col-span-5 flex flex-col justify-between gap-6">
            {/* Subsequent pressed places */}
            <div className="bg-[var(--p-panel)] border-2 border-[var(--p-line)] rounded-3xl p-6 shadow-md flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-[var(--p-text-2)] font-bold uppercase tracking-wider text-sm mb-4 pb-2 border-b border-[var(--p-line)]">
                <Clock className="w-4 h-4 text-[var(--p-accent-ink)]" />
                <span>Orden de pulsación siguiente</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {otherPresses.length > 0 ? (
                  otherPresses.map((press, idx) => {
                    const pressTeam = teams.find((t) => t.id === press.teamId) || {
                      id: press.teamId,
                      name: `Equipo ${press.teamId}`,
                      color: '#64748b',
                    };
                    const isExcl = excludedTeams.includes(press.teamId);

                    return (
                      <div
                        key={press.teamId}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          isExcl
                            ? 'bg-[var(--p-err-bg)] border-[var(--p-err)] opacity-65'
                            : 'bg-[var(--p-panel-2)] border-[var(--p-line)] shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-[var(--p-panel)] font-black text-lg text-[var(--p-accent-ink)] flex items-center justify-center border border-[var(--p-line)]">
                            {idx + 2}º
                          </span>
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: pressTeam.color }}
                          />
                          <span className="font-black text-xl text-[var(--p-text)] truncate max-w-[200px]">
                            {pressTeam.name}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-lg font-black text-[var(--p-accent-ink)]">
                            {formatMsDiff(press.msAfterFirst)}
                          </span>
                          {isExcl && (
                            <span className="block text-[11px] font-bold text-[var(--p-err)] uppercase">
                              Excluido
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--p-text-3)] py-6">
                    <Users className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm font-semibold">Ningún otro equipo pulsó en esta ronda</span>
                  </div>
                )}
              </div>
            </div>

            {/* Unpressed Teams */}
            <div className="bg-[var(--p-panel)] border-2 border-[var(--p-line)] rounded-3xl p-5 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--p-text-3)] mb-3">
                Sin pulsar en esta pregunta
              </div>
              <div className="flex flex-wrap gap-2">
                {unpressedTeams.length > 0 ? (
                  unpressedTeams.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--p-panel-2)] border border-[var(--p-line)] text-sm font-bold text-[var(--p-text-2)]"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span>{t.name}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-[var(--p-text-3)] font-medium italic">Todos los equipos pulsaron</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

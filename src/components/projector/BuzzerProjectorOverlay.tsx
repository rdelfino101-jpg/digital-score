import React, { useState, useEffect } from 'react';
import { BuzzerServerState, StudioTeam } from '../../types/masterStudio';
import { Zap, Clock, Users, CheckCircle2, XCircle } from 'lucide-react';
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
        <div className="flex items-center gap-3 px-8 py-3 rounded-full bg-amber-500 text-slate-950 font-black text-2xl tracking-wider uppercase shadow-[0_0_50px_rgba(245,158,11,0.8)] border-4 border-yellow-200 animate-pulse">
          <Zap className="w-8 h-8 fill-current text-slate-950 animate-bounce" />
          <span>⚡ PULSADORES ABIERTOS · ¡PULSA AHORA!</span>
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
      <div className="absolute inset-0 z-50 bg-[#070814]/90 backdrop-blur-md flex flex-col p-14 animate-in fade-in zoom-in-95 duration-200 select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/40">
              <Zap className="w-7 h-7 fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-wide uppercase">
                ¿Quién pulsó primero?
              </h1>
              <p className="text-lg text-slate-400 font-medium">
                Pulsadores inalámbricos sincronizados en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl font-bold uppercase tracking-wider text-slate-400">
              Tiempo para responder:
            </span>
            <div className="px-6 py-2 rounded-2xl bg-slate-900 border-2 border-amber-400 text-amber-300 font-mono font-black text-4xl shadow-[0_0_25px_rgba(251,191,36,0.3)]">
              {secRemaining}s
            </div>
          </div>
        </div>

        {/* Content Split: Left Hero Card, Right Subsequent Presses */}
        <div className="flex-1 grid grid-cols-12 gap-8 items-stretch min-h-0">
          {/* Left Column (7 cols): Giant Card for First Place */}
          <div
            className="col-span-7 rounded-3xl p-10 flex flex-col justify-between border-4 shadow-2xl relative overflow-hidden transition-all duration-300"
            style={{
              backgroundColor: `${answeringTeam.color}22`,
              borderColor: answeringTeam.color,
              boxShadow: `0 0 80px ${answeringTeam.color}44`,
            }}
          >
            {/* Background glowing aura */}
            <div
              className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: answeringTeam.color }}
            />

            <div>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-400 text-slate-950 font-black text-xl tracking-wider uppercase mb-6 shadow-lg shadow-amber-400/30">
                <Zap className="w-6 h-6 fill-current" />
                <span>PRIMER LUGAR</span>
              </div>

              {/* Huge team name */}
              <div
                className="font-black text-white leading-none tracking-tight break-words drop-shadow-2xl"
                style={{ fontSize: '132px' }}
              >
                {answeringTeam.name}
              </div>

              <div className="text-4xl font-extrabold text-white/90 uppercase tracking-widest mt-4 flex items-center gap-3">
                <span>¡Tienen la palabra!</span>
              </div>
            </div>

            {/* Bottom timer progress bar */}
            <div className="mt-8">
              <div className="flex items-center justify-between text-lg font-bold text-slate-300 mb-2">
                <span>Cuenta regresiva</span>
                <span className="font-mono text-amber-300 text-2xl font-black">{secRemaining}s</span>
              </div>
              <div className="w-full h-5 rounded-full bg-slate-950/80 border border-white/20 p-1 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-100 ease-linear shadow-lg"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: progressPct < 30 ? '#ef4444' : progressPct < 60 ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): 2nd, 3rd place and unpressed teams */}
          <div className="col-span-5 flex flex-col justify-between gap-6">
            {/* Subsequent pressed places */}
            <div className="bg-slate-900/80 border-2 border-slate-700/60 rounded-3xl p-6 shadow-xl flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-sm mb-4 pb-2 border-b border-slate-800">
                <Clock className="w-4 h-4 text-amber-400" />
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
                            ? 'bg-red-950/30 border-red-900/40 opacity-50'
                            : 'bg-slate-800/90 border-slate-700/80 shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-slate-700/80 font-black text-lg text-amber-300 flex items-center justify-center border border-white/10">
                            {idx + 2}º
                          </span>
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: pressTeam.color }}
                          />
                          <span className="font-black text-xl text-white truncate max-w-[200px]">
                            {pressTeam.name}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-lg font-black text-amber-300">
                            {formatMsDiff(press.msAfterFirst)}
                          </span>
                          {isExcl && (
                            <span className="block text-[11px] font-bold text-red-400 uppercase">
                              Excluido
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-6">
                    <Users className="w-8 h-8 mb-2 opacity-40" />
                    <span className="text-sm font-semibold">Ningún otro equipo pulsó en esta ronda</span>
                  </div>
                )}
              </div>
            </div>

            {/* Unpressed Teams */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Sin pulsar en esta pregunta
              </div>
              <div className="flex flex-wrap gap-2">
                {unpressedTeams.length > 0 ? (
                  unpressedTeams.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-bold text-slate-300"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span>{t.name}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">Todos los equipos pulsaron</span>
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

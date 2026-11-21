import React from 'react';
import { TeamMatcherResult } from '../../../types/masterStudio';
import { Trophy, Swords, CheckCircle2 } from 'lucide-react';
import { FitText } from '../common/FitText';

interface TournamentBracketArenaProps {
  matcherResult: TeamMatcherResult | null;
  prizeTitle?: string;
}

export const TournamentBracketArena: React.FC<TournamentBracketArenaProps> = ({
  matcherResult,
  prizeTitle,
}) => {
  if (!matcherResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center p-12">
        <Trophy className="w-24 h-24 text-[var(--p-accent-ink)] mb-6 opacity-70 animate-pulse" />
        <h2 className="font-projector-title text-[44px] text-[var(--p-text)] mb-3">
          {prizeTitle || 'Torneo y Emparejamiento Oficial'}
        </h2>
        <p className="text-[26px] text-[var(--p-text-2)]">
          El cuadro de llaves y duelos se revelará en esta pantalla al comenzar.
        </p>
      </div>
    );
  }

  // 1. Bracket view (4, 8, 16 teams)
  if (matcherResult.type === 'tournament_bracket' && matcherResult.bracket) {
    const bracket = matcherResult.bracket;
    const totalRounds = Math.log2(bracket.size);

    const roundNames: Record<number, string> = {
      0: bracket.size === 16 ? 'Octavos de Final' : bracket.size === 8 ? 'Cuartos de Final' : 'Semifinales',
      1: bracket.size === 16 ? 'Cuartos de Final' : bracket.size === 8 ? 'Semifinales' : 'Gran Final',
      2: bracket.size === 16 ? 'Semifinales' : 'Gran Final',
      3: 'Gran Final',
    };

    return (
      <div className="flex flex-col w-full h-full justify-between gap-6 select-none">
        <div className="flex items-center justify-between px-6 py-2.5 rounded-2xl bg-[var(--p-panel)] border border-[var(--p-line)]">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-[var(--p-accent-ink)]" />
            <span className="text-[22px] font-black uppercase tracking-wider text-[var(--p-text)]">
              Cuadro de llaves · Torneo eliminatorio ({bracket.size} equipos)
            </span>
          </div>
          <span className="text-[18px] text-[var(--p-accent-ink)] font-bold">
            {prizeTitle || 'Por el Gran Trofeo'}
          </span>
        </div>

        {/* Columns of rounds */}
        <div className="flex-1 flex items-stretch justify-between gap-6 py-2 overflow-x-auto">
          {Array.from({ length: totalRounds }).map((_, rIdx) => {
            const matchesInThisRound = bracket.matches.filter((m) => m.roundIndex === rIdx);
            const isFinal = rIdx === totalRounds - 1;

            return (
              <div key={rIdx} className="flex-1 flex flex-col justify-between min-w-[260px] gap-4">
                <div className="text-center py-2 rounded-xl bg-[var(--p-brand)] text-[var(--p-on-brand)]">
                  <span className="text-[18px] font-black uppercase tracking-widest">
                    {roundNames[rIdx] || `Ronda ${rIdx + 1}`}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-around gap-4">
                  {matchesInThisRound.map((match) => {
                    const hasWinner = Boolean(match.winner);
                    return (
                      <div
                        key={match.id}
                        className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col gap-2 shadow-sm ${
                          isFinal
                            ? 'bg-[var(--p-accent-soft)] border-[var(--p-accent-ink)]'
                            : hasWinner
                            ? 'bg-[var(--p-panel)] border-[var(--p-ok)]'
                            : 'bg-[var(--p-panel)] border-[var(--p-line)]'
                        }`}
                      >
                        {/* Team A */}
                        <div
                          className={`flex items-center justify-between gap-2 px-4 py-2 rounded-xl font-black transition-all ${
                            match.winner === match.teamA
                              ? 'bg-[var(--p-ok-bg)] text-[var(--p-ok)] border border-[var(--p-ok)]'
                              : match.winner && match.winner !== match.teamA
                              ? 'bg-[var(--p-panel-2)] text-[var(--p-text-3)] line-through opacity-55'
                              : 'bg-[var(--p-panel-2)] text-[var(--p-text)]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 text-left">
                            <FitText max={22} min={13} className="w-full font-black" title={match.teamA || 'Por definir'}>
                              {match.teamA || 'Por definir'}
                            </FitText>
                          </div>
                          {match.winner === match.teamA && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                        </div>

                        {/* Team B */}
                        <div
                          className={`flex items-center justify-between gap-2 px-4 py-2 rounded-xl font-black transition-all ${
                            match.winner === match.teamB
                              ? 'bg-[var(--p-ok-bg)] text-[var(--p-ok)] border border-[var(--p-ok)]'
                              : match.winner && match.winner !== match.teamB
                              ? 'bg-[var(--p-panel-2)] text-[var(--p-text-3)] line-through opacity-55'
                              : 'bg-[var(--p-panel-2)] text-[var(--p-text)]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 text-left">
                            <FitText max={22} min={13} className="w-full font-black" title={match.teamB || 'Por definir'}>
                              {match.teamB || 'Por definir'}
                            </FitText>
                          </div>
                          {match.winner === match.teamB && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Duels 1v1 View
  if (matcherResult.type === 'duels_1v1' && matcherResult.matchups) {
    return (
      <div className="flex flex-col w-full h-full justify-between gap-6 select-none">
        <div className="flex items-center justify-between px-6 py-2.5 rounded-2xl bg-[var(--p-panel)] border border-[var(--p-line)]">
          <div className="flex items-center gap-3">
            <Swords className="w-7 h-7 text-[var(--p-accent-ink)]" />
            <span className="text-[22px] font-black uppercase tracking-wider text-[var(--p-text)]">
              Emparejamiento de duelos 1 vs 1 ({matcherResult.matchups.length} duelos)
            </span>
          </div>
          <span className="text-[18px] text-[var(--p-accent-ink)] font-bold">
            {prizeTitle || 'Sorteo de Enfrentamientos'}
          </span>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-5 overflow-y-auto py-2">
          {matcherResult.matchups.map((m, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[var(--p-panel)] border-2 border-[var(--p-line)] flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="min-w-0 flex-1 p-3 rounded-xl bg-[var(--p-panel-2)] border border-[var(--p-line-strong)] text-center text-[var(--p-text)]">
                <FitText max={24} min={14} className="w-full font-black text-center" title={m.teamA}>
                  {m.teamA}
                </FitText>
              </div>
              <div className="w-12 h-12 rounded-full bg-[var(--p-accent)] text-[var(--p-on-accent)] font-black text-[18px] flex items-center justify-center shrink-0 shadow-sm">
                VS
              </div>
              <div className="min-w-0 flex-1 p-3 rounded-xl bg-[var(--p-panel-2)] border border-[var(--p-line-strong)] text-center text-[var(--p-text)]">
                <FitText max={24} min={14} className="w-full font-black text-center" title={m.teamB}>
                  {m.teamB}
                </FitText>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. N-Teams Partition View
  if (matcherResult.type === 'n_teams' && matcherResult.groups) {
    return (
      <div className="flex flex-col w-full h-full justify-between gap-6 select-none">
        <div className="flex items-center justify-between px-6 py-2.5 rounded-2xl bg-[var(--p-panel)] border border-[var(--p-line)]">
          <span className="text-[22px] font-black uppercase tracking-wider text-[var(--p-text)]">
            Grupos asignados aleatoriamente ({matcherResult.groups.length} equipos)
          </span>
          <span className="text-[18px] text-[var(--p-accent-ink)] font-bold">
            {prizeTitle || 'Distribución Oficial'}
          </span>
        </div>

        <div className="flex-1 grid grid-cols-4 gap-5 overflow-y-auto py-2">
          {matcherResult.groups.map((group, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[var(--p-panel)] border-2 flex flex-col justify-between shadow-sm"
              style={{ borderColor: group.color || 'var(--p-line)' }}
            >
              <div className="pb-3 border-b border-[var(--p-line)] flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <FitText max={22} min={14} className="w-full font-black text-[var(--p-text)]" title={group.groupName}>
                    {group.groupName}
                  </FitText>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-[var(--p-panel-2)] text-[var(--p-text-2)] text-[13px] font-bold">
                  {group.members.length} miembros
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 py-3 overflow-y-auto">
                {group.members.map((m, mIdx) => (
                  <div key={mIdx} className="px-3 py-1.5 rounded-lg bg-[var(--p-panel-2)] text-[var(--p-text)]">
                    <FitText max={18} min={13} className="w-full font-bold" title={m}>
                      {m}
                    </FitText>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

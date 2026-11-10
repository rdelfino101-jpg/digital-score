import React from 'react';
import { TournamentBracket, TeamMatcherResult } from '../../../types/masterStudio';
import { Trophy, Swords, CheckCircle2 } from 'lucide-react';

interface TournamentBracketArenaProps {
  matcherResult: TeamMatcherResult | null;
  prizeTitle?: string;
}

export const TournamentBracketArena: React.FC<TournamentBracketArenaProps> = ({
  matcherResult,
  prizeTitle,
}) => {
  // Empty state: clean broadcast title (Requirement 2: no operator instructions on projector)
  if (!matcherResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center p-12">
        <Trophy className="w-24 h-24 text-[#FFC53D] mb-6 opacity-60 animate-pulse" />
        <h2 className="text-[44px] font-black text-white mb-3">
          {prizeTitle || 'Torneo y Emparejamiento Oficial'}
        </h2>
        <p className="text-[26px] text-[#B8BCE6]">
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
        <div className="flex items-center justify-between px-6 py-2.5 rounded-2xl bg-[#15173A] border border-[#2A2D5C]">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-[#FFC53D]" />
            <span className="text-[22px] font-black uppercase tracking-wider text-white">
              CUADRO DE LLAVES · TORNEO ELIMINATORIO ({bracket.size} EQUIPOS)
            </span>
          </div>
          <span className="text-[18px] text-[#FFC53D] font-bold">
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
                <div className="text-center py-2 rounded-xl bg-[#1C1F47] border border-[#2A2D5C]">
                  <span className="text-[18px] font-black uppercase tracking-widest text-[#FFC53D]">
                    {roundNames[rIdx] || `Ronda ${rIdx + 1}`}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-around gap-4">
                  {matchesInThisRound.map((match) => {
                    const hasWinner = Boolean(match.winner);
                    return (
                      <div
                        key={match.id}
                        className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col gap-2 shadow-xl ${
                          isFinal
                            ? 'bg-[#3A2A05] border-[#FFC53D]'
                            : hasWinner
                            ? 'bg-[#15173A] border-[#4ADE80]/80'
                            : 'bg-[#15173A] border-[#2A2D5C]'
                        }`}
                      >
                        {/* Team A */}
                        <div
                          className={`flex items-center justify-between px-4 py-2 rounded-xl font-black text-[20px] transition-all ${
                            match.winner === match.teamA
                              ? 'bg-[#0F5132] text-[#4ADE80] border border-[#4ADE80]'
                              : match.winner && match.winner !== match.teamA
                              ? 'bg-black/30 text-slate-500 line-through'
                              : 'bg-[#0A0B1E] text-white'
                          }`}
                        >
                          <span className="truncate">{match.teamA || 'Por definir'}</span>
                          {match.winner === match.teamA && <CheckCircle2 className="w-5 h-5 shrink-0 ml-2" />}
                        </div>

                        {/* Team B */}
                        <div
                          className={`flex items-center justify-between px-4 py-2 rounded-xl font-black text-[20px] transition-all ${
                            match.winner === match.teamB
                              ? 'bg-[#0F5132] text-[#4ADE80] border border-[#4ADE80]'
                              : match.winner && match.winner !== match.teamB
                              ? 'bg-black/30 text-slate-500 line-through'
                              : 'bg-[#0A0B1E] text-white'
                          }`}
                        >
                          <span className="truncate">{match.teamB || 'Por definir'}</span>
                          {match.winner === match.teamB && <CheckCircle2 className="w-5 h-5 shrink-0 ml-2" />}
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
        <div className="flex items-center justify-between px-6 py-2.5 rounded-2xl bg-[#15173A] border border-[#2A2D5C]">
          <div className="flex items-center gap-3">
            <Swords className="w-7 h-7 text-[#FFC53D]" />
            <span className="text-[22px] font-black uppercase tracking-wider text-white">
              EMPAREJAMIENTO DE DUELOS 1 VS 1 ({matcherResult.matchups.length} DUELOS)
            </span>
          </div>
          <span className="text-[18px] text-[#FFC53D] font-bold">
            {prizeTitle || 'Sorteo de Enfrentamientos'}
          </span>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-5 overflow-y-auto py-2">
          {matcherResult.matchups.map((m, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#15173A] border-2 border-[#2A2D5C] flex items-center justify-between gap-4 shadow-xl"
            >
              <div className="flex-1 p-3 rounded-xl bg-[#0A0B1E] border border-blue-500/40 text-center font-black text-[24px] text-white truncate">
                {m.teamA}
              </div>
              <div className="w-12 h-12 rounded-full bg-[#FFC53D] text-slate-950 font-black text-[18px] flex items-center justify-center shrink-0 shadow-lg">
                VS
              </div>
              <div className="flex-1 p-3 rounded-xl bg-[#0A0B1E] border border-red-500/40 text-center font-black text-[24px] text-white truncate">
                {m.teamB}
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
        <div className="flex items-center justify-between px-6 py-2.5 rounded-2xl bg-[#15173A] border border-[#2A2D5C]">
          <span className="text-[22px] font-black uppercase tracking-wider text-white">
            GRUPOS ASIGNADOS ALEATORIAMENTE ({matcherResult.groups.length} EQUIPOS)
          </span>
          <span className="text-[18px] text-[#FFC53D] font-bold">
            {prizeTitle || 'Distribución Oficial'}
          </span>
        </div>

        <div className="flex-1 grid grid-cols-4 gap-5 overflow-y-auto py-2">
          {matcherResult.groups.map((group, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#15173A] border-2 flex flex-col justify-between shadow-xl"
              style={{ borderColor: group.color || '#2A2D5C' }}
            >
              <div className="pb-3 border-b border-[#2A2D5C] flex items-center justify-between">
                <span className="text-[22px] font-black text-white">{group.groupName}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[13px] font-bold">
                  {group.members.length} miembros
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 py-3 overflow-y-auto">
                {group.members.map((m, mIdx) => (
                  <div key={mIdx} className="px-3 py-1.5 rounded-lg bg-[#0A0B1E] text-white text-[18px] font-bold truncate">
                    {m}
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

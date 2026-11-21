import React from 'react';
import { StudioTeam } from '../../../types/masterStudio';
import { rankStudioTeams } from '../../../utils/gameEngineRules';
import { Trophy, Flame } from 'lucide-react';
import { AnimatedScore } from './AnimatedScore';

interface TeamBandProps {
  teams: StudioTeam[];
  activeTeamId?: string | null;
  showScores?: boolean;
  className?: string;
}

export const TeamBand: React.FC<TeamBandProps> = ({
  teams,
  activeTeamId,
  showScores = true,
  className = '',
}) => {
  const ranked = rankStudioTeams(teams, true);
  const isLargeTeamCount = teams.length >= 5;

  if (isLargeTeamCount) {
    // 5-10 TEAMS: Vertical Right-Side Standings Column of 600px width
    return (
      <aside
        className={`flex w-[600px] flex-col gap-3 rounded-3xl border-2 border-[var(--p-line)] bg-[var(--p-panel)] p-6 shadow-md ${className}`}
      >
        <div className="flex items-center justify-between border-b border-[var(--p-line)] pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[var(--p-accent-ink)]" />
            <span className="font-projector text-[24px] font-black uppercase tracking-wider text-[var(--p-text)]">
              Posiciones en vivo
            </span>
          </div>
          <span className="font-projector text-[20px] font-bold text-[var(--p-text-3)]">
            {teams.length} equipos
          </span>
        </div>

        <div className="flex flex-col gap-2.5 overflow-hidden">
          {ranked.map((team) => {
            const isTurn = team.id === activeTeamId;

            return (
              <div
                key={team.id}
                className={`relative flex h-[76px] items-center justify-between rounded-2xl border-2 px-5 transition-all ${
                  isTurn
                    ? 'border-[var(--p-accent-ink)] bg-[var(--p-accent-soft)] text-[var(--p-text)] shadow-sm'
                    : 'border-[var(--p-line)] bg-[var(--p-panel-2)] text-[var(--p-text)]'
                }`}
                style={{
                  borderLeftColor: team.color,
                  borderLeftWidth: '10px',
                }}
              >
                {/* Rank & Name */}
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-projector text-[26px] font-black tabular-numbers text-[var(--p-text-2)]">
                    #{team.rank}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-projector text-[28px] font-black truncate text-[var(--p-text)] max-w-[280px]">
                      {team.name}
                    </span>
                    {isTurn && (
                      <span className="flex items-center gap-1 font-projector text-[18px] font-black uppercase text-[var(--p-accent-ink)]">
                        <Flame className="h-3.5 w-3.5" /> EN TURNO
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-baseline gap-2 shrink-0">
                  {showScores ? (
                    <>
                      <AnimatedScore
                        score={team.score}
                        className="font-projector text-[48px] font-black leading-none text-[var(--p-text)]"
                      />
                      <span className="font-projector text-[20px] font-bold text-[var(--p-text-2)]">PTS</span>
                    </>
                  ) : (
                    <span className="font-projector text-[24px] font-bold text-[var(--p-text-3)]">---</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  // 2-4 TEAMS: Bottom Horizontal Band with Team Cards
  return (
    <footer
      className={`grid w-full gap-4 rounded-3xl border-2 border-[var(--p-line)] bg-[var(--p-panel)] p-4 shadow-md shrink-0 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${teams.length}, minmax(0, 1fr))`,
      }}
    >
      {teams.map((team) => {
        const isTurn = team.id === activeTeamId;
        const rankInfo = ranked.find((r) => r.id === team.id);

        return (
          <div
            key={team.id}
            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 p-4 transition-all duration-300 ${
              isTurn
                ? 'border-[var(--p-accent-ink)] bg-[var(--p-accent-soft)] shadow-md'
                : 'border-[var(--p-line)] bg-[var(--p-panel-2)]'
            }`}
          >
            {/* 10px Top Bar with Team Color */}
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: '10px',
                backgroundColor: team.color,
              }}
            />

            {/* Header: Rank + Name + Turn indicator */}
            <div className="flex items-center justify-between gap-2 pt-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-projector text-[22px] font-bold tracking-wider text-[var(--p-text-2)]">
                  {rankInfo?.rank ? `${rankInfo.rank}º` : 'Equipo'}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--p-text-3)]" />
                <span
                  className="font-projector text-[28px] font-black text-[var(--p-text)] truncate max-w-[200px]"
                  title={team.name}
                >
                  {team.name}
                </span>
              </div>

              {isTurn && (
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--p-accent)] px-3 py-0.5 font-projector text-[18px] font-black uppercase tracking-wider text-[var(--p-on-accent)] shadow-sm shrink-0">
                  <Flame className="h-4 w-4" />
                  EN TURNO
                </span>
              )}
            </div>

            {/* Score 76px */}
            <div className="mt-2 flex items-baseline justify-between border-t border-[var(--p-line)] pt-2">
              <span className="font-projector text-[22px] font-bold uppercase text-[var(--p-text-3)]">
                Puntos
              </span>
              {showScores ? (
                <div className="flex items-baseline gap-1.5">
                  <AnimatedScore
                    score={team.score}
                    className="font-projector tabular-numbers text-[76px] font-black leading-none text-[var(--p-text)]"
                  />
                  <span className="font-projector text-[24px] font-black text-[var(--p-accent-ink)]">PTS</span>
                </div>
              ) : (
                <span className="font-projector text-[48px] font-black text-[var(--p-text-3)]">???</span>
              )}
            </div>
          </div>
        );
      })}
    </footer>
  );
};

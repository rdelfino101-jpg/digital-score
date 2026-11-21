import React from 'react';
import { StudioTeam } from '../../../types/masterStudio';
import { rankStudioTeams } from '../../../utils/gameEngineRules';
import { Trophy, Flame } from 'lucide-react';
import { AnimatedScore } from './AnimatedScore';
import { FitText } from './FitText';

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
    const isDense = ranked.length >= 8;

    // 5-10 TEAMS: Full-height Vertical Right-Side Standings Column without scroll
    return (
      <aside
        className={`flex h-full min-h-0 w-[560px] shrink-0 flex-col gap-2.5 overflow-hidden rounded-3xl border-2 border-[var(--p-line)] bg-[var(--p-panel)] p-5 shadow-md ${className}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--p-line)] pb-2.5">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[var(--p-accent-ink)]" />
            <span className="font-projector text-[22px] font-black uppercase tracking-wider text-[var(--p-text)]">
              Posiciones en vivo
            </span>
          </div>
          <span className="font-projector text-[20px] font-bold text-[var(--p-text-3)]">
            {teams.length} equipos
          </span>
        </div>

        <div
          className={`grid flex-1 min-h-0 overflow-hidden ${isDense ? 'gap-1.5' : 'gap-2'}`}
          style={{
            gridTemplateRows: `repeat(${Math.max(1, ranked.length)}, minmax(0, 1fr))`,
          }}
        >
          {ranked.map((team) => {
            const isTurn = team.id === activeTeamId;

            return (
              <div
                key={team.id}
                className={`relative flex min-h-0 min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl border-2 px-4 py-1 transition-all ${
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
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`w-[44px] shrink-0 font-projector font-black tabular-numbers text-[var(--p-text-2)] ${
                      isDense ? 'text-[20px]' : 'text-[24px]'
                    }`}
                  >
                    #{team.rank}
                  </span>

                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <FitText
                        max={isDense ? 24 : 28}
                        min={14}
                        className="w-full font-projector font-black text-[var(--p-text)]"
                        title={team.name}
                      >
                        {team.name}
                      </FitText>
                    </div>
                    {isTurn && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--p-accent)] px-2.5 py-0.5 font-projector text-[13px] font-black uppercase text-[var(--p-on-accent)]">
                        <Flame className="h-3.5 w-3.5" />
                        Turno
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-baseline gap-1.5 shrink-0">
                  {showScores ? (
                    <>
                      <AnimatedScore
                        score={team.score}
                        className={`font-projector font-black leading-none text-[var(--p-text)] ${
                          isDense ? 'text-[30px]' : 'text-[40px]'
                        }`}
                      />
                      <span
                        className={`font-projector font-bold text-[var(--p-text-2)] ${
                          isDense ? 'text-[14px]' : 'text-[18px]'
                        }`}
                      >
                        PTS
                      </span>
                    </>
                  ) : (
                    <span className="font-projector text-[22px] font-bold text-[var(--p-text-3)]">---</span>
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

            {/* Header: Rank + Name (FitText 36->18) + Turn indicator */}
            <div className="flex items-center justify-between gap-2 pt-1.5 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-projector text-[22px] font-bold tracking-wider text-[var(--p-text-2)] shrink-0">
                  {rankInfo?.rank ? `${rankInfo.rank}º` : 'Equipo'}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--p-text-3)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <FitText
                    max={36}
                    min={18}
                    className="w-full font-projector font-black text-[var(--p-text)]"
                    title={team.name}
                  >
                    {team.name}
                  </FitText>
                </div>
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

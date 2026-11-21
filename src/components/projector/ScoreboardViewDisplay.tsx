import React from 'react';
import { MasterLiveState } from '../../types/masterStudio';
import { Flame, EyeOff, Trophy, Medal, Award } from 'lucide-react';
import { formatTimeDisplay, rankStudioTeams } from '../../utils/gameEngineRules';
import { ProjectorHeader } from './common/ProjectorHeader';
import { ProjectorClock } from './common/ProjectorClock';
import { AnimatedScore } from './common/AnimatedScore';
import { AutoFit } from './common/AutoFit';
import { BrandMark } from './common/BrandMark';
import { FitText } from './common/FitText';
import { useProjectorBrand } from './common/brandContext';

interface ScoreboardViewDisplayProps {
  state: MasterLiveState;
}

export const ScoreboardViewDisplay: React.FC<ScoreboardViewDisplayProps> = ({ state }) => {
  const { teams, scoreboard, hudToggles, timer, viewMode } = state;

  // 3 or more teams always use the new BrandedLeaderboard layout
  if (teams.length >= 3) {
    return <BrandedLeaderboard state={state} />;
  }

  const isLeaderboardView = viewMode === 'LEADERBOARD_FULL';

  const isTimerWarning = timer.mode === 'countdown' && timer.secondsRemaining <= 10 && timer.secondsRemaining > 0;
  const isTimerFinished = timer.mode === 'countdown' && timer.secondsRemaining === 0 && !timer.isRunning;

  // Header Right Slot: Center Set Pill + Clock + Rounds Badge
  const headerRightSlot = (
    <div className="flex items-center gap-6">
      {hudToggles.showPeriod && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-[var(--p-accent-ink)] bg-[var(--p-panel)] px-5 py-2.5 shadow-sm">
          <span className="font-projector text-[24px] font-black uppercase tracking-wider text-[var(--p-accent-ink)]">
            {scoreboard.periodTypeLabel} {scoreboard.currentRound}
          </span>
          {scoreboard.totalRounds > 0 && (
            <>
              <span className="h-4 w-px bg-[var(--p-line)]" />
              <span className="font-projector text-[22px] font-bold text-[var(--p-text-2)]">
                Mejor de {scoreboard.totalRounds} {scoreboard.periodTypeLabel.toLowerCase()}s
              </span>
            </>
          )}
        </div>
      )}

      {hudToggles.showTimer && timer.mode !== 'off' && (
        <ProjectorClock
          seconds={timer.mode === 'countdown' ? timer.secondsRemaining : timer.stopwatchSeconds}
          mode={timer.mode}
          isWarning={isTimerWarning}
          isFinished={isTimerFinished}
        />
      )}
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col justify-between animate-projector-wipe">
      {/* 1. PROJECTOR HEADER */}
      {hudToggles.showEventTitles ? (
        <ProjectorHeader
          kicker="Marcador Oficial Deportivo"
          title={scoreboard.title || 'Competición en vivo'}
          subtitle={scoreboard.subtitle || ''}
          rightSlot={headerRightSlot}
        />
      ) : (
        <div className="flex justify-end pb-4">{headerRightSlot}</div>
      )}

      {/* 2. MAIN CENTER ARENA: 1 VS 1 SPORTS DUEL OR FULL LEADERBOARD */}
      <main className="my-auto flex flex-1 min-h-0 items-center justify-center py-4 w-full">
        <AutoFit className="w-full h-full">
          {isLeaderboardView ? (
            <FullLeaderboardDisplay state={state} />
          ) : (
            <SportsDuelDisplay state={state} />
          )}
        </AutoFit>
      </main>

      {/* 3. FOOTER: SET HISTORY (PREVIOUS SETS) */}
      {hudToggles.showRoundHistory && scoreboard.roundHistory.length > 0 && (
        <footer className="flex items-center justify-between border-t border-[var(--p-line)] pt-4">
          <div className="flex items-center gap-4">
            <span className="font-projector text-[22px] font-black uppercase tracking-wider text-[var(--p-text-2)]">
              Historial de sets:
            </span>
            <div className="flex items-center gap-4 overflow-x-auto">
              {scoreboard.roundHistory.map((rh, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border-2 border-[var(--p-line)] bg-[var(--p-panel)] px-5 py-2 shadow-sm"
                >
                  <span className="font-projector text-[22px] font-bold text-[var(--p-text-2)]">
                    {rh.label}:
                  </span>
                  <div className="flex items-center gap-2 font-projector text-[24px] font-black">
                    {Object.entries(rh.scores).map(([tid, sc], idx) => {
                      const t = teams.find((tm) => tm.id === tid);
                      return (
                        <React.Fragment key={tid}>
                          {idx > 0 && <span className="text-[var(--p-text-3)]">-</span>}
                          <span style={{ color: t?.color || 'var(--p-text)' }}>{sc}</span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[var(--p-ok)] animate-pulse" />
            <span className="font-projector text-[20px] font-bold uppercase text-[var(--p-text-2)]">
              Transmisión en directo
            </span>
          </div>
        </footer>
      )}
    </div>
  );
};

/* -------------------------------------------------------------
 * BrandedLeaderboard (3+ teams, 1920x1080 TV-optimized layout)
 * ------------------------------------------------------------- */
export const BrandedLeaderboard: React.FC<{ state: MasterLiveState }> = ({ state }) => {
  const { teams, scoreboard, hudToggles, timer, turn } = state;
  const brand = useProjectorBrand();

  const ranked = rankStudioTeams(teams, true);
  const count = ranked.length;
  const isTwoCol = count >= 7;
  const rowsPerCol = isTwoCol ? Math.ceil(count / 2) : count;

  const activeTeam = teams.find((t) => t.id === turn.activeTeamId) || null;
  const isTimerWarning = timer.mode === 'countdown' && timer.secondsRemaining <= 10 && timer.secondsRemaining > 0;
  const isTimerFinished = timer.mode === 'countdown' && timer.secondsRemaining === 0 && !timer.isRunning;
  const isTimerAlert = isTimerWarning || isTimerFinished;
  const clockSeconds = timer.mode === 'countdown' ? timer.secondsRemaining : timer.stopwatchSeconds;

  // Dynamic typography sizing per row count
  const nameMax = isTwoCol ? 40 : count <= 4 ? 58 : 48;
  const scoreSize = isTwoCol ? 68 : count <= 4 ? 104 : count === 5 ? 88 : 76;
  const recentRounds = scoreboard.roundHistory.slice(-3);
  const showInlineHistory = !isTwoCol && hudToggles.showRoundHistory && recentRounds.length > 0;

  return (
    <div className="flex h-full w-full min-h-0 gap-8 select-none animate-projector-wipe">
      {/* LEFT COLUMN: Fixed 540px Brand Panel */}
      <aside
        className="flex w-[540px] shrink-0 flex-col justify-between overflow-hidden rounded-[36px] p-[48px] shadow-xl"
        style={{
          backgroundColor: 'var(--p-brand)',
          color: 'var(--p-on-brand)',
        }}
      >
        {/* Top: BrandMark + Event Name + Subtitle + Optional Scoreboard Title */}
        <div className="flex flex-col items-start gap-5 min-w-0">
          <BrandMark brand={brand} size={96} inverse />

          <div className="flex w-full flex-col gap-2 min-w-0">
            <FitText
              as="h1"
              max={56}
              min={30}
              lines={2}
              lineHeight={1.06}
              className="w-full font-projector-title"
              style={{ color: 'var(--p-on-brand)' }}
              title={brand.name}
            >
              {brand.name}
            </FitText>

            {brand.tagline && (
              <FitText
                max={30}
                min={20}
                className="w-full font-projector font-semibold"
                style={{ color: 'var(--p-brand-2)' }}
                title={brand.tagline}
              >
                {brand.tagline}
              </FitText>
            )}

            {hudToggles.showEventTitles && scoreboard.title && (
              <FitText
                max={26}
                min={18}
                className="mt-1 w-full font-projector font-bold opacity-90"
                style={{ color: 'var(--p-on-brand)' }}
                title={scoreboard.title}
              >
                {scoreboard.title}
              </FitText>
            )}
          </div>
        </div>

        {/* Bottom: Round + Timer + Active Turn Card */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Round */}
          {hudToggles.showPeriod && (
            <div className="flex flex-col gap-1">
              <span
                className="font-projector text-[26px] font-bold leading-tight"
                style={{ color: 'var(--p-brand-2)' }}
              >
                Ronda
              </span>
              <div className="flex items-baseline gap-2 leading-none">
                <span
                  className="font-projector tabular-numbers text-[60px] font-black leading-none"
                  style={{ color: 'var(--p-on-brand)' }}
                >
                  {scoreboard.currentRound}
                </span>
                {scoreboard.totalRounds > 0 && (
                  <span
                    className="font-projector tabular-numbers text-[34px] font-bold leading-none"
                    style={{ color: 'var(--p-brand-2)' }}
                  >
                    de {scoreboard.totalRounds}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Timer / Stopwatch */}
          {hudToggles.showTimer && timer.mode !== 'off' && (
            <div className="flex flex-col items-start gap-2">
              <span
                className="font-projector text-[26px] font-bold leading-tight"
                style={{ color: 'var(--p-brand-2)' }}
              >
                {timer.mode === 'stopwatch' ? 'Cronómetro' : 'Tiempo'}
              </span>
              <div
                className={`font-projector tabular-numbers text-[92px] font-black leading-none tracking-tight transition-colors ${
                  isTimerAlert
                    ? 'animate-pulse rounded-3xl px-5 py-2.5 shadow-md'
                    : ''
                }`}
                style={
                  isTimerAlert
                    ? {
                        backgroundColor: 'var(--p-accent)',
                        color: 'var(--p-on-accent)',
                      }
                    : {
                        color: 'var(--p-on-brand)',
                      }
                }
              >
                {formatTimeDisplay(clockSeconds)}
              </div>
            </div>
          )}

          {/* Active Turn Card */}
          {activeTeam && (
            <div
              className="flex flex-col gap-2 rounded-3xl border-2 px-6 py-4"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.22)',
                backgroundColor: 'rgba(0, 0, 0, 0.16)',
              }}
            >
              <span
                className="font-projector text-[20px] font-bold leading-tight"
                style={{ color: 'var(--p-brand-2)' }}
              >
                En turno
              </span>
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className="h-6 w-6 shrink-0 rounded-full ring-2 ring-white/50"
                  style={{ backgroundColor: activeTeam.color }}
                />
                <div className="min-w-0 flex-1">
                  <FitText
                    max={36}
                    min={20}
                    className="w-full font-projector font-extrabold"
                    style={{ color: 'var(--p-on-brand)' }}
                    title={activeTeam.name}
                  >
                    {activeTeam.name}
                  </FitText>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT COLUMN: Full-height grid (1 col up to 6 teams, 2 cols by column for 7-10 teams) */}
      <section
        className={`grid flex-1 min-w-0 min-h-0 h-full overflow-hidden ${
          isTwoCol ? 'grid-cols-2 grid-flow-col gap-4' : 'grid-cols-1 gap-4'
        }`}
        style={{
          gridTemplateRows: `repeat(${Math.max(1, rowsPerCol)}, minmax(0, 1fr))`,
        }}
      >
        {ranked.map((team) => {
          const isTurn = team.id === turn.activeTeamId;
          const isSoleLeader = team.rank === 1 && !team.isTied && team.score > 0;
          const showTiedBadge = team.isTied && team.score > 0;
          const hasBadges = isSoleLeader || isTurn || showTiedBadge;

          return (
            <div
              key={team.id}
              className={`flex min-h-0 min-w-0 items-center justify-between gap-4 overflow-hidden rounded-[28px] border-[3px] shadow-sm transition-all duration-300 ${
                isTwoCol ? 'px-5 py-2.5' : 'px-7 py-3'
              }`}
              style={{
                backgroundColor: isTurn ? 'var(--p-accent-soft)' : 'var(--p-panel)',
                borderColor: isSoleLeader
                  ? 'var(--p-accent)'
                  : isTurn
                  ? 'var(--p-accent-ink)'
                  : 'var(--p-line)',
              }}
            >
              {/* Left: Rank + 14px Vertical Team Color Bar + Name & Badges */}
              <div className="flex min-w-0 flex-1 items-center gap-5 h-full">
                {/* Position (40px, --p-text-3) */}
                <span
                  className="w-[54px] shrink-0 text-center font-projector tabular-numbers text-[40px] font-black leading-none"
                  style={{ color: 'var(--p-text-3)' }}
                >
                  {team.rank}
                </span>

                {/* 14px Vertical Team Color Bar */}
                <div
                  className="w-[14px] shrink-0 self-stretch my-1.5 rounded-full"
                  style={{ backgroundColor: team.color }}
                />

                {/* Name + Pills */}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                  <FitText
                    as="h2"
                    max={nameMax}
                    min={22}
                    lines={isTwoCol ? 2 : 1}
                    lineHeight={1.06}
                    className="w-full font-projector-title text-[var(--p-text)]"
                    title={team.name}
                  >
                    {team.name}
                  </FitText>

                  {hasBadges && (
                    <div className="flex flex-wrap items-center gap-2">
                      {isSoleLeader && (
                        <span
                          className="rounded-full px-3 py-0.5 font-projector text-[16px] font-black leading-tight"
                          style={{
                            backgroundColor: 'var(--p-accent)',
                            color: 'var(--p-on-accent)',
                          }}
                        >
                          Líder
                        </span>
                      )}

                      {isTurn && (
                        <span
                          className="rounded-full border-2 px-3 py-0.5 font-projector text-[16px] font-black leading-tight"
                          style={{
                            borderColor: 'var(--p-accent-ink)',
                            color: 'var(--p-accent-ink)',
                          }}
                        >
                          En turno
                        </span>
                      )}

                      {showTiedBadge && (
                        <span
                          className="rounded-full border px-3 py-0.5 font-projector text-[16px] font-bold leading-tight"
                          style={{
                            backgroundColor: 'var(--p-panel-2)',
                            borderColor: 'var(--p-line-strong)',
                            color: 'var(--p-text-2)',
                          }}
                        >
                          Empate
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Optional Last 3 Rounds (1 col only) + Total Score */}
              <div className="flex shrink-0 items-center gap-5">
                {showInlineHistory && (
                  <div className="flex items-center gap-2">
                    {recentRounds.map((rh, rhIdx) => (
                      <div
                        key={rhIdx}
                        className="flex min-w-[66px] flex-col items-center rounded-2xl border px-3 py-1.5"
                        style={{
                          backgroundColor: 'var(--p-panel-2)',
                          borderColor: 'var(--p-line)',
                        }}
                      >
                        <span
                          className="font-projector text-[14px] font-bold leading-tight"
                          style={{ color: 'var(--p-text-3)' }}
                        >
                          R{rh.roundNumber ?? rhIdx + 1}
                        </span>
                        <span
                          className="font-projector tabular-numbers text-[24px] font-black leading-tight"
                          style={{ color: 'var(--p-text-2)' }}
                        >
                          {rh.scores[team.id] ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-baseline justify-end min-w-[92px]">
                  {hudToggles.showScores ? (
                    <AnimatedScore
                      score={team.score}
                      className="font-projector tabular-numbers font-black leading-none text-[var(--p-text)]"
                      style={{ fontSize: `${scoreSize}px` }}
                    />
                  ) : (
                    <span
                      className="font-projector font-black leading-none text-[var(--p-text-3)]"
                      style={{ fontSize: `${Math.round(scoreSize * 0.65)}px` }}
                    >
                      ---
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

/* -------------------------------------------------------------
 * 1 vs 1 Sports Duel Display (Score up to 360px, 76px names)
 * ------------------------------------------------------------- */
const SportsDuelDisplay: React.FC<{ state: MasterLiveState }> = ({ state }) => {
  const { teams, hudToggles, turn, scoreboard } = state;
  const teamA = teams[0] || { id: 'team-a', name: 'Equipo Local', color: '#3B82F6', score: 0, setsWon: 0, fouls: 0 };
  const teamB = teams[1] || { id: 'team-b', name: 'Equipo Visitante', color: '#EF4444', score: 0, setsWon: 0, fouls: 0 };

  const totalSetsNeeded = Math.ceil(scoreboard.totalRounds / 2) || 3;

  const renderTeamCard = (team: typeof teamA, roleLabel: string) => {
    const isTurn = team.id === turn.activeTeamId;
    return (
      <div
        className={`relative col-span-5 flex flex-col justify-between overflow-hidden rounded-[36px] border-4 p-10 shadow-lg transition-all duration-300 ${
          isTurn
            ? 'border-[var(--p-accent-ink)] bg-[var(--p-accent-soft)]'
            : 'border-[var(--p-line)] bg-[var(--p-panel)]'
        }`}
      >
        {/* Top 12px Bar with Team Color */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: '12px', backgroundColor: team.color }}
        />

        {/* Header: Label, Possession & Advantage */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span
              className="h-4 w-4 rounded-full shrink-0"
              style={{ backgroundColor: team.color }}
            />
            <span className="font-projector text-[24px] font-black uppercase tracking-widest text-[var(--p-text-2)]">
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {hudToggles.showPossession && team.hasPossession && (
              <span className="flex items-center gap-2 rounded-xl bg-[var(--p-accent)] px-4 py-1.5 font-projector text-[22px] font-black uppercase tracking-wider text-[var(--p-on-accent)] shadow-sm">
                <Flame className="h-5 w-5" />
                SAQUE
              </span>
            )}
            {team.advantage && (
              <span className="rounded-xl border-2 border-[var(--p-accent-ink)] bg-[var(--p-accent-soft)] px-4 py-1.5 font-projector text-[22px] font-black uppercase text-[var(--p-accent-ink)]">
                VENTAJA
              </span>
            )}
          </div>
        </div>

        {/* Team Name: 76px */}
        <h2
          className="font-projector-title mt-4 truncate text-[76px] leading-tight text-[var(--p-text)]"
          title={team.name}
        >
          {team.name}
        </h2>

        {/* Score: Giant 360px Display */}
        <div className="my-auto flex items-center justify-center py-4">
          {hudToggles.showScores ? (
            <AnimatedScore
              score={team.score}
              className="font-projector tabular-numbers text-[360px] font-black leading-none tracking-tight text-[var(--p-text)]"
            />
          ) : (
            <div className="flex items-center gap-4 rounded-3xl border-2 border-[var(--p-line)] bg-[var(--p-panel-2)] px-10 py-8">
              <EyeOff className="h-16 w-16 text-[var(--p-accent-ink)] animate-pulse" />
              <span className="font-projector text-[48px] font-black tracking-widest text-[var(--p-text)]">
                PUNTOS OCULTOS
              </span>
            </div>
          )}
        </div>

        {/* Bottom Stats: Sets as circles + Fouls */}
        <div className="flex items-center justify-between border-t-2 border-[var(--p-line)] pt-6">
          <div className="flex items-center gap-4">
            <span className="font-projector text-[24px] font-bold uppercase tracking-wider text-[var(--p-text-2)]">
              SETS:
            </span>
            <div className="flex items-center gap-2.5">
              {Array.from({ length: totalSetsNeeded }).map((_, i) => (
                <div
                  key={i}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    i < team.setsWon
                      ? 'border-[var(--p-ok)] bg-[var(--p-ok)]'
                      : 'border-[var(--p-line)] bg-[var(--p-panel-2)]'
                  }`}
                />
              ))}
            </div>
            <span className="font-projector text-[32px] font-black text-[var(--p-text)] ml-2">
              ({team.setsWon})
            </span>
          </div>

          {hudToggles.showFouls && (
            <div className="flex items-center gap-3">
              <span className="font-projector text-[22px] font-bold uppercase tracking-wider text-[var(--p-text-2)]">
                FALTAS:
              </span>
              <span className="font-projector text-[40px] font-black text-[var(--p-err)] tabular-numbers">
                {team.fouls}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid w-full grid-cols-11 items-stretch gap-8 select-none">
      {renderTeamCard(teamA, 'Equipo local')}

      {/* VS DIVIDER */}
      <div className="col-span-1 flex flex-col items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-[var(--p-line-strong)] bg-[var(--p-brand)] text-[var(--p-on-brand)] shadow-lg">
          <span className="font-projector text-[36px] font-black tracking-wider">
            VS
          </span>
        </div>
      </div>

      {renderTeamCard(teamB, 'Equipo visitante')}
    </div>
  );
};

/* -------------------------------------------------------------
 * Full Leaderboard View (fallback when <= 2 teams in LEADERBOARD_FULL)
 * ------------------------------------------------------------- */
const FullLeaderboardDisplay: React.FC<{ state: MasterLiveState }> = ({ state }) => {
  const { teams, hudToggles, turn, scoreboard } = state;
  const ranked = rankStudioTeams(teams, true);

  return (
    <div className="flex w-full flex-col gap-4 select-none">
      {ranked.map((team, index) => {
        const isLeader = index === 0 && !team.isTied && team.score > 0;
        const isTurn = team.id === turn.activeTeamId;

        return (
          <div
            key={team.id}
            className={`relative flex h-[150px] items-center justify-between overflow-hidden rounded-3xl border-4 px-8 transition-all duration-300 ${
              isTurn
                ? 'border-[var(--p-accent-ink)] bg-[var(--p-accent-soft)] shadow-md'
                : isLeader
                ? 'border-[var(--p-accent)] bg-[var(--p-panel)] shadow-md'
                : 'border-[var(--p-line)] bg-[var(--p-panel)] shadow-sm'
            }`}
          >
            {/* Team Color Vertical Bar */}
            <div
              className="absolute left-0 top-0 bottom-0"
              style={{ width: '16px', backgroundColor: team.color }}
            />

            {/* Left Section: Rank Badge + Name */}
            <div className="flex items-center gap-6 min-w-0 flex-1 pl-4 pr-6">
              {/* Rank Pill */}
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-projector text-[40px] font-black shadow-sm ${
                  team.medal === 'gold'
                    ? 'bg-[var(--p-accent)] text-[var(--p-on-accent)]'
                    : team.medal === 'silver'
                    ? 'bg-[var(--p-brand)] text-[var(--p-on-brand)]'
                    : team.medal === 'bronze'
                    ? 'bg-[var(--p-panel-2)] border-2 border-[var(--p-line-strong)] text-[var(--p-text)]'
                    : 'bg-[var(--p-panel-2)] text-[var(--p-text-2)]'
                }`}
              >
                {team.medal === 'gold' ? (
                  <Trophy className="h-10 w-10" />
                ) : team.medal === 'silver' ? (
                  <Medal className="h-10 w-10" />
                ) : team.medal === 'bronze' ? (
                  <Award className="h-10 w-10" />
                ) : (
                  <span>#{team.rank}</span>
                )}
              </div>

              {/* Team Name with FitText */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0 flex-1">
                    <FitText
                      as="h3"
                      max={54}
                      min={22}
                      className="w-full font-projector-title text-[var(--p-text)]"
                      title={team.name}
                    >
                      {team.name}
                    </FitText>
                  </div>
                  {isLeader && (
                    <span className="shrink-0 rounded-xl bg-[var(--p-accent)] px-3.5 py-1 font-projector text-[20px] font-black uppercase text-[var(--p-on-accent)]">
                      LÍDER
                    </span>
                  )}
                  {isTurn && (
                    <span className="shrink-0 flex items-center gap-1 rounded-xl bg-[var(--p-brand)] px-3.5 py-1 font-projector text-[20px] font-black uppercase text-[var(--p-on-brand)]">
                      <Flame className="h-4 w-4" /> EN TURNO
                    </span>
                  )}
                </div>
                <span className="font-projector text-[22px] font-semibold text-[var(--p-text-2)]">
                  Puesto {team.rank} {team.isTied && '(Empate)'}
                </span>
              </div>
            </div>

            {/* Right Section: Round Breakdown + Total Score 92px */}
            <div className="flex items-center gap-10 shrink-0">
              {scoreboard.roundHistory.length > 0 && (
                <div className="flex items-center gap-3">
                  {scoreboard.roundHistory.slice(-3).map((rh, rhIdx) => (
                    <div
                      key={rhIdx}
                      className="flex flex-col items-center rounded-2xl border border-[var(--p-line)] bg-[var(--p-panel-2)] px-4 py-2"
                    >
                      <span className="font-projector text-[18px] font-bold uppercase text-[var(--p-text-3)]">
                        {rh.label}
                      </span>
                      <span className="font-projector text-[28px] font-black text-[var(--p-text)]">
                        {rh.scores[team.id] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Score: 92px */}
              <div className="flex flex-col items-end border-l-2 border-[var(--p-line)] pl-8">
                <span className="font-projector text-[20px] font-bold uppercase tracking-wider text-[var(--p-text-3)]">
                  Puntaje total
                </span>
                {hudToggles.showScores ? (
                  <div className="flex items-baseline gap-2">
                    <AnimatedScore
                      score={team.score}
                      className="font-projector tabular-numbers text-[92px] font-black leading-none text-[var(--p-text)]"
                    />
                    <span className="font-projector text-[28px] font-black text-[var(--p-accent-ink)]">PTS</span>
                  </div>
                ) : (
                  <span className="font-projector text-[48px] font-black text-[var(--p-text-3)]">---</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

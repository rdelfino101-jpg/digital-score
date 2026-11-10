import React from 'react';
import { MasterLiveState } from '../../types/masterStudio';
import { Flame, EyeOff, Trophy, Medal, Award, Timer, Volleyball } from 'lucide-react';
import { rankStudioTeams, formatTimeDisplay } from '../../utils/gameEngineRules';
import { ProjectorHeader } from './common/ProjectorHeader';
import { ProjectorClock } from './common/ProjectorClock';
import { AnimatedScore } from './common/AnimatedScore';

interface ScoreboardViewDisplayProps {
  state: MasterLiveState;
}

export const ScoreboardViewDisplay: React.FC<ScoreboardViewDisplayProps> = ({ state }) => {
  const { teams, scoreboard, turn, hudToggles, timer, viewMode } = state;
  const isLeaderboardView = viewMode === 'LEADERBOARD_FULL' || teams.length > 2;

  const isTimerWarning = timer.mode === 'countdown' && timer.secondsRemaining <= 10 && timer.secondsRemaining > 0;
  const isTimerFinished = timer.mode === 'countdown' && timer.secondsRemaining === 0 && !timer.isRunning;

  // Header Right Slot: Center Set Pill + Clock + Rounds Badge
  const headerRightSlot = (
    <div className="flex items-center gap-6">
      {/* Sports Set Pill: "SET 3 | 08:42" */}
      {hudToggles.showPeriod && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-[#FFC53D] bg-[#15173A] px-5 py-2.5 shadow-lg">
          <span className="font-projector text-[24px] font-black uppercase tracking-wider text-[#FFC53D]">
            {scoreboard.periodTypeLabel} {scoreboard.currentRound}
          </span>
          <span className="h-4 w-px bg-white/20" />
          <span className="font-projector text-[22px] font-bold text-[#B8BCE6]">
            {scoreboard.totalRounds > 0 ? `Mejor de ${scoreboard.totalRounds} ${scoreboard.periodTypeLabel.toLowerCase()}s` : ''}
          </span>
        </div>
      )}

      {/* Projector Clock */}
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
          title={scoreboard.title || 'COMPETICIÓN EN VIVO'}
          subtitle={scoreboard.subtitle || ''}
          rightSlot={headerRightSlot}
        />
      ) : (
        <div className="flex justify-end pb-4">{headerRightSlot}</div>
      )}

      {/* 2. MAIN CENTER ARENA: 1 VS 1 SPORTS DUEL OR FULL LEADERBOARD */}
      <main className="my-auto flex flex-1 items-center justify-center py-6 w-full">
        {isLeaderboardView ? (
          <FullLeaderboardDisplay state={state} />
        ) : (
          <SportsDuelDisplay state={state} />
        )}
      </main>

      {/* 3. FOOTER: SET HISTORY (PREVIOUS SETS) */}
      {hudToggles.showRoundHistory && scoreboard.roundHistory.length > 0 && (
        <footer className="flex items-center justify-between border-t border-[#2A2D5C] pt-4">
          <div className="flex items-center gap-4">
            <span className="font-projector text-[22px] font-black uppercase tracking-wider text-[#B8BCE6]">
              HISTORIAL DE SETS:
            </span>
            <div className="flex items-center gap-4 overflow-x-auto">
              {scoreboard.roundHistory.map((rh, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border-2 border-[#2A2D5C] bg-[#15173A] px-5 py-2 shadow-md"
                >
                  <span className="font-projector text-[22px] font-bold text-[#B8BCE6]">
                    {rh.label}:
                  </span>
                  <div className="flex items-center gap-2 font-projector text-[24px] font-black">
                    {Object.entries(rh.scores).map(([tid, sc], idx) => {
                      const t = teams.find((tm) => tm.id === tid);
                      return (
                        <React.Fragment key={tid}>
                          {idx > 0 && <span className="text-[#B8BCE6]">-</span>}
                          <span style={{ color: t?.color || '#FFFFFF' }}>{sc}</span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-projector text-[20px] font-bold uppercase text-[#B8BCE6]">
              TRANSMISIÓN EN DIRECTO
            </span>
          </div>
        </footer>
      )}
    </div>
  );
};

/* -------------------------------------------------------------
 * 1 vs 1 Sports Duel Display (Score up to 400px, 76px names)
 * ------------------------------------------------------------- */
const SportsDuelDisplay: React.FC<{ state: MasterLiveState }> = ({ state }) => {
  const { teams, hudToggles, turn, scoreboard } = state;
  const teamA = teams[0] || { id: 'team-a', name: 'Equipo Local', color: '#3B82F6', score: 0, setsWon: 0, fouls: 0 };
  const teamB = teams[1] || { id: 'team-b', name: 'Equipo Visitante', color: '#EF4444', score: 0, setsWon: 0, fouls: 0 };

  const totalSetsNeeded = Math.ceil(scoreboard.totalRounds / 2) || 3;

  return (
    <div className="grid w-full grid-cols-11 items-stretch gap-8 select-none">
      {/* TEAM A CARD (Local) */}
      <div
        className={`relative col-span-5 flex flex-col justify-between overflow-hidden rounded-[36px] border-4 p-10 backdrop-blur-2xl shadow-2xl transition-all duration-300 ${
          teamA.id === turn.activeTeamId
            ? 'border-[#FFC53D] bg-[#15173A] ring-8 ring-[#FFC53D]/40 shadow-[0_0_50px_rgba(255,197,61,0.4)]'
            : 'border-[#2A2D5C] bg-[#15173A]/90'
        }`}
      >
        {/* Top 12px Bar with Team Color */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: '12px', backgroundColor: teamA.color }}
        />

        {/* Header: Label, Possession & Advantage */}
        <div className="flex items-center justify-between gap-4">
          <span
            className="font-projector text-[24px] font-black uppercase tracking-widest"
            style={{ color: teamA.color }}
          >
            EQUIPO LOCAL
          </span>

          <div className="flex items-center gap-3">
            {hudToggles.showPossession && teamA.hasPossession && (
              <span className="flex items-center gap-2 rounded-xl bg-[#FFC53D] px-4 py-1.5 font-projector text-[22px] font-black uppercase tracking-wider text-slate-950 shadow-lg animate-pulse">
                <Flame className="h-5 w-5" />
                SAQUE
              </span>
            )}
            {teamA.advantage && (
              <span className="rounded-xl border-2 border-[#FFC53D] bg-[#FFC53D]/20 px-4 py-1.5 font-projector text-[22px] font-black uppercase text-[#FFC53D]">
                VENTAJA
              </span>
            )}
          </div>
        </div>

        {/* Team Name: 76px */}
        <h2
          className="font-projector-title mt-4 truncate text-[76px] leading-tight text-white drop-shadow-md"
          title={teamA.name}
        >
          {teamA.name}
        </h2>

        {/* Score: Giant 360-400px Display */}
        <div className="my-auto flex items-center justify-center py-4">
          {hudToggles.showScores ? (
            <AnimatedScore
              score={teamA.score}
              className="font-projector tabular-numbers text-[360px] font-black leading-none tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <div className="flex items-center gap-4 rounded-3xl border-2 border-white/20 bg-black/60 px-10 py-8">
              <EyeOff className="h-16 w-16 text-[#FFC53D] animate-pulse" />
              <span className="font-projector text-[48px] font-black tracking-widest text-white">
                PUNTOS OCULTOS
              </span>
            </div>
          )}
        </div>

        {/* Bottom Stats: Sets as circles + Fouls */}
        <div className="flex items-center justify-between border-t-2 border-[#2A2D5C] pt-6">
          {/* Sets Won as Filled Circles */}
          <div className="flex items-center gap-4">
            <span className="font-projector text-[24px] font-bold uppercase tracking-wider text-[#B8BCE6]">
              SETS:
            </span>
            <div className="flex items-center gap-2.5">
              {Array.from({ length: totalSetsNeeded }).map((_, i) => (
                <div
                  key={i}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    i < teamA.setsWon
                      ? 'border-emerald-400 bg-emerald-400 shadow-[0_0_12px_#34d399]'
                      : 'border-[#2A2D5C] bg-[#0A0B1E]'
                  }`}
                />
              ))}
            </div>
            <span className="font-projector text-[32px] font-black text-white ml-2">
              ({teamA.setsWon})
            </span>
          </div>

          {/* Fouls */}
          {hudToggles.showFouls && (
            <div className="flex items-center gap-3">
              <span className="font-projector text-[22px] font-bold uppercase tracking-wider text-[#B8BCE6]">
                FALTAS:
              </span>
              <span className="font-projector text-[40px] font-black text-[#EF4444] tabular-numbers">
                {teamA.fouls}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* VS DIVIDER */}
      <div className="col-span-1 flex flex-col items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-[#2A2D5C] bg-[#15173A] shadow-2xl">
          <span className="font-projector text-[36px] font-black tracking-wider text-[#FFC53D]">
            VS
          </span>
        </div>
      </div>

      {/* TEAM B CARD (Visitante) */}
      <div
        className={`relative col-span-5 flex flex-col justify-between overflow-hidden rounded-[36px] border-4 p-10 backdrop-blur-2xl shadow-2xl transition-all duration-300 ${
          teamB.id === turn.activeTeamId
            ? 'border-[#FFC53D] bg-[#15173A] ring-8 ring-[#FFC53D]/40 shadow-[0_0_50px_rgba(255,197,61,0.4)]'
            : 'border-[#2A2D5C] bg-[#15173A]/90'
        }`}
      >
        {/* Top 12px Bar with Team Color */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: '12px', backgroundColor: teamB.color }}
        />

        {/* Header: Label, Possession & Advantage */}
        <div className="flex items-center justify-between gap-4">
          <span
            className="font-projector text-[24px] font-black uppercase tracking-widest"
            style={{ color: teamB.color }}
          >
            EQUIPO VISITANTE
          </span>

          <div className="flex items-center gap-3">
            {hudToggles.showPossession && teamB.hasPossession && (
              <span className="flex items-center gap-2 rounded-xl bg-[#FFC53D] px-4 py-1.5 font-projector text-[22px] font-black uppercase tracking-wider text-slate-950 shadow-lg animate-pulse">
                <Flame className="h-5 w-5" />
                SAQUE
              </span>
            )}
            {teamB.advantage && (
              <span className="rounded-xl border-2 border-[#FFC53D] bg-[#FFC53D]/20 px-4 py-1.5 font-projector text-[22px] font-black uppercase text-[#FFC53D]">
                VENTAJA
              </span>
            )}
          </div>
        </div>

        {/* Team Name: 76px */}
        <h2
          className="font-projector-title mt-4 truncate text-[76px] leading-tight text-white drop-shadow-md"
          title={teamB.name}
        >
          {teamB.name}
        </h2>

        {/* Score: Giant 360-400px Display */}
        <div className="my-auto flex items-center justify-center py-4">
          {hudToggles.showScores ? (
            <AnimatedScore
              score={teamB.score}
              className="font-projector tabular-numbers text-[360px] font-black leading-none tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <div className="flex items-center gap-4 rounded-3xl border-2 border-white/20 bg-black/60 px-10 py-8">
              <EyeOff className="h-16 w-16 text-[#FFC53D] animate-pulse" />
              <span className="font-projector text-[48px] font-black tracking-widest text-white">
                PUNTOS OCULTOS
              </span>
            </div>
          )}
        </div>

        {/* Bottom Stats: Sets as circles + Fouls */}
        <div className="flex items-center justify-between border-t-2 border-[#2A2D5C] pt-6">
          {/* Sets Won as Filled Circles */}
          <div className="flex items-center gap-4">
            <span className="font-projector text-[24px] font-bold uppercase tracking-wider text-[#B8BCE6]">
              SETS:
            </span>
            <div className="flex items-center gap-2.5">
              {Array.from({ length: totalSetsNeeded }).map((_, i) => (
                <div
                  key={i}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${
                    i < teamB.setsWon
                      ? 'border-emerald-400 bg-emerald-400 shadow-[0_0_12px_#34d399]'
                      : 'border-[#2A2D5C] bg-[#0A0B1E]'
                  }`}
                />
              ))}
            </div>
            <span className="font-projector text-[32px] font-black text-white ml-2">
              ({teamB.setsWon})
            </span>
          </div>

          {/* Fouls */}
          {hudToggles.showFouls && (
            <div className="flex items-center gap-3">
              <span className="font-projector text-[22px] font-bold uppercase tracking-wider text-[#B8BCE6]">
                FALTAS:
              </span>
              <span className="font-projector text-[40px] font-black text-[#EF4444] tabular-numbers">
                {teamB.fouls}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * Full Leaderboard View (150px rows, 54px names, 92px total score)
 * ------------------------------------------------------------- */
const FullLeaderboardDisplay: React.FC<{ state: MasterLiveState }> = ({ state }) => {
  const { teams, hudToggles, turn, scoreboard } = state;
  const ranked = rankStudioTeams(teams, true);

  return (
    <div className="flex w-full flex-col gap-4 select-none">
      {ranked.map((team, index) => {
        const isLeader = index === 0;
        const isTurn = team.id === turn.activeTeamId;

        return (
          <div
            key={team.id}
            className={`relative flex h-[150px] items-center justify-between overflow-hidden rounded-3xl border-4 px-8 backdrop-blur-2xl transition-all duration-300 ${
              isLeader
                ? 'border-[#FFC53D] bg-[#1A1838] shadow-[0_0_40px_rgba(255,197,61,0.4)]'
                : isTurn
                ? 'border-cyan-400 bg-[#15173A] shadow-xl'
                : 'border-[#2A2D5C] bg-[#15173A]/90'
            }`}
          >
            {/* Team Color Vertical Bar */}
            <div
              className="absolute left-0 top-0 bottom-0"
              style={{ width: '16px', backgroundColor: team.color }}
            />

            {/* Left Section: Rank Badge + Name */}
            <div className="flex items-center gap-6 min-w-0 pl-4">
              {/* Rank Pill */}
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-projector text-[40px] font-black shadow-lg ${
                  team.medal === 'gold'
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950'
                    : team.medal === 'silver'
                    ? 'bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950'
                    : team.medal === 'bronze'
                    ? 'bg-gradient-to-tr from-amber-800 to-amber-600 text-white'
                    : 'bg-[#2A2D5C] text-[#B8BCE6]'
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

              {/* Team Name: 54px */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-4">
                  <h3
                    className="font-projector-title truncate text-[54px] leading-tight text-white"
                    title={team.name}
                  >
                    {team.name}
                  </h3>
                  {isLeader && (
                    <span className="rounded-xl bg-[#FFC53D] px-3.5 py-1 font-projector text-[20px] font-black uppercase text-slate-950">
                      LÍDER
                    </span>
                  )}
                  {isTurn && (
                    <span className="flex items-center gap-1 rounded-xl bg-cyan-400 px-3.5 py-1 font-projector text-[20px] font-black uppercase text-slate-950 animate-pulse">
                      <Flame className="h-4 w-4" /> EN TURNO
                    </span>
                  )}
                </div>
                <span className="font-projector text-[22px] font-semibold text-[#B8BCE6]">
                  Puesto {team.rank} {team.isTied && '(Empate técnico)'}
                </span>
              </div>
            </div>

            {/* Right Section: Round Breakdown + Total Score 92px */}
            <div className="flex items-center gap-10 shrink-0">
              {/* Previous Rounds history pills */}
              {scoreboard.roundHistory.length > 0 && (
                <div className="flex items-center gap-3">
                  {scoreboard.roundHistory.map((rh, rhIdx) => (
                    <div
                      key={rhIdx}
                      className="flex flex-col items-center rounded-2xl border border-[#2A2D5C] bg-[#0A0B1E]/80 px-4 py-2"
                    >
                      <span className="font-projector text-[18px] font-bold uppercase text-[#B8BCE6]">
                        {rh.label}
                      </span>
                      <span className="font-projector text-[28px] font-black text-white">
                        {rh.scores[team.id] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Score: 92px */}
              <div className="flex flex-col items-end border-l-2 border-[#2A2D5C] pl-8">
                <span className="font-projector text-[20px] font-bold uppercase tracking-wider text-[#B8BCE6]">
                  PUNTAJE TOTAL
                </span>
                {hudToggles.showScores ? (
                  <div className="flex items-baseline gap-2">
                    <AnimatedScore
                      score={team.score}
                      className="font-projector tabular-numbers text-[92px] font-black leading-none text-white drop-shadow-md"
                    />
                    <span className="font-projector text-[28px] font-black text-[#FFC53D]">PTS</span>
                  </div>
                ) : (
                  <span className="font-projector text-[48px] font-black text-slate-500">---</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

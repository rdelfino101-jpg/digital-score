import React from 'react';
import { MasterLiveState } from '../../types/masterStudio';
import { AlertOctagon, Zap } from 'lucide-react';
import { ProjectorHeader } from './common/ProjectorHeader';
import { ProjectorClock } from './common/ProjectorClock';
import { TimerBar } from './common/TimerBar';
import { TurnPill } from './common/TurnPill';
import { TeamBand } from './common/TeamBand';
import { ScaleToFit } from './common/ScaleToFit';

import { BibleBookArena } from './games/BibleBookArena';
import { WhoSaidItArena } from './games/WhoSaidItArena';
import { HangmanArena } from './games/HangmanArena';
import { CharadesArena } from './games/CharadesArena';
import { FamilyFeudArena } from './games/FamilyFeudArena';
import { TriviaShowArena } from './games/TriviaShowArena';
import { AnagramWheelArena } from './games/AnagramWheelArena';
import { MusicKaraokeArena } from './games/MusicKaraokeArena';
import { MillionaireArena } from './games/MillionaireArena';
import { DealOrNoDealArena } from './games/DealOrNoDealArena';

interface GameStageDisplayProps {
  state: MasterLiveState;
}

export const GameStageDisplay: React.FC<GameStageDisplayProps> = ({ state }) => {
  const { teams, turn, gameStage, timer, hudToggles, buzzer } = state;
  const { activeGameId } = gameStage;
  const activeTeam = teams.find((t) => t.id === turn.activeTeamId);
  const isLargeTeamCount = teams.length >= 5;
  const isSingleTeamGame = activeGameId === 'millionaire_show' || activeGameId === 'deal_or_nodeal';

  const isTimerWarning = timer.mode === 'countdown' && timer.secondsRemaining <= 10 && timer.secondsRemaining > 0;
  const isTimerFinished = timer.mode === 'countdown' && timer.secondsRemaining === 0 && !timer.isRunning;

  // Header Right Slot: TurnPill + Steal badge + ProjectorClock + Buzzer Open Badge + Single Team Chip
  const headerRightSlot = (
    <div className="flex items-center gap-4">
      {buzzer?.status === 'open' && (
        <span className="flex items-center gap-2 rounded-2xl bg-[var(--p-accent)] px-5 py-2 font-projector text-[22px] font-black uppercase tracking-wider text-[var(--p-on-accent)] shadow-md border-2 border-[var(--p-line-strong)] animate-pulse">
          <Zap className="h-6 w-6 fill-current animate-bounce" />
          PULSADORES ABIERTOS
        </span>
      )}
      {turn.stealMode && (
        <span className="flex items-center gap-2 rounded-2xl bg-[var(--p-err)] px-5 py-2 font-projector text-[22px] font-black uppercase tracking-wider text-[var(--p-err-bg)] shadow-md animate-pulse">
          <AlertOctagon className="h-6 w-6" />
          ¡ROBO DE PUNTOS!
        </span>
      )}
      {isSingleTeamGame && activeTeam ? (
        <div
          className="flex items-center gap-3 rounded-2xl bg-[var(--p-panel)] border-2 border-[var(--p-accent-ink)] px-5 py-2 font-projector text-[22px] font-black text-[var(--p-text)] shadow-sm"
          style={{ borderLeftColor: activeTeam.color, borderLeftWidth: '8px' }}
        >
          <span>Juega: {activeTeam.name}</span>
          <span className="text-[var(--p-text-3)]">·</span>
          <span className="text-[var(--p-accent-ink)] tabular-numbers">{activeTeam.score} pts</span>
        </div>
      ) : (
        activeTeam && (
          <TurnPill
            teamName={activeTeam.name}
            teamColor={activeTeam.color}
            label="En Turno"
          />
        )
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
    <div className="flex h-full w-full flex-col justify-between select-none animate-projector-wipe">
      {/* 1. PROJECTOR HEADER */}
      <ProjectorHeader
        kicker="Game Show Studio"
        title={getGameNameLabel(activeGameId)}
        rightSlot={headerRightSlot}
      />

      {/* 2. TIMER BAR */}
      {hudToggles.showTimer && timer.mode === 'countdown' && timer.initialSeconds > 0 && (
        <div className="pt-3">
          <TimerBar
            currentSeconds={timer.secondsRemaining}
            totalSeconds={timer.initialSeconds}
            isUrgent={isTimerWarning}
          />
        </div>
      )}

      {/* 3. MAIN ARENA LAYOUT */}
      <div className={`my-auto flex flex-1 min-h-0 items-center justify-center py-3 w-full ${!isSingleTeamGame && isLargeTeamCount ? 'gap-8' : 'flex-col'}`}>
        <ScaleToFit className="relative z-10 w-full">
          <main className="flex flex-1 min-h-0 items-stretch justify-center w-full min-w-0">
            {activeGameId === 'bible_book' && gameStage?.bibleBook && <BibleBookArena stage={gameStage.bibleBook} />}
            {activeGameId === 'who_said_it' && gameStage?.whoSaidIt && <WhoSaidItArena stage={gameStage.whoSaidIt} />}
            {activeGameId === 'hangman' && gameStage?.hangman && <HangmanArena stage={gameStage.hangman} />}
            {activeGameId === 'charades' && gameStage?.charades && <CharadesArena stage={gameStage.charades} />}
            {activeGameId === 'family_feud' && gameStage?.familyFeud && <FamilyFeudArena stage={gameStage.familyFeud} />}
            {activeGameId === 'trivia_show' && gameStage?.triviaShow && <TriviaShowArena stage={gameStage.triviaShow} />}
            {activeGameId === 'anagram_wheel' && gameStage?.anagramWheel && <AnagramWheelArena stage={gameStage.anagramWheel} />}
            {activeGameId === 'music_karaoke' && gameStage?.musicKaraoke && <MusicKaraokeArena stage={gameStage.musicKaraoke} />}
            {activeGameId === 'millionaire_show' && gameStage?.millionaireShow && <MillionaireArena stage={gameStage.millionaireShow} />}
            {activeGameId === 'deal_or_nodeal' && gameStage?.dealOrNoDeal && <DealOrNoDealArena stage={gameStage.dealOrNoDeal} />}
          </main>
        </ScaleToFit>

        {!isSingleTeamGame && isLargeTeamCount && (
          <TeamBand
            teams={teams}
            activeTeamId={turn.activeTeamId}
            showScores={hudToggles.showScores}
          />
        )}
      </div>

      {/* 4. BOTTOM TEAM BAND FOR 2-4 TEAMS (Suppressed in single-team games) */}
      {!isSingleTeamGame && !isLargeTeamCount && (
        <TeamBand
          teams={teams}
          activeTeamId={turn.activeTeamId}
          showScores={hudToggles.showScores}
        />
      )}
    </div>
  );
};

function getGameNameLabel(id: string): string {
  switch (id) {
    case 'bible_book':
      return '¿En qué libro está?';
    case 'who_said_it':
      return '¿Quién lo dijo?';
    case 'hangman':
      return 'Adivina la Palabra (Ahorcado)';
    case 'charades':
      return 'Charadas en Vivo';
    case 'family_feud':
      return '100 Personas Dijeron';
    case 'trivia_show':
      return 'Trivia Show';
    case 'anagram_wheel':
      return 'Palabra Desordenada & Ruleta';
    case 'music_karaoke':
      return 'Música & Karaoke Show';
    case 'millionaire_show':
      return '¿Quién Quiere Ser Millonario?';
    case 'deal_or_nodeal':
      return 'Trato Hecho (Deal or No Deal)';
    default:
      return 'Game Show Studio';
  }
}

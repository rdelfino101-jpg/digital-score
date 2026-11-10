import React from 'react';
import { MasterLiveState } from '../../types/masterStudio';
import { AlertOctagon, Zap } from 'lucide-react';
import { ProjectorHeader } from './common/ProjectorHeader';
import { ProjectorClock } from './common/ProjectorClock';
import { TimerBar } from './common/TimerBar';
import { TurnPill } from './common/TurnPill';
import { TeamBand } from './common/TeamBand';

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

  const isTimerWarning = timer.mode === 'countdown' && timer.secondsRemaining <= 10 && timer.secondsRemaining > 0;
  const isTimerFinished = timer.mode === 'countdown' && timer.secondsRemaining === 0 && !timer.isRunning;

  // Header Right Slot: TurnPill + Steal badge + ProjectorClock + Buzzer Open Badge
  const headerRightSlot = (
    <div className="flex items-center gap-4">
      {buzzer?.status === 'open' && (
        <span className="flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2 font-projector text-[22px] font-black uppercase tracking-wider text-slate-950 shadow-xl border-2 border-yellow-200 animate-pulse">
          <Zap className="h-6 w-6 fill-current text-slate-950 animate-bounce" />
          PULSADORES ABIERTOS
        </span>
      )}
      {turn.stealMode && (
        <span className="flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-2 font-projector text-[22px] font-black uppercase tracking-wider text-white shadow-xl animate-pulse">
          <AlertOctagon className="h-6 w-6" />
          ¡ROBO DE PUNTOS!
        </span>
      )}
      {activeTeam && (
        <TurnPill
          teamName={activeTeam.name}
          teamColor={activeTeam.color}
          label="En Turno"
        />
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
      {/* 1. PROJECTOR HEADER (Kicker 24px, Title 58px, Right slot) */}
      <ProjectorHeader
        kicker="Game Show Studio"
        title={getGameNameLabel(activeGameId)}
        rightSlot={headerRightSlot}
      />

      {/* 2. TIMER BAR (14px gold fill emptying over time if countdown is active) */}
      {hudToggles.showTimer && timer.mode === 'countdown' && timer.initialSeconds > 0 && (
        <div className="pt-3">
          <TimerBar
            currentSeconds={timer.secondsRemaining}
            totalSeconds={timer.initialSeconds}
            isUrgent={isTimerWarning}
          />
        </div>
      )}

      {/* 3. MAIN ARENA LAYOUT:
          - If 5-10 teams: Horizontal layout (Main Arena flex-1 + TeamBand 600px column on the right)
          - If 2-4 teams: Vertical layout (Main Arena flex-1 + TeamBand bottom horizontal band)
      */}
      <div className={`my-auto flex flex-1 min-h-0 items-center justify-center py-3 w-full ${isLargeTeamCount ? 'gap-8' : 'flex-col'}`}>
        <main className="relative z-10 flex flex-1 min-h-0 items-stretch justify-center w-full min-w-0">
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

        {isLargeTeamCount && (
          <TeamBand
            teams={teams}
            activeTeamId={turn.activeTeamId}
            showScores={hudToggles.showScores}
          />
        )}
      </div>

      {/* 4. BOTTOM TEAM BAND FOR 2-4 TEAMS */}
      {!isLargeTeamCount && (
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

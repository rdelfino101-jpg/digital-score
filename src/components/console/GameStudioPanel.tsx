import React from 'react';
import {
  ActiveGameId,
  MasterLiveState,
  MasterViewMode,
} from '../../types/masterStudio';
import { BibleBookController } from './games/BibleBookController';
import { WhoSaidItController } from './games/WhoSaidItController';
import { HangmanController } from './games/HangmanController';
import { CharadesController } from './games/CharadesController';
import { FamilyFeudController } from './games/FamilyFeudController';
import { TriviaShowController } from './games/TriviaShowController';
import { AnagramWheelController } from './games/AnagramWheelController';
import { MusicKaraokeController } from './games/MusicKaraokeController';
import { MillionaireController } from './games/MillionaireController';
import { DealOrNoDealController } from './games/DealOrNoDealController';
import {
  BookOpen,
  MessageSquareQuote,
  Keyboard,
  Hourglass,
  Users2,
  HelpCircle,
  Dices,
  Music,
  Tv,
  Sparkles,
  Trophy,
  Briefcase,
  Zap,
} from 'lucide-react';

interface GameStudioPanelProps {
  state: MasterLiveState;
  onUpdateState: (updater: (prev: MasterLiveState) => MasterLiveState) => void;
  onSetViewMode: (mode: MasterViewMode) => void;
  onAwardActiveTeam: (points: number, actionName: string) => void;
  onTriggerError: () => void;
  onNextTurn: () => void;
}

export const GameStudioPanel: React.FC<GameStudioPanelProps> = ({
  state,
  onUpdateState,
  onSetViewMode,
  onAwardActiveTeam,
  onTriggerError,
  onNextTurn,
}) => {
  const activeGameId = state.gameStage.activeGameId;

  const handleSelectGame = (id: ActiveGameId) => {
    onUpdateState((prev) => ({
      ...prev,
      gameStage: {
        ...prev.gameStage,
        activeGameId: id,
      },
    }));
  };

  const gameTabs: Array<{
    id: ActiveGameId;
    title: string;
    badge: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    accent: string;
  }> = [
    {
      id: 'bible_book',
      title: '¿En qué libro está?',
      badge: 'Biblia',
      icon: BookOpen,
      accent: 'border-amber-500 text-amber-400',
    },
    {
      id: 'who_said_it',
      title: '¿Quién lo dijo?',
      badge: 'Citas',
      icon: MessageSquareQuote,
      accent: 'border-blue-500 text-blue-400',
    },
    {
      id: 'hangman',
      title: 'Ahorcado Pro',
      badge: 'Letras',
      icon: Keyboard,
      accent: 'border-red-500 text-red-400',
    },
    {
      id: 'charades',
      title: 'Charadas Reloj',
      badge: 'Actuación',
      icon: Hourglass,
      accent: 'border-purple-500 text-purple-400',
    },
    {
      id: 'family_feud',
      title: '100 Dijeron',
      badge: 'Popular',
      icon: Users2,
      accent: 'border-cyan-500 text-cyan-400',
    },
    {
      id: 'trivia_show',
      title: 'Trivia Show 50:50',
      badge: 'Opciones',
      icon: HelpCircle,
      accent: 'border-emerald-500 text-emerald-400',
    },
    {
      id: 'anagram_wheel',
      title: 'Anagrama & Ruleta',
      badge: 'Retos',
      icon: Dices,
      accent: 'border-pink-500 text-pink-400',
    },
    {
      id: 'music_karaoke',
      title: 'Música & Karaoke',
      badge: '3 en 1',
      icon: Music,
      accent: 'border-rose-500 text-rose-400',
    },
    {
      id: 'millionaire_show',
      title: 'Millonario',
      badge: 'TV Show',
      icon: Trophy,
      accent: 'border-amber-400 text-amber-400',
    },
    {
      id: 'deal_or_nodeal',
      title: 'Trato Hecho',
      badge: 'Banca',
      icon: Briefcase,
      accent: 'border-emerald-400 text-emerald-400',
    },
  ];

  const isGameStageLive = state.viewMode === 'GAME_STAGE';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#080d1a]">
      {/* Game Selection Header with Live Stage Indicator */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs uppercase font-extrabold tracking-wider text-white">
            Game Show Studio (10 Dinámicas Interactivas)
          </h2>
        </div>

        {/* Live scene switcher button and Buzzer mode toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              onUpdateState((prev) => {
                const currentUse = prev.buzzer?.config?.useBuzzersInGameStage ?? false;
                return {
                  ...prev,
                  buzzer: prev.buzzer
                    ? {
                        ...prev.buzzer,
                        config: {
                          ...prev.buzzer.config,
                          useBuzzersInGameStage: !currentUse,
                        },
                      }
                    : prev.buzzer,
                };
              });
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
              state.buzzer?.config?.useBuzzersInGameStage
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Cuando está activado, el equipo que gana el pulsador toma automáticamente el turno del juego"
          >
            <Zap className={`w-3.5 h-3.5 ${state.buzzer?.config?.useBuzzersInGameStage ? 'fill-current text-amber-400' : ''}`} />
            <span>Pulsadores: {state.buzzer?.config?.useBuzzersInGameStage ? 'ACTIVADOS' : 'Desactivados'}</span>
          </button>

          {isGameStageLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>JUEGOS AL AIRE EN PANTALLA</span>
            </div>
          ) : (
            <button
              onClick={() => onSetViewMode('GAME_STAGE')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all hover:scale-102"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Poner Escenario de Juegos AL AIRE</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Navigation for 10 Games - 5x2 desktop grid with high-contrast icons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b border-slate-800 bg-slate-950/80 p-2.5 shrink-0">
        {gameTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = tab.id === activeGameId;
          const iconColor = tab.accent.split(' ')[1]; // semantic accent color

          return (
            <button
              key={tab.id}
              onClick={() => handleSelectGame(tab.id)}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                isSelected
                  ? 'bg-slate-800 text-white border-blue-500 shadow-md shadow-blue-500/25 ring-1 ring-blue-500/50 scale-[1.01]'
                  : 'bg-slate-900/70 text-slate-200 border-slate-800 hover:bg-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} strokeWidth={2.2} />
                <span className="truncate">{tab.title}</span>
              </div>
              <span
                className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black tracking-wider shrink-0 ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Game Controller Workspace */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {activeGameId === 'bible_book' && (
          <BibleBookController
            state={state}
            onUpdateState={onUpdateState}
            onAwardActiveTeam={onAwardActiveTeam}
            onTriggerError={onTriggerError}
          />
        )}

        {activeGameId === 'who_said_it' && (
          <WhoSaidItController
            state={state}
            onUpdateState={onUpdateState}
            onAwardActiveTeam={onAwardActiveTeam}
            onTriggerError={onTriggerError}
          />
        )}

        {activeGameId === 'hangman' && (
          <HangmanController
            state={state}
            onUpdateState={onUpdateState}
            onAwardActiveTeam={onAwardActiveTeam}
            onTriggerError={onTriggerError}
          />
        )}

        {activeGameId === 'charades' && (
          <CharadesController
            state={state}
            onUpdateState={onUpdateState}
            onAwardActiveTeam={onAwardActiveTeam}
            onNextTurn={onNextTurn}
          />
        )}

        {activeGameId === 'family_feud' && (
          <FamilyFeudController
            state={state}
            onUpdateState={onUpdateState}
            onAwardActiveTeam={onAwardActiveTeam}
            onNextTurn={onNextTurn}
          />
        )}

        {activeGameId === 'trivia_show' && (
          <TriviaShowController
            state={state}
            onUpdateState={onUpdateState}
            onAwardActiveTeam={onAwardActiveTeam}
            onTriggerError={onTriggerError}
          />
        )}

        {activeGameId === 'anagram_wheel' && (
          <AnagramWheelController
            state={state}
            onUpdateState={onUpdateState}
            onAwardActiveTeam={onAwardActiveTeam}
          />
        )}

        {activeGameId === 'music_karaoke' && (
          <MusicKaraokeController
            state={state}
            onUpdateState={onUpdateState}
            onAwardActiveTeam={onAwardActiveTeam}
            onTriggerError={onTriggerError}
          />
        )}

        {activeGameId === 'millionaire_show' && (
          <MillionaireController
            state={state}
            onUpdateState={onUpdateState}
            onAwardActiveTeam={onAwardActiveTeam}
            onTriggerError={onTriggerError}
          />
        )}

        {activeGameId === 'deal_or_nodeal' && (
          <DealOrNoDealController
            state={state}
            onUpdateState={onUpdateState}
            onAwardActiveTeam={onAwardActiveTeam}
            onTriggerError={onTriggerError}
          />
        )}
      </div>
    </div>
  );
};

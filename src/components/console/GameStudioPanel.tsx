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
    <div className="@container flex-1 flex flex-col min-w-0 bg-[var(--c-bg)]">
      {/* Encabezado del módulo */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--c-line)] px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold text-[var(--c-text)]">Juegos</h1>
          <p className="truncate text-[13px] text-[var(--c-text-3)]">
            {gameTabs.find((g) => g.id === activeGameId)?.title || 'Elige una dinámica'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            role="switch"
            aria-checked={Boolean(state.buzzer?.config?.useBuzzersInGameStage)}
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
            className="flex items-center gap-2 rounded-lg border border-[var(--c-line)] bg-[var(--c-panel)] px-3 py-2 text-[13px] font-semibold text-[var(--c-text-2)] transition-colors hover:text-[var(--c-text)]"
            title="El equipo que gana el pulsador toma el turno del juego"
          >
            <Zap className="h-4 w-4" />
            Usar pulsadores
            <span
              className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors ${
                state.buzzer?.config?.useBuzzersInGameStage ? 'bg-[var(--c-accent)]' : 'bg-[var(--c-line-strong)]'
              }`}
              aria-hidden
            >
              <span
                className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all ${
                  state.buzzer?.config?.useBuzzersInGameStage ? 'left-[16px]' : 'left-[2px]'
                }`}
              />
            </span>
          </button>

          {isGameStageLive ? (
            <span className="flex items-center gap-2 rounded-lg border border-red-500/60 bg-red-500/10 px-3.5 py-2 text-[13px] font-bold text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
              Al aire
            </span>
          ) : (
            <button
              onClick={() => onSetViewMode('GAME_STAGE')}
              className="flex items-center gap-2 rounded-lg bg-[var(--c-accent)] px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-blue-500"
            >
              <Tv className="h-4 w-4" />
              Poner al aire
            </button>
          )}
        </div>
      </div>

      {/* Selector de dinámica: nombres completos, sin cortes */}
      <div className="grid shrink-0 grid-cols-2 gap-1.5 border-b border-[var(--c-line)] p-2.5 @2xl:grid-cols-3 @4xl:grid-cols-5">
        {gameTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = tab.id === activeGameId;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectGame(tab.id)}
              aria-pressed={isSelected}
              className={`flex min-w-0 items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                isSelected
                  ? 'border-[var(--c-accent)] bg-[var(--c-accent-soft)]'
                  : 'border-[var(--c-line)] bg-[var(--c-panel)] hover:border-[var(--c-line-strong)]'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-[var(--c-accent)]' : 'text-[var(--c-text-3)]'}`} strokeWidth={2.2} />
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-tight text-[var(--c-text)]">{tab.title}</span>
                <span className="block text-[11px] leading-tight text-[var(--c-text-3)]">{tab.badge}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Game Controller Workspace */}
      <div className="flex-1 overflow-y-auto p-4 xl:p-5">
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

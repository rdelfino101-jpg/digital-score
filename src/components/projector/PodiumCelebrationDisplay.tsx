import React from 'react';
import { MasterLiveState } from '../../types/masterStudio';
import { Trophy, Medal, Award } from 'lucide-react';
import { rankStudioTeams, RankedTeam } from '../../utils/gameEngineRules';
import { AnimatedScore } from './common/AnimatedScore';
import { BrandMark } from './common/BrandMark';
import { FitText } from './common/FitText';
import { useProjectorBrand } from './common/brandContext';

interface PodiumCelebrationDisplayProps {
  state: MasterLiveState;
}

interface PillarConfig {
  team: RankedTeam | undefined;
  placeLabel: string;
  heightPct: string;
  icon: React.ReactNode;
  iconBoxClass: string;
  isFirst: boolean;
  nameMax: number;
  nameMin: number;
  scoreSize: string;
  ptsColorClass: string;
}

export const PodiumCelebrationDisplay: React.FC<PodiumCelebrationDisplayProps> = ({ state }) => {
  const { teams } = state;
  const brand = useProjectorBrand();
  const ranked = rankStudioTeams(teams, true);

  const gold = ranked[0];
  const silver = ranked[1];
  const bronze = ranked[2];

  const pillars: PillarConfig[] = [
    {
      team: silver,
      placeLabel: '2° lugar',
      heightPct: '74%',
      icon: <Medal className="h-12 w-12" />,
      iconBoxClass: 'border-2 border-[var(--p-line-strong)] bg-[var(--p-panel-2)] text-[var(--p-text)]',
      isFirst: false,
      nameMax: 48,
      nameMin: 22,
      scoreSize: 'text-[86px]',
      ptsColorClass: 'text-[var(--p-text-2)]',
    },
    {
      team: gold,
      placeLabel: '1° lugar',
      heightPct: '100%',
      icon: <Trophy className="h-14 w-14" />,
      iconBoxClass: 'border-2 border-[var(--p-accent-ink)] bg-[var(--p-accent)] text-[var(--p-on-accent)] shadow-md',
      isFirst: true,
      nameMax: 58,
      nameMin: 24,
      scoreSize: 'text-[110px]',
      ptsColorClass: 'text-[var(--p-accent-ink)]',
    },
    {
      team: bronze,
      placeLabel: '3° lugar',
      heightPct: '56%',
      icon: <Award className="h-11 w-11" />,
      iconBoxClass: 'border-2 border-[var(--p-line)] bg-[var(--p-panel-2)] text-[var(--p-text-2)]',
      isFirst: false,
      nameMax: 44,
      nameMin: 20,
      scoreSize: 'text-[72px]',
      ptsColorClass: 'text-[var(--p-text-2)]',
    },
  ];

  return (
    <div className="flex h-full w-full min-h-0 flex-col justify-between gap-8 overflow-hidden select-none animate-projector-wipe">
      {/* Top Header: BrandMark + "¡Felicidades, <primer lugar>!" */}
      <header className="flex shrink-0 items-center justify-center gap-6 px-4">
        <BrandMark brand={brand} size={84} />
        <div className="flex min-w-0 max-w-[1360px] flex-col items-start text-left">
          <span className="font-projector text-[24px] font-bold text-[var(--p-text-2)] leading-tight">
            {brand.name} · Podio de campeones
          </span>
          <FitText
            as="h1"
            max={64}
            min={30}
            lines={1}
            className="w-full font-projector-title text-[var(--p-text)]"
            title={gold ? `¡Felicidades, ${gold.name}!` : 'Podio de campeones'}
          >
            {gold ? `¡Felicidades, ${gold.name}!` : 'Podio de campeones'}
          </FitText>
        </div>
      </header>

      {/* Bottom 3-Column Grid aligned to bottom: 2° (74%) — 1° (100%) — 3° (56%) */}
      <div className="grid flex-1 min-h-0 w-full grid-cols-3 items-end gap-8">
        {pillars.map((pillar) => {
          if (!pillar.team) {
            return <div key={pillar.placeLabel} className="h-full" />;
          }

          const { team } = pillar;

          return (
            <div key={team.id} className="flex h-full min-h-0 min-w-0 items-end">
              <div
                className={`relative flex w-full flex-col items-center justify-between overflow-hidden rounded-[36px] bg-[var(--p-panel)] px-8 pt-10 pb-8 shadow-lg ${
                  pillar.isFirst
                    ? 'border-4 border-[var(--p-accent)]'
                    : 'border-2 border-[var(--p-line-strong)]'
                }`}
                style={{
                  height: pillar.heightPct,
                  minHeight: '120px',
                }}
              >
                {/* 12px Top Strip with Team Color */}
                <div
                  className="absolute top-0 left-0 right-0 h-[12px]"
                  style={{ backgroundColor: team.color }}
                />

                {/* Top: Icon + Place Label */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div
                    className={`flex items-center justify-center rounded-3xl ${
                      pillar.isFirst ? 'h-24 w-24' : 'h-20 w-20'
                    } ${pillar.iconBoxClass}`}
                  >
                    {pillar.icon}
                  </div>
                  <span
                    className={`font-projector text-[22px] font-black tracking-wide ${
                      pillar.isFirst ? 'text-[var(--p-accent-ink)]' : 'text-[var(--p-text-2)]'
                    }`}
                  >
                    {pillar.placeLabel}
                  </span>
                </div>

                {/* Middle: Team Name with FitText */}
                <div className="my-auto flex w-full min-w-0 items-center justify-center px-2 py-2">
                  <FitText
                    as={pillar.isFirst ? 'h2' : 'h3'}
                    max={pillar.nameMax}
                    min={pillar.nameMin}
                    lines={2}
                    lineHeight={1.08}
                    className="w-full text-center font-projector-title text-[var(--p-text)]"
                    title={team.name}
                  >
                    {team.name}
                  </FitText>
                </div>

                {/* Bottom: Score */}
                <div className="flex items-baseline justify-center gap-3 shrink-0">
                  <AnimatedScore
                    score={team.score}
                    className={`font-projector tabular-numbers font-black leading-none text-[var(--p-text)] ${pillar.scoreSize}`}
                  />
                  <span className={`font-projector text-[28px] font-black ${pillar.ptsColorClass}`}>
                    PTS
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

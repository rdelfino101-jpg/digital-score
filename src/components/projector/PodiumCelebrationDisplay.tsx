import React from 'react';
import { MasterLiveState } from '../../types/masterStudio';
import { Trophy, Medal, Award, Sparkles, Crown } from 'lucide-react';
import { rankStudioTeams } from '../../utils/gameEngineRules';
import { AnimatedScore } from './common/AnimatedScore';

interface PodiumCelebrationDisplayProps {
  state: MasterLiveState;
}

export const PodiumCelebrationDisplay: React.FC<PodiumCelebrationDisplayProps> = ({ state }) => {
  const { teams } = state;
  const ranked = rankStudioTeams(teams, true);

  const gold = ranked[0];
  const silver = ranked[1];
  const bronze = ranked[2];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between py-6 select-none animate-projector-wipe">
      {/* Top Banner / Celebration Title */}
      <header className="flex flex-col items-center text-center">
        <div className="flex items-center gap-3 rounded-full border-2 border-[#FFC53D] bg-[#15173A] px-8 py-2 text-[24px] font-black uppercase tracking-widest text-[#FFC53D] shadow-[0_0_25px_rgba(255,197,61,0.4)]">
          <Sparkles className="h-6 w-6 animate-spin" />
          <span>GRAN CEREMONIA DE PREMIACIÓN</span>
          <Sparkles className="h-6 w-6 animate-spin" />
        </div>

        <h1 className="font-projector-title mt-4 text-[64px] leading-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          PODIO DE CAMPEONES
        </h1>

        <p className="font-projector text-[28px] font-bold text-[#B8BCE6] mt-1">
          {gold
            ? `¡Felicitaciones a ${gold.name} por la victoria absoluta!`
            : 'Resultados oficiales de la gran final'}
        </p>
      </header>

      {/* 3 Pillars Podium Grid: Left (Silver #2 - 360px), Center (Gold #1 - 500px), Right (Bronze #3 - 260px) */}
      <div className="flex w-full max-w-6xl items-end justify-center gap-10 mt-auto pb-6">
        {/* 2nd Place: Silver (Left, 360px height pillar) */}
        {silver ? (
          <div className="flex flex-1 flex-col items-center">
            {/* Medal & Info above pillar */}
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-slate-300 bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950 shadow-2xl">
              <Medal className="h-12 w-12" />
            </div>

            <h3
              className="font-projector-title truncate text-[36px] text-slate-200 max-w-[280px]"
              title={silver.name}
            >
              {silver.name}
            </h3>

            <div className="mt-1 flex items-baseline gap-2">
              <AnimatedScore
                score={silver.score}
                className="font-projector tabular-numbers text-[58px] font-black text-slate-200"
              />
              <span className="font-projector text-[24px] font-bold text-[#B8BCE6]">PTS</span>
            </div>

            {/* Pillar: 360px */}
            <div
              className="mt-4 flex w-full flex-col items-center justify-center rounded-t-[36px] border-4 border-slate-400 bg-gradient-to-b from-[#1C1F47] via-[#15173A] to-[#0A0B1E] p-6 shadow-2xl"
              style={{ height: '360px' }}
            >
              <span className="font-projector text-[120px] font-black leading-none text-slate-300 drop-shadow">
                #2
              </span>
              <span className="font-projector text-[28px] font-black uppercase tracking-[0.2em] text-slate-300 mt-2">
                SUBCAMPEÓN
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* 1st Place: Gold (Center, 500px height pillar) */}
        {gold ? (
          <div className="flex flex-1 flex-col items-center">
            {/* Crown & Trophy above pillar */}
            <div className="relative mb-4 flex h-28 w-28 items-center justify-center rounded-[32px] border-4 border-[#FFC53D] bg-gradient-to-tr from-amber-500 via-[#FFC53D] to-yellow-200 text-slate-950 shadow-[0_0_50px_rgba(255,197,61,0.6)]">
              <Crown className="absolute -top-10 text-[#FFC53D] h-12 w-12 animate-pulse" />
              <Trophy className="h-16 w-16" />
            </div>

            <h2
              className="font-projector-title truncate text-[48px] text-[#FFC53D] max-w-[340px] drop-shadow-lg"
              title={gold.name}
            >
              {gold.name}
            </h2>

            <div className="mt-1 flex items-baseline gap-2">
              <AnimatedScore
                score={gold.score}
                className="font-projector tabular-numbers text-[76px] font-black text-white drop-shadow"
              />
              <span className="font-projector text-[30px] font-black text-[#FFC53D]">PTS</span>
            </div>

            {/* Pillar: 500px */}
            <div
              className="mt-4 flex w-full flex-col items-center justify-center rounded-t-[40px] border-4 border-[#FFC53D] bg-gradient-to-b from-amber-950/90 via-[#15173A] to-[#0A0B1E] p-8 shadow-[0_0_60px_rgba(255,197,61,0.3)] ring-4 ring-[#FFC53D]/30"
              style={{ height: '500px' }}
            >
              <span className="font-projector text-[160px] font-black leading-none text-[#FFC53D] drop-shadow-2xl">
                #1
              </span>
              <span className="font-projector text-[36px] font-black uppercase tracking-[0.2em] text-[#FFC53D] mt-3">
                ¡GRAN CAMPEÓN!
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* 3rd Place: Bronze (Right, 260px height pillar) */}
        {bronze ? (
          <div className="flex flex-1 flex-col items-center">
            {/* Medal & Info above pillar */}
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-amber-700 bg-gradient-to-tr from-amber-800 to-amber-600 text-white shadow-2xl">
              <Award className="h-12 w-12" />
            </div>

            <h3
              className="font-projector-title truncate text-[36px] text-amber-200 max-w-[280px]"
              title={bronze.name}
            >
              {bronze.name}
            </h3>

            <div className="mt-1 flex items-baseline gap-2">
              <AnimatedScore
                score={bronze.score}
                className="font-projector tabular-numbers text-[58px] font-black text-amber-200"
              />
              <span className="font-projector text-[24px] font-bold text-[#B8BCE6]">PTS</span>
            </div>

            {/* Pillar: 260px */}
            <div
              className="mt-4 flex w-full flex-col items-center justify-center rounded-t-[36px] border-4 border-amber-700 bg-gradient-to-b from-[#1C1F47] via-[#15173A] to-[#0A0B1E] p-6 shadow-2xl"
              style={{ height: '260px' }}
            >
              <span className="font-projector text-[100px] font-black leading-none text-amber-600 drop-shadow">
                #3
              </span>
              <span className="font-projector text-[28px] font-black uppercase tracking-[0.2em] text-amber-400 mt-2">
                TERCER LUGAR
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
};

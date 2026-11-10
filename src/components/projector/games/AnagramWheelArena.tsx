import React from 'react';
import { AnagramWheelGameState, WheelReward } from '../../../types/masterStudio';
import { Shuffle, Sparkles, Trophy, AlertOctagon, HelpCircle } from 'lucide-react';

interface AnagramWheelArenaProps {
  stage: AnagramWheelGameState;
}

const DEFAULT_REWARDS: WheelReward[] = [
  { id: '1', label: '+100 PTS', type: 'points_bonus', value: 100, color: '#4ADE80' },
  { id: '2', label: 'PIERDE TURNO', type: 'lose_turn', color: '#EF4444' },
  { id: '3', label: '¡DOBLE PTS!', type: 'double_points', color: '#FFC53D' },
  { id: '4', label: '+200 PTS', type: 'points_bonus', value: 200, color: '#38BDF8' },
  { id: '5', label: 'RETO FÍSICO', type: 'physical_challenge', color: '#A855F7' },
  { id: '6', label: '-50 PTS', type: 'points_penalty', value: 50, color: '#F97316' },
  { id: '7', label: '+150 PTS', type: 'points_bonus', value: 150, color: '#34D399' },
  { id: '8', label: 'ROBA PUNTOS', type: 'points_bonus', value: 100, color: '#EC4899' },
];

export const AnagramWheelArena: React.FC<AnagramWheelArenaProps> = ({ stage }) => {
  const items = stage?.items || [];
  const currentIndex = stage?.currentIndex ?? 0;
  const item = items[currentIndex];
  const rewards = stage?.rewards && stage.rewards.length > 0 ? stage.rewards : DEFAULT_REWARDS;

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Shuffle className="w-24 h-24 text-[#FFC53D] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-white mb-3">RULETA DE ANAGRAMAS</h2>
        <p className="font-projector text-[28px] font-bold text-[#B8BCE6] uppercase tracking-wider">COMPETICIÓN EN VIVO</p>
      </div>
    );
  }

  // Scrambled letters array
  const scrambledChars = (item.scrambledWord || item.originalWord)
    .toUpperCase()
    .split('')
    .filter((c) => c !== ' ');

  const originalChars = item.originalWord.toUpperCase().split('');

  // SVG Wheel geometry
  const wheelSize = 380;
  const cx = wheelSize / 2;
  const cy = wheelSize / 2;
  const radius = wheelSize / 2 - 10;
  const sliceAngle = (2 * Math.PI) / rewards.length;

  return (
    <div className="flex h-full gap-8">
      {/* Left Column: Anagram Tiles, Hint & Solution */}
      <div className="flex-1 flex flex-col justify-between h-full gap-5">
        {/* Top bar: Category and Points */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-5 py-2 rounded-full bg-[#1C1F47] border border-[#2A2D5C] text-[#FFC53D] font-black text-[22px] uppercase tracking-wide">
              {item.category || 'Palabra Desordenada'}
            </span>
            <span className="px-5 py-2 rounded-full bg-[#15173A] border border-[#2A2D5C] text-white font-bold text-[22px]">
              {item.points} PUNTOS
            </span>
          </div>

          <div className="px-5 py-2 rounded-full bg-[#15173A] border border-[#2A2D5C] text-[#B8BCE6] font-semibold text-[20px]">
            {scrambledChars.length} LETRAS
          </div>
        </div>

        {/* Center: Scrambled Letters on White Tiles (124x140px) */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-2">
          <span className="text-[20px] font-black tracking-widest text-[#B8BCE6] uppercase">
            LETRAS DESORDENADAS
          </span>

          <div className="flex flex-wrap items-center justify-center gap-4 max-w-5xl">
            {scrambledChars.map((char, index) => (
              <div
                key={index}
                className="w-[124px] h-[140px] rounded-2xl bg-white text-slate-950 font-black text-[80px] flex items-center justify-center shadow-2xl border-4 border-slate-200"
              >
                {char}
              </div>
            ))}
          </div>

          {/* Solution below in Gold Slots if revealed */}
          {stage.revealed && (
            <div className="flex flex-col items-center gap-2 mt-4 animate-in zoom-in-95 duration-300">
              <span className="text-[18px] font-black tracking-widest text-[#4ADE80] uppercase">
                PALABRA CORRECTA
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {originalChars.map((char, index) => {
                  if (char === ' ') return <div key={index} className="w-8 h-20" />;
                  return (
                    <div
                      key={index}
                      className="w-16 h-20 rounded-xl bg-[#3A2A05] border-2 border-[#FFC53D] text-[#FFC53D] font-black text-[44px] flex items-center justify-center shadow-lg"
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Hint Box below */}
        {item.hint && (
          <div className="w-full p-4 rounded-2xl bg-[#15173A] border-2 border-[#2A2D5C] flex items-center gap-3 text-center justify-center">
            <Sparkles className="w-6 h-6 text-[#FFC53D] shrink-0" />
            <span className="text-[24px] text-white font-bold">
              Pista: <span className="text-[#FFC53D]">{item.hint}</span>
            </span>
          </div>
        )}
      </div>

      {/* Right Column: Reward Wheel in SVG & Selected Result Card */}
      <div className="w-[440px] flex flex-col items-center justify-between rounded-3xl bg-[#15173A] border-2 border-[#2A2D5C] p-6 shadow-2xl shrink-0">
        <div className="text-center pb-2 border-b border-[#2A2D5C] w-full">
          <span className="text-[20px] font-black tracking-widest text-[#FFC53D] uppercase">
            RULETA DE RETOS Y PREMIOS
          </span>
        </div>

        {/* SVG Wheel with pointer on top */}
        <div className="relative flex items-center justify-center my-3" style={{ width: wheelSize, height: wheelSize }}>
          {/* Pointer indicator on top */}
          <div className="absolute top-0 z-20 -mt-2 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-[#FFC53D] filter drop-shadow(0 4px 6px rgba(0,0,0,0.5))" />
          </div>

          <svg
            width={wheelSize}
            height={wheelSize}
            viewBox={`0 0 ${wheelSize} ${wheelSize}`}
            style={{
              transform: `rotate(${stage.wheelAngle || 0}deg)`,
              transition: stage.wheelSpinning ? 'transform 3.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'transform 0.3s ease-out',
            }}
          >
            {rewards.map((rw, index) => {
              const startAngle = index * sliceAngle - Math.PI / 2;
              const endAngle = (index + 1) * sliceAngle - Math.PI / 2;
              const midAngle = (startAngle + endAngle) / 2;

              const x1 = cx + radius * Math.cos(startAngle);
              const y1 = cy + radius * Math.sin(startAngle);
              const x2 = cx + radius * Math.cos(endAngle);
              const y2 = cy + radius * Math.sin(endAngle);

              // Text position
              const textRadius = radius * 0.65;
              const tx = cx + textRadius * Math.cos(midAngle);
              const ty = cy + textRadius * Math.sin(midAngle);
              const textRotation = (midAngle * 180) / Math.PI + 90;

              return (
                <g key={rw.id || index}>
                  <path
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                    fill={rw.color || '#3B82F6'}
                    stroke="#0A0B1E"
                    strokeWidth="3"
                  />
                  <text
                    x={tx}
                    y={ty}
                    fill="#0A0B1E"
                    fontSize="16"
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                  >
                    {rw.label}
                  </text>
                </g>
              );
            })}
            {/* Center hub */}
            <circle cx={cx} cy={cy} r="26" fill="#0A0B1E" stroke="#FFC53D" strokeWidth="4" />
          </svg>
        </div>

        {/* Selected Reward Card on Stop */}
        {stage.selectedReward ? (
          <div className="w-full p-4 rounded-2xl bg-[#3A2A05] border-2 border-[#FFC53D] text-center animate-in zoom-in-95">
            <span className="text-[16px] font-black uppercase tracking-widest text-[#FFC53D] block mb-1">
              ¡RESULTADO DE LA RULETA!
            </span>
            <div className="text-[32px] font-black text-white leading-tight">
              {stage.selectedReward.label}
            </div>
          </div>
        ) : (
          <div className="w-full py-3 px-4 rounded-xl bg-[#1C1F47]/50 border border-[#2A2D5C] text-center text-[#B8BCE6] text-[18px] font-semibold">
            {stage.wheelSpinning ? '¡Girando la ruleta...!' : 'Gira la ruleta al acertar'}
          </div>
        )}
      </div>
    </div>
  );
};

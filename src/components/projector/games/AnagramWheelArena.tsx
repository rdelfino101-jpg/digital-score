import React from 'react';
import { AnagramWheelGameState, WheelReward } from '../../../types/masterStudio';
import { Shuffle, Sparkles } from 'lucide-react';
import { readableOn } from '../../../styles/eventBrand';

interface AnagramWheelArenaProps {
  stage: AnagramWheelGameState;
}

const DEFAULT_REWARDS: WheelReward[] = [
  { id: '1', label: '+100 PTS', type: 'points_bonus', value: 100, color: '#15803D' },
  { id: '2', label: 'PIERDE TURNO', type: 'lose_turn', color: '#B91C1C' },
  { id: '3', label: '¡DOBLE PTS!', type: 'double_points', color: '#D97706' },
  { id: '4', label: '+200 PTS', type: 'points_bonus', value: 200, color: '#2563EB' },
  { id: '5', label: 'RETO FÍSICO', type: 'physical_challenge', color: '#7C3AED' },
  { id: '6', label: '-50 PTS', type: 'points_penalty', value: 50, color: '#EA580C' },
  { id: '7', label: '+150 PTS', type: 'points_bonus', value: 150, color: '#0D9488' },
  { id: '8', label: 'ROBA PUNTOS', type: 'points_bonus', value: 100, color: '#DB2777' },
];

export const AnagramWheelArena: React.FC<AnagramWheelArenaProps> = ({ stage }) => {
  const items = stage?.items || [];
  const currentIndex = stage?.currentIndex ?? 0;
  const item = items[currentIndex];
  const rewards = stage?.rewards && stage.rewards.length > 0 ? stage.rewards : DEFAULT_REWARDS;

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Shuffle className="w-24 h-24 text-[var(--p-accent-ink)] mb-6 opacity-80" />
        <h2 className="font-projector-title text-[54px] text-[var(--p-text)] mb-3">Ruleta de Anagramas</h2>
        <p className="font-projector text-[28px] font-bold text-[var(--p-text-2)] uppercase tracking-wider">Competición en vivo</p>
      </div>
    );
  }

  const scrambledChars = (item.scrambledWord || item.originalWord)
    .toUpperCase()
    .split('')
    .filter((c) => c !== ' ');

  const originalChars = item.originalWord.toUpperCase().split('');

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
            <span className="px-5 py-2 rounded-full bg-[var(--p-panel)] border border-[var(--p-line)] text-[var(--p-accent-ink)] font-black text-[22px] uppercase tracking-wide">
              {item.category || 'Palabra Desordenada'}
            </span>
            <span className="px-5 py-2 rounded-full bg-[var(--p-panel-2)] border border-[var(--p-line)] text-[var(--p-text)] font-bold text-[22px]">
              {item.points} PUNTOS
            </span>
          </div>

          <div className="px-5 py-2 rounded-full bg-[var(--p-panel-2)] border border-[var(--p-line)] text-[var(--p-text-2)] font-semibold text-[20px]">
            {scrambledChars.length} LETRAS
          </div>
        </div>

        {/* Center: Scrambled Letters */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-2">
          <span className="text-[20px] font-black tracking-widest text-[var(--p-text-3)] uppercase">
            Letras desordenadas
          </span>

          <div className="flex flex-wrap items-center justify-center gap-4 max-w-5xl">
            {scrambledChars.map((char, index) => (
              <div
                key={index}
                className="w-[124px] h-[140px] rounded-2xl bg-[var(--p-panel)] text-[var(--p-text)] font-black text-[80px] flex items-center justify-center shadow-md border-4 border-[var(--p-line-strong)]"
              >
                {char}
              </div>
            ))}
          </div>

          {/* Solution below if revealed */}
          {stage.revealed && (
            <div className="flex flex-col items-center gap-2 mt-4 animate-in zoom-in-95 duration-300">
              <span className="text-[18px] font-black tracking-widest text-[var(--p-ok)] uppercase">
                Palabra correcta
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {originalChars.map((char, index) => {
                  if (char === ' ') return <div key={index} className="w-8 h-20" />;
                  return (
                    <div
                      key={index}
                      className="w-16 h-20 rounded-xl bg-[var(--p-ok-bg)] border-2 border-[var(--p-ok)] text-[var(--p-ok)] font-black text-[44px] flex items-center justify-center shadow-sm"
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
          <div className="w-full p-4 rounded-2xl bg-[var(--p-panel)] border-2 border-[var(--p-line)] flex items-center gap-3 text-center justify-center">
            <Sparkles className="w-6 h-6 text-[var(--p-accent-ink)] shrink-0" />
            <span className="text-[24px] text-[var(--p-text)] font-bold">
              Pista: <span className="text-[var(--p-accent-ink)]">{item.hint}</span>
            </span>
          </div>
        )}
      </div>

      {/* Right Column: Reward Wheel in SVG & Selected Result Card */}
      <div className="w-[440px] flex flex-col items-center justify-between rounded-3xl bg-[var(--p-panel)] border-2 border-[var(--p-line)] p-6 shadow-md shrink-0">
        <div className="text-center pb-2 border-b border-[var(--p-line)] w-full">
          <span className="text-[20px] font-black tracking-widest text-[var(--p-accent-ink)] uppercase">
            Ruleta de retos y premios
          </span>
        </div>

        {/* SVG Wheel with pointer on top */}
        <div className="relative flex items-center justify-center my-3" style={{ width: wheelSize, height: wheelSize }}>
          <div className="absolute top-0 z-20 -mt-2 flex flex-col items-center">
            <div
              className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px]"
              style={{ borderTopColor: 'var(--p-accent-ink)' }}
            />
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

              const textRadius = radius * 0.65;
              const tx = cx + textRadius * Math.cos(midAngle);
              const ty = cy + textRadius * Math.sin(midAngle);
              const textRotation = (midAngle * 180) / Math.PI + 90;
              const sliceFill = rw.color || '#2E2A78';
              const sliceText = readableOn(sliceFill);

              return (
                <g key={rw.id || index}>
                  <path
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                    fill={sliceFill}
                    stroke="var(--p-bg)"
                    strokeWidth="3"
                  />
                  <text
                    x={tx}
                    y={ty}
                    fill={sliceText}
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
            <circle cx={cx} cy={cy} r="26" fill="var(--p-brand)" stroke="var(--p-accent)" strokeWidth="4" />
          </svg>
        </div>

        {/* Selected Reward Card on Stop */}
        {stage.selectedReward ? (
          <div className="w-full p-4 rounded-2xl bg-[var(--p-accent-soft)] border-2 border-[var(--p-accent-ink)] text-center animate-in zoom-in-95">
            <span className="text-[16px] font-black uppercase tracking-widest text-[var(--p-accent-ink)] block mb-1">
              ¡Resultado de la ruleta!
            </span>
            <div className="text-[32px] font-black text-[var(--p-text)] leading-tight">
              {stage.selectedReward.label}
            </div>
          </div>
        ) : (
          <div className="w-full py-3 px-4 rounded-xl bg-[var(--p-panel-2)] border border-[var(--p-line)] text-center text-[var(--p-text-2)] text-[18px] font-semibold">
            {stage.wheelSpinning ? '¡Girando la ruleta...!' : 'Gira la ruleta al acertar'}
          </div>
        )}
      </div>
    </div>
  );
};

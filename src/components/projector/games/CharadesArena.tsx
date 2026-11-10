import React from 'react';
import { CharadesGameState } from '../../../types/masterStudio';
import { CheckCircle2, RotateCcw, Smartphone, Sparkles, HelpCircle } from 'lucide-react';

interface CharadesArenaProps {
  stage: CharadesGameState;
}

export const CharadesArena: React.FC<CharadesArenaProps> = ({ stage }) => {
  const items = stage?.items || [];
  const currentIndex = stage?.currentIndex ?? 0;
  const item = items[currentIndex];
  const remaining = stage?.remainingSeconds ?? stage?.roundSeconds ?? 60;
  const total = stage?.roundSeconds || 60;
  const progressRatio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;

  // Ring geometry (480px diameter)
  const size = 480;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - progressRatio);

  const isLowTime = remaining <= 10;
  const ringColor = isLowTime ? '#EF4444' : remaining <= 20 ? '#FFC53D' : '#4ADE80';

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      {/* Top row: Category and Host announcement */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-5 py-2 rounded-full bg-[#1C1F47] border border-[#2A2D5C] text-[#FFC53D] font-black text-[22px] uppercase tracking-wide">
            {item?.category ? `Categoría: ${item.category}` : 'Charadas & Mímica'}
          </span>
          {item?.difficulty && (
            <span className="px-5 py-2 rounded-full bg-[#15173A] border border-[#2A2D5C] text-[#B8BCE6] font-semibold text-[22px] capitalize">
              Dificultad: {item.difficulty}
            </span>
          )}
        </div>

        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#1C1F47] border border-[#4B5299] text-[#B8BCE6] text-[20px] font-semibold">
          <Smartphone className="w-6 h-6 text-[#FFC53D]" />
          <span>Palabra secreta visible solo en el móvil del actor</span>
        </div>
      </div>

      {/* Center arena: Side counter (Correctas), 480px Countdown Ring, Side counter (Pasadas) */}
      <div className="flex-1 flex items-center justify-around px-8 py-2">
        {/* Left Side: Correctas Counter */}
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-[#0F5132]/40 border-4 border-[#4ADE80] min-w-[280px]">
          <div className="flex items-center gap-3 text-[#4ADE80] mb-2">
            <CheckCircle2 className="w-8 h-8" />
            <span className="text-[26px] font-black tracking-widest uppercase">CORRECTAS</span>
          </div>
          <span className="text-[100px] font-black text-white leading-none tabular-numbers">
            {stage.correctCount || 0}
          </span>
          <span className="text-[22px] text-[#4ADE80] font-bold mt-2">aciertos</span>
        </div>

        {/* Center: 480px Countdown Ring */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1C1F47"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Active progress ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={ringColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>

          {/* Number in 190px */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className="text-[190px] font-black leading-none text-white tabular-numbers tracking-tighter"
              style={{ color: isLowTime ? '#EF4444' : '#FFFFFF' }}
            >
              {remaining}
            </span>
            <span className="text-[24px] font-black tracking-widest text-[#B8BCE6] uppercase mt-1">
              SEGUNDOS
            </span>
          </div>
        </div>

        {/* Right Side: Pasadas Counter */}
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-[#3F1216]/40 border-4 border-[#EF4444] min-w-[280px]">
          <div className="flex items-center gap-3 text-[#EF4444] mb-2">
            <RotateCcw className="w-8 h-8" />
            <span className="text-[26px] font-black tracking-widest uppercase">PASADAS</span>
          </div>
          <span className="text-[100px] font-black text-white leading-none tabular-numbers">
            {stage.skippedCount || 0}
          </span>
          <span className="text-[22px] text-[#EF4444] font-bold mt-2">omitidas</span>
        </div>
      </div>

      {/* Bottom status note: Word is NEVER shown on projector */}
      <div className="w-full py-4 px-8 rounded-2xl bg-[#15173A] border-2 border-[#2A2D5C] text-center">
        <p className="text-[26px] font-black text-[#FFC53D] tracking-wide uppercase">
          ¡ACTUANDO EN VIVO! · Mímica y Gestos (Prohibido hablar, cantar o señalar letras)
        </p>
      </div>
    </div>
  );
};

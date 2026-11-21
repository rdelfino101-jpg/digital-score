import React from 'react';
import { RaffleParticipant } from '../../../types/masterStudio';
import { readableOn } from '../../../styles/eventBrand';
import { FitText } from '../common/FitText';

interface RaffleSvgWheelProps {
  participants: RaffleParticipant[];
  targetAngle: number;
  isSpinning: boolean;
  durationMs: number;
}

export const RaffleSvgWheel: React.FC<RaffleSvgWheelProps> = ({
  participants,
  targetAngle,
  isSpinning,
  durationMs,
}) => {
  const size = 820;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 20;

  const count = Math.max(1, participants.length);
  const sliceDeg = 360 / count;

  const innerStart = count > 18 ? 132 : count > 12 ? 112 : 94;
  const outerEnd = radius - 28;
  const labelWidth = Math.max(120, outerEnd - innerStart);
  const labelHeight = count > 18 ? 34 : 44;
  const maxFontSize = count > 18 ? 26 : count > 12 ? 28 : 32;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* 3 O'CLOCK POINTER */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 flex items-center pointer-events-none"
        style={{ transform: 'translate(14px, -50%)' }}
      >
        <svg width="60" height="50" viewBox="0 0 60 50">
          <polygon
            points="0,25 50,2 50,48"
            fill="#FFFFFF"
            stroke="var(--p-brand)"
            strokeWidth="4"
          />
          <circle cx="36" cy="25" r="5" fill="var(--p-accent)" />
        </svg>
      </div>

      {/* SVG WHEEL */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        style={{
          transform: `rotate(${targetAngle}deg)`,
          transformOrigin: 'center center',
          transition: isSpinning
            ? `transform ${durationMs}ms cubic-bezier(0.12, 0.95, 0.22, 1)`
            : 'transform 0.4s ease-out',
        }}
      >
        {/* Outer wheel rim */}
        <circle cx={cx} cy={cy} r={radius + 8} fill="var(--p-brand)" stroke="var(--p-accent)" strokeWidth="6" />

        {/* Outer decorative pins around perimeter */}
        {participants.map((_, i) => {
          const pinAngle = (i * sliceDeg * Math.PI) / 180;
          const px = cx + (radius + 4) * Math.cos(pinAngle);
          const py = cy + (radius + 4) * Math.sin(pinAngle);
          return (
            <circle
              key={`pin-${i}`}
              cx={px}
              cy={py}
              r="4.5"
              fill="var(--p-accent)"
              stroke="var(--p-brand)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Slices and FitText labels */}
        {participants.map((p, idx) => {
          const startAngle = (idx * sliceDeg * Math.PI) / 180;
          const endAngle = ((idx + 1) * sliceDeg * Math.PI) / 180;
          const midDeg = (idx + 0.5) * sliceDeg;

          const x1 = cx + radius * Math.cos(startAngle);
          const y1 = cy + radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle);
          const y2 = cy + radius * Math.sin(endAngle);

          const arcPath =
            count === 1
              ? `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy} Z`
              : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${sliceDeg > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;

          const isLeftHalf = midDeg > 90 && midDeg < 270;
          const rotation = isLeftHalf ? midDeg + 180 : midDeg;
          const boxX = isLeftHalf ? cx - outerEnd : cx + innerStart;
          const boxY = cy - labelHeight / 2;

          const sliceFill = p.color || '#2563eb';
          const textFill = readableOn(sliceFill);

          return (
            <g key={p.id || idx}>
              <path
                d={arcPath}
                fill={sliceFill}
                stroke="var(--p-bg)"
                strokeWidth="2.5"
              />

              <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
                <foreignObject x={boxX} y={boxY} width={labelWidth} height={labelHeight}>
                  <div
                    className={`flex h-full w-full items-center ${
                      isLeftHalf ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <FitText
                      max={maxFontSize}
                      min={14}
                      lineHeight={1.05}
                      className={`w-full select-none font-projector font-black uppercase tracking-wide ${
                        isLeftHalf ? 'text-left' : 'text-right'
                      }`}
                      style={{ color: textFill }}
                      title={p.name}
                    >
                      {p.name}
                    </FitText>
                  </div>
                </foreignObject>
              </g>
            </g>
          );
        })}

        {/* Center Hub */}
        <circle cx={cx} cy={cy} r="65" fill="var(--p-brand)" stroke="var(--p-accent)" strokeWidth="6" />
        <circle cx={cx} cy={cy} r="24" fill="var(--p-accent)" stroke="var(--p-brand)" strokeWidth="3" />
      </svg>
    </div>
  );
};

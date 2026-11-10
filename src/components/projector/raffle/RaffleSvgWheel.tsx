import React from 'react';
import { RaffleParticipant } from '../../../types/masterStudio';

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
  const sliceRad = (sliceDeg * Math.PI) / 180;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* 
        3 O'CLOCK POINTER (Positioned at 3 o'clock / Right side at 0 degrees)
        Requirement 1: "Puntero blanco a la derecha (posición de las 3)"
      */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-30 flex items-center pointer-events-none filter drop-shadow(0 6px 12px rgba(0,0,0,0.8))"
        style={{ transform: 'translate(14px, -50%)' }}
      >
        <svg width="60" height="50" viewBox="0 0 60 50">
          {/* White arrow pointing leftwards towards the wheel at 3 o'clock */}
          <polygon
            points="0,25 50,2 50,48"
            fill="#FFFFFF"
            stroke="#15173A"
            strokeWidth="4"
          />
          {/* Center decorative gold dot */}
          <circle cx="36" cy="25" r="5" fill="#FFC53D" />
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
        <defs>
          <radialGradient id="wheelHubGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2A2D5C" />
            <stop offset="70%" stopColor="#15173A" />
            <stop offset="100%" stopColor="#0A0B1E" />
          </radialGradient>
          <filter id="sliceShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer metallic wheel rim */}
        <circle cx={cx} cy={cy} r={radius + 8} fill="#15173A" stroke="#FFC53D" strokeWidth="6" />

        {/* Outer decorative bulbs/pins around perimeter */}
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
              fill="#FFC53D"
              stroke="#0A0B1E"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Slices and names */}
        {participants.map((p, idx) => {
          const startAngle = (idx * sliceDeg * Math.PI) / 180;
          const endAngle = ((idx + 1) * sliceDeg * Math.PI) / 180;
          const midDeg = (idx + 0.5) * sliceDeg;
          const midRad = (midDeg * Math.PI) / 180;

          const x1 = cx + radius * Math.cos(startAngle);
          const y1 = cy + radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle);
          const y2 = cy + radius * Math.sin(endAngle);

          const arcPath = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

          // Text placement:
          // In SVG, 0 deg is at (cx + r, cy) = 3 o'clock.
          // Mid angle is midDeg.
          // In the left half (midDeg between 90 deg and 270 deg), cos(midRad) < 0.
          // To prevent text from being upside down, rotate 180 deg and set text-anchor="start"!
          const isLeftHalf = midDeg > 90 && midDeg < 270;

          const textRadius = radius - 38;
          const tx = cx + textRadius * Math.cos(midRad);
          const ty = cy + textRadius * Math.sin(midRad);

          const rotation = isLeftHalf ? midDeg + 180 : midDeg;
          const textAnchor = isLeftHalf ? 'start' : 'end';

          // Text size: minimum 26px on 1920x1080 canvas
          const fontSize = count > 18 ? 26 : count > 12 ? 28 : 32;

          return (
            <g key={p.id || idx}>
              {/* Slice path */}
              <path
                d={arcPath}
                fill={p.color || '#2563eb'}
                stroke="#0A0B1E"
                strokeWidth="2.5"
              />

              {/* Text inside segment */}
              <text
                x={tx}
                y={ty}
                fill="#FFFFFF"
                fontSize={fontSize}
                fontWeight="900"
                fontFamily="Archivo, sans-serif"
                textAnchor={textAnchor}
                dominantBaseline="central"
                transform={`rotate(${rotation}, ${tx}, ${ty})`}
                filter="url(#sliceShadow)"
                className="select-none uppercase tracking-wide"
              >
                {p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name}
              </text>
            </g>
          );
        })}

        {/* Center Hub */}
        <circle cx={cx} cy={cy} r="65" fill="url(#wheelHubGradient)" stroke="#FFC53D" strokeWidth="6" />
        <circle cx={cx} cy={cy} r="24" fill="#FFC53D" stroke="#0A0B1E" strokeWidth="3" />
      </svg>
    </div>
  );
};

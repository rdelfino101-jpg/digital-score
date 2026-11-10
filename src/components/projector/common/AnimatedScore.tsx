import React, { useState, useEffect, useRef } from 'react';

interface AnimatedScoreProps {
  score: number;
  className?: string;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({
  score,
  className = '',
  durationMs = 500,
  prefix = '',
  suffix = '',
}) => {
  const [displayScore, setDisplayScore] = useState(score);
  const [isFlashing, setIsFlashing] = useState(false);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    if (prevScoreRef.current === score) return;

    const start = prevScoreRef.current;
    const end = score;
    prevScoreRef.current = score;

    setIsFlashing(true);
    const flashTimeout = setTimeout(() => setIsFlashing(false), durationMs);

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayScore(end);
      return () => clearTimeout(flashTimeout);
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (end - start) * easeProgress);
      setDisplayScore(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      clearTimeout(flashTimeout);
    };
  }, [score, durationMs]);

  return (
    <span
      className={`tabular-numbers inline-block transition-transform duration-300 ${
        isFlashing ? 'animate-projector-score-flash' : ''
      } ${className}`}
    >
      {prefix}
      {displayScore.toLocaleString()}
      {suffix}
    </span>
  );
};

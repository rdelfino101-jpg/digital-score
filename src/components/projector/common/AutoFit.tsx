import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';

interface AutoFitProps {
  children: React.ReactNode;
  minScale?: number;
  className?: string;
}

/**
 * AutoFit container:
 * Occupies 100% of available height/width in flex layouts (flex-1 min-h-0 overflow-hidden).
 * Automatically detects if children overflow the available space via ResizeObserver
 * and scales down with CSS transform: scale(x) down to minScale (default 0.6).
 * Recalculates dynamically when content changes (new question, revealed letters, etc.).
 */
export const AutoFit: React.FC<AutoFitProps> = ({
  children,
  minScale = 0.6,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const scaleRef = useRef<number>(1);
  scaleRef.current = scale;

  const calculateScale = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const container = containerRef.current;
    const content = contentRef.current;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (containerWidth <= 0 || containerHeight <= 0) return;

    // Calculate unscaled dimensions from bounding rect divided by active scale
    const currentScale = scaleRef.current || 1;
    const rect = content.getBoundingClientRect();
    const unscaledWidth = Math.max(rect.width / currentScale, content.scrollWidth, content.offsetWidth);
    const unscaledHeight = Math.max(rect.height / currentScale, content.scrollHeight, content.offsetHeight);

    if (unscaledWidth <= 0 || unscaledHeight <= 0) return;

    const scaleX = containerWidth / unscaledWidth;
    const scaleY = containerHeight / unscaledHeight;
    const fitted = Math.min(1, scaleX, scaleY);

    // If within 2% of 1, keep 1 for crisper text rendering
    const newScale = fitted >= 0.98 ? 1 : Math.max(minScale, Number(fitted.toFixed(3)));

    if (Math.abs(newScale - scaleRef.current) > 0.005) {
      scaleRef.current = newScale;
      setScale(newScale);
    }
  }, [minScale]);

  useLayoutEffect(() => {
    calculateScale();
  }, [children, calculateScale]);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const observer = new ResizeObserver(() => {
      calculateScale();
    });

    observer.observe(containerRef.current);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    // Window resize fallback
    window.addEventListener('resize', calculateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', calculateScale);
    };
  }, [calculateScale]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-1 min-h-0 w-full items-center justify-center overflow-hidden ${className}`}
    >
      <div
        ref={contentRef}
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'center center',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.12s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

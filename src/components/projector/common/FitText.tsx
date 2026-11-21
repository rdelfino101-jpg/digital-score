import React, { useLayoutEffect, useRef } from 'react';

interface FitTextProps {
  children: React.ReactNode;
  /** Tamaño máximo en px (lienzo de 1920x1080) */
  max: number;
  /** Tamaño mínimo en px; por debajo de esto se permite el corte */
  min?: number;
  /** Líneas permitidas antes de achicar (1 = una sola línea) */
  lines?: number;
  lineHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p';
  title?: string;
}

/**
 * Texto que se achica hasta caber en su caja en vez de cortarse con "…".
 * Mide en unidades del lienzo (no le afecta la escala del proyector).
 */
export const FitText: React.FC<FitTextProps> = ({
  children,
  max,
  min = 18,
  lines = 1,
  lineHeight = 1.08,
  className = '',
  style,
  as = 'span',
  title,
}) => {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cabe = (fs: number) => {
      el.style.fontSize = `${fs}px`;
      const alturaMax = Math.ceil(fs * lineHeight * lines) + 2;
      return el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= alturaMax;
    };

    const ajustar = () => {
      if (!el.clientWidth) return;
      if (cabe(max)) return;
      let lo = min;
      let hi = max;
      while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (cabe(mid)) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${lo}px`;
    };

    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    document.fonts?.ready.then(ajustar).catch(() => {});
    return () => ro.disconnect();
  });

  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      title={title}
      className={`block min-w-0 max-w-full ${lines === 1 ? 'whitespace-nowrap overflow-hidden text-ellipsis' : 'overflow-hidden'} ${className}`}
      style={{
        fontSize: max,
        lineHeight,
        ...(lines > 1
          ? { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical' as const, overflowWrap: 'anywhere' as const }
          : {}),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};

import React, { useLayoutEffect, useRef } from 'react';

interface ScaleToFitProps {
  children: React.ReactNode;
  className?: string;
  /** Escala mínima permitida (por debajo se recorta) */
  minScale?: number;
}

/**
 * Zona fija del escenario. Si el contenido (pregunta larga, muchas
 * opciones) no cabe en el alto disponible, se reduce proporcionalmente
 * en lugar de desbordarse encima de los equipos o del cintillo.
 */
export const ScaleToFit: React.FC<ScaleToFitProps> = ({ children, className = '', minScale = 0.55 }) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const ajustar = () => {
      const alto = outer.clientHeight;
      const ancho = outer.clientWidth;
      if (!alto || !ancho) return;
      // 1) medir con el alto real disponible
      inner.style.transform = 'none';
      inner.style.height = `${alto}px`;
      inner.style.width = `${ancho}px`;
      const necesario = Math.max(inner.scrollHeight, alto);
      if (necesario <= alto + 1) return;
      // 2) no cabe: darle su alto natural y reducir
      const escala = Math.max(minScale, alto / necesario);
      inner.style.height = `${necesario}px`;
      inner.style.transform = `scale(${escala})`;
    };

    ajustar();
    const ro = new ResizeObserver(() => ajustar());
    ro.observe(outer);
    document.fonts?.ready.then(ajustar).catch(() => {});
    return () => ro.disconnect();
  });

  return (
    <div ref={outerRef} className={`relative min-h-0 min-w-0 flex-1 self-stretch overflow-hidden ${className}`}>
      <div ref={innerRef} className="absolute left-0 top-0 flex items-stretch justify-center"
        style={{ transformOrigin: 'top center' }}>
        {children}
      </div>
    </div>
  );
};

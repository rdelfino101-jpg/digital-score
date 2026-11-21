import React from 'react';
import type { EventBrand } from '../../../styles/eventBrand';

interface BrandMarkProps {
  brand: EventBrand;
  size?: number;
  /** true cuando va sobre el color de marca (cintillo, columna) */
  inverse?: boolean;
  className?: string;
}

/** Iniciales del evento: "Noche de jóvenes" -> "NJ" */
export function brandInitials(name: string): string {
  const palabras = (name || '')
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(p));
  const letras = (palabras.length ? palabras : [name || '?']).slice(0, 2).map((p) => p[0]);
  return letras.join('').toUpperCase();
}

/**
 * Logo del evento. Si no hay logo, muestra un monograma con las
 * iniciales sobre el color de marca, para que siempre haya identidad.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ brand, size = 72, inverse = false, className = '' }) => {
  if (brand.logo) {
    const img = (
      <img
        src={brand.logo}
        alt={brand.name}
        className="block object-contain"
        style={{ height: inverse ? size * 0.72 : size, width: 'auto', maxWidth: size * 3 }}
      />
    );
    // Sobre el color de marca, el logo va en una placa blanca: muchos logos
    // usan el mismo color del evento y desaparecerían sobre él.
    if (inverse) {
      return (
        <span
          className={`inline-flex shrink-0 items-center justify-center bg-white ${className}`}
          style={{ height: size, padding: `0 ${Math.round(size * 0.16)}px`, borderRadius: Math.round(size * 0.22) }}
        >
          {img}
        </span>
      );
    }
    return <span className={`inline-flex shrink-0 ${className}`}>{img}</span>;
  }
  return (
    <span
      aria-label={brand.name}
      className={`flex shrink-0 items-center justify-center font-projector font-black ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        fontSize: Math.round(size * 0.42),
        background: inverse ? 'var(--p-on-brand)' : 'var(--p-brand)',
        color: inverse ? 'var(--p-brand)' : 'var(--p-on-brand)',
        letterSpacing: '-0.02em',
      }}
    >
      {brandInitials(brand.name)}
    </span>
  );
};

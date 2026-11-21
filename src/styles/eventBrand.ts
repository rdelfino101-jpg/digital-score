/* -------------------------------------------------------------
 * Marca del evento
 *
 * Cada evento (noche de jóvenes, campamento, aniversario…) define su
 * nombre, un logo opcional y dos colores. A partir de eso se calculan
 * todas las variables CSS del proyector (--p-*), que usan las escenas
 * en lugar de colores fijos. Así un cambio de marca se ve en todas las
 * pantallas sin tocar código.
 * ------------------------------------------------------------- */

export type BrandSurface = 'claro' | 'oscuro';

export interface EventBrand {
  /** Nombre del evento, p. ej. "Noche de jóvenes" */
  name: string;
  /** Línea secundaria opcional, p. ej. "Campamento 2026" */
  tagline: string;
  /** Logo como data URL (ya reducido) o URL; vacío = sin logo */
  logo: string;
  /** Color principal: columna de marca y encabezados */
  primary: string;
  /** Color de acento: turno, líder, cronómetro */
  accent: string;
  /** Fondo general del proyector */
  surface: BrandSurface;
}

export interface BrandPreset {
  id: string;
  label: string;
  primary: string;
  accent: string;
}

export const BRAND_PRESETS: BrandPreset[] = [
  { id: 'indigo', label: 'Índigo y ámbar', primary: '#2E2A78', accent: '#F5B83D' },
  { id: 'marino', label: 'Marino y coral', primary: '#173A5E', accent: '#FF7A59' },
  { id: 'bosque', label: 'Bosque y lima', primary: '#1F4D3A', accent: '#B5E853' },
  { id: 'vino', label: 'Vino y dorado', primary: '#5A1E3A', accent: '#F2C14E' },
  { id: 'petroleo', label: 'Petróleo y turquesa', primary: '#123C4A', accent: '#2EC4B6' },
  { id: 'carbon', label: 'Carbón y menta', primary: '#16181D', accent: '#74E0BC' },
];

export const DEFAULT_EVENT_BRAND: EventBrand = {
  name: 'Noche de jóvenes',
  tagline: '',
  logo: '',
  primary: BRAND_PRESETS[0].primary,
  accent: BRAND_PRESETS[0].accent,
  surface: 'claro',
};

export function resolveEventBrand(brand?: Partial<EventBrand> | null): EventBrand {
  const b = { ...DEFAULT_EVENT_BRAND, ...(brand || {}) };
  return {
    ...b,
    primary: normalizeHex(b.primary) || DEFAULT_EVENT_BRAND.primary,
    accent: normalizeHex(b.accent) || DEFAULT_EVENT_BRAND.accent,
    surface: b.surface === 'oscuro' ? 'oscuro' : 'claro',
  };
}

/* ---------- Color ---------- */

export function normalizeHex(value: string): string | null {
  const v = (value || '').trim();
  const short = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(v);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toUpperCase();
  const full = /^#?([0-9a-f]{6})$/i.exec(v);
  return full ? `#${full[1]}`.toUpperCase() : null;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex) || '#000000';
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Texto legible (casi negro o blanco) sobre un color de fondo */
export function readableOn(bg: string): string {
  return contrastRatio(bg, '#FFFFFF') >= contrastRatio(bg, '#111318') ? '#FFFFFF' : '#111318';
}

/** Mezcla dos colores: t=0 devuelve a, t=1 devuelve b */
export function mix(a: string, b: string, t: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  return rgbToHex([ra[0] + (rb[0] - ra[0]) * t, ra[1] + (rb[1] - ra[1]) * t, ra[2] + (rb[2] - ra[2]) * t]);
}

/**
 * Ajusta un color hacia negro o blanco hasta que tenga el contraste
 * pedido contra el fondo. Sirve para usar el acento como texto sobre
 * fondo claro sin que se pierda (p. ej. ámbar sobre blanco).
 */
export function ensureContrast(color: string, bg: string, min = 4.5): string {
  if (contrastRatio(color, bg) >= min) return normalizeHex(color) || color;
  const target = relativeLuminance(bg) > 0.4 ? '#000000' : '#FFFFFF';
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = mix(color, target, t);
    if (contrastRatio(c, bg) >= min) return c;
  }
  return target;
}

/* ---------- Variables del proyector ---------- */

const SURFACES = {
  claro: {
    bg: '#EEF0F3',
    panel: '#FFFFFF',
    panel2: '#F4F5F7',
    line: '#D6DAE1',
    lineStrong: '#A9B0BC',
    text: '#111318',
    text2: '#454C59',
    text3: '#6A7180',
    ok: '#15803D',
    okBg: '#DCFCE7',
    err: '#B91C1C',
    errBg: '#FEE2E2',
  },
  oscuro: {
    bg: '#0E1015',
    panel: '#181B22',
    panel2: '#20242D',
    line: '#2D323D',
    lineStrong: '#4B5363',
    text: '#FFFFFF',
    text2: '#C4C9D4',
    text3: '#8F96A3',
    ok: '#4ADE80',
    okBg: '#0F3D24',
    err: '#F87171',
    errBg: '#3F1216',
  },
  contraste: {
    bg: '#000000',
    panel: '#111111',
    panel2: '#1F1F1F',
    line: '#FFFFFF',
    lineStrong: '#FFFFFF',
    text: '#FFFFFF',
    text2: '#E2E8F0',
    text3: '#CBD5E1',
    ok: '#4ADE80',
    okBg: '#0F5132',
    err: '#FF6B6B',
    errBg: '#7F1D1D',
  },
} as const;

export type ProjectorCssVars = Record<`--p-${string}`, string>;

export function brandCssVars(brandInput?: Partial<EventBrand> | null, highContrast = false): ProjectorCssVars {
  const brand = resolveEventBrand(brandInput);
  const s = highContrast ? SURFACES.contraste : SURFACES[brand.surface];
  const accent = brand.accent;
  const primary = brand.primary;
  return {
    '--p-bg': s.bg,
    '--p-panel': s.panel,
    '--p-panel-2': s.panel2,
    '--p-line': s.line,
    '--p-line-strong': s.lineStrong,
    '--p-text': s.text,
    '--p-text-2': s.text2,
    '--p-text-3': s.text3,
    '--p-ok': s.ok,
    '--p-ok-bg': s.okBg,
    '--p-err': s.err,
    '--p-err-bg': s.errBg,
    '--p-accent': accent,
    '--p-on-accent': readableOn(accent),
    // Acento usado como texto o borde fino sobre los paneles: siempre legible
    '--p-accent-ink': ensureContrast(accent, s.panel, 4.5),
    '--p-accent-soft': highContrast ? '#2A2A2A' : mix(s.panel, accent, brand.surface === 'claro' ? 0.18 : 0.22),
    '--p-brand': primary,
    '--p-on-brand': readableOn(primary),
    '--p-brand-2': readableOn(primary) === '#FFFFFF' ? mix(primary, '#FFFFFF', 0.72) : mix(primary, '#000000', 0.62),
    '--p-brand-soft': mix(s.panel, primary, brand.surface === 'claro' ? 0.1 : 0.3),
  };
}

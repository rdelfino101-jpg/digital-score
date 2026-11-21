import React, { useEffect, useRef, useState } from 'react';
import { LiveSceneSettings } from '../../types/masterStudio';
import {
  BRAND_PRESETS,
  BrandSurface,
  EventBrand,
  brandCssVars,
  normalizeHex,
  resolveEventBrand,
} from '../../styles/eventBrand';
import { BrandMark } from '../projector/common/BrandMark';
import { Upload, Trash2, Check, Sun, Moon, Contrast, AlertCircle } from 'lucide-react';

interface EventBrandEditorProps {
  scene: LiveSceneSettings;
  onUpdateScene: (scene: LiveSceneSettings) => void;
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const MAX_LOGO_DIMENSION = 400;

function resizeImageToPngDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const isSvg =
        file.type === 'image/svg+xml' ||
        file.name.toLowerCase().endsWith('.svg');
      if (isSvg) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
      img.onload = () => {
        const { width, height } = img;
        if (!width || !height) {
          resolve(dataUrl);
          return;
        }
        const longest = Math.max(width, height);
        const ratio = longest > MAX_LOGO_DIMENSION ? MAX_LOGO_DIMENSION / longest : 1;
        const targetW = Math.max(1, Math.round(width * ratio));
        const targetH = Math.max(1, Math.round(height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const EventBrandEditor: React.FC<EventBrandEditorProps> = ({
  scene,
  onUpdateScene,
}) => {
  const brand = resolveEventBrand(scene.eventBrand);
  const isHighContrast = scene.theme === 'high-contrast';

  const [primaryInput, setPrimaryInput] = useState(brand.primary);
  const [accentInput, setAccentInput] = useState(brand.accent);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPrimaryInput(brand.primary);
  }, [brand.primary]);

  useEffect(() => {
    setAccentInput(brand.accent);
  }, [brand.accent]);

  const updateBrand = (patch: Partial<EventBrand>, extraScene?: Partial<LiveSceneSettings>) => {
    onUpdateScene({
      ...scene,
      ...(extraScene || {}),
      eventBrand: {
        ...brand,
        ...patch,
      },
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so re-selecting the same file works
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('El logo pesa más de 5 MB. Usa una versión más liviana.');
      return;
    }

    setLogoError(null);
    try {
      const processedDataUrl = await resizeImageToPngDataUrl(file);
      updateBrand({ logo: processedDataUrl });
    } catch {
      setLogoError('No se pudo cargar el archivo. Prueba con un PNG, JPG, WEBP o SVG válido.');
    }
  };

  const handleHexChange = (field: 'primary' | 'accent', raw: string) => {
    if (field === 'primary') setPrimaryInput(raw);
    else setAccentInput(raw);

    const normalized = normalizeHex(raw);
    if (normalized) {
      updateBrand({ [field]: normalized });
    }
  };

  const handleHexBlur = (field: 'primary' | 'accent') => {
    const currentText = field === 'primary' ? primaryInput : accentInput;
    const normalized = normalizeHex(currentText);
    if (normalized) {
      if (field === 'primary') setPrimaryInput(normalized);
      else setAccentInput(normalized);
      if (normalized !== brand[field]) {
        updateBrand({ [field]: normalized });
      }
    } else {
      if (field === 'primary') setPrimaryInput(brand.primary);
      else setAccentInput(brand.accent);
    }
  };

  const handleSelectSurface = (mode: BrandSurface | 'high-contrast') => {
    if (mode === 'high-contrast') {
      onUpdateScene({
        ...scene,
        theme: 'high-contrast',
        eventBrand: brand,
      });
    } else {
      const nextTheme = scene.theme === 'high-contrast' ? 'broadcast-dark' : scene.theme;
      updateBrand({ surface: mode }, { theme: nextTheme });
    }
  };

  const previewVars = brandCssVars(brand, isHighContrast);

  return (
    <div className="space-y-5">
      {/* Encabezado del editor */}
      <p className="text-xs text-slate-300 leading-relaxed">
        El nombre, el logo y los colores aparecen en todas las escenas del proyector.
      </p>

      {/* 1. Nombre del evento y Línea secundaria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="event-brand-name"
            className="block text-xs font-bold text-slate-200 mb-1.5"
          >
            Nombre del evento
          </label>
          <input
            id="event-brand-name"
            type="text"
            value={brand.name}
            onChange={(e) => updateBrand({ name: e.target.value })}
            placeholder="Noche de jóvenes"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="event-brand-tagline"
            className="block text-xs font-bold text-slate-200 mb-1.5"
          >
            Línea secundaria <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="event-brand-tagline"
            type="text"
            value={brand.tagline}
            onChange={(e) => updateBrand({ tagline: e.target.value })}
            placeholder="Campamento 2026"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 2. Logo */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 min-w-12 items-center justify-center rounded-lg border border-slate-700/80 px-2"
              style={{
                ...(previewVars as React.CSSProperties),
                backgroundColor: 'var(--p-panel)',
              }}
            >
              <BrandMark brand={brand} size={36} />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-200">Logo</span>
              <p className="text-[11px] text-slate-400">
                Sin logo se muestran las iniciales del evento. Funciona mejor un PNG con fondo transparente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
              onChange={handleLogoChange}
              className="hidden"
              aria-label="Subir logo del evento"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-blue-400" />
              <span>{brand.logo ? 'Cambiar logo' : 'Subir logo'}</span>
            </button>
            {brand.logo && (
              <button
                type="button"
                onClick={() => {
                  setLogoError(null);
                  updateBrand({ logo: '' });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/70 bg-red-950/60 hover:bg-red-900/60 px-3 py-1.5 text-xs font-bold text-red-200 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Quitar</span>
              </button>
            )}
          </div>
        </div>

        {logoError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-red-800/80 bg-red-950/70 px-3 py-2 text-xs font-medium text-red-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{logoError}</span>
          </div>
        )}
      </div>

      {/* 3. Combinaciones rápidas */}
      <div>
        <span className="block text-xs font-bold text-slate-200 mb-2">
          Combinaciones rápidas
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BRAND_PRESETS.map((preset) => {
            const isActive =
              brand.primary.toUpperCase() === preset.primary.toUpperCase() &&
              brand.accent.toUpperCase() === preset.accent.toUpperCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateBrand({ primary: preset.primary, accent: preset.accent })}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                  isActive
                    ? 'border-blue-500 bg-slate-800/90 ring-2 ring-blue-500/30 text-white'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center shrink-0">
                    <span
                      className="h-5 w-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="-ml-1.5 h-5 w-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </span>
                  <span className="text-xs font-bold truncate">{preset.label}</span>
                </div>
                {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-blue-400" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Selectores de color Principal y Acento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <label
            htmlFor="event-brand-primary-hex"
            className="block text-xs font-bold text-slate-200 mb-2"
          >
            Principal
          </label>
          <div className="flex items-center gap-2.5">
            <input
              type="color"
              aria-label="Color principal"
              value={brand.primary}
              onChange={(e) => {
                const hex = normalizeHex(e.target.value);
                if (hex) updateBrand({ primary: hex });
              }}
              className="h-9 w-11 cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-0.5 shrink-0"
            />
            <input
              id="event-brand-primary-hex"
              type="text"
              value={primaryInput}
              onChange={(e) => handleHexChange('primary', e.target.value)}
              onBlur={() => handleHexBlur('primary')}
              placeholder="#2E2A78"
              maxLength={7}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono uppercase text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <label
            htmlFor="event-brand-accent-hex"
            className="block text-xs font-bold text-slate-200 mb-2"
          >
            Acento
          </label>
          <div className="flex items-center gap-2.5">
            <input
              type="color"
              aria-label="Color de acento"
              value={brand.accent}
              onChange={(e) => {
                const hex = normalizeHex(e.target.value);
                if (hex) updateBrand({ accent: hex });
              }}
              className="h-9 w-11 cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-0.5 shrink-0"
            />
            <input
              id="event-brand-accent-hex"
              type="text"
              value={accentInput}
              onChange={(e) => handleHexChange('accent', e.target.value)}
              onBlur={() => handleHexBlur('accent')}
              placeholder="#F5B83D"
              maxLength={7}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono uppercase text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. Fondo: Claro, Oscuro, Alto contraste */}
      <div>
        <span className="block text-xs font-bold text-slate-200 mb-2">Fondo</span>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              id: 'claro' as const,
              label: 'Claro',
              icon: Sun,
              active: !isHighContrast && brand.surface === 'claro',
            },
            {
              id: 'oscuro' as const,
              label: 'Oscuro',
              icon: Moon,
              active: !isHighContrast && brand.surface === 'oscuro',
            },
            {
              id: 'high-contrast' as const,
              label: 'Alto contraste',
              icon: Contrast,
              active: isHighContrast,
            },
          ].map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={opt.active}
                onClick={() => handleSelectSurface(opt.id)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                  opt.active
                    ? 'border-blue-500 bg-blue-600/20 text-white ring-2 ring-blue-500/30'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Vista previa */}
      <div>
        <span className="block text-xs font-bold text-slate-200 mb-2">Vista previa</span>
        <div
          data-testid="event-brand-preview"
          className="overflow-hidden rounded-xl border-2 shadow-lg"
          style={{
            ...(previewVars as React.CSSProperties),
            backgroundColor: 'var(--p-bg)',
            borderColor: 'var(--p-line)',
            color: 'var(--p-text)',
          }}
        >
          <div className="flex min-h-[144px] items-stretch">
            {/* Columna de marca */}
            <div
              className="flex w-52 shrink-0 flex-col justify-between p-4"
              style={{
                backgroundColor: 'var(--p-brand)',
                color: 'var(--p-on-brand)',
              }}
            >
              <BrandMark brand={brand} size={44} inverse />
              <div className="mt-3 min-w-0">
                <div className="truncate font-projector text-base font-black leading-tight">
                  {brand.name || 'Nombre del evento'}
                </div>
                {brand.tagline && (
                  <div
                    className="truncate text-xs font-semibold mt-0.5"
                    style={{ color: 'var(--p-brand-2)' }}
                  >
                    {brand.tagline}
                  </div>
                )}
              </div>
            </div>

            {/* Dos filas de equipo de ejemplo */}
            <div className="flex flex-1 flex-col justify-center gap-2.5 p-4 min-w-0">
              {/* Equipo 1 (líder / en turno con acento) */}
              <div
                className="flex items-center justify-between gap-3 rounded-xl border-2 px-3.5 py-2.5"
                style={{
                  backgroundColor: 'var(--p-accent-soft)',
                  borderColor: 'var(--p-accent)',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                    style={{
                      backgroundColor: 'var(--p-accent)',
                      color: 'var(--p-on-accent)',
                    }}
                  >
                    1º
                  </span>
                  <div className="min-w-0">
                    <div
                      className="truncate text-sm font-black"
                      style={{ color: 'var(--p-text)' }}
                    >
                      Águilas Doradas
                    </div>
                    <div
                      className="text-[11px] font-bold uppercase tracking-wide"
                      style={{ color: 'var(--p-accent-ink)' }}
                    >
                      En turno · Líder
                    </div>
                  </div>
                </div>
                <span
                  className="shrink-0 font-projector text-xl font-black tabular-numbers"
                  style={{ color: 'var(--p-text)' }}
                >
                  120
                </span>
              </div>

              {/* Equipo 2 (panel estándar) */}
              <div
                className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                style={{
                  backgroundColor: 'var(--p-panel)',
                  borderColor: 'var(--p-line)',
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black"
                    style={{
                      backgroundColor: 'var(--p-panel-2)',
                      color: 'var(--p-text-2)',
                    }}
                  >
                    2º
                  </span>
                  <span
                    className="truncate text-sm font-extrabold"
                    style={{ color: 'var(--p-text)' }}
                  >
                    Halcones Verdes
                  </span>
                </div>
                <span
                  className="shrink-0 font-projector text-xl font-black tabular-numbers"
                  style={{ color: 'var(--p-text-2)' }}
                >
                  95
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

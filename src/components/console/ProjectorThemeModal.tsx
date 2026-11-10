import React, { useState } from 'react';
import { BroadcastTheme, LiveSceneSettings } from '../../types/masterStudio';
import {
  Palette,
  X,
  Check,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Zap,
  Sliders,
  Tv,
  Flame,
  Sun,
  Layers,
  Crown,
} from 'lucide-react';

interface ProjectorThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: LiveSceneSettings;
  onUpdateScene: (scene: LiveSceneSettings) => void;
}

interface ThemeDefinition {
  id: BroadcastTheme;
  title: string;
  category: string;
  description: string;
  gradientClass: string;
  textColor: string;
  badgeColor: string;
  borderPreview: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const THEMES: ThemeDefinition[] = [
  {
    id: 'broadcast-dark',
    title: 'Broadcast Nocturno',
    category: 'Estudio Clásico',
    description: 'Gradiente radial azul oscuro profundo con viñeta suave de estudio de televisión.',
    gradientClass: 'from-slate-900 via-slate-950 to-black',
    textColor: 'text-blue-200',
    badgeColor: 'bg-blue-600',
    borderPreview: 'border-blue-500/50',
    icon: Tv,
  },
  {
    id: 'sports-neon',
    title: 'Sports Arena Neon',
    category: 'Deportes',
    description: 'Noche azul marino profundo con haces de reflectores y resplandor cian eléctrico.',
    gradientClass: 'from-[#031329] via-[#051c3d] to-[#020b18]',
    textColor: 'text-cyan-300',
    badgeColor: 'bg-cyan-500 text-slate-950',
    borderPreview: 'border-cyan-400/60',
    icon: Zap,
  },
  {
    id: 'tv-game-gold',
    title: 'TV Game Show Gold',
    category: 'Concurso Televisivo',
    description: 'Púrpura y zafiro de gala con resplandor dorado y destellos estelares luminosos.',
    gradientClass: 'from-indigo-950 via-purple-950 to-slate-950',
    textColor: 'text-amber-300',
    badgeColor: 'bg-amber-500 text-slate-950',
    borderPreview: 'border-amber-400/60',
    icon: Crown,
  },
  {
    id: 'cyber-arcade',
    title: 'Cyber Arcade Retro',
    category: 'Futurista & Retro',
    description: 'Gradiente violeta y magenta con cuadrícula láser de perspectiva en la base.',
    gradientClass: 'from-[#1a052e] via-[#120324] to-[#0a0015]',
    textColor: 'text-pink-300',
    badgeColor: 'bg-fuchsia-600',
    borderPreview: 'border-fuchsia-400/60',
    icon: Sparkles,
  },
  {
    id: 'parchment-gold',
    title: 'Papiro & Oro Clásico',
    category: 'Solemne & Histórico',
    description: 'Tonos pergamino cálidos y oro envejecido, ideal para competencias bíblicas y galas.',
    gradientClass: 'from-[#2a1708] via-[#1f1207] to-[#120a04]',
    textColor: 'text-amber-200',
    badgeColor: 'bg-amber-600 text-amber-950',
    borderPreview: 'border-amber-500/60',
    icon: Layers,
  },
  {
    id: 'versus-fire',
    title: 'Versus & Furia de Fuego',
    category: 'Alta Intensidad',
    description: 'Carmesí dramático y resplandor de brasas para duelos a muerte y rondas decisivas.',
    gradientClass: 'from-[#380404] via-[#240606] to-[#0f0202]',
    textColor: 'text-red-400',
    badgeColor: 'bg-red-600',
    borderPreview: 'border-red-500/60',
    icon: Flame,
  },
  {
    id: 'broadcast-light',
    title: 'Broadcast Diurno',
    category: 'Día & Auditorios Iluminados',
    description: 'Gris perla y blanco de alto contraste con tarjetas oscuras para ambientes iluminados.',
    gradientClass: 'from-slate-100 via-white to-slate-200',
    textColor: 'text-slate-800',
    badgeColor: 'bg-slate-700 text-white',
    borderPreview: 'border-slate-300',
    icon: Sun,
  },
  {
    id: 'chroma-green',
    title: 'Croma Verde Puro (#00FF00)',
    category: 'OBS / vMix Broadcast',
    description: 'Fondo plano sin sombras ni gradientes para transparencia instantánea con Chroma Key.',
    gradientClass: 'from-[#00FF00] to-[#00FF00]',
    textColor: 'text-black',
    badgeColor: 'bg-emerald-600 text-white',
    borderPreview: 'border-emerald-400',
    icon: Tv,
  },
  {
    id: 'high-contrast',
    title: 'Alto Contraste (Salones Iluminados)',
    category: 'Proyectores & TV con Luz',
    description: 'Fondo negro puro (#000000), paneles #111111 y bordes blancos de máxima nitidez para salones muy iluminados.',
    gradientClass: 'from-black via-[#111111] to-black',
    textColor: 'text-white',
    badgeColor: 'bg-white text-slate-950',
    borderPreview: 'border-white',
    icon: Sun,
  },
  {
    id: 'custom',
    title: 'Fondo Personalizado',
    category: 'Imagen Propia / URL',
    description: 'Sube el logo de tu evento, un estadio o pega una URL con opacidad y desenfoque.',
    gradientClass: 'from-slate-800 via-indigo-950 to-slate-900',
    textColor: 'text-blue-300',
    badgeColor: 'bg-indigo-600',
    borderPreview: 'border-indigo-400/60',
    icon: ImageIcon,
  },
];

export const ProjectorThemeModal: React.FC<ProjectorThemeModalProps> = ({
  isOpen,
  onClose,
  scene,
  onUpdateScene,
}) => {
  const [customUrl, setCustomUrl] = useState(scene.customBgImage || '');

  if (!isOpen) return null;

  const currentTheme = scene.theme || 'broadcast-dark';
  const overlayOpacity = scene.customOverlayOpacity ?? 40;
  const bgBlur = scene.customBgBlur ?? 0;

  const handleSelectTheme = (themeId: BroadcastTheme) => {
    onUpdateScene({
      ...scene,
      theme: themeId,
    });
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    onUpdateScene({
      ...scene,
      theme: 'custom',
      customBgImage: customUrl.trim(),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 3MB max to prevent storage exhaustion
    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen no debe superar los 3 MB para garantizar sincronización rápida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCustomUrl(base64);
        onUpdateScene({
          ...scene,
          theme: 'custom',
          customBgImage: base64,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOverlayChange = (val: number) => {
    onUpdateScene({
      ...scene,
      customOverlayOpacity: val,
    });
  };

  const handleBlurChange = (val: number) => {
    onUpdateScene({
      ...scene,
      customBgBlur: val,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1120] text-slate-100 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-amber-500 p-0.5 shadow-md shadow-blue-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Palette className="h-5 w-5 text-amber-400" strokeWidth={2.2} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold uppercase tracking-wider text-white">
                  Motor de Temas y Fondo de Proyección
                </h2>
                <span className="rounded bg-blue-600/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300 border border-blue-500/40">
                  9 Estilos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Aplica en vivo en todas las vistas del proyector (#projector) y monitor integrado
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Cerrar selector de temas"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* THEMES GRID (9 THEMES) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" strokeWidth={2.2} />
                <span>Estilos Visuales Preconfigurados</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Tema activo actual:{' '}
                <strong className="text-white">
                  {THEMES.find((t) => t.id === currentTheme)?.title || currentTheme}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {THEMES.map((t) => {
                const Icon = t.icon;
                const isSelected = currentTheme === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`group relative rounded-xl border-2 p-3.5 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-slate-900/90 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/40 scale-[1.02]'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80 hover:scale-[1.01]'
                    }`}
                  >
                    {/* Visual Preview Box */}
                    <div
                      className={`h-20 w-full rounded-lg bg-gradient-to-br ${t.gradientClass} border ${t.borderPreview} relative overflow-hidden mb-3 shadow-inner flex flex-col justify-between p-2.5`}
                    >
                      {/* Theme preview details */}
                      <div className="flex items-center justify-between z-10">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${t.badgeColor} shadow-sm`}>
                          {t.category}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-[10px] font-black text-white shadow">
                            <Check className="w-3 h-3" strokeWidth={3} />
                            <span>AL AIRE</span>
                          </span>
                        )}
                      </div>

                      {/* Mini watermark simulation */}
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold opacity-80 z-10">
                        <span className={t.textColor}>120 - 100</span>
                        <span className={t.textColor}>10:00</span>
                      </div>

                      {/* Specific mini aesthetic layers */}
                      {t.id === 'sports-neon' && (
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-400/25 via-transparent to-transparent pointer-events-none" />
                      )}
                      {t.id === 'tv-game-gold' && (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
                      )}
                      {t.id === 'cyber-arcade' && (
                        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-fuchsia-500/20 to-transparent pointer-events-none" />
                      )}
                      {t.id === 'versus-fire' && (
                        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-red-600/30 to-transparent pointer-events-none" />
                      )}
                    </div>

                    {/* Meta info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 rounded-md bg-slate-800 text-white shrink-0">
                          <Icon className="w-4 h-4" strokeWidth={2.2} />
                        </div>
                        <h3 className="font-extrabold text-sm text-white group-hover:text-blue-300 transition-colors">
                          {t.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CUSTOM BACKGROUND CONTROLS (WHEN 'custom' IS SELECTED OR CONFIGURED) */}
          <div className="rounded-xl border border-indigo-900/60 bg-gradient-to-b from-indigo-950/30 to-slate-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Sliders className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Configuración de Fondo Personalizado
                  </h4>
                  <p className="text-xs text-slate-400">
                    Sube una foto corporativa, estadio o textura para proyectarla de fondo
                  </p>
                </div>
              </div>

              {currentTheme !== 'custom' && (
                <button
                  onClick={() => handleSelectTheme('custom')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
                >
                  Activar Modo Personalizado
                </button>
              )}
            </div>

            {/* Inputs: URL and Local Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              {/* Option A: Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Pegar URL de Imagen (HTTPS):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleApplyCustomUrl}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {/* Option B: Local File Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  O subir imagen desde tu dispositivo (JPG, PNG, WebP):
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-indigo-400" strokeWidth={2.2} />
                  <span>Seleccionar Archivo Local</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Sliders: Dark Overlay & Blur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              {/* Dark Overlay Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Capa de Oscurecimiento (Contraste):</span>
                  <span className="font-mono text-indigo-300">{overlayOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={overlayOpacity}
                  onChange={(e) => handleOverlayChange(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">
                  Ayuda a que los textos y números del marcador sean 100% legibles.
                </span>
              </div>

              {/* Blur Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Desenfoque de Fondo (Blur):</span>
                  <span className="font-mono text-indigo-300">{bgBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={bgBlur}
                  onChange={(e) => handleBlurChange(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">
                  Difumina elementos complejos de la foto para mayor elegancia.
                </span>
              </div>
            </div>

            {/* Quick preset backgrounds */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                Fondos rápidos sugeridos:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const url = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1600&auto=format&fit=crop';
                    setCustomUrl(url);
                    onUpdateScene({ ...scene, theme: 'custom', customBgImage: url, customOverlayOpacity: 60, customBgBlur: 3 });
                  }}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-medium"
                >
                  🏟️ Estadio con Luces
                </button>
                <button
                  onClick={() => {
                    const url = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop';
                    setCustomUrl(url);
                    onUpdateScene({ ...scene, theme: 'custom', customBgImage: url, customOverlayOpacity: 50, customBgBlur: 2 });
                  }}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-medium"
                >
                  🎮 Escenario Gamer / Luces Neon
                </button>
                <button
                  onClick={() => {
                    const url = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop';
                    setCustomUrl(url);
                    onUpdateScene({ ...scene, theme: 'custom', customBgImage: url, customOverlayOpacity: 55, customBgBlur: 2 });
                  }}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-medium"
                >
                  ✨ Gala de Luces y Concierto
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-3 shrink-0">
          <div className="text-xs text-slate-400">
            Los cambios se guardan y sincronizan automáticamente en tiempo real.
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/30 transition-all active:scale-98"
          >
            <Check className="w-4 h-4" strokeWidth={2.5} />
            <span>Listo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

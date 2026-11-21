import React, { useState } from 'react';
import { BroadcastTheme, LiveSceneSettings } from '../../types/masterStudio';
import {
  Palette,
  X,
  Check,
  Upload,
  Sliders,
} from 'lucide-react';
import { EventBrandEditor } from './EventBrandEditor';

interface ProjectorThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: LiveSceneSettings;
  onUpdateScene: (scene: LiveSceneSettings) => void;
}

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
              <h2 className="text-base font-extrabold uppercase tracking-wider text-white">
                Marca del evento y fondo
              </h2>
              <p className="text-xs text-slate-400">
                Aplica en vivo en todas las vistas del proyector y monitor integrado
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* EVENT BRAND EDITOR */}
          <EventBrandEditor scene={scene} onUpdateScene={onUpdateScene} />

          {/* CUSTOM BACKGROUND CONTROLS */}
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

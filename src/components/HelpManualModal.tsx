import React from 'react';
import {
  X,
  HelpCircle,
  Tv,
  Edit3,
  ExternalLink,
  Users,
  Video,
  CheckCircle2,
} from 'lucide-react';

interface HelpManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpManualModal: React.FC<HelpManualModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 sm:p-8 shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-scoreboard text-xl font-bold text-white">
                Manual del Operador: Scoreboard Studio
              </h2>
              <p className="text-xs text-slate-400">
                Guía rápida de configuración y operación en vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal de manual"
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="mt-6 flex flex-col gap-6 text-sm">
          {/* Section 1: Cómo editar nombres de equipos */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
              <Edit3 className="h-4 w-4" />
              <h3 className="text-base text-white">1. Cómo Editar los Nombres de los Equipos / Jugadores</h3>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 ml-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>En Modo 1 vs 1:</strong> En cada tarjeta de equipo (Local y Visitante) encontrarás la casilla <span className="text-blue-300 font-semibold">"Nombre del Equipo / Jugador"</span>. Simplemente haz clic dentro del campo de texto y escribe el nombre deseado. El cambio se reflejará instantáneamente en la pantalla del proyector.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>En Modo Multijugador:</strong> Cada tarjeta de participante en la grilla cuenta con una casilla de texto editable en el encabezado. Haz clic y renómbralo al instante.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Colores Identificativos:</strong> Puedes pulsar cualquier círculo de color predeterminado o el selector de color personalizado para cambiar el tono de cada equipo.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 2: Configuración de doble pantalla */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
              <Tv className="h-4 w-4" />
              <h3 className="text-base text-white">2. Configuración de Doble Pantalla y Proyector</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-2">
              El sistema utiliza la tecnología nativa <span className="font-mono text-indigo-300">BroadcastChannel</span> para sincronizar múltiples pestañas en el mismo navegador sin depender de internet o servidores:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-300 ml-1">
              <li>Haz clic en el botón rojo superior <strong>"Abrir Pantalla de Proyección"</strong>.</li>
              <li>Arrastra la ventana emergente que se abre hacia tu proyector, televisor secundario o segunda pantalla.</li>
              <li>Presiona la tecla <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-xs border border-slate-700">F11</kbd> en la ventana del proyector para ponerla a pantalla completa limpia.</li>
              <li>Mantén la Consola del Operador en tu pantalla principal para controlar puntajes y reloj.</li>
            </ol>
            <p className="mt-2 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-500/30 rounded-xl p-2.5">
              💡 <em>Nota: Si tu navegador bloquea ventanas emergentes, puedes abrir una pestaña nueva con la URL terminada en <code>?view=projector</code> o usar el botón <strong>"Modo Prueba (Vista Dividida)"</strong>.</em>
            </p>
          </div>

          {/* Section 3: Uso con OBS Studio y vMix (Chroma Key) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
              <Video className="h-4 w-4" />
              <h3 className="text-base text-white">3. Integración con OBS Studio / vMix / Streaming</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-2">
              Para incrustar el marcador sobre transmisiones en vivo:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 ml-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  En la consola, en el panel <strong>Fondo de Proyección</strong>, selecciona <strong>"Verde Chroma (#00FF00)"</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  En OBS, agrega una fuente de tipo <strong>"Captura de Ventana"</strong> o <strong>"Navegador"</strong> apuntando a la URL del proyector.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Aplica el filtro <strong>"Filtro de Color / Fondo Croma"</strong> (Color Key / Chroma Key) seleccionando Verde. ¡El fondo desaparecerá y quedará solo el marcador flotando sobre tu transmisión!
                </span>
              </li>
            </ul>
          </div>

          {/* Section 4: Motor de Deportes y Gestor de Rondas */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
              <ExternalLink className="h-4 w-4" />
              <h3 className="text-base text-white">4. Motor de Deportes y Gestor de Rondas</h3>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 ml-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Plantillas Preconfiguradas:</strong> Pulsa el botón "Plantilla" en el marcador para elegir entre Básquetbol (+1/+2/+3, cuartos, posesión), Voleibol (Sets a 25/11 con reseteo), Fútbol (+1, tiempos, tarjetas), Combate, Trivia (+100/+200/+500) o 100% Personalizado.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Comportamiento de Rondas:</strong> En modo <em>Acumulativo</em>, los puntos se mantienen y se archiva el parcial. En modo <em>Sets</em>, el ganador de la ronda suma +1 set ganado y el marcador se reinicia a 0.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Corrección Humana:</strong> Pulsa "Historial" en cualquier momento para corregir o auditar puntajes de rondas finalizadas.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 5: Control de Capas en Vivo (Live HUD) y Efectos */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold mb-2">
              <ExternalLink className="h-4 w-4" />
              <h3 className="text-base text-white">5. Control de Capas en Vivo (Live HUD) y Efectos</h3>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 ml-1">
              <li>
                <strong>Interruptores de Capas:</strong> En el panel "Control de Capas en Vivo", enciende o apaga al instante el Reloj, las Rondas, el Historial, las Faltas, la Posesión o los Títulos. El proyector se reacomodará automáticamente sin huecos vacíos.
              </li>
              <li>
                <strong>Modo Suspenso:</strong> Desactiva la casilla "Puntajes Principales" para ocultar los puntos en la proyección mientras los sigues sumando en tu consola.
              </li>
              <li>
                <strong>Modo Tabla Resumen:</strong> Alterna entre el marcador en duelo y la tabla de resumen de rondas/posiciones.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30"
          >
            Entendido, volver a la Consola
          </button>
        </div>
      </div>
    </div>
  );
};

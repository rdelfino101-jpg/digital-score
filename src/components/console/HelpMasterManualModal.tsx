import React from 'react';
import {
  X,
  Tv,
  Gamepad2,
  Users,
  Zap,
  Volume2,
  Columns,
  ExternalLink,
  Keyboard,
} from 'lucide-react';

interface HelpMasterManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpMasterManualModal: React.FC<HelpMasterManualModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-sans">
              Manual de Operación: Master Studio Pro
            </h2>
            <p className="text-xs text-slate-400">
              Guía rápida para transmisiones en vivo, eventos deportivos y dinámicas interactivas.
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm">
          {/* Section 1: Dual Screen Setup */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2 mb-2 text-blue-400">
              <ExternalLink className="w-4 h-4" />
              <span>1. Configuración de Doble Pantalla (Proyector o Pantalla Externa)</span>
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs">
              <li>
                Haz clic en el botón superior <strong>"Abrir Proyección"</strong> o abre en otra pestaña/pantalla la URL con <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono">#projector</code> o <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono">?view=projector</code>.
              </li>
              <li>
                Arrastra esa ventana a tu segunda pantalla o proyector y presiona <strong>F11</strong> para ponerla en pantalla completa limpia (sin botones ni barras).
              </li>
              <li>
                La sincronización es <strong>instantánea y automática</strong> gracias al canal nativo <code className="text-emerald-400 font-mono">BroadcastChannel</code> y respaldo continuo de almacenamiento local.
              </li>
              <li>
                Si estás probando en un solo monitor o tu navegador bloquea popups, activa <strong>"Vista Dividida"</strong> para ver el resultado en vivo al lado.
              </li>
            </ul>
          </div>

          {/* Section 2: Unified Team and Turn System */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2 mb-2 text-amber-400">
              <Users className="w-4 h-4" />
              <span>2. Sistema Unificado de Equipos y Turnos</span>
            </h3>
            <p className="text-xs text-slate-300 mb-2">
              Los equipos de la barra lateral izquierda son la <strong>fuente única de verdad</strong> para toda la competencia:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
              <li>El equipo con el recuadro brillante tiene el <strong>Turno Activo</strong> actual.</li>
              <li>Al pulsar "Asignar Puntos" en cualquier juego, se le acreditan automáticamente al equipo en turno.</li>
              <li><strong>Modo Robo de Puntos (Steal):</strong> Si un equipo falla y otro responde, activa el botón de Robo o pasa el turno con <code className="text-blue-300">&gt;&gt; Siguiente</code>.</li>
              <li>Puedes agregar de 2 hasta 12 equipos con nombres y colores personalizados.</li>
            </ul>
          </div>

          {/* Section 3: The 7 Game Dynamics */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2 mb-2 text-purple-400">
              <Gamepad2 className="w-4 h-4" />
              <span>3. Las 7 Dinámicas de Game Show Disponibles</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <strong className="text-amber-300 block">1. ¿En qué libro de la Biblia está?</strong>
                3 modalidades de juego: Por Testamento (AT/NT), 4 opciones múltiples o a ciegas (Cita directa).
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <strong className="text-blue-300 block">2. ¿Quién lo dijo?</strong>
                Frases y citas célebres con pista contextual y revelación en vivo de autor.
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <strong className="text-red-300 block">3. Ahorcado Pro</strong>
                Teclado interactivo A-Z con contador de 6 fallos (strikes) y revelación letra por letra.
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <strong className="text-purple-300 block">4. Charadas / Actúalo contra el Reloj</strong>
                Rondas contrarreloj (30s, 60s o 90s) donde se acumulan palabras adivinadas.
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <strong className="text-cyan-300 block">5. 100 Personas Dijeron</strong>
                Tablero estilo Family Feud con respuestas volteables, pozo de puntos acumulativo y 3 strikes (X).
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <strong className="text-emerald-300 block">6. Trivia Show 50:50</strong>
                Preguntas de opción múltiple con comodín 50:50 que descarta dos opciones falsas al instante.
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 sm:col-span-2">
                <strong className="text-pink-300 block">7. Palabra Desordenada + Ruleta de Retos</strong>
                Palabra con letras mezcladas para descifrar, y Ruleta animada con premios/castigos y retos sorpresa.
              </div>
            </div>
          </div>

          {/* Section 4: TV Scene Switcher */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2 mb-2 text-emerald-400">
              <Zap className="w-4 h-4" />
              <span>4. Selector Maestro de Escenas (Director de TV)</span>
            </h3>
            <p className="text-xs text-slate-300">
              En cualquier momento puedes alternar lo que ve el público en el proyector usando la barra superior:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 bg-amber-600/30 border border-amber-500 rounded text-amber-300 text-xs font-bold">
                [ESCENARIO JUEGOS]
              </span>
              <span className="px-2 py-1 bg-blue-600/30 border border-blue-500 rounded text-blue-300 text-xs font-bold">
                [MARCADOR GIGANTE]
              </span>
              <span className="px-2 py-1 bg-emerald-600/30 border border-emerald-500 rounded text-emerald-300 text-xs font-bold">
                [TABLA POSICIONES]
              </span>
              <span className="px-2 py-1 bg-purple-600/30 border border-purple-500 rounded text-purple-300 text-xs font-bold">
                [PODIO / GANADORES]
              </span>
              <span className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 text-xs font-bold">
                [PANTALLA NEGRA]
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            Entendido, volver a la consola
          </button>
        </div>
      </div>
    </div>
  );
};

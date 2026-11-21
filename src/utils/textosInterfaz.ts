import type { MasterViewMode } from '../types/masterStudio';

/** Nombre legible de cada escena para la consola (sin códigos internos) */
export function nombreEscena(modo: MasterViewMode | string): string {
  switch (modo) {
    case 'SCOREBOARD_ONLY':
      return 'Marcador';
    case 'LEADERBOARD_FULL':
      return 'Tabla de posiciones';
    case 'GAME_STAGE':
      return 'Juego';
    case 'RAFFLE_STAGE':
      return 'Sorteo';
    case 'PODIUM_CELEBRATION':
      return 'Podio';
    case 'BLACKOUT':
      return 'Pantalla en pausa';
    default:
      return 'Escena';
  }
}

/** Traduce códigos de error del servidor a mensajes para el voluntario */
export function mensajeErrorRemoto(error: string | null | undefined): string | null {
  if (!error) return null;
  if (error === 'PIN_REQUIRED') return 'Escribe el PIN de operador para usar los botones.';
  if (/^[A-Z_]+$/.test(error)) return 'No se pudo conectar con la consola. Revisa el PIN e intenta de nuevo.';
  return error;
}

import type { MasterLiveState, TimerMode } from '../types/masterStudio';
import {
  normalizeChar,
  processFamilyFeudReveal,
  processFamilyFeudStrike,
  processHangmanGuess,
} from './gameEngineRules';

/* -------------------------------------------------------------
 * Acciones del control remoto
 *
 * Reproducen lo que hacen los botones de la consola, como funciones puras
 * sobre el estado. La consola (App.tsx) aplica el cambio y, cuando la acción
 * da puntos, los entrega con el mismo camino que los botones del juego
 * (así funcionan Deshacer, el cambio de turno y los pulsadores).
 * ------------------------------------------------------------- */

export type Actualizador = (prev: MasterLiveState) => MasterLiveState;

export interface ResultadoAccion {
  /** Cambio de estado del juego (marcar revelado, avanzar palabra, etc.) */
  actualizar?: Actualizador;
  /** Puntos para el equipo en turno */
  puntos?: number;
  etiqueta?: string;
  /** La acción cuenta como error (sonido, robo y pulsador al siguiente) */
  esError?: boolean;
  /** Después de dar los puntos, pasar al siguiente equipo */
  siguienteTurno?: boolean;
}

const conJuego = <K extends keyof MasterLiveState['gameStage']>(
  clave: K,
  cambio: (actual: MasterLiveState['gameStage'][K]) => MasterLiveState['gameStage'][K]
): Actualizador => (prev) => ({
  ...prev,
  gameStage: { ...prev.gameStage, [clave]: cambio(prev.gameStage[clave]) },
});

/** ¡Correcto! del juego activo. Devuelve null si ese juego no tiene esta acción. */
export function accionCorrecto(s: MasterLiveState): ResultadoAccion | null {
  const g = s.gameStage;
  switch (g.activeGameId) {
    case 'bible_book': {
      const item = g.bibleBook.items[g.bibleBook.currentIndex];
      if (!item || g.bibleBook.pointsAwarded) return null;
      return {
        actualizar: conJuego('bibleBook', (st) => ({ ...st, revealed: true, pointsAwarded: true })),
        puntos: item.points,
        etiqueta: `Acierto en ¿En qué libro está? (${item.book})`,
      };
    }
    case 'who_said_it': {
      const item = g.whoSaidIt.items[g.whoSaidIt.currentIndex];
      if (!item || g.whoSaidIt.pointsAwarded) return null;
      return {
        actualizar: conJuego('whoSaidIt', (st) => ({ ...st, revealed: true, pointsAwarded: true })),
        puntos: item.points,
        etiqueta: `Acierto en ¿Quién lo dijo? (${item.author})`,
      };
    }
    case 'hangman': {
      const item = g.hangman.items[g.hangman.currentIndex];
      if (!item || g.hangman.pointsAwarded) return null;
      return {
        actualizar: conJuego('hangman', (st) => ({ ...st, solved: true, pointsAwarded: true })),
        puntos: item.pointsSolve,
        etiqueta: `Palabra resuelta en Ahorcado (${item.word})`,
      };
    }
    case 'anagram_wheel': {
      const st = g.anagramWheel;
      const item = st.items[st.currentIndex];
      if (!item || st.pointsAwarded) return null;
      let bonus = item.points;
      if (st.selectedReward?.type === 'double_points') bonus *= 2;
      else if (st.selectedReward?.type === 'points_bonus' && st.selectedReward.value) bonus += st.selectedReward.value;
      return {
        actualizar: conJuego('anagramWheel', (x) => ({ ...x, revealed: true, pointsAwarded: true })),
        puntos: bonus,
        etiqueta: `Anagrama resuelto (${item.originalWord})`,
      };
    }
    case 'trivia_show': {
      const item = g.triviaShow.items[g.triviaShow.currentIndex];
      if (!item || g.triviaShow.pointsAwarded) return null;
      return {
        actualizar: conJuego('triviaShow', (st) => ({
          ...st,
          selectedOption: item.correctAnswer,
          revealed: true,
          pointsAwarded: true,
        })),
        puntos: item.points,
        etiqueta: `Acierto en Trivia (${item.question.slice(0, 25)}…)`,
      };
    }
    case 'family_feud': {
      const pozo = g.familyFeud.potScore;
      if (!pozo) return null;
      return {
        actualizar: (prev) => ({
          ...prev,
          gameStage: {
            ...prev.gameStage,
            familyFeud: { ...prev.gameStage.familyFeud, potScore: 0, potAwardedTeamId: prev.turn.activeTeamId },
          },
          turn: { ...prev.turn, stealMode: false },
        }),
        puntos: pozo,
        etiqueta: `Pozo ganado en 100 Dijeron (+${pozo} pts)`,
      };
    }
    case 'charades':
      return accionCharadaAcierto(s);
    case 'music_karaoke': {
      const st = g.musicKaraoke;
      const item = st.items[st.currentIndex];
      if (!item || st.revealedSong) return null;
      const pts =
        st.activeSnippetSeconds === 1 ? 200 : st.activeSnippetSeconds === 3 ? 150 : st.activeSnippetSeconds === 5 ? 100 : item.points || 100;
      return {
        actualizar: conJuego('musicKaraoke', (x) => ({ ...x, revealedSong: true })),
        puntos: pts,
        etiqueta: `Adivinó la canción: ${item.title}`,
      };
    }
    default:
      return null; // Millonario y Trato Hecho tienen su propio flujo en la consola
  }
}

/** Fallo del juego activo */
export function accionFallo(s: MasterLiveState): ResultadoAccion {
  const g = s.gameStage;
  if (g.activeGameId === 'trivia_show') {
    return { actualizar: conJuego('triviaShow', (st) => ({ ...st, revealed: true })), esError: true };
  }
  if (g.activeGameId === 'family_feud') {
    return {
      actualizar: (prev) => {
        const feud = processFamilyFeudStrike(prev.gameStage.familyFeud);
        return {
          ...prev,
          gameStage: { ...prev.gameStage, familyFeud: feud },
          turn: { ...prev.turn, stealMode: feud.strikes >= 3 },
        };
      },
      esError: true,
    };
  }
  return { esError: true };
}

/** Letra en el Ahorcado. esError cuando falla y toca robo o se acabaron los intentos. */
export function accionLetraAhorcado(s: MasterLiveState, letra: string): ResultadoAccion | null {
  const st = s.gameStage.hangman;
  const item = st.items[st.currentIndex];
  const norm = normalizeChar(letra);
  if (!item || st.solved || st.gameOver || st.guessedLetters.some((l) => normalizeChar(l) === norm)) return null;
  const acierta = item.word.split('').some((ch) => normalizeChar(ch) === norm);
  return {
    actualizar: conJuego('hangman', (x) => processHangmanGuess(x, letra)),
    esError: !acierta && (s.turn.stealMode || st.strikes + 1 >= st.maxStrikes),
  };
}

/** Destapar (o tapar) una respuesta de 100 Dijeron */
export function accionDestaparRespuesta(answerId: string): ResultadoAccion {
  return { actualizar: conJuego('familyFeud', (x) => processFamilyFeudReveal(x, answerId)) };
}

export function accionCharadaAcierto(s: MasterLiveState): ResultadoAccion | null {
  const st = s.gameStage.charades;
  const item = st.items[st.currentIndex];
  if (!item) return null;
  return {
    actualizar: conJuego('charades', (x) => ({
      ...x,
      currentIndex: (x.currentIndex + 1) % x.items.length,
      correctCount: x.correctCount + 1,
      guessedWordIds: [...x.guessedWordIds, item.id],
    })),
  };
}

export function accionCharadaPasar(): ResultadoAccion {
  return {
    actualizar: conJuego('charades', (x) => ({
      ...x,
      currentIndex: (x.currentIndex + 1) % Math.max(1, x.items.length),
      skippedCount: x.skippedCount + 1,
    })),
  };
}

export function accionCharadaReloj(): ResultadoAccion {
  return { actualizar: conJuego('charades', (x) => ({ ...x, isRunning: !x.isRunning })) };
}

const reiniciarCharada = (x: MasterLiveState['gameStage']['charades'], segundos = 60) => ({
  ...x,
  roundSeconds: segundos,
  remainingSeconds: segundos,
  isRunning: false,
  correctCount: 0,
  skippedCount: 0,
  pointsAwarded: false,
});

export function accionCharadaReiniciar(segundos = 60): ResultadoAccion {
  return { actualizar: conJuego('charades', (x) => reiniciarCharada(x, segundos)) };
}

/** Da los puntos de la ronda de charadas (50 por acierto) y deja lista la siguiente */
export function accionCharadaPuntos(s: MasterLiveState): ResultadoAccion | null {
  const aciertos = s.gameStage.charades.correctCount;
  if (aciertos <= 0) return null;
  return {
    actualizar: conJuego('charades', (x) => reiniciarCharada(x, 60)),
    puntos: aciertos * 50,
    etiqueta: `Ronda de Charadas (${aciertos} aciertos)`,
    siguienteTurno: true,
  };
}

/** Opción elegida en Trivia (sin revelar todavía) */
export function accionElegirOpcionTrivia(opcion: 'A' | 'B' | 'C' | 'D'): ResultadoAccion {
  return { actualizar: conJuego('triviaShow', (x) => ({ ...x, selectedOption: opcion, revealed: false })) };
}

/* ---------- Marcador ---------- */

export const siguienteRonda: Actualizador = (prev) => {
  const sb = prev.scoreboard;
  const puntajes: Record<string, number> = {};
  prev.teams.forEach((t) => {
    puntajes[t.id] = t.score;
  });
  return {
    ...prev,
    scoreboard: {
      ...sb,
      currentRound: sb.currentRound + 1,
      roundHistory: [
        ...sb.roundHistory,
        { roundNumber: sb.currentRound, label: `${sb.periodTypeLabel} ${sb.currentRound}`, scores: puntajes },
      ],
    },
  };
};

export const rondaAnterior: Actualizador = (prev) => ({
  ...prev,
  scoreboard: { ...prev.scoreboard, currentRound: Math.max(1, prev.scoreboard.currentRound - 1) },
});

export const ajustarReloj = (segundos: number): Actualizador => (prev) => {
  const t = prev.timer;
  return t.mode === 'countdown'
    ? { ...prev, timer: { ...t, secondsRemaining: Math.max(0, t.secondsRemaining + segundos) } }
    : { ...prev, timer: { ...t, stopwatchSeconds: Math.max(0, t.stopwatchSeconds + segundos) } };
};

export const modoReloj = (modo: TimerMode): Actualizador => (prev) => ({
  ...prev,
  timer: { ...prev.timer, mode: modo, isRunning: modo === 'off' ? false : prev.timer.isRunning },
});

export const cintillo = (cambios: { activo?: boolean; mensaje?: string }): Actualizador => (prev) => ({
  ...prev,
  scene: {
    ...prev.scene,
    tickerActive: typeof cambios.activo === 'boolean' ? cambios.activo : prev.scene.tickerActive,
    tickerMessage: typeof cambios.mensaje === 'string' ? cambios.mensaje.slice(0, 280) : prev.scene.tickerMessage,
  },
});

/* ---------- Pregunta anterior / siguiente ---------- */

const CLAVE_DE_JUEGO: Record<MasterLiveState['gameStage']['activeGameId'], keyof MasterLiveState['gameStage'] | null> = {
  bible_book: 'bibleBook',
  who_said_it: 'whoSaidIt',
  hangman: 'hangman',
  charades: 'charades',
  family_feud: 'familyFeud',
  trivia_show: 'triviaShow',
  anagram_wheel: 'anagramWheel',
  music_karaoke: 'musicKaraoke',
  millionaire_show: 'millionaireShow',
  deal_or_nodeal: null,
};

/**
 * Cambia a la pregunta anterior o siguiente del juego activo y limpia lo de la
 * pregunta anterior (letras del ahorcado, respuestas destapadas, opción elegida…),
 * igual que al elegir una pregunta en la consola.
 */
export const moverPregunta = (paso: 1 | -1): Actualizador => (prev) => {
  const clave = CLAVE_DE_JUEGO[prev.gameStage.activeGameId];
  if (!clave) return prev;
  const st = prev.gameStage[clave] as any;
  if (!st || !Array.isArray(st.items) || st.items.length === 0) return prev;
  const n = st.items.length;
  const indice = (st.currentIndex + paso + n) % n;
  let nuevo: any = { ...st, currentIndex: indice };

  switch (clave) {
    case 'bibleBook':
      nuevo = { ...nuevo, revealed: false, selectedOption: null, pointsAwarded: false };
      break;
    case 'whoSaidIt':
      nuevo = { ...nuevo, revealed: false, selectedOption: null, pointsAwarded: false, showHint: false };
      break;
    case 'hangman':
      nuevo = { ...nuevo, guessedLetters: [], strikes: 0, solved: false, gameOver: false, pointsAwarded: false };
      break;
    case 'familyFeud':
      nuevo = { ...nuevo, potScore: 0, strikes: 0, revealedAnswerIds: [], potAwardedTeamId: null };
      break;
    case 'triviaShow':
      nuevo = { ...nuevo, selectedOption: null, revealed: false, hiddenOptions5050: [], used5050: false, pointsAwarded: false };
      break;
    case 'anagramWheel':
      nuevo = { ...nuevo, revealed: false, selectedReward: null, pointsAwarded: false };
      break;
    case 'musicKaraoke':
      nuevo = {
        ...nuevo,
        revealedSong: false,
        isMusicCut: false,
        isPlaying: false,
        activeSnippetSeconds: null,
        revealedWordsCount: 0,
        lyricsSolved: false,
        pointsAwarded: false,
      };
      break;
    case 'millionaireShow':
      nuevo = {
        ...nuevo,
        currentLevel: indice + 1,
        selectedOption: null,
        isFinalAnswer: false,
        revealed: false,
        isCorrect: null,
        hiddenOptions5050: [],
        showAudiencePoll: false,
        showPhoneCall: false,
      };
      break;
    default:
      break; // Charadas: solo cambia la palabra
  }

  return { ...prev, gameStage: { ...prev.gameStage, [clave]: nuevo } };
};

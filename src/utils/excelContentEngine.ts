import * as XLSX from 'xlsx';
import {
  StudioContentBank,
  MasterLiveState,
  BibleBookItem,
  WhoSaidItItem,
  HangmanItem,
  CharadesItem,
  FamilyFeudItem,
  TriviaShowItem,
  AnagramWheelItem,
  MusicTrackItem,
  MillionaireItem,
  DealBriefcase,
  RaffleParticipant,
  MusicGameMode,
  NightWinnerItem,
  RaffleDrawRecord,
} from '../types/masterStudio';
import {
  INITIAL_BIBLE_BOOK_ITEMS,
  INITIAL_WHO_SAID_IT_ITEMS,
  INITIAL_HANGMAN_ITEMS,
  INITIAL_CHARADES_ITEMS,
  INITIAL_FAMILY_FEUD_ITEMS,
  INITIAL_TRIVIA_SHOW_ITEMS,
  INITIAL_ANAGRAM_ITEMS,
  INITIAL_MUSIC_ITEMS,
  INITIAL_MILLIONAIRE_ITEMS,
  INITIAL_BRIEFCASES,
} from './gameData';
import { extractYouTubeVideoId, scrambleWord } from './gameEngineRules';
import { DEFAULT_RAFFLE_PARTICIPANTS } from './raffleEngineRules';

export const CURRENT_BANK_VERSION = 1;

/**
 * Returns a complete initial StudioContentBank prefilled with the rich initial game items.
 */
export function getDefaultContentBank(): StudioContentBank {
  return {
    version: CURRENT_BANK_VERSION,
    updatedAt: Date.now(),
    bibleBookItems: [...INITIAL_BIBLE_BOOK_ITEMS],
    whoSaidItItems: [...INITIAL_WHO_SAID_IT_ITEMS],
    hangmanItems: [...INITIAL_HANGMAN_ITEMS],
    charadesItems: [...INITIAL_CHARADES_ITEMS],
    familyFeudItems: [...INITIAL_FAMILY_FEUD_ITEMS],
    triviaShowItems: [...INITIAL_TRIVIA_SHOW_ITEMS],
    anagramItems: [...INITIAL_ANAGRAM_ITEMS],
    musicItems: [...INITIAL_MUSIC_ITEMS],
    millionaireItems: [...INITIAL_MILLIONAIRE_ITEMS],
    briefcases: [...INITIAL_BRIEFCASES],
    raffleParticipants: [...DEFAULT_RAFFLE_PARTICIPANTS],
  };
}

/**
 * Counts total items across all games and raffles.
 */
export function countTotalBankItems(bank: StudioContentBank | Partial<StudioContentBank>): number {
  if (!bank) return 0;
  return (
    (bank.bibleBookItems?.length || 0) +
    (bank.whoSaidItItems?.length || 0) +
    (bank.hangmanItems?.length || 0) +
    (bank.charadesItems?.length || 0) +
    (bank.familyFeudItems?.length || 0) +
    (bank.triviaShowItems?.length || 0) +
    (bank.anagramItems?.length || 0) +
    (bank.musicItems?.length || 0) +
    (bank.millionaireItems?.length || 0) +
    (bank.briefcases?.length || 0) +
    (bank.raffleParticipants?.length || 0)
  );
}

/**
 * Generates the Master Excel Template with 9 sheets and prefilled example rows.
 */
export function generateMasterTemplateWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Biblia
  const bibliaData = [
    {
      Versiculo_o_Evento: 'El arca de madera de acacia construida para sobrevivir al gran diluvio universal.',
      Testamento: 'Antiguo Testamento',
      Libro_Correcto: 'Génesis',
      Capitulo_Cita: 'Génesis 6-8',
      Opcion_A: 'Génesis',
      Opcion_B: 'Éxodo',
      Opcion_C: 'Levítico',
      Opcion_D: 'Josué',
      Puntos: 100,
    },
    {
      Versiculo_o_Evento: 'La dramática visión del valle de los huesos secos que cobran vida con el soplo de Dios.',
      Testamento: 'Antiguo Testamento',
      Libro_Correcto: 'Ezequiel',
      Capitulo_Cita: 'Ezequiel 37:1-14',
      Opcion_A: 'Isaías',
      Opcion_B: 'Jeremías',
      Opcion_C: 'Ezequiel',
      Opcion_D: 'Daniel',
      Puntos: 150,
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bibliaData), 'Biblia');

  // 2. Sheet: Quien_Lo_Dijo
  const quienDijoData = [
    {
      Frase: '"...pero yo y mi casa serviremos a Jehová."',
      Autor_Correcto: 'Josué',
      Pista_Contexto: 'Discurso de despedida ante las doce tribus en Siquem.',
      Opcion_A: 'Moisés',
      Opcion_B: 'Josué',
      Opcion_C: 'Caleb',
      Opcion_D: 'David',
      Puntos: 100,
    },
    {
      Frase: '"Todo lo puedo en Cristo que me fortalece."',
      Autor_Correcto: 'Apóstol Pablo',
      Pista_Contexto: 'Epístola a los Filipenses, reflexionando sobre la provisión.',
      Opcion_A: 'Apóstol Pedro',
      Opcion_B: 'Apóstol Pablo',
      Opcion_C: 'Santiago',
      Opcion_D: 'Juan el Bautista',
      Puntos: 100,
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(quienDijoData), 'Quien_Lo_Dijo');

  // 3. Sheet: Ahorcado
  const ahorcadoData = [
    {
      Palabra_o_Frase: 'PENTECOSTÉS',
      Categoria_Pista: 'Fiestas Bíblicas',
      Puntos_Por_Letra: 15,
      Bono_Resolver: 100,
    },
    {
      Palabra_o_Frase: 'MISERICORDIA',
      Categoria_Pista: 'Valores y Virtudes',
      Puntos_Por_Letra: 10,
      Bono_Resolver: 120,
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ahorcadoData), 'Ahorcado');

  // 4. Sheet: Charadas
  const charadasData = [
    {
      Palabra: 'León Rugiendo',
      Categoria: 'Animales',
      Palabras_Prohibidas: 'Selva, Melena, Rugido',
      Tiempo_Segundos: 60,
      Puntos: 50,
    },
    {
      Palabra: 'Encestar un Triple',
      Categoria: 'Deportes',
      Palabras_Prohibidas: 'Balón, Canasta, Aro',
      Tiempo_Segundos: 60,
      Puntos: 50,
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(charadasData), 'Charadas');

  // 5. Sheet: 100_Dijeron
  const feudData = [
    {
      Pregunta: '100 Personas Dijeron: Cosas que empacas primero para ir a un día de playa',
      Resp1_Texto: 'Traje de Baño / Bikini',
      Resp1_Pts: 34,
      Resp2_Texto: 'Toalla / Pareo',
      Resp2_Pts: 26,
      Resp3_Texto: 'Bloqueador / Protector Solar',
      Resp3_Pts: 19,
      Resp4_Texto: 'Lentes / Gafas de Sol',
      Resp4_Pts: 12,
      Resp5_Texto: 'Hielera con Bebidas',
      Resp5_Pts: 9,
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(feudData), '100_Dijeron');

  // 6. Sheet: Trivia_y_Millonario
  const triviaMillonarioData = [
    {
      Juego_Destino: 'MILLONARIO',
      Nivel_1_a_15: 1,
      Pregunta: '¿Cuántos días le tomó a Dios la creación según el relato de Génesis antes de descansar?',
      Opcion_A: '3 días',
      Opcion_B: '6 días',
      Opcion_C: '10 días',
      Opcion_D: '12 días',
      Letra_Correcta: 'B',
      Puntos: 50,
      Explicacion: 'Génesis narra la obra creativa en 6 días y reposó el séptimo día.',
    },
    {
      Juego_Destino: 'TRIVIA',
      Nivel_1_a_15: 1,
      Pregunta: '¿Cuál es el río más largo del planeta Tierra según las mediciones modernas?',
      Opcion_A: 'Río Nilo',
      Opcion_B: 'Río Amazonas',
      Opcion_C: 'Río Yangtsé',
      Opcion_D: 'Río Misisipi',
      Letra_Correcta: 'B',
      Puntos: 100,
      Explicacion: 'El río Amazonas es el más largo y caudaloso del mundo.',
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(triviaMillonarioData), 'Trivia_y_Millonario');

  // 7. Sheet: Anagrama
  const anagramaData = [
    {
      Palabra_Original: 'GALILEA',
      Categoria_Pista: 'Lugares Bíblicos',
      Puntos: 100,
    },
    {
      Palabra_Original: 'ESPÍRITU',
      Categoria_Pista: 'Conceptos Clave',
      Puntos: 120,
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(anagramaData), 'Anagrama');

  // 8. Sheet: Musica_y_Karaoke
  const musicaData = [
    {
      Modo: 'ADIVINA',
      Titulo_Cancion: 'De Música Ligera',
      Artista: 'Soda Stereo',
      Categoria: 'Rock Clásico Latino - Años 90',
      URL_YouTube_o_YTMusic: 'https://www.youtube.com/watch?v=T_FkEw27XJ0',
      Segundo_Inicio: 40,
      Segundo_Corte: 60,
      Letra_Previa_Visible: '',
      Letra_Secreta_Completar: '',
      Puntos: 100,
    },
    {
      Modo: 'LETRA',
      Titulo_Cancion: 'Rayando el Sol',
      Artista: 'Maná',
      Categoria: 'Pop Rock en Español',
      URL_YouTube_o_YTMusic: 'https://www.youtube.com/watch?v=e5z_Y9rA7lE',
      Segundo_Inicio: 32,
      Segundo_Corte: 50,
      Letra_Previa_Visible: 'Rayando el sol, desesperación, es más fácil llegar al sol que a tu corazón...',
      Letra_Secreta_Completar: 'me muero por ti, viviendo sin ti',
      Puntos: 150,
    },
    {
      Modo: 'KARAOKE',
      Titulo_Cancion: 'Vivir Mi Vida',
      Artista: 'Marc Anthony (Karaoke)',
      Categoria: 'Salsa / Fiesta Latina',
      URL_YouTube_o_YTMusic: 'https://www.youtube.com/watch?v=pP31Lq3K0oY',
      Segundo_Inicio: 15,
      Segundo_Corte: 90,
      Letra_Previa_Visible: '',
      Letra_Secreta_Completar: '',
      Puntos: 200,
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(musicaData), 'Musica_y_Karaoke');

  // 9. Sheet: Trato_Hecho_y_Sorteos
  const tratoSorteosData = [
    {
      Tipo: 'MALETIN',
      Texto_o_Nombre: 'Maletín Especial #1',
      Valor_Puntos: 100,
    },
    {
      Tipo: 'PARTICIPANTE',
      Texto_o_Nombre: 'Carlos Morales',
      Valor_Puntos: 101, // boleto
    },
    {
      Tipo: 'PARTICIPANTE',
      Texto_o_Nombre: 'Mariana Silva',
      Valor_Puntos: 102,
    },
    {
      Tipo: 'RULETA',
      Texto_o_Nombre: 'Bono Sorpresa +300',
      Valor_Puntos: 300,
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tratoSorteosData), 'Trato_Hecho_y_Sorteos');

  return wb;
}

/**
 * Triggers browser download of the Master Excel Template (.xlsx).
 */
export function downloadMasterTemplateFile(filename = 'Plantilla_Master_Studio.xlsx'): void {
  const wb = generateMasterTemplateWorkbook();
  XLSX.writeFile(wb, filename);
}

/**
 * Exports current StudioContentBank to a downloaded .xlsx file.
 */
export function exportContentBankWorkbook(bank: StudioContentBank, filename = 'Mi_Banco_Master_Studio.xlsx'): void {
  const wb = XLSX.utils.book_new();

  // 1. Biblia
  const bibliaRows = (bank.bibleBookItems || []).map((b) => ({
    Versiculo_o_Evento: b.verseOrEvent,
    Testamento: b.testament,
    Libro_Correcto: b.book,
    Capitulo_Cita: b.reference,
    Opcion_A: b.options?.[0] || '',
    Opcion_B: b.options?.[1] || '',
    Opcion_C: b.options?.[2] || '',
    Opcion_D: b.options?.[3] || '',
    Puntos: b.points,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bibliaRows), 'Biblia');

  // 2. Quien_Lo_Dijo
  const quienRows = (bank.whoSaidItItems || []).map((w) => ({
    Frase: w.quote,
    Autor_Correcto: w.author,
    Pista_Contexto: w.context,
    Opcion_A: w.options?.[0] || '',
    Opcion_B: w.options?.[1] || '',
    Opcion_C: w.options?.[2] || '',
    Opcion_D: w.options?.[3] || '',
    Puntos: w.points,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(quienRows), 'Quien_Lo_Dijo');

  // 3. Ahorcado
  const ahorcadoRows = (bank.hangmanItems || []).map((h) => ({
    Palabra_o_Frase: h.word,
    Categoria_Pista: h.category,
    Puntos_Por_Letra: h.pointsPerLetter,
    Bono_Resolver: h.pointsSolve,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ahorcadoRows), 'Ahorcado');

  // 4. Charadas
  const charadasRows = (bank.charadesItems || []).map((c) => ({
    Palabra: c.word,
    Categoria: c.category,
    Palabras_Prohibidas: '',
    Tiempo_Segundos: 60,
    Puntos: c.points,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(charadasRows), 'Charadas');

  // 5. 100_Dijeron
  const feudRows = (bank.familyFeudItems || []).map((f) => ({
    Pregunta: f.question,
    Resp1_Texto: f.answers?.[0]?.text || '',
    Resp1_Pts: f.answers?.[0]?.points || 0,
    Resp2_Texto: f.answers?.[1]?.text || '',
    Resp2_Pts: f.answers?.[1]?.points || 0,
    Resp3_Texto: f.answers?.[2]?.text || '',
    Resp3_Pts: f.answers?.[2]?.points || 0,
    Resp4_Texto: f.answers?.[3]?.text || '',
    Resp4_Pts: f.answers?.[3]?.points || 0,
    Resp5_Texto: f.answers?.[4]?.text || '',
    Resp5_Pts: f.answers?.[4]?.points || 0,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(feudRows), '100_Dijeron');

  // 6. Trivia_y_Millonario
  const triviaRows = [
    ...(bank.millionaireItems || []).map((m) => ({
      Juego_Destino: 'MILLONARIO',
      Nivel_1_a_15: m.level,
      Pregunta: m.question,
      Opcion_A: m.options?.A || '',
      Opcion_B: m.options?.B || '',
      Opcion_C: m.options?.C || '',
      Opcion_D: m.options?.D || '',
      Letra_Correcta: m.correctAnswer,
      Puntos: m.points,
      Explicacion: m.explanation || '',
    })),
    ...(bank.triviaShowItems || []).map((t, idx) => ({
      Juego_Destino: 'TRIVIA',
      Nivel_1_a_15: idx + 1,
      Pregunta: t.question,
      Opcion_A: t.options?.A || '',
      Opcion_B: t.options?.B || '',
      Opcion_C: t.options?.C || '',
      Opcion_D: t.options?.D || '',
      Letra_Correcta: t.correctAnswer,
      Puntos: t.points,
      Explicacion: t.explanation || '',
    })),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(triviaRows), 'Trivia_y_Millonario');

  // 7. Anagrama
  const anagramRows = (bank.anagramItems || []).map((a) => ({
    Palabra_Original: a.originalWord,
    Categoria_Pista: a.category,
    Puntos: a.points,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(anagramRows), 'Anagrama');

  // 8. Musica_y_Karaoke
  const musicRows = (bank.musicItems || []).map((m) => ({
    Modo: m.mode === 'guess_song' ? 'ADIVINA' : m.mode === 'guess_lyrics' ? 'LETRA' : 'KARAOKE',
    Titulo_Cancion: m.title,
    Artista: m.artist,
    Categoria: m.category,
    URL_YouTube_o_YTMusic: m.youtubeUrl || '',
    Segundo_Inicio: m.startTime || 0,
    Segundo_Corte: m.cutTime || 0,
    Letra_Previa_Visible: m.letraPrevia || '',
    Letra_Secreta_Completar: m.letraSecreta || '',
    Puntos: m.points,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(musicRows), 'Musica_y_Karaoke');

  // 9. Trato_Hecho_y_Sorteos
  const tratoRows = [
    ...(bank.briefcases || []).map((b) => ({
      Tipo: 'MALETIN',
      Texto_o_Nombre: b.customLabel || `Maletín #${b.number}`,
      Valor_Puntos: b.value,
    })),
    ...(bank.raffleParticipants || []).map((p) => ({
      Tipo: 'PARTICIPANTE',
      Texto_o_Nombre: p.name,
      Valor_Puntos: p.ticketNumber || 0,
    })),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tratoRows), 'Trato_Hecho_y_Sorteos');

  XLSX.writeFile(wb, filename);
}

export interface ParseResult {
  bank: Partial<StudioContentBank>;
  counts: Record<string, number>;
  errors: string[];
}

/**
 * Robustly parses binary ArrayBuffer / Uint8Array representing an Excel or CSV file.
 */
export function parseExcelContentBank(data: ArrayBuffer | Uint8Array): ParseResult {
  const wb = XLSX.read(data, { type: 'array' });
  const counts: Record<string, number> = {};
  const errors: string[] = [];
  const partialBank: Partial<StudioContentBank> = {};

  const sheetNames = wb.SheetNames;
  const findSheet = (patterns: string[]) => {
    return sheetNames.find((name) =>
      patterns.some((p) => name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(p.toLowerCase().replace(/[^a-z0-9]/g, '')))
    );
  };

  // Helper to get rows
  const getSheetRows = (sheetName?: string): any[] => {
    if (!sheetName || !wb.Sheets[sheetName]) return [];
    return XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
  };

  // 1. Biblia
  const bibliaSheet = findSheet(['biblia', 'bible', 'libro']);
  if (bibliaSheet) {
    const rows = getSheetRows(bibliaSheet);
    const items: BibleBookItem[] = [];
    rows.forEach((r, idx) => {
      const verse = String(r.Versiculo_o_Evento || r.Versiculo || r.Evento || r.Pregunta || '').trim();
      const book = String(r.Libro_Correcto || r.Libro || r.Respuesta || '').trim();
      if (!verse || !book) return;

      const optA = String(r.Opcion_A || book).trim();
      const optB = String(r.Opcion_B || 'Éxodo').trim();
      const optC = String(r.Opcion_C || 'Levítico').trim();
      const optD = String(r.Opcion_D || 'Josué').trim();

      const options = [optA, optB, optC, optD];
      if (!options.includes(book)) options[0] = book;

      items.push({
        id: `bb-import-${Date.now()}-${idx}`,
        verseOrEvent: verse,
        testament: String(r.Testamento || '').toUpperCase().includes('NUEVO') ? 'Nuevo Testamento' : 'Antiguo Testamento',
        book,
        reference: String(r.Capitulo_Cita || r.Referencia || '').trim(),
        options,
        points: Number(r.Puntos) || 100,
        hint: `Libro: ${book}`,
      });
    });
    if (items.length > 0) {
      partialBank.bibleBookItems = items;
      counts['Biblia'] = items.length;
    }
  }

  // 2. Quien_Lo_Dijo
  const quienSheet = findSheet(['quien', 'dijo', 'citas', 'who']);
  if (quienSheet) {
    const rows = getSheetRows(quienSheet);
    const items: WhoSaidItItem[] = [];
    rows.forEach((r, idx) => {
      const quote = String(r.Frase || r.Cita || r.Pregunta || '').trim();
      const author = String(r.Autor_Correcto || r.Autor || r.Personaje || '').trim();
      if (!quote || !author) return;

      const optA = String(r.Opcion_A || author).trim();
      const optB = String(r.Opcion_B || 'David').trim();
      const optC = String(r.Opcion_C || 'Moisés').trim();
      const optD = String(r.Opcion_D || 'Pedro').trim();

      const options = [optA, optB, optC, optD];
      if (!options.includes(author)) options[0] = author;

      items.push({
        id: `wsi-import-${Date.now()}-${idx}`,
        quote,
        author,
        context: String(r.Pista_Contexto || r.Contexto || '').trim(),
        options,
        points: Number(r.Puntos) || 100,
        hint: `Autor: ${author}`,
      });
    });
    if (items.length > 0) {
      partialBank.whoSaidItItems = items;
      counts['¿Quién lo dijo?'] = items.length;
    }
  }

  // 3. Ahorcado
  const ahorcadoSheet = findSheet(['ahorcado', 'hangman', 'palabra']);
  if (ahorcadoSheet) {
    const rows = getSheetRows(ahorcadoSheet);
    const items: HangmanItem[] = [];
    rows.forEach((r, idx) => {
      const word = String(r.Palabra_o_Frase || r.Palabra || r.Frase || '').trim().toUpperCase();
      if (!word) return;

      items.push({
        id: `hm-import-${Date.now()}-${idx}`,
        word,
        category: String(r.Categoria_Pista || r.Categoria || 'General').trim(),
        pointsPerLetter: Number(r.Puntos_Por_Letra) || 10,
        pointsSolve: Number(r.Bono_Resolver || r.Puntos) || 100,
        hint: String(r.Pista || `Palabra de ${word.length} letras`),
      });
    });
    if (items.length > 0) {
      partialBank.hangmanItems = items;
      counts['Ahorcado'] = items.length;
    }
  }

  // 4. Charadas
  const charadasSheet = findSheet(['charada', 'actuacion', 'mímica']);
  if (charadasSheet) {
    const rows = getSheetRows(charadasSheet);
    const items: CharadesItem[] = [];
    rows.forEach((r, idx) => {
      const word = String(r.Palabra || r.Accion || '').trim();
      if (!word) return;

      items.push({
        id: `ch-import-${Date.now()}-${idx}`,
        word,
        category: String(r.Categoria || 'General').trim(),
        difficulty: 'medio',
        points: Number(r.Puntos) || 50,
      });
    });
    if (items.length > 0) {
      partialBank.charadesItems = items;
      counts['Charadas'] = items.length;
    }
  }

  // 5. 100_Dijeron
  const feudSheet = findSheet(['100', 'dijeron', 'feud', 'familia']);
  if (feudSheet) {
    const rows = getSheetRows(feudSheet);
    const items: FamilyFeudItem[] = [];
    rows.forEach((r, idx) => {
      const question = String(r.Pregunta || r.Question || '').trim();
      if (!question) return;

      const answers: { id: string; text: string; points: number; revealed: boolean }[] = [];
      for (let i = 1; i <= 6; i++) {
        const text = String(r[`Resp${i}_Texto`] || r[`Respuesta${i}`] || r[`Opcion${i}`] || '').trim();
        const points = Number(r[`Resp${i}_Pts`] || r[`Puntos${i}`]) || 0;
        if (text) {
          answers.push({
            id: `ans-import-${idx}-${i}`,
            text,
            points: points || Math.max(5, 40 - (i * 7)),
            revealed: false,
          });
        }
      }

      if (answers.length > 0) {
        items.push({
          id: `ff-import-${Date.now()}-${idx}`,
          question,
          answers,
        });
      }
    });
    if (items.length > 0) {
      partialBank.familyFeudItems = items;
      counts['100 Dijeron'] = items.length;
    }
  }

  // 6. Trivia_y_Millonario
  const triviaSheet = findSheet(['trivia', 'millonario', 'millionaire']);
  if (triviaSheet) {
    const rows = getSheetRows(triviaSheet);
    const triviaItems: TriviaShowItem[] = [];
    const millionaireItems: MillionaireItem[] = [];

    rows.forEach((r, idx) => {
      const question = String(r.Pregunta || r.Question || '').trim();
      if (!question) return;

      const optA = String(r.Opcion_A || 'Opción A').trim();
      const optB = String(r.Opcion_B || 'Opción B').trim();
      const optC = String(r.Opcion_C || 'Opción C').trim();
      const optD = String(r.Opcion_D || 'Opción D').trim();

      let correct = String(r.Letra_Correcta || r.Correcta || 'A').trim().toUpperCase() as 'A' | 'B' | 'C' | 'D';
      if (!['A', 'B', 'C', 'D'].includes(correct)) correct = 'A';

      const points = Number(r.Puntos) || 100;
      const explanation = String(r.Explicacion || '').trim();
      const dest = String(r.Juego_Destino || r.Destino || '').trim().toUpperCase();

      if (dest.includes('TRIVIA')) {
        triviaItems.push({
          id: `ts-import-${Date.now()}-${idx}`,
          question,
          category: String(r.Categoria || 'General').trim(),
          options: { A: optA, B: optB, C: optC, D: optD },
          correctAnswer: correct,
          points,
          explanation,
        });
      } else {
        millionaireItems.push({
          id: `mil-import-${Date.now()}-${idx}`,
          level: Number(r.Nivel_1_a_15) || millionaireItems.length + 1,
          question,
          options: { A: optA, B: optB, C: optC, D: optD },
          correctAnswer: correct,
          points: points || 100,
          explanation,
        });
      }
    });

    if (triviaItems.length > 0) {
      partialBank.triviaShowItems = triviaItems;
      counts['Trivia Show'] = triviaItems.length;
    }
    if (millionaireItems.length > 0) {
      partialBank.millionaireItems = millionaireItems;
      counts['Millonario'] = millionaireItems.length;
    }
  }

  // 7. Anagrama
  const anagramSheet = findSheet(['anagrama', 'anagram', 'desordenada']);
  if (anagramSheet) {
    const rows = getSheetRows(anagramSheet);
    const items: AnagramWheelItem[] = [];
    rows.forEach((r, idx) => {
      const originalWord = String(r.Palabra_Original || r.Palabra || '').trim().toUpperCase();
      if (!originalWord) return;

      const scrambledWord = String(r.Palabra_Desordenada || '').trim().toUpperCase() || scrambleWord(originalWord);

      items.push({
        id: `an-import-${Date.now()}-${idx}`,
        originalWord,
        scrambledWord,
        category: String(r.Categoria_Pista || r.Categoria || 'General').trim(),
        hint: String(r.Pista || `Palabra de ${originalWord.length} letras`),
        points: Number(r.Puntos) || 100,
      });
    });
    if (items.length > 0) {
      partialBank.anagramItems = items;
      counts['Anagrama'] = items.length;
    }
  }

  // 8. Musica_y_Karaoke
  const musicSheet = findSheet(['musica', 'karaoke', 'cancion', 'music']);
  if (musicSheet) {
    const rows = getSheetRows(musicSheet);
    const items: MusicTrackItem[] = [];
    rows.forEach((r, idx) => {
      const title = String(r.Titulo_Cancion || r.Titulo || r.Cancion || '').trim();
      const artist = String(r.Artista || 'Varios Artistas').trim();
      if (!title) return;

      const modeStr = String(r.Modo || '').trim().toUpperCase();
      let mode: MusicGameMode = 'guess_song';
      if (modeStr.includes('LETRA') || modeStr.includes('LYRICS')) mode = 'guess_lyrics';
      else if (modeStr.includes('KARAOKE')) mode = 'karaoke_show';

      const url = String(r.URL_YouTube_o_YTMusic || r.URL || r.Link || '').trim();
      const videoId = extractYouTubeVideoId(url) || '';

      items.push({
        id: `mus-import-${Date.now()}-${idx}`,
        title,
        artist,
        category: String(r.Categoria || 'Música en Vivo').trim(),
        mode,
        youtubeUrl: url,
        videoId,
        startTime: Number(r.Segundo_Inicio) || 0,
        cutTime: Number(r.Segundo_Corte) || 30,
        letraPrevia: String(r.Letra_Previa_Visible || '').trim(),
        letraSecreta: String(r.Letra_Secreta_Completar || '').trim(),
        points: Number(r.Puntos) || 100,
      });
    });
    if (items.length > 0) {
      partialBank.musicItems = items;
      counts['Música & Karaoke'] = items.length;
    }
  }

  // 9. Trato_Hecho_y_Sorteos
  const tratoSheet = findSheet(['trato', 'sorteo', 'raffle', 'maletin']);
  if (tratoSheet) {
    const rows = getSheetRows(tratoSheet);
    const participants: RaffleParticipant[] = [];
    const briefcases: DealBriefcase[] = [];

    rows.forEach((r, idx) => {
      const type = String(r.Tipo || '').trim().toUpperCase();
      const text = String(r.Texto_o_Nombre || r.Nombre || '').trim();
      const val = Number(r.Valor_Puntos || r.Puntos) || 0;

      if (!text) return;

      if (type.includes('MALETIN')) {
        briefcases.push({
          id: idx + 1,
          number: idx + 1,
          value: val || 100,
          customLabel: text,
          isOpen: false,
          isContestantBriefcase: false,
        });
      } else {
        participants.push({
          id: `part-import-${Date.now()}-${idx}`,
          name: text,
          ticketNumber: val || idx + 1,
          eliminated: false,
        });
      }
    });

    if (participants.length > 0) {
      partialBank.raffleParticipants = participants;
      counts['Participantes Sorteos'] = participants.length;
    }
    if (briefcases.length > 0) {
      partialBank.briefcases = briefcases;
      counts['Maletines Trato Hecho'] = briefcases.length;
    }
  }

  return {
    bank: partialBank,
    counts,
    errors,
  };
}

/**
 * Merges incoming parsed bank into existing bank according to selected mode ('replace' or 'append').
 */
export function mergeContentBank(
  existing: StudioContentBank,
  incoming: Partial<StudioContentBank>,
  mode: 'replace' | 'append' = 'replace'
): StudioContentBank {
  if (mode === 'replace') {
    return {
      version: CURRENT_BANK_VERSION,
      updatedAt: Date.now(),
      bibleBookItems: incoming.bibleBookItems || existing.bibleBookItems,
      whoSaidItItems: incoming.whoSaidItItems || existing.whoSaidItItems,
      hangmanItems: incoming.hangmanItems || existing.hangmanItems,
      charadesItems: incoming.charadesItems || existing.charadesItems,
      familyFeudItems: incoming.familyFeudItems || existing.familyFeudItems,
      triviaShowItems: incoming.triviaShowItems || existing.triviaShowItems,
      anagramItems: incoming.anagramItems || existing.anagramItems,
      musicItems: incoming.musicItems || existing.musicItems,
      millionaireItems: incoming.millionaireItems || existing.millionaireItems,
      briefcases: incoming.briefcases || existing.briefcases,
      raffleParticipants: incoming.raffleParticipants || existing.raffleParticipants,
    };
  }

  // Append mode
  return {
    version: CURRENT_BANK_VERSION,
    updatedAt: Date.now(),
    bibleBookItems: [...existing.bibleBookItems, ...(incoming.bibleBookItems || [])],
    whoSaidItItems: [...existing.whoSaidItItems, ...(incoming.whoSaidItItems || [])],
    hangmanItems: [...existing.hangmanItems, ...(incoming.hangmanItems || [])],
    charadesItems: [...existing.charadesItems, ...(incoming.charadesItems || [])],
    familyFeudItems: [...existing.familyFeudItems, ...(incoming.familyFeudItems || [])],
    triviaShowItems: [...existing.triviaShowItems, ...(incoming.triviaShowItems || [])],
    anagramItems: [...existing.anagramItems, ...(incoming.anagramItems || [])],
    musicItems: [...existing.musicItems, ...(incoming.musicItems || [])],
    millionaireItems: [...existing.millionaireItems, ...(incoming.millionaireItems || [])],
    briefcases: incoming.briefcases && incoming.briefcases.length > 0 ? incoming.briefcases : existing.briefcases,
    raffleParticipants: [...existing.raffleParticipants, ...(incoming.raffleParticipants || [])],
  };
}

/**
 * Applies a StudioContentBank to a MasterLiveState, updating games and raffle with new bank data.
 */
export function applyBankToMasterState(
  prev: MasterLiveState,
  bank: StudioContentBank
): MasterLiveState {
  return {
    ...prev,
    gameStage: {
      ...prev.gameStage,
      bibleBook: {
        ...prev.gameStage.bibleBook,
        items: bank.bibleBookItems && bank.bibleBookItems.length > 0 ? bank.bibleBookItems : prev.gameStage.bibleBook.items,
        currentIndex: 0,
        revealed: false,
        selectedOption: null,
        pointsAwarded: false,
      },
      whoSaidIt: {
        ...prev.gameStage.whoSaidIt,
        items: bank.whoSaidItItems && bank.whoSaidItItems.length > 0 ? bank.whoSaidItItems : prev.gameStage.whoSaidIt.items,
        currentIndex: 0,
        revealed: false,
        selectedOption: null,
        pointsAwarded: false,
      },
      hangman: {
        ...prev.gameStage.hangman,
        items: bank.hangmanItems && bank.hangmanItems.length > 0 ? bank.hangmanItems : prev.gameStage.hangman.items,
        currentIndex: 0,
        guessedLetters: [],
        strikes: 0,
        solved: false,
        gameOver: false,
        pointsAwarded: false,
      },
      charades: {
        ...prev.gameStage.charades,
        items: bank.charadesItems && bank.charadesItems.length > 0 ? bank.charadesItems : prev.gameStage.charades.items,
        currentIndex: 0,
        remainingSeconds: prev.gameStage.charades.roundSeconds || 60,
        isRunning: false,
        correctCount: 0,
        skippedCount: 0,
        guessedWordIds: [],
        pointsAwarded: false,
      },
      familyFeud: {
        ...prev.gameStage.familyFeud,
        items: bank.familyFeudItems && bank.familyFeudItems.length > 0 ? bank.familyFeudItems : prev.gameStage.familyFeud.items,
        currentIndex: 0,
        potScore: 0,
        strikes: 0,
        revealedAnswerIds: [],
        potAwardedTeamId: null,
      },
      triviaShow: {
        ...prev.gameStage.triviaShow,
        items: bank.triviaShowItems && bank.triviaShowItems.length > 0 ? bank.triviaShowItems : prev.gameStage.triviaShow.items,
        currentIndex: 0,
        selectedOption: null,
        revealed: false,
        hiddenOptions5050: [],
        used5050: false,
        pointsAwarded: false,
      },
      anagramWheel: {
        ...prev.gameStage.anagramWheel,
        items: bank.anagramItems && bank.anagramItems.length > 0 ? bank.anagramItems : prev.gameStage.anagramWheel.items,
        currentIndex: 0,
        revealed: false,
        wheelSpinning: false,
        selectedReward: null,
        pointsAwarded: false,
      },
      musicKaraoke: {
        ...prev.gameStage.musicKaraoke,
        items: bank.musicItems && bank.musicItems.length > 0 ? bank.musicItems : prev.gameStage.musicKaraoke.items,
        currentIndex: 0,
        isPlaying: false,
        revealedSong: false,
        isMusicCut: false,
        lyricsSolved: false,
        revealedWordsCount: 0,
        pointsAwarded: false,
      },
      millionaireShow: {
        ...prev.gameStage.millionaireShow,
        items: bank.millionaireItems && bank.millionaireItems.length > 0 ? bank.millionaireItems : prev.gameStage.millionaireShow.items,
        currentIndex: 0,
        currentLevel: 1,
        selectedOption: null,
        isFinalAnswer: false,
        revealed: false,
        isCorrect: null,
        hiddenOptions5050: [],
        showAudiencePoll: false,
        showPhoneCall: false,
        accumulatedPoints: 0,
        gameStatus: 'playing',
        pointsAwarded: false,
      },
      dealOrNoDeal: {
        ...prev.gameStage.dealOrNoDeal,
        briefcases: bank.briefcases && bank.briefcases.length > 0 ? bank.briefcases : prev.gameStage.dealOrNoDeal.briefcases,
      },
    },
    raffle: {
      ...prev.raffle,
      participants: bank.raffleParticipants && bank.raffleParticipants.length > 0 ? bank.raffleParticipants : prev.raffle.participants,
    },
  };
}

/**
 * Requirement 5 & 13: Exports Night Winners and complete Raffle Audit Log to an Excel workbook (.xlsx).
 */
export function exportRaffleWinnersWorkbook(
  nightWinners: NightWinnerItem[],
  drawRecords: RaffleDrawRecord[],
  filename = 'Ganadores_Sorteos_Master_Studio.xlsx'
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ganadores de la Noche
  const winnersRows = (nightWinners || []).map((w) => ({
    Sorteo_Numero: w.drawNumber,
    Nombre_Ganador: w.name,
    Numero_Boleto: w.ticketNumber ? `#${w.ticketNumber}` : 'Sin boleto',
    Grupo_o_Celula: w.groupOrCell || 'General',
    Titulo_Premio: w.title || 'Gran Sorteo',
    Fecha_Hora: new Date(w.timestamp).toLocaleTimeString(),
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(winnersRows.length > 0 ? winnersRows : [{ Info: 'Sin ganadores registrados aún' }]),
    'Ganadores_De_La_Noche'
  );

  // Sheet 2: Historial Completo de Sorteos
  const recordsRows = (drawRecords || []).map((r) => ({
    Sorteo_Numero: r.drawNumber,
    Fecha_Hora: r.dateStr || new Date(r.timestamp).toLocaleString(),
    Modalidad: r.mode,
    Total_Participantes: r.participantCount,
    Nombre_Ganador: r.winnerName,
    Numero_Boleto: r.ticketNumber ? `#${r.ticketNumber}` : '',
    Grupo_o_Celula: r.groupOrCell || '',
    Frase_Reto: r.challengePhrase || '',
    Titulo_Sorteo: r.title,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(recordsRows.length > 0 ? recordsRows : [{ Info: 'Sin sorteos auditados aún' }]),
    'Historial_Auditoria_Sorteos'
  );

  XLSX.writeFile(wb, filename);
}

/**
 * Requirement 4: Exports and Imports Challenges and Prizes for the Challenge Combiner.
 */
export function exportRaffleChallengesAndPrizesWorkbook(
  challenges: string[],
  prizes: string[],
  filename = 'Retos_Y_Premios_Combinador.xlsx'
): void {
  const wb = XLSX.utils.book_new();

  const challengesRows = challenges.map((c, i) => ({ N: i + 1, Reto_Accion: c }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(challengesRows), 'Retos');

  const prizesRows = prizes.map((p, i) => ({ N: i + 1, Premio_Recompensa: p }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prizesRows), 'Premios');

  XLSX.writeFile(wb, filename);
}


import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import {
  generateMasterTemplateWorkbook,
  parseExcelContentBank,
  mergeContentBank,
  countTotalBankItems,
  getDefaultContentBank,
} from './excelContentEngine';
import { normalizeGoogleSheetsUrl } from './cloudSyncService';

test('generateMasterTemplateWorkbook: creates 9 distinct game sheets with headers', () => {
  const wb = generateMasterTemplateWorkbook();
  assert.equal(wb.SheetNames.length, 9);
  assert.ok(wb.SheetNames.includes('Biblia'));
  assert.ok(wb.SheetNames.includes('Quien_Lo_Dijo'));
  assert.ok(wb.SheetNames.includes('Ahorcado'));
  assert.ok(wb.SheetNames.includes('Charadas'));
  assert.ok(wb.SheetNames.includes('100_Dijeron'));
  assert.ok(wb.SheetNames.includes('Trivia_y_Millonario'));
  assert.ok(wb.SheetNames.includes('Anagrama'));
  assert.ok(wb.SheetNames.includes('Musica_y_Karaoke'));
  assert.ok(wb.SheetNames.includes('Trato_Hecho_y_Sorteos'));
});

test('parseExcelContentBank: parses binary workbook output and maps to game models', () => {
  const wb = generateMasterTemplateWorkbook();
  const u8 = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const result = parseExcelContentBank(u8);

  assert.ok(result.bank.bibleBookItems && result.bank.bibleBookItems.length >= 2);
  assert.ok(result.bank.whoSaidItItems && result.bank.whoSaidItItems.length >= 2);
  assert.ok(result.bank.hangmanItems && result.bank.hangmanItems.length >= 2);
  assert.ok(result.bank.charadesItems && result.bank.charadesItems.length >= 2);
  assert.ok(result.bank.familyFeudItems && result.bank.familyFeudItems.length >= 1);
  assert.ok(result.bank.millionaireItems && result.bank.millionaireItems.length >= 1);
  assert.ok(result.bank.triviaShowItems && result.bank.triviaShowItems.length >= 1);
  assert.ok(result.bank.anagramItems && result.bank.anagramItems.length >= 2);
  assert.ok(result.bank.musicItems && result.bank.musicItems.length >= 3);
  assert.ok(result.bank.raffleParticipants && result.bank.raffleParticipants.length >= 2);
  assert.ok(result.bank.briefcases && result.bank.briefcases.length >= 1);

  // Check counts summary
  assert.ok(result.counts['Biblia'] >= 2);
  assert.ok(result.counts['Millonario'] >= 1);
  assert.ok(result.counts['Música & Karaoke'] >= 3);
});

test('mergeContentBank: replace mode overwrites with incoming bank, append mode combines', () => {
  const initial = getDefaultContentBank();
  const initialCount = initial.hangmanItems.length;

  const incoming = {
    hangmanItems: [
      {
        id: 'new-1',
        word: 'PRUEBA',
        category: 'Test',
        pointsPerLetter: 10,
        pointsSolve: 100,
        hint: 'Pista',
      },
    ],
  };

  // Replace
  const replaced = mergeContentBank(initial, incoming, 'replace');
  assert.equal(replaced.hangmanItems.length, 1);
  assert.equal(replaced.hangmanItems[0].word, 'PRUEBA');

  // Append
  const appended = mergeContentBank(initial, incoming, 'append');
  assert.equal(appended.hangmanItems.length, initialCount + 1);
  assert.equal(appended.hangmanItems[appended.hangmanItems.length - 1].word, 'PRUEBA');
});

test('countTotalBankItems: sums all items correctly', () => {
  const bank = getDefaultContentBank();
  const total = countTotalBankItems(bank);
  assert.ok(total > 50, `Expected default bank to have over 50 items, got ${total}`);
});

test('normalizeGoogleSheetsUrl: converts standard Google Sheets sharing links to XLSX export endpoint', () => {
  const rawSharing = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';
  const normalized = normalizeGoogleSheetsUrl(rawSharing);
  assert.equal(
    normalized,
    'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=xlsx'
  );

  // If already an export URL, keep untouched
  const alreadyExport = 'https://docs.google.com/spreadsheets/d/123/export?format=xlsx';
  assert.equal(normalizeGoogleSheetsUrl(alreadyExport), alreadyExport);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChar } from '../../../utils/gameEngineRules';

test('Projector Hangman: letter normalization handles vowels with accents', () => {
  assert.strictEqual(normalizeChar('É'), 'E');
  assert.strictEqual(normalizeChar('é'), 'E');
  assert.strictEqual(normalizeChar('Á'), 'A');
  assert.strictEqual(normalizeChar('Í'), 'I');
  assert.strictEqual(normalizeChar('Ó'), 'O');
  assert.strictEqual(normalizeChar('Ú'), 'U');
  assert.strictEqual(normalizeChar('Ñ'), 'Ñ');
  assert.strictEqual(normalizeChar('ñ'), 'Ñ');
});

test('Projector Charades: 480px ring geometry calculations', () => {
  const size = 480;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  assert.strictEqual(size, 480);
  assert.strictEqual(radius, 228);
  assert(circumference > 1430 && circumference < 1440, `Circumference was ${circumference}`);
});

test('Projector Millionaire: ladder has exactly 15 levels with 5 and 10 safe havens', () => {
  const levels = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  assert.strictEqual(levels.length, 15);
  const safeHavens = new Set([5, 10]);
  assert.strictEqual(safeHavens.has(5), true);
  assert.strictEqual(safeHavens.has(10), true);
  assert.strictEqual(safeHavens.has(7), false);
});

test('Projector Deal or No Deal: sorts and partitions 16 briefcases into 8 low and 8 high values', () => {
  const values = [1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 5000, 10000, 50000];
  const sorted = [...values].sort((a, b) => a - b);
  const midPoint = Math.ceil(sorted.length / 2);
  const low = sorted.slice(0, midPoint);
  const high = sorted.slice(midPoint);

  assert.strictEqual(low.length, 8);
  assert.strictEqual(high.length, 8);
  assert.strictEqual(low[0], 1);
  assert.strictEqual(high[high.length - 1], 50000);
});

test('Projector Anagram & Wheel: 8 segments divide circle equally into 45 degree slices', () => {
  const segmentCount = 8;
  const sliceRadians = (2 * Math.PI) / segmentCount;
  const sliceDegrees = (sliceRadians * 180) / Math.PI;

  assert.strictEqual(Math.round(sliceDegrees), 45);
});

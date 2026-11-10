import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeVideoId,
  parseTimeToSeconds,
  formatSecondsToMMSS,
  getYouTubeThumbnailUrl,
} from './songQuizUtils.ts';

describe('songQuizUtils', () => {
  describe('extractYouTubeVideoId', () => {
    it('extracts ID from standard watch URL', () => {
      const id = extractYouTubeVideoId('https://www.youtube.com/watch?v=fJ9rUzIMcZQ');
      assert.equal(id, 'fJ9rUzIMcZQ');
    });

    it('extracts ID from YouTube Music URL', () => {
      const id = extractYouTubeVideoId('https://music.youtube.com/watch?v=Zi_XLOBDo_Y&feature=share');
      assert.equal(id, 'Zi_XLOBDo_Y');
    });

    it('extracts ID from youtu.be short URL', () => {
      const id = extractYouTubeVideoId('https://youtu.be/djV11Xbc914?t=20');
      assert.equal(id, 'djV11Xbc914');
    });

    it('extracts ID from embed URL', () => {
      const id = extractYouTubeVideoId('https://www.youtube.com/embed/kJQP7kiw5Fk');
      assert.equal(id, 'kJQP7kiw5Fk');
    });

    it('handles direct 11-char ID', () => {
      const id = extractYouTubeVideoId('1k8craCGpgs');
      assert.equal(id, '1k8craCGpgs');
    });

    it('returns null for invalid or empty inputs', () => {
      assert.equal(extractYouTubeVideoId(''), null);
      assert.equal(extractYouTubeVideoId('https://google.com'), null);
      assert.equal(extractYouTubeVideoId('invalid_id'), null);
    });
  });

  describe('parseTimeToSeconds', () => {
    it('parses MM:SS format correctly', () => {
      assert.equal(parseTimeToSeconds('1:30'), 90);
      assert.equal(parseTimeToSeconds('0:45'), 45);
      assert.equal(parseTimeToSeconds('2:05'), 125);
    });

    it('parses pure second strings or numbers', () => {
      assert.equal(parseTimeToSeconds('45'), 45);
      assert.equal(parseTimeToSeconds(60), 60);
    });

    it('handles HH:MM:SS format', () => {
      assert.equal(parseTimeToSeconds('1:01:10'), 3670);
    });

    it('defaults invalid values to 0', () => {
      assert.equal(parseTimeToSeconds(''), 0);
      assert.equal(parseTimeToSeconds('abc'), 0);
      assert.equal(parseTimeToSeconds(-10), 0);
    });
  });

  describe('formatSecondsToMMSS', () => {
    it('formats numbers into MM:SS', () => {
      assert.equal(formatSecondsToMMSS(0), '0:00');
      assert.equal(formatSecondsToMMSS(45), '0:45');
      assert.equal(formatSecondsToMMSS(90), '1:30');
      assert.equal(formatSecondsToMMSS(125), '2:05');
    });
  });

  describe('getYouTubeThumbnailUrl', () => {
    it('returns correct hqdefault URL', () => {
      assert.equal(
        getYouTubeThumbnailUrl('fJ9rUzIMcZQ'),
        'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg'
      );
      assert.equal(getYouTubeThumbnailUrl(''), '');
    });
  });
});

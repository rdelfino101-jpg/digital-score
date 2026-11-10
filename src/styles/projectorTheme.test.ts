import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECTOR_DEFAULT_THEME,
  PROJECTOR_HIGH_CONTRAST_THEME,
  OPTION_BADGE_CONFIG,
  PROJECTOR_FONT_SPECS,
} from './projectorTheme';

test('projectorTheme: default theme tokens match contrast requirements', () => {
  assert.equal(PROJECTOR_DEFAULT_THEME.background, '#0A0B1E');
  assert.equal(PROJECTOR_DEFAULT_THEME.panel, '#15173A');
  assert.equal(PROJECTOR_DEFAULT_THEME.border, '#2A2D5C');
  assert.equal(PROJECTOR_DEFAULT_THEME.text, '#FFFFFF');
  assert.equal(PROJECTOR_DEFAULT_THEME.goldAccent, '#FFC53D');
  assert.equal(PROJECTOR_DEFAULT_THEME.correctBg, '#0F5132');
  assert.equal(PROJECTOR_DEFAULT_THEME.correctBorder, '#4ADE80');
  assert.equal(PROJECTOR_DEFAULT_THEME.errorBorder, '#EF4444');
});

test('projectorTheme: high contrast theme uses pure black and high-contrast borders', () => {
  assert.equal(PROJECTOR_HIGH_CONTRAST_THEME.background, '#000000');
  assert.equal(PROJECTOR_HIGH_CONTRAST_THEME.panel, '#111111');
  assert.equal(PROJECTOR_HIGH_CONTRAST_THEME.border, '#FFFFFF');
});

test('projectorTheme: option badge config defines exact letters and badge colors', () => {
  assert.equal(OPTION_BADGE_CONFIG.A.bg, '#4F7BFF');
  assert.equal(OPTION_BADGE_CONFIG.A.text, '#FFFFFF');

  assert.equal(OPTION_BADGE_CONFIG.B.bg, '#FF8A1F');
  assert.equal(OPTION_BADGE_CONFIG.B.text, '#1A0E00');

  assert.equal(OPTION_BADGE_CONFIG.C.bg, '#19C3A6');
  assert.equal(OPTION_BADGE_CONFIG.C.text, '#032B24');

  assert.equal(OPTION_BADGE_CONFIG.D.bg, '#E04FD8');
  assert.equal(OPTION_BADGE_CONFIG.D.text, '#FFFFFF');
});

test('projectorTheme: font sizes never go below 20px on the 1920x1080 canvas', () => {
  assert.ok(PROJECTOR_FONT_SPECS.minTextSize >= 20);
  assert.ok(PROJECTOR_FONT_SPECS.secondaryText >= 22);
  assert.ok(PROJECTOR_FONT_SPECS.teamName >= 28);
  assert.ok(PROJECTOR_FONT_SPECS.optionText >= 48);
  assert.ok(PROJECTOR_FONT_SPECS.questionText >= 60);
  assert.ok(PROJECTOR_FONT_SPECS.gameTitle >= 58);
  assert.ok(PROJECTOR_FONT_SPECS.scoreMain >= 76);
  assert.ok(PROJECTOR_FONT_SPECS.sportsScore >= 360);
});

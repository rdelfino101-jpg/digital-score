export interface ProjectorThemeColors {
  background: string;
  panel: string;
  panelSecondary: string;
  border: string;
  borderHighlight: string;
  text: string;
  textSecondary: string;
  goldAccent: string;
  correctBg: string;
  correctBorder: string;
  correctText: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
  timerTrack: string;
  timerFill: string;
}

export const PROJECTOR_DEFAULT_THEME: ProjectorThemeColors = {
  background: '#0A0B1E',
  panel: '#15173A',
  panelSecondary: '#1C1F47',
  border: '#2A2D5C',
  borderHighlight: '#4B5299',
  text: '#FFFFFF',
  textSecondary: '#B8BCE6',
  goldAccent: '#FFC53D',
  correctBg: '#0F5132',
  correctBorder: '#4ADE80',
  correctText: '#4ADE80',
  errorBg: '#3F1216',
  errorBorder: '#EF4444',
  errorText: '#EF4444',
  timerTrack: '#1C1F47',
  timerFill: '#FFC53D',
};

export const PROJECTOR_HIGH_CONTRAST_THEME: ProjectorThemeColors = {
  background: '#000000',
  panel: '#111111',
  panelSecondary: '#1F1F1F',
  border: '#FFFFFF',
  borderHighlight: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#E2E8F0',
  goldAccent: '#FFD700',
  correctBg: '#0F5132',
  correctBorder: '#4ADE80',
  correctText: '#FFFFFF',
  errorBg: '#7F1D1D',
  errorBorder: '#EF4444',
  errorText: '#FFFFFF',
  timerTrack: '#333333',
  timerFill: '#FFD700',
};

export const OPTION_BADGE_CONFIG = {
  A: {
    bg: '#4F7BFF',
    text: '#FFFFFF',
    label: 'A',
  },
  B: {
    bg: '#FF8A1F',
    text: '#1A0E00',
    label: 'B',
  },
  C: {
    bg: '#19C3A6',
    text: '#032B24',
    label: 'C',
  },
  D: {
    bg: '#E04FD8',
    text: '#FFFFFF',
    label: 'D',
  },
} as const;

export type OptionBadgeKey = keyof typeof OPTION_BADGE_CONFIG;

export const PROJECTOR_FONT_SPECS = {
  // Never below 20px on the 1920x1080 canvas
  minTextSize: 20,
  secondaryText: 24,
  teamName: 32,
  badgeKicker: 24,
  optionText: 48,
  questionText: 68,
  gameTitle: 58,
  scoreMain: 84,
  scoreLarge: 92,
  sportsScore: 360,
  intermissionCountdown: 280,
} as const;

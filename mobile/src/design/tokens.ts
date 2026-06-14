export const colors = {
  ink: '#111111',
  paper: '#fff9ef',
  blockLime: '#dceeb1',
  hotPink: '#ff5c8a',
  cobalt: '#4f7cff',
  warning: '#ffd166',
  danger: '#ff3b30',
  muted: '#f1eadf',
  white: '#ffffff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const borders = {
  hairline: 1,
  thick: 3,
  heavy: 4,
} as const;

export const shadows = {
  brutal: {
    shadowColor: colors.ink,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
} as const;

export const typography = {
  display: 34,
  title: 24,
  body: 16,
  caption: 13,
} as const;

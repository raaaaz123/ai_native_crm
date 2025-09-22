// Centralized theme configuration for Rexa Engage
// All colors, spacing, and design tokens in one place

export const theme = {
  colors: {
    // Primary brand colors from provided palette
    primary: {
      DEFAULT: '#c15f3c', // burnt orange
      50: '#fef7f4',
      100: '#fdeee8',
      200: '#fad9c6',
      300: '#f6bfa4',
      400: '#ee8b60',
      500: '#c15f3c', // main
      600: '#a8512f',
      700: '#8c4327',
      800: '#703520',
      900: '#5c2b1a',
    },
    
    // Neutral palette
    neutral: {
      DEFAULT: '#b1ada1', // warm gray
      50: '#f9f8f6',
      100: '#f4f3ee', // background
      200: '#e8e6e0',
      300: '#dcd9d1',
      400: '#c4c0b5',
      500: '#b1ada1', // main
      600: '#9a9589',
      700: '#7d7a70',
      800: '#605e57',
      900: '#4a4944',
    },
    
    // Semantic colors
    background: '#f4f3ee',
    foreground: '#05060f',
    card: '#ffffff',
    surface: '#f4f3ee',
    border: '#b1ada1',
    muted: '#b1ada1',
    
    // Status colors (modern additions)
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Modern spacing scale
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },
  
  // Border radius scale
  radius: {
    none: '0',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },
  
  // Typography scale
  typography: {
    fontFamily: {
      sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-geist-mono)', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Modern shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  // Animation durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// CSS custom properties generator
export const generateCSSVariables = () => {
  return {
    '--color-primary': theme.colors.primary.DEFAULT,
    '--color-primary-foreground': '#ffffff',
    '--color-background': theme.colors.background,
    '--color-foreground': theme.colors.foreground,
    '--color-card': theme.colors.card,
    '--color-surface': theme.colors.surface,
    '--color-border': theme.colors.border,
    '--color-muted': theme.colors.muted,
    '--color-success': theme.colors.success,
    '--color-warning': theme.colors.warning,
    '--color-error': theme.colors.error,
    '--color-info': theme.colors.info,
    '--radius-sm': theme.radius.sm,
    '--radius-md': theme.radius.md,
    '--radius-lg': theme.radius.lg,
    '--radius-xl': theme.radius.xl,
    '--shadow-sm': theme.shadows.sm,
    '--shadow-md': theme.shadows.md,
    '--shadow-lg': theme.shadows.lg,
    '--shadow-xl': theme.shadows.xl,
  };
};

// Utility functions for theme usage
export const getColor = (colorPath: string): string => {
  const keys = colorPath.split('.');
  let value: unknown = theme.colors;
  for (const key of keys) {
    if (typeof value === 'object' && value !== null && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return '';
    }
  }
  return typeof value === 'string' ? value : '';
};

export const getSpacing = (size: keyof typeof theme.spacing) => theme.spacing[size];
export const getRadius = (size: keyof typeof theme.radius) => theme.radius[size];
export const getShadow = (size: keyof typeof theme.shadows) => theme.shadows[size];

export default theme;
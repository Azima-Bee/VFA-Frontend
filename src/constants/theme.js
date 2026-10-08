export const COLORS = {
  primary: '#4F46E5',        // Modern Indigo
  primaryDark: '#3730A3',    // Deep Indigo
  primaryLight: '#EEF2FF',   // Soft Indigo Tint
  accent: '#7C3AED',         // Vibrant Violet
  accentLight: '#F5F3FF',    // Soft Violet Tint
  verified: '#10B981',       // Emerald Green for Verified Student Badge
  verifiedLight: '#ECFDF5',
  
  background: '#F8FAFC',     // Clean slate background
  surface: '#FFFFFF',        // Card white
  surfaceAlt: '#F1F5F9',
  
  textPrimary: '#0F172A',    // Slate 900
  textSecondary: '#475569',  // Slate 600
  textMuted: '#94A3B8',      // Slate 400
  textWhite: '#FFFFFF',
  
  border: '#E2E8F0',         // Slate 200
  borderFocus: '#818CF8',    // Indigo 400
  
  error: '#EF4444',
  errorLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  success: '#10B981',

  gradientPrimary: ['#4F46E5', '#7C3AED'],
  gradientVerified: ['#10B981', '#059669'],
  gradientDark: ['#0F172A', '#1E293B'],
  gradientCard: ['#FFFFFF', '#F8FAFC'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  large: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
};

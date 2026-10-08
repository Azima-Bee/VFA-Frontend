import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS as LIGHT_COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';

const THEME_STORAGE_KEY = '@vfa_app_theme';

// Dark theme color palette — designed to complement the existing indigo/violet VFA brand
const DARK_COLORS = {
  primary: '#818CF8',           // Indigo 400 — bright readable indigo for dark mode
  primaryDark: '#6366F1',       // Indigo 500
  primaryLight: '#1E1B4B',      // Deep indigo tint surface
  accent: '#A78BFA',            // Violet 400
  accentLight: '#2E1065',       // Dark violet tint
  verified: '#34D399',          // Emerald 400
  verifiedLight: 'rgba(6, 78, 59, 0.6)', // Emerald dark tint

  background: '#0F172A',        // Slate 900 — soft dark navy/slate background (no harsh #000)
  surface: '#1E293B',           // Slate 800 — cards & surfaces slightly lighter than page bg
  surfaceAlt: '#334155',        // Slate 700 — alternate dark surface for chips & secondary inputs

  textPrimary: '#F8FAFC',       // Slate 50 — primary text with excellent readability
  textSecondary: '#CBD5E1',     // Slate 300 — softer gray secondary text
  textMuted: '#94A3B8',         // Slate 400 — softer muted gray text
  textWhite: '#FFFFFF',

  border: '#334155',            // Slate 700 — visible subtle border
  borderFocus: '#818CF8',       // Indigo 400

  error: '#F87171',             // Red 400
  errorLight: 'rgba(69, 10, 10, 0.6)',   // Red dark tint
  warning: '#FBBF24',           // Amber 400
  warningLight: 'rgba(69, 26, 3, 0.6)',  // Amber dark tint
  success: '#34D399',           // Emerald 400

  gradientPrimary: ['#6366F1', '#8B5CF6'],
  gradientVerified: ['#10B981', '#059669'],
  gradientDark: ['#0F172A', '#1E293B'],
  gradientCard: ['#1E293B', '#0F172A'],
};

// Dark mode shadows — subtle in dark mode
const DARK_SHADOWS = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const ThemeContext = createContext({
  isDark: false,
  colors: LIGHT_COLORS,
  shadows: SHADOWS,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'dark') {
          setIsDark(true);
        }
      } catch (e) {
        // Default to light if read fails
      }
      setIsLoaded(true);
    })();
  }, []);

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newIsDark ? 'dark' : 'light');
    } catch (e) {
      // Persist silently fails — theme still switches in-memory
    }
  };

  const value = useMemo(
    () => ({
      isDark,
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      shadows: isDark ? DARK_SHADOWS : SHADOWS,
      toggleTheme,
    }),
    [isDark]
  );

  // Don't render children until we've loaded the persisted preference
  // to avoid a flash of light theme
  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access the current theme colors and toggle function.
 * Usage:
 *   const { colors, isDark, toggleTheme, shadows } = useTheme();
 */
export const useTheme = () => useContext(ThemeContext);

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dynamically resolves backend API Base URL:
 * - Physical Device via Expo Go: Uses host PC Wi-Fi IP (derived from Metro bundler hostUri e.g. 192.168.X.X:5000)
 * - Android Emulator: Uses http://10.0.2.2:5000/api
 * - iOS Simulator / Web: Uses http://localhost:5000/api
 */
const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.trim()) {
    return process.env.EXPO_PUBLIC_API_URL.trim();
  }
  return 'https://vfa-backend.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

export const APP_CONFIG = {
  appName: 'FlatMate',
  tagline: 'Find a verified student. Find your perfect place.',
  version: '1.0.0',
  apiBaseUrl: API_BASE_URL,
  supportedEmailDomain: '.edu',
};



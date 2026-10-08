import axios from 'axios';
import safeStorage from '../utils/storage';
import { APP_CONFIG } from '../constants/config';

export const AUTH_TOKEN_KEY = 'authToken';

/**
 * Centralized Axios Instance configured for FlatMate Backend API
 */
const api = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request Interceptor — Automatically attaches JWT Authorization header
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await safeStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('[API Interceptor Warning]: Failed to read token from safeStorage', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Helper to extract user-friendly error messages from API response / network failures
 */
export const handleApiError = (error) => {
  if (error.response) {
    const status = error.response.status;
    const backendMsg = error.response.data?.message;

    if (backendMsg && typeof backendMsg === 'string') {
      return backendMsg;
    }

    switch (status) {
      case 400:
        return 'Invalid request. Please check your details.';
      case 401:
        return 'Authentication failed or session expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Requested endpoint or resource was not found.';
      case 409:
        return 'An account or record with these details already exists.';
      case 500:
      default:
        return 'Server error occurred. Please try again later.';
    }
  } else if (error.request) {
    return 'Unable to reach the server. Please ensure the backend is running and check your network connection.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
};

export default api;

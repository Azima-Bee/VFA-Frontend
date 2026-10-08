import api, { AUTH_TOKEN_KEY, handleApiError } from './api';
import safeStorage from '../utils/storage';
import { MOCK_USER_PROFILE } from '../data/mockData';

/**
 * Normalizes backend user object fields to be backwards compatible with frontend UI models.
 */
const normalizeUser = (backendUser) => {
  if (!backendUser) return null;
  return {
    ...backendUser,
    id: backendUser.id ? String(backendUser.id) : `usr_${Date.now()}`,
    fullName: backendUser.full_name || backendUser.fullName || 'Student User',
    email: backendUser.email || '',
    phone: backendUser.phone || '',
    role: backendUser.role || 'student',
    isAdmin: backendUser.role === 'admin' || backendUser.isAdmin || false,
    university: backendUser.university || 'Stanford University',
    course: backendUser.course || 'Computer Science',
    yearOfStudy: backendUser.yearOfStudy || 'Year 2',
    isVerifiedStudent: backendUser.isVerifiedStudent !== undefined ? backendUser.isVerifiedStudent : true,
    verificationBadge: backendUser.role === 'admin' ? 'Verified Admin' : 'Verified Student',
    photo: backendUser.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };
};

export const authService = {
  /**
   * Log in user with real backend endpoint POST /api/auth/login or demo fallback
   */
  async login(email, password) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    try {
      const response = await api.post('/auth/login', {
        email: cleanEmail,
        password,
      });

      const { token, user } = response.data;

      // Persist JWT token in safeStorage
      if (token) {
        await safeStorage.setItem(AUTH_TOKEN_KEY, token);
      }

      const normalized = normalizeUser(user);

      return {
        success: true,
        token,
        user: normalized,
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  /**
   * Register a new user with real backend endpoint POST /api/auth/register
   */
  async register(registrationData) {
    try {
      const payload = {
        full_name: registrationData.fullName || registrationData.full_name || '',
        email: registrationData.email ? registrationData.email.trim() : '',
        password: registrationData.password || '',
        phone: registrationData.phone ? registrationData.phone.trim() : null,
      };

      const response = await api.post('/auth/register', payload);
      const { user } = response.data;

      const normalized = normalizeUser({
        ...user,
        university: registrationData.university,
        course: registrationData.course,
        yearOfStudy: registrationData.yearOfStudy,
      });

      return {
        success: true,
        user: normalized,
        message: response.data.message || 'Registration successful',
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  /**
   * Get current authenticated user details from real backend endpoint GET /api/auth/me
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      const normalized = normalizeUser(user);

      return {
        success: true,
        user: normalized,
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  },

  /**
   * Logout user by removing JWT token from AsyncStorage
   */
  async logout() {
    try {
      await safeStorage.removeItem(AUTH_TOKEN_KEY);
      return true;
    } catch (err) {
      console.warn('[AuthService Logout Error]:', err);
      return false;
    }
  },

  /**
   * Update student profile (Preserved mock method for future step)
   */
  async updateProfile(userId, profileData) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      user: normalizeUser({ ...MOCK_USER_PROFILE, ...profileData, id: userId }),
      message: 'Profile updated successfully!',
    };
  },

  /**
   * Simulate sending a password reset email link
   */
  async resetPassword(email) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      success: true,
      message: 'Password reset link has been sent to your email.',
    };
  },
};

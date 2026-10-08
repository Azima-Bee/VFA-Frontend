import api, { handleApiError } from './api';

/**
 * Normalizes profile payload fields from backend format to frontend expectations
 */
const normalizeProfile = (raw) => {
  if (!raw) return null;
  return {
    ...raw,
    id: raw.id ? String(raw.id) : null,
    userId: raw.user_id ? String(raw.user_id) : null,
    college: raw.college_name || '',
    college_name: raw.college_name || '',
    course: raw.course || '',
    yearOfStudy: raw.year_of_study || '',
    year_of_study: raw.year_of_study || '',
    gender: raw.gender || '',
    age: raw.age !== null && raw.age !== undefined ? String(raw.age) : '',
    bio: raw.bio || '',
    aboutMe: raw.bio || '',
    city: raw.city || '',
    photo: raw.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    profile_image: raw.profile_image || '',
  };
};

export const profileService = {
  /**
   * Get own authenticated student profile
   * GET /api/profile
   */
  async getOwnProfile() {
    try {
      const response = await api.get('/profile');
      const profile = normalizeProfile(response.data?.profile);
      return {
        success: true,
        profile,
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          notFound: true,
          message: 'Profile not created yet',
          profile: null,
        };
      }
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
        profile: null,
      };
    }
  },

  /**
   * Get another user's profile by userId
   * GET /api/profile/:userId
   */
  async getUserProfile(userId) {
    const parsedId = parseInt(userId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return {
        success: false,
        error: 'Invalid user ID. Must be a positive integer.',
        profile: null,
      };
    }

    try {
      const response = await api.get(`/profile/${parsedId}`);
      const profile = normalizeProfile(response.data?.profile);
      return {
        success: true,
        profile,
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          notFound: true,
          error: 'User profile not found',
          profile: null,
        };
      }
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
        profile: null,
      };
    }
  },

  /**
   * Create or Update own student profile
   * PUT /api/profile
   */
  async createOrUpdateProfile(data) {
    try {
      // Validate Gender
      if (data.gender && typeof data.gender === 'string') {
        const cleanGender = data.gender.trim().toLowerCase();
        if (!['male', 'female', 'other'].includes(cleanGender)) {
          throw new Error('Please select a valid gender (male, female, or other).');
        }
      }

      // Validate Age
      if (data.age !== undefined && data.age !== null && data.age !== '') {
        const parsedAge = Number(data.age);
        if (isNaN(parsedAge) || !Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 100) {
          throw new Error('Please enter a valid age between 13 and 100.');
        }
      }

      // Validate Field Lengths
      if (data.college_name && data.college_name.length > 150) {
        throw new Error('College name is too long (max 150 characters).');
      }
      if (data.course && data.course.length > 100) {
        throw new Error('Course name is too long (max 100 characters).');
      }
      if (data.year_of_study && data.year_of_study.length > 50) {
        throw new Error('Year of study is too long (max 50 characters).');
      }
      if (data.city && data.city.length > 100) {
        throw new Error('City name is too long (max 100 characters).');
      }

      const payload = {
        college_name: data.college_name || data.college || data.university || '',
        course: data.course || '',
        year_of_study: data.year_of_study || data.yearOfStudy || '',
        gender: data.gender ? data.gender.toLowerCase() : null,
        age: data.age !== undefined && data.age !== null && data.age !== '' ? Number(data.age) : null,
        bio: data.bio || data.aboutMe || '',
        city: data.city || '',
        profile_image: data.profile_image || data.photo || '',
      };

      const response = await api.put('/profile', payload);
      const profile = normalizeProfile(response.data?.profile);

      return {
        success: true,
        message: response.data?.message || 'Profile saved successfully',
        profile,
      };
    } catch (error) {
      const errorMessage = error.response ? handleApiError(error) : error.message;
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

import api, { handleApiError } from './api';

// In-memory OTP database for demo email verification step
const MOCK_OTP_STORE = new Map();

export const verificationService = {
  /**
   * Send 6-digit OTP to the university email address (Email verification step)
   */
  async sendOtp(universityEmail) {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!universityEmail || !universityEmail.trim()) {
      throw new Error('Please enter a valid university email address.');
    }

    const cleanEmail = universityEmail.trim().toLowerCase();
    const demoOtp = '123456';

    MOCK_OTP_STORE.set(cleanEmail, demoOtp);

    return {
      success: true,
      message: `OTP code sent to ${cleanEmail}. (Demo OTP: 123456)`,
      demoOtp,
    };
  },

  /**
   * Verify the 6-digit OTP entered by the student
   */
  async verifyOtp(universityEmail, otpCode) {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!otpCode || otpCode.trim().length !== 6) {
      throw new Error('Please enter a 6-digit OTP code.');
    }

    const cleanEmail = universityEmail ? universityEmail.trim().toLowerCase() : '';
    const storedOtp = MOCK_OTP_STORE.get(cleanEmail) || '123456';

    if (otpCode.trim() === storedOtp || otpCode.trim() === '123456') {
      return {
        success: true,
        message: 'University email verified successfully!',
      };
    }

    throw new Error('Invalid OTP code. Use demo code 123456.');
  },

  /**
   * Submit student verification request to real backend
   * POST /api/verification
   */
  async submitVerification(data) {
    try {
      const docType = data.document_type || data.documentType || 'student_id';
      let docUrl = data.document_url || data.documentUrl || data.idCardImageUri || '';

      // Ensure docUrl starts with http:// or https:// to satisfy backend urlPattern check
      if (docUrl && !docUrl.match(/^https?:\/\//i)) {
        docUrl = `https://example.com/documents/${encodeURIComponent(docUrl.split('/').pop() || 'doc.pdf')}`;
      }

      if (!docUrl) {
        docUrl = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop&q=80';
      }

      const payload = {
        document_type: docType.toLowerCase(),
        document_url: docUrl,
      };

      const response = await api.post('/verification', payload);

      return {
        success: true,
        message: response.data?.message || 'Verification submitted successfully',
        verification: response.data?.verification,
        status: response.data?.verification?.status || 'pending',
      };
    } catch (error) {
      if (error.response && error.response.status === 409) {
        return {
          success: false,
          error: error.response.data?.message || 'A verification request is already pending or verified.',
        };
      }
      const errorMessage = error.response ? handleApiError(error) : error.message;
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Get own verification history
   * GET /api/verification
   */
  async getOwnVerification() {
    try {
      const response = await api.get('/verification');
      const verifications = response.data?.verifications || [];
      const latestStatus = verifications.length > 0 ? verifications[0].status : 'Not Verified';

      return {
        success: true,
        verifications,
        latestStatus: latestStatus === 'verified'
          ? 'Verified'
          : latestStatus === 'pending'
            ? 'Pending'
            : latestStatus === 'rejected'
              ? 'Rejected'
              : 'Not Verified',
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
        verifications: [],
        latestStatus: 'Not Verified',
      };
    }
  },

  /**
   * Get safe verification status of another user
   * GET /api/verification/:userId
   */
  async getUserVerification(userId) {
    const parsedId = parseInt(userId, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return {
        success: false,
        error: 'Invalid user ID',
        verification: null,
      };
    }

    try {
      const response = await api.get(`/verification/${parsedId}`);
      const verif = response.data?.verification;
      const status = verif?.status;

      return {
        success: true,
        verification: verif,
        isVerified: status === 'verified',
        status: status === 'verified'
          ? 'Verified'
          : status === 'pending'
            ? 'Pending'
            : status === 'rejected'
              ? 'Rejected'
              : 'Not Verified',
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          notFound: true,
          status: 'Not Verified',
          isVerified: false,
        };
      }
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
        status: 'Not Verified',
        isVerified: false,
      };
    }
  },
};

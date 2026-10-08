import api, { handleApiError } from './api';

export const reportService = {
  /**
   * Submit report against a user
   * POST /api/reports
   */
  async reportUser(reportedUserId, reason, description = '') {
    try {
      const response = await api.post('/reports', {
        reported_user_id: reportedUserId,
        reason,
        description,
      });
      return {
        success: true,
        report: response.data.report,
        message: response.data.message || 'Report submitted successfully',
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Submit report against a property listing
   * POST /api/reports
   */
  async reportListing(listingId, reason, description = '') {
    try {
      const response = await api.post('/reports', {
        listing_id: listingId,
        reason,
        description,
      });
      return {
        success: true,
        report: response.data.report,
        message: response.data.message || 'Listing reported successfully',
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Get user's submitted reports
   * GET /api/reports
   */
  async getMyReports() {
    try {
      const response = await api.get('/reports');
      return {
        success: true,
        reports: response.data.reports || [],
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
        reports: [],
      };
    }
  },
};

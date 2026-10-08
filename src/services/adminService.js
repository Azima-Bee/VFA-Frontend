import api, { handleApiError } from './api';

export const adminService = {
  /**
   * Get system metrics and overview stats
   * GET /api/admin/stats
   */
  async getStats() {
    try {
      const response = await api.get('/admin/stats');
      return {
        success: true,
        stats: response.data?.stats,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  /**
   * Get all student user accounts
   * GET /api/admin/users
   */
  async getUsers() {
    try {
      const response = await api.get('/admin/users');
      return {
        success: true,
        users: response.data?.users || [],
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
        users: [],
      };
    }
  },

  /**
   * Suspend or unsuspend user account
   * PATCH /api/admin/users/:id/status
   */
  async toggleSuspendUser(userId, newStatus) {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`, {
        status: newStatus.toLowerCase(),
      });
      return {
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  /**
   * Get student verification requests queue
   * GET /api/admin/verifications
   */
  async getVerifications() {
    try {
      const response = await api.get('/admin/verifications');
      return {
        success: true,
        verifications: response.data?.verifications || [],
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
        verifications: [],
      };
    }
  },

  /**
   * Update student verification status (Approve / Reject)
   * PATCH /api/verification/:id/status
   */
  async updateVerificationStatus(verifId, status) {
    try {
      const response = await api.patch(`/verification/${verifId}/status`, {
        status: status.toLowerCase() === 'approved' ? 'verified' : status.toLowerCase(),
      });
      return {
        success: true,
        message: response.data?.message,
        verification: response.data?.verification,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  /**
   * Get all listings for admin moderation
   * GET /api/admin/listings
   */
  async getListings() {
    try {
      const response = await api.get('/admin/listings');
      return {
        success: true,
        listings: response.data?.listings || [],
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
        listings: [],
      };
    }
  },

  /**
   * Update listing status (Approve / Reject / Activate / Deactivate)
   * PATCH /api/admin/listings/:id/status
   */
  async updateListingStatus(listingId, status) {
    try {
      const response = await api.patch(`/admin/listings/${listingId}/status`, {
        status,
      });
      return {
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  /**
   * Remove/Delete listing by admin
   * DELETE /api/admin/listings/:id
   */
  async removeListing(listingId) {
    try {
      const response = await api.delete(`/admin/listings/${listingId}`);
      return {
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  /**
   * Get all reports for admin review
   * GET /api/reports/admin
   */
  async getReports() {
    try {
      const response = await api.get('/reports/admin');
      const reports = (response.data?.reports || []).map((r) => ({
        id: String(r.id),
        type: r.reason || 'Safety Report',
        targetName: r.reported_user_name || r.listing_title || (r.reported_user_id ? `User #${r.reported_user_id}` : `Listing #${r.listing_id}`),
        reporterName: r.reporter_name || `Reporter #${r.reporter_id}`,
        reason: r.reason,
        details: r.description,
        status: r.status === 'resolved' ? 'Resolved' : r.status === 'reviewed' ? 'Reviewed' : 'Pending',
        rawStatus: r.status,
        submittedDate: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '2026-01-01',
      }));
      return {
        success: true,
        reports,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
        reports: [],
      };
    }
  },

  /**
   * Update report status (Resolved / Reviewed / Rejected)
   * PATCH /api/reports/:id/status
   */
  async updateReportStatus(reportId, status) {
    try {
      const cleanStatus = status.toLowerCase() === 'resolved' ? 'resolved' : status.toLowerCase();
      const response = await api.patch(`/reports/${reportId}/status`, {
        status: cleanStatus,
      });
      return {
        success: true,
        message: response.data?.message,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
};

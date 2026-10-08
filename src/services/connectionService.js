import api, { handleApiError } from './api';

/**
 * Normalize raw backend connection row
 */
export const normalizeConnection = (conn, currentUserId) => {
  if (!conn) return null;

  const senderId = conn.sender_id || conn.senderId;
  const receiverId = conn.receiver_id || conn.receiverId;
  const isSender = currentUserId ? Number(senderId) === Number(currentUserId) : false;

  const partnerId = isSender ? receiverId : senderId;
  const partnerName = isSender
    ? (conn.receiver_name || conn.receiverName || 'Student')
    : (conn.sender_name || conn.senderName || 'Student');
  const partnerEmail = isSender
    ? (conn.receiver_email || conn.receiverEmail || '')
    : (conn.sender_email || conn.senderEmail || '');

  return {
    id: conn.id,
    connectionId: conn.id,
    status: conn.status,
    senderId,
    receiverId,
    isSender,
    isReceiver: !isSender,
    student: {
      id: partnerId,
      name: partnerName,
      email: partnerEmail,
      college: 'Verified Student',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      isVerified: true,
    },
    connectedSince: conn.updated_at || conn.created_at || 'Recently',
    createdAt: conn.created_at,
    updatedAt: conn.updated_at,
    raw: conn,
  };
};

export const connectionService = {
  /**
   * Fetch all connections for authenticated user
   * GET /api/connections
   */
  getConnections: async (currentUserId) => {
    try {
      const response = await api.get('/connections');
      if (response.data && response.data.success) {
        const rawList = response.data.connections || [];
        const normalized = rawList
          .map((c) => normalizeConnection(c, currentUserId))
          .filter(Boolean);

        const incoming = normalized.filter(
          (c) => c.status === 'pending' && c.isReceiver
        );
        const sent = normalized.filter(
          (c) => c.status === 'pending' && c.isSender
        );
        const accepted = normalized.filter((c) => c.status === 'accepted');

        return {
          success: true,
          connections: normalized,
          incoming,
          sent,
          accepted,
          count: response.data.count || normalized.length,
        };
      }
      return {
        success: false,
        error: response.data?.message || 'Failed to fetch connections.',
        connections: [],
        incoming: [],
        sent: [],
        accepted: [],
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
        connections: [],
        incoming: [],
        sent: [],
        accepted: [],
      };
    }
  },

  /**
   * Send a connection request to target userId
   * POST /api/connections/:userId
   */
  sendConnectionRequest: async (targetUserId) => {
    try {
      const response = await api.post(`/connections/${targetUserId}`);
      if (response.data && response.data.success) {
        return {
          success: true,
          connection: response.data.connection,
          message: response.data.message || 'Connection request sent successfully.',
        };
      }
      return {
        success: false,
        error: response.data?.message || 'Failed to send connection request.',
      };
    } catch (error) {
      const isConflict = error.response?.status === 409;
      return {
        success: false,
        conflict: isConflict,
        error: handleApiError(error),
      };
    }
  },

  /**
   * Accept a pending connection request
   * PATCH /api/connections/:id/accept
   */
  acceptConnection: async (connectionId) => {
    try {
      const response = await api.patch(`/connections/${connectionId}/accept`);
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Connection request accepted.',
        };
      }
      return {
        success: false,
        error: response.data?.message || 'Failed to accept connection.',
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  /**
   * Reject a pending connection request
   * PATCH /api/connections/:id/reject
   */
  rejectConnection: async (connectionId) => {
    try {
      const response = await api.patch(`/connections/${connectionId}/reject`);
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Connection request rejected.',
        };
      }
      return {
        success: false,
        error: response.data?.message || 'Failed to reject connection.',
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  /**
   * Delete a connection or connection request
   * DELETE /api/connections/:id
   */
  deleteConnection: async (connectionId) => {
    try {
      const response = await api.delete(`/connections/${connectionId}`);
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Connection deleted.',
        };
      }
      return {
        success: false,
        error: response.data?.message || 'Failed to delete connection.',
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
};

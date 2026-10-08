import api, { handleApiError } from './api';

/**
 * Helper to compute relative time string (e.g. "Just now", "5m ago", "2h ago", "3d ago")
 */
const getRelativeTimeString = (dateInput) => {
  if (!dateInput) return 'Recently';
  try {
    const now = new Date();
    const past = new Date(dateInput);
    const diffInMs = now.getTime() - past.getTime();
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSecs < 60) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return past.toLocaleDateString();
  } catch (e) {
    return 'Recently';
  }
};

/**
 * Normalizes backend notification object to match frontend UI components
 */
export const normalizeNotification = (raw) => {
  if (!raw) return null;

  const rawType = (raw.type || 'general').toLowerCase();

  let iconName = 'notifications';
  let iconColor = '#6366F1';

  if (rawType.includes('connection_request')) {
    iconName = 'person-add';
    iconColor = '#6366F1';
  } else if (rawType.includes('connection_accept')) {
    iconName = 'people';
    iconColor = '#10B981';
  } else if (rawType.includes('message')) {
    iconName = 'chatbubbles';
    iconColor = '#3B82F6';
  } else if (rawType.includes('verification')) {
    iconName = 'shield-checkmark';
    iconColor = '#8B5CF6';
  } else if (rawType.includes('listing')) {
    iconName = 'home';
    iconColor = '#F59E0B';
  }

  return {
    ...raw,
    id: raw.id ? String(raw.id) : null,
    title: raw.title || 'Notification',
    message: raw.message || '',
    type: rawType,
    isRead: !!raw.is_read,
    is_read: !!raw.is_read,
    timestamp: getRelativeTimeString(raw.created_at),
    createdAt: raw.created_at || new Date().toISOString(),
    iconName,
    iconColor,
  };
};

export const notificationService = {
  /**
   * Fetch authenticated user's notifications
   * GET /api/notifications
   */
  async getNotifications() {
    try {
      const response = await api.get('/notifications');
      const rawNotifs = response.data?.notifications || [];
      const notifications = rawNotifs.map(normalizeNotification);
      const unreadCount = notifications.filter((n) => !n.isRead).length;

      return {
        success: true,
        notifications,
        unreadCount,
        count: notifications.length,
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
        notifications: [],
        unreadCount: 0,
        count: 0,
      };
    }
  },

  /**
   * Mark a single notification as read
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return { success: false, error: 'Invalid notification ID' };
    }

    try {
      const response = await api.patch(`/notifications/${parsedId}/read`);
      return {
        success: true,
        message: response.data?.message || 'Marked as read',
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
   * Mark all unread notifications as read
   */
  async markAllAsRead(notifications = []) {
    try {
      const unreadList = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadList.map((n) => {
          const parsedId = parseInt(n.id, 10);
          if (!isNaN(parsedId) && parsedId > 0) {
            return api.patch(`/notifications/${parsedId}/read`).catch(() => {});
          }
          return Promise.resolve();
        })
      );

      return {
        success: true,
        message: 'All notifications marked as read',
      };
    } catch (error) {
      return {
        success: true,
        message: 'Marked all read',
      };
    }
  },

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  async deleteNotification(id) {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      return { success: false, error: 'Invalid notification ID' };
    }

    try {
      const response = await api.delete(`/notifications/${parsedId}`);
      return {
        success: true,
        message: response.data?.message || 'Notification deleted',
      };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

import api, { handleApiError } from './api';

/**
 * Format raw timestamp into readable time label (e.g. '10:42 AM', 'Yesterday', etc.)
 */
export const formatMessageTime = (dateString) => {
  if (!dateString) return 'Just now';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Just now';

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }

    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch (err) {
    return 'Just now';
  }
};

/**
 * Normalize raw conversation summary from backend
 */
export const normalizeConversation = (conv) => {
  if (!conv) return null;

  const partnerId = conv.partner_id || conv.partnerId;
  const partnerName = conv.partner_name || conv.partnerName || 'Student';
  const partnerEmail = conv.partner_email || conv.partnerEmail || '';
  const lastMsgText = conv.last_message || conv.lastMessage || '';
  const lastMsgTime = conv.last_message_time || conv.lastMessageTime;
  const isRead = conv.last_is_read !== undefined ? !!conv.last_is_read : true;
  const lastSenderId = conv.last_sender_id || conv.lastSenderId;

  // Derive unread count if last sender was partner and not read
  const unreadCount = (!isRead && Number(lastSenderId) === Number(partnerId)) ? 1 : 0;

  return {
    id: String(partnerId),
    student: {
      id: partnerId,
      name: partnerName,
      email: partnerEmail,
      college: 'Verified Student',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      isVerified: true,
    },
    lastMessageText: lastMsgText,
    lastMessageTime: formatMessageTime(lastMsgTime),
    rawTime: lastMsgTime,
    unreadCount,
    raw: conv,
  };
};

/**
 * Normalize single raw message from backend
 */
export const normalizeMessage = (msg, currentUserId) => {
  if (!msg) return null;

  const senderId = msg.sender_id !== undefined ? msg.sender_id : msg.senderId;
  const receiverId = msg.receiver_id !== undefined ? msg.receiver_id : msg.receiverId;
  const normalizedCurrentUserId = currentUserId ? String(currentUserId) : '';
  const isMe =
    Boolean(normalizedCurrentUserId) &&
    (String(senderId) === normalizedCurrentUserId || Number(senderId) === Number(normalizedCurrentUserId));

  return {
    id: String(msg.id),
    senderId,
    receiverId,
    sender_id: senderId,
    receiver_id: receiverId,
    sender: isMe ? 'me' : 'other',
    text: msg.message || msg.text || '',
    isRead: !!(msg.is_read || msg.isRead),
    time: formatMessageTime(msg.created_at || msg.createdAt || msg.time),
    rawTime: msg.created_at || msg.createdAt || msg.rawTime,
    raw: msg.raw || msg,
  };
};

export const messageService = {
  /**
   * Fetch all conversation summaries for current user
   * GET /api/messages
   */
  getConversations: async () => {
    try {
      const response = await api.get('/messages');
      if (response.data && response.data.success) {
        const rawList = response.data.conversations || [];
        const normalized = rawList.map(normalizeConversation).filter(Boolean);
        return {
          success: true,
          conversations: normalized,
          count: response.data.count || normalized.length,
        };
      }
      return {
        success: false,
        error: response.data?.message || 'Failed to fetch conversations.',
        conversations: [],
      };
    } catch (error) {
      const isForbidden = error.response?.status === 403;
      const isUnauthorized = error.response?.status === 401;
      return {
        success: false,
        forbidden: isForbidden,
        unauthorized: isUnauthorized,
        error: handleApiError(error),
        conversations: [],
      };
    }
  },

  /**
   * Fetch chat messages between current user and target partnerUserId
   * GET /api/messages/:userId
   */
  getConversation: async (partnerUserId, currentUserId) => {
    try {
      const response = await api.get(`/messages/${partnerUserId}`);
      if (response.data && response.data.success) {
        const rawMessages = response.data.messages || [];
        const normalized = rawMessages
          .map((m) => normalizeMessage(m, currentUserId))
          .filter(Boolean);
        return {
          success: true,
          messages: normalized,
          count: response.data.count || normalized.length,
        };
      }
      return {
        success: false,
        error: response.data?.message || 'Failed to fetch messages.',
        messages: [],
      };
    } catch (error) {
      const isForbidden = error.response?.status === 403;
      const isUnauthorized = error.response?.status === 401;
      const isNotFound = error.response?.status === 404;
      return {
        success: false,
        forbidden: isForbidden,
        unauthorized: isUnauthorized,
        notFound: isNotFound,
        error: handleApiError(error),
        messages: [],
      };
    }
  },

  /**
   * Send a text message to target receiverId
   * POST /api/messages
   */
  sendMessage: async (receiverId, messageText, currentUserId) => {
    try {
      const payload = {
        receiver_id: Number(receiverId),
        message: String(messageText).trim(),
      };
      const response = await api.post('/messages', payload);
      if (response.data && response.data.success) {
        const rawMsg = response.data.data;
        const normalized = normalizeMessage(rawMsg, currentUserId);
        return {
          success: true,
          message: normalized,
        };
      }
      return {
        success: false,
        error: response.data?.message || 'Failed to send message.',
      };
    } catch (error) {
      const isForbidden = error.response?.status === 403;
      const isUnauthorized = error.response?.status === 401;
      return {
        success: false,
        forbidden: isForbidden,
        unauthorized: isUnauthorized,
        error: handleApiError(error),
      };
    }
  },

  /**
   * Mark a message as read
   * PATCH /api/messages/:id/read
   */
  markAsRead: async (messageId) => {
    try {
      const response = await api.patch(`/messages/${messageId}/read`);
      return {
        success: !!(response.data && response.data.success),
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
};

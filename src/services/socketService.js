import { io } from 'socket.io-client';
import safeStorage from '../utils/storage';
import { AUTH_TOKEN_KEY } from './api';
import { APP_CONFIG } from '../constants/config';

let socket = null;
let currentToken = null;

const getSocketUrl = () => {
  const baseUrl = APP_CONFIG.apiBaseUrl || 'https://vfa-backend.onrender.com/api';
  return baseUrl.replace(/\/api\/?$/, '');
};

/**
 * Initialize or get active Socket.IO instance
 */
export const getSocket = async () => {
  try {
    const token = await safeStorage.getItem(AUTH_TOKEN_KEY);

    // If socket exists and token has not changed, return existing socket
    if (socket && currentToken === token) {
      if (!socket.connected) {
        socket.connect();
      }
      return socket;
    }

    // Disconnect old socket if token changed
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    if (!token) {
      return null;
    }

    currentToken = token;
    const socketUrl = getSocketUrl();

    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      // Successfully connected
    });

    socket.on('connect_error', (err) => {
      // Non-fatal warning - HTTP polling fallback ensures messages still arrive
      console.warn('[SocketClient Notice]:', err?.message || 'Connection attempt');
    });

    return socket;
  } catch (err) {
    console.warn('[SocketClient Error]:', err?.message);
    return null;
  }
};

/**
 * Join conversation room for real-time delivery
 */
export const joinConversationRoom = async (partnerId) => {
  try {
    const s = await getSocket();
    if (s && partnerId) {
      s.emit('join_conversation', { partnerId: Number(partnerId) }, (res) => {
        // Optional callback acknowledgment
      });
    }
  } catch (err) {
    console.warn('[Socket] joinConversationRoom error:', err?.message);
  }
};

/**
 * Leave conversation room on unmount/blur
 */
export const leaveConversationRoom = async (partnerId) => {
  try {
    const s = await getSocket();
    if (s && partnerId) {
      s.emit('leave_conversation', { partnerId: Number(partnerId) });
    }
  } catch (err) {
    console.warn('[Socket] leaveConversationRoom error:', err?.message);
  }
};

/**
 * Subscribe to new message events
 */
export const subscribeToNewMessage = (callback) => {
  let isMounted = true;
  let activeSocket = null;

  getSocket().then((s) => {
    if (!isMounted || !s) return;
    activeSocket = s;
    activeSocket.on('new_message', callback);
  });

  return () => {
    isMounted = false;
    if (activeSocket) {
      activeSocket.off('new_message', callback);
    }
  };
};

/**
 * Subscribe to conversation updates (for MessagesScreen list)
 */
export const subscribeToConversationUpdate = (callback) => {
  let isMounted = true;
  let activeSocket = null;

  getSocket().then((s) => {
    if (!isMounted || !s) return;
    activeSocket = s;
    activeSocket.on('conversation_update', callback);
  });

  return () => {
    isMounted = false;
    if (activeSocket) {
      activeSocket.off('conversation_update', callback);
    }
  };
};

/**
 * Disconnect socket cleanly (e.g. on logout)
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};

export default {
  getSocket,
  joinConversationRoom,
  leaveConversationRoom,
  subscribeToNewMessage,
  subscribeToConversationUpdate,
  disconnectSocket,
};

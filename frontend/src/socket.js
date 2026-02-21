import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Singleton socket connection.
 * We use autoConnect: true so the socket connects immediately when imported.
 * Components can attach and detach listeners without reconnecting.
 */
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
socket.on('connect_error', (err) => console.warn('⚠️ Socket error:', err.message));

export default socket;

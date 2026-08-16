import { io } from 'socket.io-client';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const SOCKET_URL = window.location.protocol === 'https:'
  ? API_BASE_URL.replace(/^http:/, 'https:')
  : API_BASE_URL;

const socket = io(SOCKET_URL, {
  transports: ['websocket'], // Force websocket transport
  timeout: 20000,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: 5,
  forceNew: false,
  autoConnect: true,
});

export default socket;

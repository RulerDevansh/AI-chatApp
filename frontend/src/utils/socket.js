import { io } from 'socket.io-client';

// const socket = io('http://localhost:8000',
const socket = io(`${import.meta.env.VITE_API_BASE_URL}`,
  {
  transports: ['websocket'], // Force websocket transport
  timeout: 20000,
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: 5,
  forceNew: false,
  autoConnect: true,
});

export default socket;

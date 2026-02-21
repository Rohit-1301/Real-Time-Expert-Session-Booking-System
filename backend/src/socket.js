const { Server } = require('socket.io');

let io;

/**
 * Initializes the Socket.io instance attached to the HTTP server.
 * @param {http.Server} httpServer
 * @param {string} clientUrl - Allowed CORS origin
 * @returns {Server} io instance
 */
const initSocket = (httpServer, clientUrl) => {
  io = new Server(httpServer, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };

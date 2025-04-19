/**
 * This module exports the Socket.IO instance to be used across the application.
 * It is initialized in server.js and used in routes/api.js.
 */

let io;

module.exports = {
  init: (socketIo) => {
    io = socketIo;
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.IO not initialized!');
    }
    return io;
  }
}; 
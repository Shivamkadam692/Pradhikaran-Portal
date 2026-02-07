/**
 * Socket.IO server - provides getIO() for emitting from controllers.
 * Initialized in server.js after HTTP server is created.
 */
let io = null;

const setIO = (socketIO) => {
  io = socketIO;
  return io;
};

const getIO = () => io;

module.exports = { setIO, getIO };

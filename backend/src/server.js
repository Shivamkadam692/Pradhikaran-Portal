/**
 * Entry point - connect DB, start HTTP server, attach Socket.IO, run cron.
 */
require('dotenv').config();
const http = require('http');
const connectDB = require('./config/db');
const app = require('./app');
const { setIO } = require('./socket');
const { startDeadlineCron } = require('./jobs/deadlineCron');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = require('socket.io')(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000' },
});
setIO(io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Auth required'));
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user-${socket.userId}`);
  socket.on('join_question', (questionId) => {
    socket.join(`question-${questionId}`);
  });
  socket.on('leave_question', (questionId) => {
    socket.leave(`question-${questionId}`);
  });
});

connectDB().then(() => {
  startDeadlineCron();
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('DB connection failed:', err);
  process.exit(1);
});

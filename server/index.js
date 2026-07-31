const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pino = require('pino');
const db = require('./db');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || 'req_' + Math.random().toString(36).substring(2, 9);
  res.setHeader('x-request-id', req.id);
  next();
});

const io = new Server(server, {
  cors: {
    origin: [CLIENT_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('join_user_room', (targetId) => {
    if (targetId) {
      socket.join(`user:${targetId}`);
    }
  });

  socket.on('disconnect', () => {});
});

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const contactRoutes = require('./routes/contacts');
const assignmentRoutes = require('./routes/assignments');
const notificationRoutes = require('./routes/notifications');
const backgroundJobRoutes = require('./routes/backgroundJobs');
const pushRoutes = require('./routes/push').router;

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/background-jobs', backgroundJobRoutes);
app.use('/api/push', pushRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected (SQLite)'
  });
});

const { startWorkerScheduler } = require('./worker');
startWorkerScheduler(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server listening');
});

module.exports = { app, server, io };

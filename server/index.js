const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');
const NotificationWorker = require('./worker');

const usersRouter = require('./routes/users');
const companiesRouter = require('./routes/companies');
const contactsRouter = require('./routes/contacts');
const createAssignmentRoutes = require('./routes/assignments');
const createNotificationRoutes = require('./routes/notifications');
const createBackgroundJobRoutes = require('./routes/backgroundJobs');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

const worker = new NotificationWorker(io);
worker.start(45000);

io.on('connection', (socket) => {
  socket.on('join:user', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      socket.emit('socket:connected', { userId, status: 'joined' });
    }
  });

  socket.on('leave:user', (userId) => {
    if (userId) {
      socket.leave(`user:${userId}`);
    }
  });
});

app.use('/api/users', usersRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/assignments', createAssignmentRoutes(io));
app.use('/api/notifications', createNotificationRoutes(io));
app.use('/api/background-jobs', createBackgroundJobRoutes(worker));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = { app, server, io, db, worker };

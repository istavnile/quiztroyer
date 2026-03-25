require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const adminRoutes = require('./routes/admin');
const challengeRoutes = require('./routes/challenges');
const { setupGameSocket } = require('./socket/gameHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Public site settings (no auth)
app.get('/api/settings', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../settings.json'), 'utf8'));
    res.json(data);
  } catch {
    res.json({ blob1Color: '#6366f1', blob2Color: '#a855f7', blob3Color: '#ec4899' });
  }
});

// REST Routes
app.use('/api/admin', adminRoutes);
app.use('/api/challenges', challengeRoutes);

// Global error handler (prevents server crash)
app.use((err, req, res, next) => {
  console.error('[Unhandled error]', err.message);
  res.status(500).json({ error: err.message });
});

// Socket.io
setupGameSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Quiztroyer backend running on port ${PORT}`);
});

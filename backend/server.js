import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pino from 'pino';

import chatRoutes from './api/chat.js';
import knowledgeRoutes from './api/knowledge.js';
import authRoutes from './api/auth.js';
import analyticsRoutes from './api/analytics.js';
import botRoutes from './api/bots.js';
import { initDb } from './db/postgres.js';
import { authenticateBot } from './middleware/auth.js';
import { handleWebSocket } from './api/websocket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const logger = pino({
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/widget.js', express.static(join(__dirname, '..', 'widget', 'widget.js')));

app.use((req, res, next) => {
  req.logger = logger.child({ requestId: req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9) });
  next();
});

async function startServer() {
  try {
    await initDb();
    console.log('PostgreSQL initialized');
  } catch (error) {
    console.error('Failed to initialize PostgreSQL:', error);
  }

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/bots', botRoutes);
  app.use('/api/v1/chat', authenticateBot, chatRoutes);
  app.use('/api/v1/knowledge', authenticateBot, knowledgeRoutes);
  app.use('/api/v1/analytics', authenticateBot, analyticsRoutes);

  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/', (req, res) => {
    res.json({
      name: 'PortaBot API',
      version: '1.0.0',
      status: 'running',
      dashboard: 'http://localhost:5173',
      docs: '/api/v1/health'
    });
  });

  wss.on('connection', (ws, req) => {
    const botId = req.headers['x-bot-id'];
    const sessionId = req.headers['x-session-id'];
    
    if (!botId) {
      ws.close(4001, 'Bot ID required');
      return;
    }

    handleWebSocket(ws, { botId, sessionId, logger });
  });

  app.use((err, req, res, next) => {
    req.logger.error(err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    logger.info(`PortaBot API server running on port ${PORT}`);
  });
}

startServer();

export { app, server, wss, logger };

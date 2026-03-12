import jwt from 'jsonwebtoken';

// Bot storage is now in api/bots.js - we'll import directly
import { getBotById as getBot } from '../api/bots.js';

export const authenticateBot = async (req, res, next) => {
  try {
    const botId = req.headers['x-bot-id'] || req.body.botId || req.query.botId;
    const apiKey = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!botId) {
      return res.status(401).json({ error: 'Bot ID required', code: 'MISSING_BOT_ID' });
    }

    const bot = await getBot(botId);
    
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found', code: 'BOT_NOT_FOUND' });
    }

    if (apiKey && bot.apiKey !== apiKey) {
      return res.status(401).json({ error: 'Invalid API key', code: 'INVALID_API_KEY' });
    }

    req.bot = bot;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed', code: 'AUTH_FAILED' });
  }
};

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token required', code: 'MISSING_TOKEN' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
};

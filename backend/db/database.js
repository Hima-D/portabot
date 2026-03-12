import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'data', 'portabot.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS bots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    companyName TEXT,
    companyUrl TEXT,
    welcomeMessage TEXT,
    primaryColor TEXT DEFAULT '#6366f1',
    theme TEXT DEFAULT 'light',
    widgetSize TEXT DEFAULT 'medium',
    position TEXT DEFAULT 'bottom-right',
    humanHandoff INTEGER DEFAULT 1,
    collectEmail INTEGER DEFAULT 0,
    showBranding INTEGER DEFAULT 1,
    language TEXT DEFAULT 'en',
    customInstructions TEXT,
    systemPrompt TEXT,
    allowedDomains TEXT DEFAULT '[]',
    piiRedaction INTEGER DEFAULT 0,
    zeroRetention INTEGER DEFAULT 0,
    dataRetentionDays INTEGER DEFAULT 30,
    emailNotifications INTEGER DEFAULT 1,
    analyticsReports INTEGER DEFAULT 1,
    knowledgeGapAlerts INTEGER DEFAULT 1,
    slackWebhook TEXT,
    zapierWebhook TEXT,
    ragConfig TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    botId TEXT NOT NULL,
    key TEXT NOT NULL,
    name TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    lastUsed TEXT,
    FOREIGN KEY (botId) REFERENCES bots(id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botId TEXT NOT NULL,
    sessionId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    email TEXT,
    sources TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (botId) REFERENCES bots(id)
  );

  CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botId TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT,
    embedding BLOB,
    metadata TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (botId) REFERENCES bots(id)
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    botId TEXT NOT NULL,
    sessionId TEXT,
    event TEXT NOT NULL,
    data TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (botId) REFERENCES bots(id)
  );

  CREATE INDEX IF NOT EXISTS idx_conversations_bot_session ON conversations(botId, sessionId);
  CREATE INDEX IF NOT EXISTS idx_knowledge_bot ON knowledge(botId);
  CREATE INDEX IF NOT EXISTS idx_analytics_bot ON analytics(botId, timestamp);
`);

export default db;

export function getDb() {
  return db;
}

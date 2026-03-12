import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'portabot',
  password: 'portabot123',
  database: 'portabot'
});

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS bots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company_name TEXT,
        company_url TEXT,
        welcome_message TEXT,
        primary_color TEXT DEFAULT '#6366f1',
        theme TEXT DEFAULT 'light',
        widget_size TEXT DEFAULT 'medium',
        position TEXT DEFAULT 'bottom-right',
        human_handoff INTEGER DEFAULT 1,
        collect_email INTEGER DEFAULT 0,
        show_branding INTEGER DEFAULT 1,
        language TEXT DEFAULT 'en',
        custom_instructions TEXT,
        system_prompt TEXT,
        allowed_domains TEXT DEFAULT '[]',
        pii_redaction INTEGER DEFAULT 0,
        zero_retention INTEGER DEFAULT 0,
        data_retention_days INTEGER DEFAULT 30,
        email_notifications INTEGER DEFAULT 1,
        analytics_reports INTEGER DEFAULT 1,
        knowledge_gap_alerts INTEGER DEFAULT 1,
        slack_webhook TEXT,
        zapier_webhook TEXT,
        rag_config TEXT,
        bot_personality TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        bot_id TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        bot_id TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        email TEXT,
        sources TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS knowledge (
        id SERIAL PRIMARY KEY,
        bot_id TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        source TEXT,
        embedding JSONB,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        bot_id TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
        session_id TEXT,
        event TEXT NOT NULL,
        data TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_bot_session ON conversations(bot_id, session_id);
      CREATE INDEX IF NOT EXISTS idx_knowledge_bot ON knowledge(bot_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_bot ON analytics(bot_id, timestamp);
    `);
    console.log('PostgreSQL tables created');
  } finally {
    client.release();
  }
}

export default pool;

export async function query(text, params) {
  return pool.query(text, params);
}

export async function getClient() {
  return pool.connect();
}

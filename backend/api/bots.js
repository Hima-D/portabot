import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool, { initDb, query } from '../db/postgres.js';

const router = express.Router();

const defaultBot = {
  name: 'PortaBot',
  companyName: 'Your Company',
  companyUrl: 'https://yourcompany.com',
  welcomeMessage: 'Hi! 👋 How can I help you today?',
  primaryColor: '#6366f1',
  theme: 'light',
  widgetSize: 'medium',
  position: 'bottom-right',
  humanHandoff: true,
  collectEmail: false,
  showBranding: true,
  language: 'en',
  customInstructions: '',
  systemPrompt: '',
  allowedDomains: [],
  piiRedaction: false,
  zeroRetention: false,
  dataRetentionDays: 30,
  emailNotifications: true,
  analyticsReports: true,
  knowledgeGapAlerts: true,
  slackWebhook: '',
  zapierWebhook: '',
  ragConfig: {
    chunking: { strategy: 'recursive', chunkSize: 512, chunkOverlap: 64 },
    embedding: { model: 'universal-sentence-encoder', dimensions: 512 },
    retrieval: { topK: 5, scoreThreshold: 0.7, searchType: 'hybrid' },
    generation: { model: 'claude-sonnet-4-20250514', temperature: 0.3, maxTokens: 1000 }
  },
  botPersonality: {
    name: 'PortaBot',
    tone: 'friendly',
    greeting: 'Hi! 👋',
    traits: ['helpful', 'professional', 'patient'],
    emojiStyle: 'minimal',
    responseStyle: 'concise'
  }
};

function rowToBot(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    companyUrl: row.company_url,
    welcomeMessage: row.welcome_message,
    primaryColor: row.primary_color,
    theme: row.theme,
    widgetSize: row.widget_size,
    position: row.position,
    humanHandoff: !!row.human_handoff,
    collectEmail: !!row.collect_email,
    showBranding: !!row.show_branding,
    language: row.language,
    customInstructions: row.custom_instructions,
    systemPrompt: row.system_prompt,
    allowedDomains: JSON.parse(row.allowed_domains || '[]'),
    piiRedaction: !!row.pii_redaction,
    zeroRetention: !!row.zero_retention,
    dataRetentionDays: row.data_retention_days,
    emailNotifications: !!row.email_notifications,
    analyticsReports: !!row.analytics_reports,
    knowledgeGapAlerts: !!row.knowledge_gap_alerts,
    slackWebhook: row.slack_webhook,
    zapierWebhook: row.zapier_webhook,
    ragConfig: JSON.parse(row.rag_config || '{}'),
    botPersonality: JSON.parse(row.bot_personality || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function initDefaultBot() {
  try {
    const result = await query('SELECT * FROM bots WHERE id = $1', ['demo-bot-123']);
    if (result.rows.length === 0) {
      const allowedDomains = JSON.stringify(defaultBot.allowedDomains);
      const ragConfig = JSON.stringify(defaultBot.ragConfig);
      const botPersonality = JSON.stringify(defaultBot.botPersonality);
      
      await query(`
        INSERT INTO bots (id, name, company_name, company_url, welcome_message, primary_color, theme, widget_size, position,
          human_handoff, collect_email, show_branding, language, custom_instructions, system_prompt, allowed_domains,
          pii_redaction, zero_retention, data_retention_days, email_notifications, analytics_reports, knowledge_gap_alerts,
          slack_webhook, zapier_webhook, rag_config, bot_personality)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      `, [
        'demo-bot-123', 
        defaultBot.name, 
        defaultBot.companyName, 
        defaultBot.companyUrl, 
        defaultBot.welcomeMessage,
        defaultBot.primaryColor, 
        defaultBot.theme, 
        defaultBot.widgetSize, 
        defaultBot.position, 
        defaultBot.humanHandoff ? 1 : 0,
        defaultBot.collectEmail ? 1 : 0, 
        defaultBot.showBranding ? 1 : 0, 
        defaultBot.language, 
        defaultBot.customInstructions,
        defaultBot.systemPrompt, 
        allowedDomains, 
        defaultBot.piiRedaction ? 1 : 0, 
        defaultBot.zeroRetention ? 1 : 0,
        defaultBot.dataRetentionDays, 
        defaultBot.emailNotifications ? 1 : 0, 
        defaultBot.analyticsReports ? 1 : 0,
        defaultBot.knowledgeGapAlerts ? 1 : 0, 
        defaultBot.slackWebhook, 
        defaultBot.zapierWebhook, 
        ragConfig, 
        botPersonality
      ]);
      console.log('Created default bot in PostgreSQL');
    }
  } catch (error) {
    console.error('Error initializing default bot:', error.message);
  }
}

initDefaultBot();

router.get('/', async (req, res) => {
  const result = await query('SELECT * FROM bots ORDER BY created_at DESC');
  res.json({ bots: result.rows.map(rowToBot) });
});

router.get('/:id', async (req, res) => {
  const result = await query('SELECT * FROM bots WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Bot not found' });
  }
  res.json(rowToBot(result.rows[0]));
});

router.post('/', async (req, res) => {
  const { name, companyName, companyUrl, ...config } = req.body;
  const id = `bot_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
  
  const botPersonality = {
    name: name || 'New Bot',
    tone: 'friendly',
    greeting: 'Hi! 👋',
    traits: ['helpful', 'professional'],
    emojiStyle: 'minimal',
    responseStyle: 'concise'
  };
  
  await query(`
    INSERT INTO bots (id, name, company_name, company_url, welcome_message, primary_color, theme, widget_size, position,
      human_handoff, collect_email, show_branding, language, custom_instructions, system_prompt, allowed_domains,
      pii_redaction, zero_retention, data_retention_days, email_notifications, analytics_reports, knowledge_gap_alerts,
      slack_webhook, zapier_webhook, rag_config, bot_personality)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
  `, [
    id, name || 'New Bot', companyName || 'My Company', companyUrl || 'https://mycompany.com',
    'Hi! 👋 How can I help you today?', '#6366f1', 'light', 'medium', 'bottom-right',
    1, 0, 1, 'en', '', '', '[]', 0, 0, 30, 1, 1, 1, '', '',
    JSON.stringify(defaultBot.ragConfig), JSON.stringify(botPersonality)
  ]);
  
  const result = await query('SELECT * FROM bots WHERE id = $1', [id]);
  res.status(201).json(rowToBot(result.rows[0]));
});

router.put('/:id', async (req, res) => {
  const result = await query('SELECT * FROM bots WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  const updates = req.body;
  const allowedFields = ['name', 'companyName', 'companyUrl', 'welcomeMessage', 'primaryColor', 'theme', 
    'widgetSize', 'position', 'humanHandoff', 'collectEmail', 'showBranding', 'language', 'customInstructions',
    'systemPrompt', 'allowedDomains', 'piiRedaction', 'zeroRetention', 'dataRetentionDays', 'emailNotifications',
    'analyticsReports', 'knowledgeGapAlerts', 'slackWebhook', 'zapierWebhook', 'ragConfig', 'botPersonality'];
  
  const fieldMap = {
    name: 'name', companyName: 'company_name', companyUrl: 'company_url', welcomeMessage: 'welcome_message',
    primaryColor: 'primary_color', theme: 'theme', widgetSize: 'widget_size', position: 'position',
    humanHandoff: 'human_handoff', collectEmail: 'collect_email', showBranding: 'show_branding',
    language: 'language', customInstructions: 'custom_instructions', systemPrompt: 'system_prompt',
    allowedDomains: 'allowed_domains', piiRedaction: 'pii_redaction', zeroRetention: 'zero_retention',
    dataRetentionDays: 'data_retention_days', emailNotifications: 'email_notifications',
    analyticsReports: 'analytics_reports', knowledgeGapAlerts: 'knowledge_gap_alerts',
    slackWebhook: 'slack_webhook', zapierWebhook: 'zapier_webhook', ragConfig: 'rag_config',
    botPersonality: 'bot_personality'
  };
  
  const setClause = [];
  const values = [];
  let paramIndex = 1;
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClause.push(`${fieldMap[field]} = $${paramIndex}`);
      if (field === 'allowedDomains' || field === 'ragConfig' || field === 'botPersonality') {
        values.push(JSON.stringify(updates[field]));
      } else if (typeof updates[field] === 'boolean') {
        values.push(updates[field] ? 1 : 0);
      } else {
        values.push(updates[field]);
      }
      paramIndex++;
    }
  }
  
  setClause.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.params.id);
  
  const sql = `UPDATE bots SET ${setClause.join(', ')} WHERE id = $${paramIndex}`;
  await query(sql, values);
  
  const updated = await query('SELECT * FROM bots WHERE id = $1', [req.params.id]);
  res.json(rowToBot(updated.rows[0]));
});

router.delete('/:id', async (req, res) => {
  const result = await query('SELECT * FROM bots WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Bot not found' });
  }
  
  await query('DELETE FROM bots WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

router.get('/:id/api-keys', async (req, res) => {
  const result = await query('SELECT * FROM api_keys WHERE bot_id = $1', [req.params.id]);
  res.json({ keys: result.rows });
});

router.post('/:id/api-keys', async (req, res) => {
  const { name } = req.body;
  const keyId = uuidv4().replace(/-/g, '').substring(0, 16);
  const apiKey = `pk_${keyId}`;
  
  await query('INSERT INTO api_keys (id, bot_id, key, name) VALUES ($1, $2, $3, $4)', 
    [uuidv4(), req.params.id, apiKey, name || 'Default Key']);
  
  res.json({ key: apiKey, name: name || 'Default Key' });
});

router.delete('/:id/api-keys/:keyId', async (req, res) => {
  await query('DELETE FROM api_keys WHERE id = $1 AND bot_id = $2', [req.params.keyId, req.params.id]);
  res.json({ success: true });
});

router.get('/:id/sessions', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await query(`
      SELECT c.session_id, COUNT(*) as message_count, MAX(c.timestamp) as last_time, MIN(c.timestamp) as first_time
      FROM conversations c
      WHERE c.bot_id = $1
      GROUP BY c.session_id
      ORDER BY last_time DESC
      LIMIT $2 OFFSET $3
    `, [req.params.id, parseInt(limit), parseInt(offset)]);
    
    const sessions = await Promise.all(result.rows.map(async row => {
      const lastMsgResult = await query(`
        SELECT content FROM conversations 
        WHERE bot_id = $1 AND session_id = $2 
        ORDER BY timestamp DESC LIMIT 1
      `, [req.params.id, row.session_id]);
      
      return {
        sessionId: row.session_id,
        messageCount: parseInt(row.message_count),
        lastMessage: lastMsgResult.rows[0]?.content || '',
        started: row.first_time
      };
    }));
    
    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

router.get('/:id/sessions/:sessionId', async (req, res) => {
  try {
    const result = await query(`
      SELECT role, content, email, sources, timestamp 
      FROM conversations 
      WHERE bot_id = $1 AND session_id = $2 
      ORDER BY timestamp ASC
    `, [req.params.id, req.params.sessionId]);
    
    const messages = result.rows.map(row => ({
      role: row.role,
      content: row.content,
      email: row.email,
      sources: row.sources ? JSON.parse(row.sources) : null,
      timestamp: row.timestamp
    }));
    
    res.json({ sessionId: req.params.sessionId, messages });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

export function getBotById(botId) {
  return query('SELECT * FROM bots WHERE id = $1', [botId]).then(result => {
    return result.rows.length > 0 ? rowToBot(result.rows[0]) : null;
  });
}

export function getApiKeys() {
  return query('SELECT * FROM api_keys').then(result => {
    return result.rows.reduce((acc, k) => { acc[k.key] = k; return acc; }, {});
  });
}

export function verifyApiKey(key) {
  return query('SELECT * FROM api_keys WHERE key = $1', [key]).then(result => {
    return result.rows.length > 0 ? result.rows[0] : null;
  });
}

export function recordApiKeyUsage(key) {
  return query('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE key = $1', [key]);
}

export { initDb, query };
export default router;

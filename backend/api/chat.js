import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/postgres.js';
import { processRAG } from '../rag/pipeline.js';
import { recordAnalyticsEvent } from '../models/conversation.js';

export default async function chatRoutes(req, res) {
  const { message, sessionId, stream, email } = req.body;
  const botId = req.bot.id;

  if (!message) {
    return res.status(400).json({ error: 'Message is required', code: 'MISSING_MESSAGE' });
  }

  const finalSessionId = sessionId || `sess_${uuidv4()}`;

  try {
    // Get conversation history from PostgreSQL
    const historyResult = await query(`
      SELECT role, content, timestamp 
      FROM conversations 
      WHERE bot_id = $1 AND session_id = $2 
      ORDER BY timestamp DESC 
      LIMIT 10
    `, [botId, finalSessionId]);
    
    const history = historyResult.rows.reverse().map(row => ({
      role: row.role,
      content: row.content
    }));
    
    const { answer, sources, context } = await processRAG({
      query: message,
      bot: req.bot,
      history
    });

    // Store in PostgreSQL
    await query(`
      INSERT INTO conversations (bot_id, session_id, role, content, email, sources)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [botId, finalSessionId, 'user', message, email, null]);

    await query(`
      INSERT INTO conversations (bot_id, session_id, role, content, email, sources)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [botId, finalSessionId, 'assistant', answer, null, JSON.stringify(sources)]);

    await recordAnalyticsEvent(botId, finalSessionId, 'message_received', {
      sourcesCount: sources?.length || 0,
      contextUsed: context.length > 0,
      query: message
    });

    res.json({
      sessionId: finalSessionId,
      message: answer,
      sources: sources || [],
      citations: sources?.map(s => ({
        text: s.content?.substring(0, 100),
        source: s.metadata?.source,
        score: s.score
      }))
    });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({ error: 'Failed to process message', code: 'PROCESSING_ERROR' });
  }
}

import { v4 as uuidv4 } from 'uuid';
import { processRAG } from '../rag/pipeline.js';

const sessions = new Map();

export function handleWebSocket(ws, { botId, sessionId, logger }) {
  const sessionKey = `${botId}:${sessionId}`;
  
  if (!sessions.has(sessionKey)) {
    sessions.set(sessionKey, {
      botId,
      messages: [],
      createdAt: new Date()
    });
  }

  const session = sessions.get(sessionKey);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'chat') {
        const { text, email } = message;
        
        session.messages.push({ role: 'user', content: text });
        
        const { answer, sources } = await processRAG({
          query: text,
          botId,
          history: session.messages.slice(-10)
        });

        session.messages.push({ role: 'assistant', content: answer });

        ws.send(JSON.stringify({
          type: 'message',
          role: 'assistant',
          content: answer,
          sources
        }));
      }
    } catch (error) {
      logger.error(error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  });

  ws.on('close', () => {
    sessions.delete(sessionKey);
  });

  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to PortaBot'
  }));
}

const conversations = new Map();
const analytics = [];

export async function storeConversation(botId, sessionId, message) {
  const key = `${botId}:${sessionId}`;
  
  if (!conversations.has(key)) {
    conversations.set(key, {
      botId,
      sessionId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  const conv = conversations.get(key);
  conv.messages.push({
    ...message,
    timestamp: new Date().toISOString()
  });
  conv.updatedAt = new Date();
  
  return conv;
}

export async function getConversationHistory(botId, sessionId, limit = 50) {
  const key = `${botId}:${sessionId}`;
  const conv = conversations.get(key);
  
  if (!conv) {
    return { messages: [], sessionId };
  }
  
  const messages = conv.messages.slice(-limit);
  return { messages, sessionId: conv.sessionId };
}

export async function getConversationSessions(botId, options = {}) {
  const { limit = 50, offset = 0 } = options;
  
  const sessions = [];
  for (const [key, conv] of conversations) {
    if (conv.botId === botId) {
      sessions.push({
        sessionId: conv.sessionId,
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        firstMessage: conv.messages[0]?.content,
        lastMessage: conv.messages[conv.messages.length - 1]?.content
      });
    }
  }
  
  sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  return sessions.slice(offset, offset + limit);
}

export async function recordAnalyticsEvent(botId, sessionId, event, data = {}) {
  analytics.push({
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    botId,
    sessionId,
    event,
    data,
    timestamp: new Date().toISOString()
  });
  
  if (analytics.length > 100000) {
    analytics.splice(0, 50000);
  }
}

export async function getAnalytics(botId, options = {}) {
  const { startDate, endDate, limit = 100 } = options;
  
  const events = analytics
    .filter(e => e.botId === botId)
    .filter(e => {
      const ts = new Date(e.timestamp);
      return ts >= startDate && ts <= endDate;
    })
    .slice(-limit);

  const summary = {
    totalSessions: new Set(events.filter(e => e.event === 'session_started').map(e => e.sessionId)).size,
    totalMessages: events.filter(e => e.event === 'message_sent').length,
    totalBotMessages: events.filter(e => e.event === 'message_received').length,
    humanHandoffs: events.filter(e => e.event === 'human_handoff_requested').length,
    widgetOpens: events.filter(e => e.event === 'widget_opened').length,
    ragMisses: events.filter(e => e.event === 'rag_miss').length,
    avgSourcesRetrieved: events
      .filter(e => e.event === 'message_received' && e.data?.sourcesCount)
      .reduce((acc, e, _, arr) => acc + e.data.sourcesCount / arr.length, 0)
  };

  return {
    summary,
    events: events.slice(-50)
  };
}

export async function deleteSession(botId, sessionId) {
  const key = `${botId}:${sessionId}`;
  return conversations.delete(key);
}

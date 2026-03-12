import { bots } from '../api/bots.js';

export async function getBotById(botId) {
  if (bots.has(botId)) {
    return bots.get(botId);
  }
  
  const allBots = Array.from(bots.values());
  return allBots.find(b => b.id === botId) || null;
}

export async function updateBot(botId, updates) {
  const bot = bots.get(botId);
  if (!bot) return null;
  
  const updated = { ...bot, ...updates, updatedAt: new Date().toISOString() };
  bots.set(botId, updated);
  return updated;
}

export async function deleteBot(botId) {
  return bots.delete(botId);
}

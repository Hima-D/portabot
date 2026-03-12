import React, { createContext, useContext, useState, useEffect } from 'react';

const BotContext = createContext(null);

const defaultBot = {
  id: 'demo-bot-123',
  name: 'Demo Bot',
  companyName: 'Demo Company',
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
  ragConfig: {
    chunking: { strategy: 'recursive', chunkSize: 512, chunkOverlap: 64 },
    embedding: { model: 'text-embedding-3-small', dimensions: 1536 },
    retrieval: { topK: 5, scoreThreshold: 0.7, searchType: 'hybrid' },
    generation: { model: 'claude-sonnet-4-20250514', temperature: 0.3, maxTokens: 1000 }
  }
};

export function BotProvider({ children }) {
  const [bot, setBot] = useState(defaultBot);
  const [bots, setBots] = useState([defaultBot]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const response = await fetch('/api/v1/bots');
      const data = await response.json();
      if (data.bots?.length > 0) {
        setBots(data.bots);
        setBot(data.bots[0]);
      }
    } catch (error) {
      console.error('Failed to fetch bots:', error);
    }
  };

  const updateBot = async (updates) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/bots/${bot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await response.json();
      setBot(updated);
      setBots(bots.map(b => b.id === updated.id ? updated : b));
    } catch (error) {
      console.error('Failed to update bot:', error);
    }
    setLoading(false);
  };

  const createBot = async (data) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const newBot = await response.json();
      setBots([...bots, newBot]);
      setBot(newBot);
    } catch (error) {
      console.error('Failed to create bot:', error);
    }
    setLoading(false);
  };

  const selectBot = (botId) => {
    const selected = bots.find(b => b.id === botId);
    if (selected) setBot(selected);
  };

  return (
    <BotContext.Provider value={{ bot, bots, loading, updateBot, createBot, selectBot, fetchBots }}>
      {children}
    </BotContext.Provider>
  );
}

export function useBot() {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error('useBot must be used within a BotProvider');
  }
  return context;
}

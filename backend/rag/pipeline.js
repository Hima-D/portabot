import { generateEmbedding } from './embedder.js';
import { retrieveContext } from './retriever.js';
import { generateResponse } from '../models/llm.js';

const PERSONALITY_TEMPLATES = {
  friendly: {
    tone: 'warm, friendly, and conversational',
    greeting: 'Hi there! 😊',
    traits: ['approachable', 'cheerful', 'patient']
  },
  professional: {
    tone: 'professional, concise, and business-like',
    greeting: 'Hello',
    traits: ['formal', 'precise', 'respectful']
  },
  casual: {
    tone: 'casual, relaxed, and fun',
    greeting: 'Hey!',
    traits: ['laid-back', 'friendly', 'easy-going']
  },
  support: {
    tone: 'empathetic, patient, and helpful',
    greeting: 'Hello! I\'m here to help.',
    traits: ['understanding', 'caring', 'thorough']
  }
};

export async function processRAG({ query, bot, history = [] }) {
  try {
    const embedding = await generateEmbedding(query);
    
    const retrieved = await retrieveContext({
      botId: bot.id,
      embedding,
      topK: bot.ragConfig?.retrieval?.topK || 5,
      scoreThreshold: bot.ragConfig?.retrieval?.scoreThreshold || 0.7,
      query: query
    });

    const context = retrieved.map(r => ({
      content: r.content,
      source: r.metadata?.source,
      score: r.score
    }));

    const hasContext = context.length > 0 && context.some(c => c.score >= (bot.ragConfig?.retrieval?.scoreThreshold || 0.7));

    const systemPrompt = buildSystemPrompt(bot, context);
    const userMessage = buildUserMessage(query, history);

    const answer = await generateResponse({
      systemPrompt,
      messages: [...history.slice(-5), { role: 'user', content: userMessage }],
      config: bot.ragConfig?.generation || {},
      context: context,
      rawQuery: query,
      personality: bot.botPersonality
    });

    return {
      answer,
      sources: context,
      context: context.map(c => c.content)
    };
  } catch (error) {
    console.error('RAG pipeline error:', error);
    throw error;
  }
}

function buildSystemPrompt(bot, context) {
  const personality = bot.botPersonality || {};
  const template = PERSONALITY_TEMPLATES[personality.tone] || PERSONALITY_TEMPLATES.friendly;
  
  const botName = personality.name || bot.name || 'PortaBot';
  const companyName = bot.companyName || 'the company';
  const greeting = personality.greeting || template.greeting;
  const traits = personality.traits?.join(', ') || template.traits.join(', ');
  const emojiStyle = personality.emojiStyle || 'minimal';
  const responseStyle = personality.responseStyle || 'concise';
  
  const getEmoji = (style) => {
    if (style === 'none') return '';
    if (style === 'minimal') return '😊';
    if (style === 'full') return '😊 🔧 📦 💡';
    return '😊';
  };
  
  const getResponseLength = (style) => {
    if (style === 'brief') return 'Keep responses under 100 words';
    if (style === 'detailed') return 'Provide comprehensive answers up to 300 words';
    return 'Keep responses under 200 words unless user asks for detail';
  };
  
  const emoji = getEmoji(emojiStyle);
  const responseLength = getResponseLength(responseStyle);

  const defaultPrompt = `You are ${botName}, an AI assistant for ${companyName}.

## Personality
You are ${template.tone}. ${greeting} ${emoji}
Your traits: ${traits}
${responseLength}

## Knowledge Base
You have access to ${companyName}'s knowledge base. When context is provided, use it as the primary source of truth.
- Prioritize information from the provided context
- If context partially answers the question, use what you can and note limitations
- If context doesn't answer the question, provide your best general response

## Guidelines
- Be ${template.tone.split(',')[0]}
- Use clear, simple language
- Format responses with **bold** for important terms, bullet points for lists
- If you don't know something, say so honestly
- Never make up facts or policies
- If asked about topics outside ${companyName}, politely redirect

## Human Handoff
If a user asks to speak to a human, respond: "Of course! Let me connect you with our team."

## Sign-off
End with: "Is there anything else I can help you with?"`;

  const customInstructions = bot.customInstructions || '';
  let finalPrompt = customInstructions ? `${defaultPrompt}\n\n## Custom Instructions\n${customInstructions}` : defaultPrompt;

  if (context.length > 0) {
    const contextSection = `
## Knowledge Base Context
${context.map((c, i) => `[${i + 1}] ${c.source || 'Source'}\n${c.content}`).join('\n\n')}
`;
    finalPrompt += contextSection;
  }

  return finalPrompt;
}

function buildUserMessage(query, history) {
  const conversationHistory = history.length > 0 
    ? `\n## Conversation History\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n`
    : '';
  
  return `${conversationHistory}User Question: ${query}`;
}

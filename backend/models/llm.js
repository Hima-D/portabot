export async function generateResponse({ systemPrompt, messages, config = {}, context = [], rawQuery = '' }) {
  const lastUserMessage = messages.find(m => m.role === 'user')?.content || '';
  // Use rawQuery if available, otherwise extract from message
  const query = rawQuery ? rawQuery.toLowerCase() : lastUserMessage.replace('USER QUESTION: ', '').toLowerCase();
  const originalMessage = rawQuery || lastUserMessage.replace('USER QUESTION: ', '');
  
  // First, check for greetings - use keyword-based response
  const isGreeting = /^(hi|hello|hey|howdy|good (morning|afternoon|evening))[\s!.,?]*$/i.test(originalMessage);
  const userMessagesCount = messages.filter(m => m.role === 'user').length;
  
  console.log('[LLM] originalMessage:', originalMessage, 'query:', query, 'userMessagesCount:', userMessagesCount);
  
  if (isGreeting && userMessagesCount <= 1) {
    console.log('[LLM] Returning greeting response');
    return "Hi there! 👋 I'm here to help you find information about our products, shipping, returns, and more. What would you like to know?";
  }
  
  // Check for thank you - use original message to preserve case
  if (originalMessage.toLowerCase().includes('thank')) {
    console.log('[LLM] Returning thank you response');
    return "You're welcome! 😊 Is there anything else I can help you with today?";
  }
  
  // Check for human agent request
  if (query.includes('human') || query.includes('agent') || query.includes('person') || query.includes('speak to someone')) {
    console.log('[LLM] Returning handoff response');
    return "Of course! Let me connect you with our team. Please hold on for just a moment...";
  }
  
  // If we have retrieved context, use it to generate a response
  if (context && context.length > 0) {
    const relevantChunks = context.filter(c => c.content && c.score > 0.1);
    
    if (relevantChunks.length > 0) {
      // Find the most relevant chunk based on query keywords
      let bestChunks = [];
      
      if (query.includes('return') || query.includes('refund')) {
        bestChunks = relevantChunks.filter(c => 
          c.content.toLowerCase().includes('return') || 
          c.content.toLowerCase().includes('refund')
        );
      } else if (query.includes('ship') || query.includes('delivery')) {
        bestChunks = relevantChunks.filter(c => 
          c.content.toLowerCase().includes('ship') || 
          c.content.toLowerCase().includes('delivery')
        );
      } else if (query.includes('contact') || query.includes('support') || query.includes('help') || query.includes('phone') || query.includes('email') || query.includes('call')) {
        bestChunks = relevantChunks.filter(c => 
          c.content.toLowerCase().includes('contact') || 
          c.content.toLowerCase().includes('support') ||
          c.content.toLowerCase().includes('email') ||
          c.content.toLowerCase().includes('phone') ||
          c.content.toLowerCase().includes('available')
        );
      } else if (query.includes('price') || query.includes('cost') || query.includes('pricing') || query.includes('discount')) {
        bestChunks = relevantChunks.filter(c => 
          c.content.toLowerCase().includes('price') || 
          c.content.toLowerCase().includes('discount') ||
          c.content.toLowerCase().includes('cost')
        );
      } else if (query.includes('product') || query.includes('item') || query.includes('buy')) {
        bestChunks = relevantChunks.filter(c => 
          c.content.toLowerCase().includes('product') || 
          c.content.toLowerCase().includes('item')
        );
      }
      
      // If we found relevant chunks, use them
      if (bestChunks.length > 0) {
        const response = bestChunks.map(c => c.content).join('\n\n');
        const sources = [...new Set(bestChunks.map(c => c.source).filter(Boolean))];
        return formatResponse(response, sources);
      }
      
      // If no specific match, use the best matching chunk
      const bestMatch = relevantChunks[0];
      if (bestMatch.score > 0.1) {
        return formatResponse(bestMatch.content, [bestMatch.source].filter(Boolean));
      }
    }
  }
  
  // No context available - tell user to add documents
  return "I don't have specific information on that in my knowledge base yet. To help you better, please add documents to your knowledge base in the Dashboard → Knowledge Base section. You can upload PDFs, text files, FAQs, or add URLs to scrape content.\n\nIs there anything else I can help you with?";
}

function formatResponse(content, sources = []) {
  let formatted = content.trim();
  
  // If the response is too long, truncate it intelligently
  if (formatted.length > 400) {
    formatted = formatted.substring(0, 400);
    const lastPeriod = formatted.lastIndexOf('.');
    const lastComma = formatted.lastIndexOf(',');
    const cutPoint = Math.max(lastPeriod, lastComma);
    if (cutPoint > 150) {
      formatted = formatted.substring(0, cutPoint + 1);
    } else {
      // Try to end at a complete sentence
      formatted = formatted.substring(0, formatted.lastIndexOf('.'));
    }
    formatted += '.';
  }
  
  return formatted;
}

function handleKeywordBasedResponse(lastUserMessage) {
  const query = lastUserMessage.toLowerCase();
  
  if (query.includes('help')) {
    return "I'd be happy to help! You can ask me about:\n\n• Our products and services\n• Shipping options and delivery times\n• Return and refund policies\n• Contact information and support\n\nWhat would you like to know more about?";
  }

  if (query.includes('price') || query.includes('cost')) {
    return "I'd be happy to help with pricing! For specific pricing information, please visit our website or contact our sales team. We also offer discounts for bulk orders. Would you like more specific information?";
  }
  
  if (query.includes('product') || query.includes('items') || query.includes('catalog')) {
    return "We have a wide range of products available! For our full catalog, please visit our website. Is there a specific type of product you're interested in?";
  }
  
  if (query.includes('warranty') || query.includes('guarantee')) {
    return "Our products come with a standard warranty. For specific warranty information, please check the product details on our website or contact our support team.";
  }

  // Default fallback
  const fallbacks = [
    "I'd be happy to help with that! Could you provide more details so I can give you the best answer?",
    "Great question! Let me help you find that information. Could you be more specific about what you're looking for?",
    "I'm here to help! What specific information are you looking for? I can assist with products, shipping, returns, and more."
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export async function* streamResponse(prompt, config = {}) {
  const response = await generateResponse({ systemPrompt: '', messages: [{ role: 'user', content: prompt }], config });
  
  const chunks = response.split(' ');
  for (const chunk of chunks) {
    yield chunk + ' ';
    await new Promise(r => setTimeout(r, 30));
  }
}

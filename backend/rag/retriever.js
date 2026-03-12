const vectorStore = new Map();

export async function retrieveContext({ botId, embedding, topK = 5, scoreThreshold = 0.1, query = '' }) {
  const botKey = `bot:${botId}`;
  const vectors = vectorStore.get(botKey) || [];

  if (vectors.length === 0) {
    return [];
  }

  // First try vector similarity
  const results = vectors.map(item => ({
    ...item,
    score: cosineSimilarity(embedding, item.embedding)
  }));

  let filtered = results
    .filter(r => r.score >= scoreThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // If no vector matches, try keyword matching
  if (filtered.length === 0 && query) {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter(k => k.length > 2);
    
    if (keywords.length > 0) {
      const keywordResults = vectors.map(item => {
        const contentLower = item.content.toLowerCase();
        let keywordScore = 0;
        for (const keyword of keywords) {
          if (contentLower.includes(keyword)) {
            keywordScore += 1;
          }
        }
        return {
          ...item,
          score: keywordScore / keywords.length
        };
      });

      filtered = keywordResults
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    }
  }

  return filtered.map(r => ({
    content: r.content,
    metadata: r.metadata,
    score: r.score
  }));
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export async function storeVectors(botId, vectors) {
  const botKey = `bot:${botId}`;
  const existing = vectorStore.get(botKey) || [];
  vectorStore.set(botKey, [...existing, ...vectors]);
  console.log(`[Store] Stored ${vectors.length} vectors for bot ${botKey}, total: ${vectorStore.get(botKey).length}`);
}

export function clearVectors(botId) {
  const botKey = `bot:${botId}`;
  vectorStore.delete(botKey);
}

export function getVectorStore() {
  return vectorStore;
}

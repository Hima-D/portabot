import { generateEmbedding } from './embedder.js';
import { hybridSearch, rerankDocuments } from './reranker.js';

const vectorStore = new Map();

export async function retrieveContext({ botId, embedding, topK = 5, scoreThreshold = 0.1, query = '' }) {
  const botKey = `bot:${botId}`;
  const vectors = vectorStore.get(botKey) || [];

  if (vectors.length === 0) {
    return [];
  }

  try {
    // Use hybrid search for better results
    const hybridResults = await hybridSearch(query, botId, vectorStore, {
      topK: topK * 2,
      denseWeight: 0.6,
      sparseWeight: 0.4
    });

    // Apply reranking to the combined results
    const reranked = await rerankDocuments(query, hybridResults.combined, topK);

    // Filter by threshold
    const filtered = reranked.filter(r => r.score >= scoreThreshold * 0.5);

    return filtered.map(r => ({
      content: r.content,
      metadata: r.metadata,
      score: r.relevanceScore || r.score,
      method: r.methods?.join(', ') || 'hybrid'
    }));
  } catch (error) {
    console.error('Retrieval error:', error);
    return simpleVectorSearch(vectors, embedding, topK, scoreThreshold);
  }
}

function simpleVectorSearch(vectors, embedding, topK, scoreThreshold) {
  const results = vectors.map(item => ({
    ...item,
    score: cosineSimilarity(embedding, item.embedding)
  }));

  return results
    .filter(r => r.score >= scoreThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(r => ({
      content: r.content,
      metadata: r.metadata,
      score: r.score,
      method: 'vector'
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

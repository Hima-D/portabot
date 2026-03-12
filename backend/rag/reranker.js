// Cross-encoder reranker for better relevance scoring
// Uses a lightweight cross-encoder model for reranking retrieved documents

import { generateEmbedding } from './embedder.js';

const rerankerCache = new Map();

export async function rerankDocuments(query, documents, topK = 5) {
  if (!documents || documents.length === 0) return [];
  if (documents.length === 1) return documents.slice(0, topK);
  
  try {
    // Use cross-encoder style scoring with the USE model
    const queryEmbedding = await generateEmbedding(query);
    
    // Score each document against the query
    const scoredDocs = await Promise.all(documents.map(async (doc) => {
      const docEmbedding = await generateEmbedding(doc.content || doc.text || '');
      
      // Cross-encoder style: concatenate query and doc, then score
      const combinedText = `${query} [SEP] ${doc.content || doc.text || ''}`;
      const combinedEmbedding = await generateEmbedding(combinedText);
      
      // Calculate multiple similarity metrics
      const cosineSim = cosineSimilarity(queryEmbedding, docEmbedding);
      const combinedSim = cosineSimilarity(queryEmbedding, combinedEmbedding);
      
      // Use semantic similarity score
      const relevanceScore = (cosineSim * 0.6) + (combinedSim * 0.4);
      
      // Boost by original score if available
      const originalBoost = (doc.score || 0) * 0.2;
      
      return {
        ...doc,
        relevanceScore: relevanceScore + originalBoost,
        crossEncoderScore: combinedSim,
        semanticScore: cosineSim
      };
    }));
    
    // Sort by relevance score
    scoredDocs.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return scoredDocs.slice(0, topK);
  } catch (error) {
    console.error('Reranking error:', error);
    // Fallback to original scoring
    return documents.slice(0, topK);
  }
}

export async function batchRerank(query, documents, topK = 5) {
  return rerankDocuments(query, documents, topK);
}

// Hybrid search combining dense (embedding) and sparse (keyword) retrieval
export async function hybridSearch(query, botId, vectorStore, options = {}) {
  const { topK = 5, denseWeight = 0.6, sparseWeight = 0.4 } = options;
  
  const results = {
    dense: [],
    sparse: [],
    combined: []
  };
  
  // 1. Dense search (vector similarity)
  const queryEmbedding = await generateEmbedding(query);
  const botKey = `bot:${botId}`;
  const vectors = vectorStore.get(botKey) || [];
  
  if (vectors.length > 0) {
    const denseResults = vectors.map(item => {
      const score = cosineSimilarity(queryEmbedding, item.embedding);
      return {
        ...item,
        score,
        method: 'dense'
      };
    }).filter(r => r.score > 0.1).sort((a, b) => b.score - a.score).slice(0, topK * 2);
    
    results.dense = denseResults;
  }
  
  // 2. Sparse search (keyword matching)
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  if (queryWords.length > 0 && vectors.length > 0) {
    const sparseResults = vectors.map(item => {
      const contentLower = (item.content || '').toLowerCase();
      let keywordScore = 0;
      
      // Count exact matches
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          keywordScore += 1;
        }
        // Also check for partial matches
        if (word.length > 4) {
          const partialMatches = contentLower.split(word).length - 1;
          keywordScore += partialMatches * 0.5;
        }
      }
      
      // Normalize score
      const normalizedScore = Math.min(keywordScore / Math.max(queryWords.length, 1), 1);
      
      return {
        ...item,
        score: normalizedScore,
        method: 'sparse',
        keywordsMatched: queryWords.filter(w => contentLower.includes(w))
      };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, topK * 2);
    
    results.sparse = sparseResults;
  }
  
  // 3. Combine results using Reciprocal Rank Fusion
  const combinedMap = new Map();
  
  // Add dense results
  results.dense.forEach((doc, idx) => {
    const key = doc.content?.substring(0, 50) || Math.random().toString();
    const rrfScore = 1 / (idx + 2); // Reciprocal rank
    combinedMap.set(key, {
      ...doc,
      rrfScore: (combinedMap.get(key)?.rrfScore || 0) + rrfScore * denseWeight,
      methods: ['dense']
    });
  });
  
  // Add sparse results
  results.sparse.forEach((doc, idx) => {
    const key = doc.content?.substring(0, 50) || Math.random().toString();
    const rrfScore = 1 / (idx + 2);
    const existing = combinedMap.get(key);
    if (existing) {
      existing.rrfScore += rrfScore * sparseWeight;
      existing.methods.push('sparse');
      existing.score = (existing.score + doc.score) / 2; // Average scores
    } else {
      combinedMap.set(key, {
        ...doc,
        rrfScore: rrfScore * sparseWeight,
        methods: ['sparse']
      });
    }
  });
  
  // Sort by RRF score and take topK
  results.combined = Array.from(combinedMap.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK);
  
  return results;
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function clearRerankerCache() {
  rerankerCache.clear();
}

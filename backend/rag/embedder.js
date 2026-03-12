import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

let model = null;
const embeddings = new Map();

async function loadModel() {
  if (!model) {
    console.log('Loading Universal Sentence Encoder...');
    model = await use.load();
    console.log('Model loaded successfully');
  }
  return model;
}

export async function generateEmbedding(text) {
  try {
    await loadModel();
    
    const embeddings_tensor = await model.embed([text]);
    const embedding = await embeddings_tensor.array();
    embeddings_tensor.dispose();
    
    const key = Buffer.from(text).toString('base64').substring(0, 100);
    embeddings.set(key, embedding[0]);
    
    return embedding[0];
  } catch (error) {
    console.error('USE embedding error:', error.message);
  }
  
  // Fallback to deterministic embedding
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256').update(text).digest('hex').substring(0, 32);
  const seed = parseInt(hash.substring(0, 8), 16);
  
  const mockEmbedding = new Array(384).fill(0);
  for (let i = 0; i < 384; i++) {
    const x = Math.sin(seed + i) * 10000;
    mockEmbedding[i] = (x - Math.floor(x)) * 2 - 1;
  }
  
  const normalized = mockEmbedding.map(v => v / Math.sqrt(mockEmbedding.reduce((sum, x) => sum + x * x, 0)));
  
  const key = Buffer.from(text).toString('base64').substring(0, 100);
  embeddings.set(key, normalized);
  
  return normalized;
}

export async function generateEmbeddingsBatch(texts) {
  try {
    await loadModel();
    
    const embeddings_tensor = await model.embed(texts);
    const embeddingArray = await embeddings_tensor.array();
    embeddings_tensor.dispose();
    
    texts.forEach((text, i) => {
      const key = Buffer.from(text).toString('base64').substring(0, 100);
      embeddings.set(key, embeddingArray[i]);
    });
    
    return embeddingArray;
  } catch (error) {
    console.error('USE batch embedding error:', error.message);
    return Promise.all(texts.map(generateEmbedding));
  }
}

export function getEmbeddingCache() {
  return embeddings;
}

export function clearCache() {
  embeddings.clear();
}

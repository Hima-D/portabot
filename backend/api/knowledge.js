import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { generateEmbedding, generateEmbeddingsBatch } from '../rag/embedder.js';
import { storeVectors, getVectorStore, clearVectors } from '../rag/retriever.js';
import { query } from '../db/postgres.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Get or create vectors for a bot
function getBotVectors(botId) {
  const vectorStore = getVectorStore();
  const botKey = `bot:${botId}`;
  return vectorStore.get(botKey) || [];
}

// Ingest document
router.post('/ingest', async (req, res) => {
  try {
    const botId = req.bot.id;
    const { content, source, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required', code: 'MISSING_CONTENT' });
    }

    // Chunk the content
    const chunks = chunkText(content, 512, 64);
    const docId = `doc_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddingsBatch(chunks);
    
    const vectors = chunks.map((chunk, idx) => ({
      content: chunk,
      embedding: embeddings[idx],
      metadata: {
        ...metadata,
        source: source || 'text-input',
        documentId: docId,
        chunkIndex: idx,
        totalChunks: chunks.length,
        ingestedAt: new Date().toISOString()
      }
    }));
    
    await storeVectors(botId, vectors);
    
    // Also store in PostgreSQL for persistence
    await query(`
      INSERT INTO knowledge (bot_id, content, source, embedding, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [botId, content, source || 'text-input', JSON.stringify(embeddings[0] || []), JSON.stringify(metadata || {})]);

    res.json({
      success: true,
      documentId: docId,
      chunksCreated: chunks.length,
      message: `Document ingested with ${chunks.length} chunks`
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: 'Failed to ingest document', code: 'INGEST_ERROR' });
  }
});

// Chunk text with overlap
function chunkText(text, chunkSize = 512, overlap = 64) {
  if (text.length <= chunkSize) return [text];
  
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at sentence boundary
    if (end < text.length) {
      const periodIdx = text.indexOf('.', end - 50);
      const commaIdx = text.indexOf(',', end - 50);
      if (periodIdx > start && periodIdx < end + 50) {
        end = periodIdx + 1;
      } else if (commaIdx > start && commaIdx < end + 50) {
        end = commaIdx + 1;
      }
    }
    
    chunks.push(text.substring(start, end).trim());
    start = end - overlap;
  }
  
  return chunks.filter(c => c.length > 20);
}

// Query knowledge base
router.post('/query', async (req, res) => {
  try {
    const botId = req.bot.id;
    const { query: queryText, topK = 5 } = req.body;
    
    if (!queryText) {
      return res.status(400).json({ error: 'Query is required', code: 'MISSING_QUERY' });
    }

    const vectorStore = getVectorStore();
    const botKey = `bot:${botId}`;
    const vectors = vectorStore.get(botKey) || [];
    
    if (vectors.length === 0) {
      return res.json({ query: queryText, results: [], method: 'empty' });
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(queryText);
    
    // Calculate similarity scores
    const results = vectors.map(v => {
      const score = cosineSimilarity(queryEmbedding, v.embedding);
      return {
        content: v.content,
        source: v.metadata?.source || 'unknown',
        score,
        metadata: v.metadata
      };
    });
    
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    
    res.json({
      query: queryText,
      results: results.slice(0, topK),
      method: 'hybrid'
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Failed to query knowledge base', code: 'QUERY_ERROR' });
  }
});

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return Math.round((dot / (magA * magB)) * 1000) / 1000;
}

// List all documents
router.get('/documents', async (req, res) => {
  try {
    const botId = req.bot.id;
    const vectorStore = getVectorStore();
    const botKey = `bot:${botId}`;
    const vectors = vectorStore.get(botKey) || [];
    
    // Group by source
    const sources = {};
    for (const v of vectors) {
      const source = v.metadata?.source || 'unknown';
      if (!sources[source]) {
        sources[source] = {
          source,
          chunks: 0,
          addedAt: v.metadata?.ingestedAt,
          documentId: v.metadata?.documentId
        };
      }
      sources[source].chunks++;
    }
    
    res.json({
      documents: Object.values(sources).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// Get specific document
router.get('/documents/:source', async (req, res) => {
  try {
    const botId = req.bot.id;
    const { source } = req.params;
    const vectorStore = getVectorStore();
    const botKey = `bot:${botId}`;
    const vectors = vectorStore.get(botKey) || [];
    
    const docs = vectors.filter(v => v.metadata?.source === source);
    
    if (docs.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({
      source,
      chunks: docs.length,
      content: docs.map(d => d.content),
      metadata: docs[0].metadata
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

// Delete document by source
router.delete('/documents/:source', async (req, res) => {
  try {
    const botId = req.bot.id;
    const { source } = req.params;
    
    const vectorStore = getVectorStore();
    const botKey = `bot:${botId}`;
    const vectors = vectorStore.get(botKey) || [];
    const filtered = vectors.filter(v => v.metadata?.source !== source);
    vectorStore.set(botKey, filtered);
    
    // Also delete from PostgreSQL
    await query('DELETE FROM knowledge WHERE bot_id = $1 AND source = $2', [botId, source]);
    
    res.json({ success: true, message: `Deleted all chunks from ${source}` });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Update/ingest with file upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const botId = req.bot.id;
    const { source } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });
    }

    // For now, handle text files
    const content = req.file.buffer.toString('utf-8');
    const fileSource = source || req.file.originalname;

    // Chunk and store
    const chunks = chunkText(content, 512, 64);
    const embeddings = await generateEmbeddingsBatch(chunks);
    const docId = `doc_${Date.now()}`;

    const vectors = chunks.map((chunk, idx) => ({
      content: chunk,
      embedding: embeddings[idx],
      metadata: {
        source: fileSource,
        documentId: docId,
        chunkIndex: idx,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        ingestedAt: new Date().toISOString()
      }
    }));

    await storeVectors(botId, vectors);

    res.json({
      success: true,
      documentId: docId,
      chunksCreated: chunks.length,
      fileName: req.file.originalname,
      message: 'File uploaded and processed successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file', code: 'UPLOAD_ERROR' });
  }
});

// Search knowledge base
router.get('/search', async (req, res) => {
  try {
    const botId = req.bot.id;
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    // Use query endpoint
    const result = await fetch(`${req.protocol}://${req.get('host')}/api/v1/knowledge/query`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-bot-id': botId
      },
      body: JSON.stringify({ query: q, topK: 10 })
    }).then(r => r.json());

    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;

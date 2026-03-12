import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { ingestDocument, queryKnowledgeBase, getStoredDocuments } from '../knowledge/ingestor.js';
import { storeVectors, getVectorStore, clearVectors } from '../rag/retriever.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Ingest document
router.post('/ingest', async (req, res) => {
  try {
    const botId = req.bot.id;
    const { content, source, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required', code: 'MISSING_CONTENT' });
    }

    // Simple text chunking
    const chunks = [content];
    
    // Store chunks with simple embeddings using retriever's storeVectors
    const vectors = [];
    const docId = `doc_${Date.now()}`;
    
    for (const chunk of chunks) {
      // Simple hash-based embedding
      const hash = content.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
      const embedding = Array(384).fill(0).map((_, i) => Math.sin(hash + i) * Math.cos(hash + i));
      
      vectors.push({
        content: chunk,
        embedding,
        metadata: {
          ...metadata,
          source: source || 'text-input',
          documentId: docId,
          ingestedAt: new Date().toISOString()
        }
      });
    }
    
    await storeVectors(botId, vectors);

    res.json({
      success: true,
      documentId: docId,
      chunksCreated: chunks.length,
      message: 'Document ingested successfully'
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: 'Failed to ingest document', code: 'INGEST_ERROR' });
  }
});

// Query knowledge base
router.post('/query', async (req, res) => {
  try {
    const botId = req.bot.id;
    const { query, topK = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required', code: 'MISSING_QUERY' });
    }

    // Use retriever's getVectorStore
    const vectorStore = getVectorStore();
    const botKey = `bot:${botId}`;
    const vectors = vectorStore.get(botKey) || [];
    
    if (vectors.length === 0) {
      return res.json({ query, results: [] });
    }

    // Simple keyword matching
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    
    const results = vectors.map(v => {
      const contentLower = v.content.toLowerCase();
      let score = 0;
      
      // Count keyword matches
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          score += 1;
        }
      }
      
      return {
        content: v.content,
        source: v.metadata?.source || 'unknown',
        score: score / Math.max(queryWords.length, 1),
        metadata: v.metadata
      };
    });
    
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    
    res.json({
      query,
      results: results.slice(0, topK)
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Failed to query knowledge base', code: 'QUERY_ERROR' });
  }
});

// List documents
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
          addedAt: v.metadata?.ingestedAt
        };
      }
      sources[source].chunks++;
    }
    
    res.json({
      documents: Object.values(sources)
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// Delete document
router.delete('/documents/:source', async (req, res) => {
  try {
    const botId = req.bot.id;
    const { source } = req.params;
    
    const vectorStore = getVectorStore();
    const botKey = `bot:${botId}`;
    const vectors = vectorStore.get(botKey) || [];
    const filtered = vectors.filter(v => v.metadata?.source !== source);
    vectorStore.set(botKey, filtered);
    
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;

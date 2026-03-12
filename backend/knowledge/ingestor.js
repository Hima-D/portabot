import { chunkText } from '../rag/chunker.js';
import { generateEmbedding } from '../rag/embedder.js';
import { storeVectors, getVectorStore } from '../rag/retriever.js';

const documentStore = new Map();

export async function ingestDocument({ botId, file, content, url, metadata = {} }) {
  let text = content;
  let source = metadata?.source || 'text-input';

  if (file) {
    text = await parseFile(file);
    source = file.originalname || 'uploaded-file';
  } else if (url) {
    text = await fetchUrlContent(url);
    source = url;
  }

  const chunks = chunkText(text, {
    chunkSize: 512,
    chunkOverlap: 64
  });

  const vectors = [];
  const docId = `doc_${Date.now()}`;
  
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk);
    vectors.push({
      content: chunk,
      embedding,
      metadata: {
        ...metadata,
        source,
        botId,
        documentId: docId,
        ingestedAt: new Date().toISOString()
      }
    });
  }

  await storeVectors(botId, vectors);

  // Track document
  const botDocs = documentStore.get(botId) || [];
  botDocs.push({
    id: docId,
    source,
    type: file ? 'file' : url ? 'url' : 'text',
    addedAt: new Date().toISOString(),
    chunks: chunks.length
  });
  documentStore.set(botId, botDocs);

  return {
    documentId: docId,
    chunksCreated: chunks.length,
    source
  };
}

async function parseFile(file) {
  const { buffer, mimetype, originalname } = file;
  
  if (mimetype === 'text/plain' || originalname.endsWith('.txt') || originalname.endsWith('.md')) {
    return buffer.toString('utf-8');
  }

  if (mimetype === 'application/pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return data.text;
    } catch (e) {
      console.error('PDF parse error:', e);
      return `PDF document: ${originalname}`;
    }
  }

  if (mimetype.includes('spreadsheet') || originalname.endsWith('.csv')) {
    return parseCSV(buffer.toString('utf-8'));
  }

  return `Document: ${originalname}\n\nContent extraction not fully supported for this format.`;
}

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
  
  const qaPairs = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length >= 2) {
      const question = values[0];
      const answer = values.slice(1).join(', ');
      if (question && answer) {
        qaPairs.push(`Q: ${question}\nA: ${answer}`);
      }
    }
  }
  
  return qaPairs.join('\n\n');
}

async function fetchUrlContent(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    const cheerio = (await import('cheerio')).default;
    const $ = cheerio.load(html);
    
    $('script, style, nav, header, footer').remove();
    
    const title = $('title').text();
    const content = $('body').text().replace(/\s+/g, ' ').trim();
    
    return `Source: ${url}\nTitle: ${title}\n\n${content.substring(0, 10000)}`;
  } catch (e) {
    console.error('URL fetch error:', e);
    return `Content from: ${url}`;
  }
}

export async function queryKnowledgeBase(botId, query, topK = 5) {
  const embedding = await generateEmbedding(query);
  
  const { retrieveContext } = await import('../rag/retriever.js');
  return retrieveContext({
    botId,
    embedding,
    topK,
    scoreThreshold: 0.5
  });
}

export async function listDocuments(botId) {
  return [];
}

export function getStoredDocuments(botId) {
  return documentStore.get(botId) || [];
}

export async function deleteDocument(botId, documentId) {
  return { success: true };
}

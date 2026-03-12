export function chunkText(text, options = {}) {
  const {
    chunkSize = 512,
    chunkOverlap = 64,
    strategy = 'recursive'
  } = options;

  if (strategy === 'recursive') {
    return recursiveChunk(text, chunkSize, chunkOverlap);
  }

  return simpleChunk(text, chunkSize);
}

function recursiveChunk(text, chunkSize, overlap) {
  const chunks = [];
  const separators = ['\n\n', '\n', '. ', '? ', '! ', ', ', ' '];
  
  function splitIntoChunks(text, sepIndex) {
    if (text.length <= chunkSize) {
      return [text];
    }
    
    let bestSep = -1;
    let bestSepPos = -1;
    
    for (let i = 0; i < separators.length && sepIndex < separators.length; i++) {
      const pos = text.lastIndexOf(separators[sepIndex], chunkSize);
      if (pos > bestSepPos) {
        bestSep = sepIndex;
        bestSepPos = pos;
      }
      sepIndex++;
    }
    
    if (bestSepPos === -1 || bestSep >= separators.length) {
      return [text.substring(0, chunkSize)];
    }
    
    const firstChunk = text.substring(0, bestSepPos + 1).trim();
    const remaining = text.substring(bestSepPos + 1).trim();
    
    if (remaining.length === 0) {
      return [firstChunk];
    }
    
    const restChunks = splitIntoChunks(remaining, 0);
    
    if (chunks.length > 0 && overlap > 0 && firstChunk.length > overlap) {
      const prevChunk = chunks[chunks.length - 1];
      const overlapText = prevChunk.substring(prevChunk.length - overlap);
      if (!firstChunk.startsWith(overlapText)) {
        return [firstChunk, ...restChunks];
      }
    }
    
    return [firstChunk, ...restChunks];
  }
  
  return splitIntoChunks(text, 0).filter(c => c.length > 50);
}

function simpleChunk(text, size) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.substring(start, end));
    start = end;
  }
  
  return chunks;
}

export function chunkBySentence(text, minChunkSize = 100) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > minChunkSize * 2) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks;
}

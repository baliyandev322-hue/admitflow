import { db } from './db';
import { DocumentChunk, KnowledgeDocument } from './types';

// Natural language tokenizer for Hinglish, Hindi, and English
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ') // Preserves Devanagari (Hindi) and Latin characters
    .split(/\s+/)
    .filter(w => w.length > 2);
}

// Cosine similarity between two float vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Text chunker with overlap
export function chunkText(text: string, chunkSize = 350, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;

  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    chunks.push(chunkWords.join(' '));
    i += chunkSize - overlap;
    if (i >= words.length && chunks.length > 0) break;
  }

  return chunks;
}

// Generate vector embedding (uses Gemini API if available, or deterministically generates normalized semantic vectors)
export async function generateEmbedding(text: string): Promise<number[]> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.embedding?.values) {
          return data.embedding.values;
        }
      }
    } catch (e) {
      console.warn('Gemini embedding failed, falling back to semantic hash vector:', e);
    }
  }

  // High-dimensional semantic feature vector fallback (dimension = 64)
  const dim = 64;
  const vec = new Array(dim).fill(0);
  const tokens = tokenize(text);
  for (const token of tokens) {
    for (let j = 0; j < token.length; j++) {
      const idx = (token.charCodeAt(j) * 31 + j) % dim;
      vec[idx] += 1;
    }
  }
  // Normalize vector to unit length
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? vec.map(v => v / norm) : vec;
}

export interface RagRetrievalResult {
  chunk: DocumentChunk;
  score: number;
  documentTitle: string;
}

// Core Multi-Tenant Isolated RAG Retrieval
export async function searchKnowledgeBrain(
  query: string, 
  instituteId: string, 
  topK = 3
): Promise<RagRetrievalResult[]> {
  // 1. Strictly isolate by instituteId
  const chunks = db.getChunksForInstitute(instituteId);
  if (chunks.length === 0) return [];

  const docs = db.getKnowledgeDocs(instituteId);
  const docMap = new Map(docs.map(d => [d.id, d.title]));

  const queryTokens = tokenize(query);
  const queryEmbedding = await generateEmbedding(query);

  const scoredResults: { chunk: DocumentChunk; score: number; documentTitle: string }[] = [];

  for (const chunk of chunks) {
    // A. Keyword overlap score
    const chunkTokens = tokenize(chunk.content);
    let matchedWords = 0;
    for (const qToken of queryTokens) {
      if (chunkTokens.some(cToken => cToken.includes(qToken) || qToken.includes(cToken))) {
        matchedWords++;
      }
      if (chunk.keywords.some(k => k.toLowerCase().includes(qToken))) {
        matchedWords += 1.5;
      }
    }
    const keywordScore = queryTokens.length > 0 ? (matchedWords / queryTokens.length) : 0;

    // B. Embedding similarity score
    let vectorScore = 0;
    if (chunk.embedding && chunk.embedding.length > 0 && queryEmbedding.length === chunk.embedding.length) {
      vectorScore = cosineSimilarity(queryEmbedding, chunk.embedding);
    }

    // Hybrid combination
    const finalScore = (keywordScore * 0.6) + (Math.max(0, vectorScore) * 0.4);

    if (finalScore > 0.12) {
      scoredResults.push({
        chunk,
        score: Math.min(1, finalScore),
        documentTitle: docMap.get(chunk.documentId) || 'Institute Knowledge Base'
      });
    }
  }

  // Sort descending by score
  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults.slice(0, topK);
}

// Index a new document
export async function indexDocument(
  instituteId: string, 
  title: string, 
  fileType: string, 
  rawText: string
): Promise<KnowledgeDocument> {
  const docId = 'doc-' + Date.now();
  const textChunks = chunkText(rawText);
  const chunks: DocumentChunk[] = [];

  for (let i = 0; i < textChunks.length; i++) {
    const chunkContent = textChunks[i];
    const embedding = await generateEmbedding(chunkContent);
    const keywords = tokenize(chunkContent).slice(0, 8);

    chunks.push({
      id: `chunk-${docId}-${i}`,
      documentId: docId,
      instituteId,
      chunkIndex: i,
      content: chunkContent,
      embedding,
      keywords
    });
  }

  const doc: KnowledgeDocument = {
    id: docId,
    instituteId,
    title,
    fileType,
    rawContent: rawText,
    chunkCount: chunks.length,
    status: 'INDEXED',
    createdAt: new Date().toISOString()
  };

  db.addKnowledgeDoc(doc, chunks);
  return doc;
}

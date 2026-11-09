import { db } from './db';
import { DocumentChunk, KnowledgeDocument } from './types';
import { gemini } from './gemini';

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
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
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

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  provider: 'GEMINI_API' | 'DETERMINISTIC_FALLBACK';
  model: string;
}

/**
 * Generate vector embedding using Google Gemini API (`models/gemini-embedding-001`),
 * or deterministically generate a normalized 768-dimensional semantic feature vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await generateEmbeddingWithDetails(text);
  return result.embedding;
}

export async function generateEmbeddingWithDetails(text: string): Promise<EmbeddingResult> {
  const geminiKey = gemini.getApiKey();
  const targetDim = 768; // Industry-standard 768-dimension embeddings

  if (geminiKey && geminiKey.length > 10) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text }] },
          outputDimensionality: targetDim
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.embedding?.values && data.embedding.values.length > 0) {
          return {
            embedding: data.embedding.values,
            dimensions: data.embedding.values.length,
            provider: 'GEMINI_API',
            model: 'gemini-embedding-001'
          };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn(`[RAG Embedding API Warning] HTTP ${res.status}: ${errData.error?.message || 'Unknown error'}. Falling back to 768-dim deterministic vector.`);
      }
    } catch (e: any) {
      console.warn(`[RAG Embedding Network Warning] ${e.message}. Falling back to 768-dim deterministic vector.`);
    }
  }

  // Consistent 768-dimensional semantic feature vector fallback
  const vec = new Array(targetDim).fill(0);
  const tokens = tokenize(text);
  for (const token of tokens) {
    for (let j = 0; j < token.length; j++) {
      const idx = (token.charCodeAt(j) * 31 + j * 7) % targetDim;
      vec[idx] += 1;
    }
  }
  // Normalize vector to unit length
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  const normalizedVec = norm > 0 ? vec.map(v => v / norm) : vec;

  return {
    embedding: normalizedVec,
    dimensions: targetDim,
    provider: 'DETERMINISTIC_FALLBACK',
    model: 'deterministic-semantic-768'
  };
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

/**
 * Reindexes all existing documents for an institute to ensure uniform 768-dim embeddings.
 */
export async function reindexAllDocuments(instituteId: string): Promise<{ reindexedCount: number; chunksCount: number }> {
  const docs = db.getKnowledgeDocs(instituteId);
  let totalChunks = 0;

  for (const doc of docs) {
    if (doc.rawContent) {
      const textChunks = chunkText(doc.rawContent);
      const newChunks: DocumentChunk[] = [];
      for (let i = 0; i < textChunks.length; i++) {
        const chunkContent = textChunks[i];
        const embedding = await generateEmbedding(chunkContent);
        const keywords = tokenize(chunkContent).slice(0, 8);
        newChunks.push({
          id: `chunk-${doc.id}-${i}`,
          documentId: doc.id,
          instituteId,
          chunkIndex: i,
          content: chunkContent,
          embedding,
          keywords
        });
      }
      db.addKnowledgeDoc({ ...doc, chunkCount: newChunks.length, status: 'INDEXED' }, newChunks);
      totalChunks += newChunks.length;
    }
  }

  return { reindexedCount: docs.length, chunksCount: totalChunks };
}

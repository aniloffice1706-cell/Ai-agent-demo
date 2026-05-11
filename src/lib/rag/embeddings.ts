import { RAGResult } from '@/types';

export async function generateEmbedding(text: string): Promise<number[]> {
  // Placeholder for embedding generation
  // In production, integrate with OpenAI or similar service
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  // Generate deterministic embedding
  const embedding: number[] = [];
  for (let i = 0; i < 1536; i++) {
    embedding.push(
      Math.sin(hash + i) * Math.cos(i) * (hash % 100) + i
    );
  }
  return embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

export function chunkText(text: string, chunkSize: number = 500): string[] {
  const chunks: string[] = [];
  let currentChunk = '';

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks;
}

export async function retrieveRelevantChunks(
  query: string,
  chunks: Array<{ text: string; source: string }>,
  topK: number = 3
): Promise<RAGResult[]> {
  const queryEmbedding = await generateEmbedding(query);

  const scored = await Promise.all(
    chunks.map(async (chunk) => ({
      chunk: chunk.text,
      source: chunk.source,
      score: cosineSimilarity(queryEmbedding, await generateEmbedding(chunk.text)),
    }))
  );

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

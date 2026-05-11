import { chunkText, cosineSimilarity } from '@/lib/rag/embeddings';

describe('RAG Embeddings', () => {
  it('should chunk text correctly', () => {
    const text = 'This is a sample text. It has multiple sentences. Each sentence will be chunked.';
    const chunks = chunkText(text, 30);
    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeGreaterThan(0);
    });
  });

  it('should calculate cosine similarity', () => {
    const vector1 = [1, 0, 0];
    const vector2 = [1, 0, 0];
    const vector3 = [0, 1, 0];

    const similarity1 = cosineSimilarity(vector1, vector2);
    const similarity2 = cosineSimilarity(vector1, vector3);

    expect(similarity1).toBeGreaterThan(similarity2);
  });
});

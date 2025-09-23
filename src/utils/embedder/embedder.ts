
let embedder: any = null;

export async function getEmbedding(text: string): Promise<number[]> {
  if (!embedder) {
        const { pipeline } = await import('@xenova/transformers'); // ✅ Dynamic import
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  const output = await embedder(text, {
    pooling: 'mean',
    normalize: true
  });
  return output.data;
}
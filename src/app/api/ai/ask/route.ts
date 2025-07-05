import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Document } from 'genkit/retriever';
import { retrieve } from '@genkit-ai/ai/retriever';


// This is the input validation schema for the request body.
const AskRequestSchema = z.object({
  question: z.string(),
  bookContent: z.string(),
});

const AnswerQuestionFromBookOutputSchema = z.object({
  answer: z.string().describe('The answer to the question. This could be based on the book context, general knowledge, or a statement that the answer is not in the book.'),
});

// Simple chunking function since simpleChunker doesn't exist in the imports
function chunkText(text: string, maxChunkSize: number = 512, overlap: number = 128): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + maxChunkSize, text.length);
    chunks.push(text.slice(start, end));
    const prevStart = start;
    start = end - overlap;

    // Prevent infinite loop
    if (start <= prevStart) break;
  }
  
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = AskRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.format() }, { status: 400 });
    }

    const { question, bookContent } = validation.data;

    // Define the prompt inside the request handler to avoid Next.js build-time issues.
    const bookRagPrompt = ai.definePrompt({
        name: 'bookRagPrompt',
        input: { schema: z.object({
            question: z.string(),
            context: z.string(),
        })},
        output: { schema: AnswerQuestionFromBookOutputSchema },
        prompt: `You are an AI assistant with two primary functions: a literary expert for the provided book context, and a general knowledge expert. Your task is to determine the user's intent and answer accordingly.

Follow these steps:
1.  Analyze the user's question and the provided book context.
2.  **If the question can be answered using the context**, provide a detailed answer based *only* on the book. Do not add any external information.
3.  **If the question is about the book but the context does not contain the answer**, you MUST respond with *only* this exact phrase: "I could not find an answer to that in the book."
4.  **If the question appears to be a general knowledge query unrelated to the book**, answer it using your own knowledge. You MUST start your answer with the phrase: "Answering from my general knowledge: "

CONTEXT FROM THE BOOK:
{{{context}}}

QUESTION:
{{{question}}}`
    });

    // 1. Chunk the document
    const chunks = chunkText(bookContent, 512, 128);
    const documents = chunks.map((content) => Document.fromText(content));

    // 2. Simple retrieval - find chunks containing keywords from the question
    const queryLower = question.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    
    const relevantDocs = documents
      .map(doc => {
        const text = doc.text.toLowerCase();
        const matchCount = queryWords.reduce((count, word) => {
          return count + (text.includes(word) ? 1 : 0);
        }, 0);
        return { doc, score: matchCount };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.doc);

    // 3. Generate an answer using a prompt with the retrieved context
    const { output } = await bookRagPrompt({
      question: question,
      context: relevantDocs.map((d) => d.text).join('\n---\n'),
    });

    if (!output) {
        throw new Error('AI failed to generate an answer.');
    }
    
    return NextResponse.json(output);

  } catch (error) {
    console.error('API Error in /api/ai/ask:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
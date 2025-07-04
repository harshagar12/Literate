import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import PDFParser from 'pdf2json';

// Helper to run pdf2json in a promise
const parsePdfBuffer = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    // pdf2json requires a 'this' context, so we can't use an arrow function here
    const pdfParser = new PDFParser(null, true);

    pdfParser.on('pdfParser_dataError', (errData: any) => {
      console.error(errData.parserError);
      reject(new Error('Error parsing PDF: ' + errData.parserError));
    });

    pdfParser.on('pdfParser_dataReady', () => {
      const text = pdfParser.getRawTextContent();
      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
};


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file: fileDataUri } = body;

    if (!fileDataUri || !fileDataUri.startsWith('data:application/pdf;base64,')) {
        return NextResponse.json({ error: 'Invalid file data. Please upload a PDF.' }, { status: 400 });
    }

    // Extract base64 content
    const base64Content = fileDataUri.substring('data:application/pdf;base64,'.length);
    const buffer = Buffer.from(base64Content, 'base64');
    
    const text = await parsePdfBuffer(buffer);

    return NextResponse.json({ text });

  } catch (error) {
    console.error('API Error in /api/parse-pdf:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

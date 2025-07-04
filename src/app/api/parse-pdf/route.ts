import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import PDFParser from 'pdf2json';

// Helper function to decode URI-encoded text. pdf2json output is URI encoded.
function decode(text: string): string {
  try {
    return decodeURIComponent(text || '');
  } catch (e) {
    // Fallback for strings that are not properly encoded
    return text || '';
  }
}

// Function to parse the PDF buffer and reconstruct text
function parsePdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (errData: any) => {
      console.error('PDF Parser Error:', errData.parserError);
      reject(new Error('Error parsing PDF file. It might be corrupted or protected.'));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      try {
        let fullText = '';
        const pages = pdfData.Pages || [];
        
        pages.forEach((page: any, pageIndex: number) => {
          // A heuristic to filter out headers and footers based on their vertical position.
          const pageHeight = page.Height;
          const headerThreshold = pageHeight * 0.08;
          const footerThreshold = pageHeight * 0.92;
          
          const contentTexts = (page.Texts || [])
            .filter((text: any) => text.y > headerThreshold && text.y < footerThreshold)
            .sort((a: any, b: any) => { // Sort by Y then X
                if (a.y < b.y) return -1;
                if (a.y > b.y) return 1;
                if (a.x < b.x) return -1;
                if (a.x > b.x) return 1;
                return 0;
            });

          if (contentTexts.length === 0) return;
            
          let pageText = '';
          let lastY = contentTexts[0].y;
          let lastTextItem = contentTexts[0];

          // Process the first text item
          pageText += (lastTextItem.R || []).map((run: any) => decode(run.T)).join('');

          for (let i = 1; i < contentTexts.length; i++) {
            const currentTextItem = contentTexts[i];
            const currentText = (currentTextItem.R || []).map((run: any) => decode(run.T)).join('');
            
            const textHeight = lastTextItem.h || 1.2; // Approximate height of the last text block

            // Heuristic for paragraph break: a large vertical gap. Increased from 1.5 to 1.7
            if (currentTextItem.y > lastY + textHeight * 1.7) {
              pageText += '\n\n';
            } else if (currentTextItem.y > lastY + textHeight * 0.2) { // New line with small vertical gap
                 if (pageText.trim().endsWith('-')) {
                    pageText = pageText.trim().slice(0, -1);
                 } else {
                    pageText += ' ';
                 }
            } else {
              // Text is on the same line as the previous block.
              // Add a space only if there's a significant horizontal gap.
              const horizontalGap = currentTextItem.x - (lastTextItem.x + lastTextItem.w);
              const spaceWidthThreshold = textHeight * 0.2; // A space is roughly 20% of the font height
              if (horizontalGap > spaceWidthThreshold) {
                  pageText += ' ';
              }
            }
            
            pageText += currentText;
            lastY = currentTextItem.y;
            lastTextItem = currentTextItem;
          }
          
          fullText += pageText;
          if (pageIndex < pages.length - 1) {
            fullText += '\n\n\n'; // Use a clear page break marker
          }
        });
        
        // Final cleanup to normalize spacing
        fullText = fullText.replace(/ \n/g, '\n'); // remove trailing spaces from lines
        fullText = fullText.replace(/\n\n\n/g, '\n\n'); // Normalize page breaks to paragraph breaks
        fullText = fullText.replace(/ +/g, ' '); // Consolidate multiple spaces into one
        
        resolve(fullText.trim());
      } catch (e) {
        console.error('Error processing parsed PDF data:', e);
        reject(new Error('Failed to process text from PDF.'));
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parsePdf(buffer);
    
    return NextResponse.json({ text });

  } catch (error) {
    console.error('API Error in /api/parse-pdf:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

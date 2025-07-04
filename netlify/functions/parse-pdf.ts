import type { Handler } from "@netlify/functions";
import PDFParser from "pdf2json";

// Helper to run pdf2json in a promise
const parsePdfBuffer = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, true);

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      console.error(errData.parserError);
      reject(new Error("Error parsing PDF: " + errData.parserError));
    });

    pdfParser.on("pdfParser_dataReady", () => {
      const text = pdfParser.getRawTextContent();
      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
};

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No file data provided." }),
      };
    }

    const { file: fileDataUri } = JSON.parse(event.body);

    if (!fileDataUri || !fileDataUri.startsWith('data:application/pdf;base64,')) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid file data. Please upload a PDF.' }) };
    }

    // Extract base64 content
    const base64Content = fileDataUri.substring('data:application/pdf;base64,'.length);
    const buffer = Buffer.from(base64Content, 'base64');
    
    const text = await parsePdfBuffer(buffer);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Function Error in /functions/parse-pdf:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return {
      statusCode: 500,
      body: JSON.stringify({ error: message }),
    };
  }
};

export { handler };

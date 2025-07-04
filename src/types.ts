export type NoteCategory = "Summary" | "Question" | "Important" | "Quote";
export type PageLayout = "single" | "double";

export interface AiConversation {
  question: string;
  answer: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  // Content is optional, as it won't be stored in Firestore.
  // It will only be present in the app's state after a PDF is uploaded.
  content?: string;
}

export interface Note {
  id: number;
  page: number;
  createdAt: Date;
  updatedAt: Date;
  content: string;
  category: NoteCategory;
}

export interface ReadingSession {
  startTime: number;
  endTime: number;
}

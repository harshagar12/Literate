'use client';
import { db } from './firebase';
import { doc, getDoc, setDoc, Timestamp, collection, getDocs, query } from 'firebase/firestore';
import type { Note, ReadingSession, PageLayout, Book, AiConversation } from '@/types';

// This is the shape of our data in Firestore.
// Note: It does NOT include the 'content' of the book.
interface BookDoc {
    id: string;
    title: string;
    author: string;
    currentPage?: number;
    pageLayout?: PageLayout;
    sessions?: ReadingSession[];
    visitedPages?: number[];
    notes?: (Omit<Note, 'createdAt' | 'updatedAt'> & { createdAt: Timestamp; updatedAt: Timestamp })[];
    aiHistory?: AiConversation[];
}

export type BookState = {
    currentPage: number;
    pageLayout: PageLayout;
    sessions: ReadingSession[];
    visitedPages: number[];
    notes: Note[];
    aiHistory: AiConversation[];
}

// Fetches book data from Firestore and converts it to client-side types
export async function getBookState(bookId: string): Promise<BookState | null> {
    if (!bookId) return null;
    const docRef = doc(db, "books", bookId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data() as BookDoc;
        
        const notes = (data.notes || []).map((note) => ({
            ...note,
            createdAt: note.createdAt.toDate(),
            updatedAt: note.updatedAt.toDate(),
        }));

        const sessions = (data.sessions || []).map(session => ({
            startTime: session.startTime,
            endTime: session.endTime,
        }));
        
        return {
            currentPage: data.currentPage || 0,
            pageLayout: data.pageLayout || 'single',
            sessions: sessions,
            visitedPages: data.visitedPages || [0],
            notes: notes,
            aiHistory: data.aiHistory || [],
        };
    } else {
        return null;
    }
}

// Saves client-side book data to Firestore, converting types as needed
export async function saveBookState(bookId: string, data: BookState): Promise<void> {
    if (!bookId) return;
    const docRef = doc(db, "books", bookId);

    const notesToSave = data.notes.map(note => ({
        ...note,
        createdAt: Timestamp.fromDate(new Date(note.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(note.updatedAt)),
    }));
    
    const dataToSave = {
        ...data,
        notes: notesToSave,
    };

    await setDoc(docRef, dataToSave, { merge: true });
}

// Saves only the book's metadata (id, title, author), not its content.
export async function saveBook(book: Book): Promise<void> {
    if (!book.id) return;
    const docRef = doc(db, "books", book.id);
    
    const bookToSave = {
        id: book.id,
        title: book.title,
        author: book.author,
    };

    await setDoc(docRef, bookToSave, { merge: true });
}

export async function getLibrary(): Promise<Book[]> {
    const libraryCol = collection(db, "books");
    const q = query(libraryCol);
    const querySnapshot = await getDocs(q);
    // Books from the library do not include content.
    const books: Book[] = querySnapshot.docs.map(doc => doc.data() as Book);
    return books;
}

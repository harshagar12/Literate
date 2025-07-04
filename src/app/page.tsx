"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  BookOpen,
  PanelRightOpen,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Shuffle,
  BarChart3,
  TrendingUp,
  BookCopy,
  Timer,
  RectangleHorizontal,
  SplitSquareHorizontal,
  Loader2,
  UploadCloud,
  Sparkles,
  X,
  Download,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AiAssistant from "@/components/AiAssistant";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { Note, ReadingSession, PageLayout, NoteCategory, Book, AiConversation } from "@/types";
import { getBookState, saveBookState, getLibrary, saveBook } from "@/lib/data-service";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

const LOREM_IPSUM_LONG = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. Sorbi et quilis et. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. Morbi faustibus, justo non, adipiscing, steque, justus, et. Nulla vitae elit libero, a pharetra augue. Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec ullamcorper nulla non metus auctor fringilla. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. Sorbi et quilis et. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. Morbi faustibus, justo non, adipiscing, steque, justus, et. Nulla vitae elit libero, a pharetra augue. Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec ullamcorper nulla non metus auctor fringilla.";
const LOREM_IPSUM_SHORT = "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?";
const WORDS_PER_PAGE = 250;

const initialBooks: Book[] = [
  {
    id: 'lorem-ipsum-long',
    title: 'The Art of Placeholder',
    author: 'Cicero & Co.',
    content: LOREM_IPSUM_LONG,
  },
  {
    id: 'lorem-ipsum-short',
    title: 'A Brief History of Ipsum',
    author: 'J. Doe',
    content: LOREM_IPSUM_SHORT,
  },
];

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBookSelection, setShowBookSelection] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>("Important");
  const [pageLayout, setPageLayout] = useState<PageLayout>('single');
  const [animationDirection, setAnimationDirection] = useState<'next' | 'prev'>('next');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiHistory, setAiHistory] = useState<AiConversation[]>([]);


  // Reading session state
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([0]));
  const sessionStartRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Fetch library from Firestore on initial load
  useEffect(() => {
    async function fetchLibrary() {
      setIsLoading(true);
      try {
        const libraryBooks = await getLibrary();
        const bookIds = new Set(libraryBooks.map(b => b.id));
        const allBooks = [...libraryBooks, ...initialBooks.filter(b => !bookIds.has(b.id))];
        setBooks(allBooks);
      } catch (e) {
        console.error("Error fetching library", e);
        toast.error("Error", {
          description: "Could not load your library. Please try again later.",
        });
        setBooks(initialBooks); // Fallback to initial books
      } finally {
        setIsLoading(false);
      }
    }
    fetchLibrary();
  }, []);


  const bookPages = useMemo(() => {
    if (!selectedBook?.content) return [];
    const words = selectedBook.content.split(' ');
    const pages = [];
    for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
      pages.push(words.slice(i, i + WORDS_PER_PAGE).join(' '));
    }
    return pages;
  }, [selectedBook]);
  const totalPages = bookPages.length;

  const pageIncrement = useMemo(() => (pageLayout === 'double' ? 2 : 1), [pageLayout]);

  const pagesInView = useMemo(() => {
    return bookPages.slice(currentPage, currentPage + pageIncrement);
  }, [currentPage, pageIncrement, bookPages]);

  const lastVisiblePageNumber = currentPage + pagesInView.length;

  // Load state from Firestore on book selection
  useEffect(() => {
    async function loadData() {
      if (!selectedBook) return;
      setIsLoading(true);
      try {
        const savedState = await getBookState(selectedBook.id);
        if (savedState) {
          setCurrentPage(savedState.currentPage);
          setPageLayout(savedState.pageLayout);
          setSessions(savedState.sessions);
          setVisitedPages(new Set(savedState.visitedPages));
          setNotes(savedState.notes);
          setAiHistory(savedState.aiHistory);
        } else {
          // New book, set defaults
          setCurrentPage(0);
          setPageLayout('single');
          setSessions([]);
          setVisitedPages(new Set([0]));
          setNotes([]);
          setAiHistory([]);
        }
      } catch (e) {
        console.error("Error loading from Firestore", e);
        toast.error("Error", {
          description: "Could not load book data. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBook?.id]);

  // Save state to Firestore
  useEffect(() => {
    if (isLoading || isInitialMount.current) {
        // Don't save while initial data is loading or on the very first render cycle
        if (isLoading) return;
        isInitialMount.current = false;
        return;
    }

    const handler = setTimeout(() => {
      if (selectedBook) {
        const dataToSave = {
          currentPage,
          pageLayout,
          sessions,
          visitedPages: Array.from(visitedPages),
          notes,
          aiHistory,
        };
        saveBookState(selectedBook.id, dataToSave).catch(e => {
            console.error("Failed to save state", e);
            toast.error("Sync Error", {
                description: "Failed to save progress.",
            });
        });
      }
    }, 1500); // Debounce saves to avoid excessive writes

    return () => {
      clearTimeout(handler);
    };
  }, [currentPage, pageLayout, sessions, visitedPages, notes, aiHistory, selectedBook, isLoading]);


  // Session management
  useEffect(() => {
    const endCurrentSession = () => {
        if (sessionStartRef.current) {
            const session = { startTime: sessionStartRef.current, endTime: Date.now() };
            setSessions(prev => [...prev, session]);
            sessionStartRef.current = null;
        }
    };

    if (selectedBook) {
        sessionStartRef.current = Date.now();
        window.addEventListener('beforeunload', endCurrentSession);

        return () => {
            endCurrentSession();
            window.removeEventListener('beforeunload', endCurrentSession);
        };
    }
  }, [selectedBook]);
  
  // Track visited pages
  useEffect(() => {
      if (selectedBook && !isLoading) {
          setVisitedPages(prev => {
              const newSet = new Set(prev);
              for (let i = 0; i < pagesInView.length; i++) {
                  newSet.add(currentPage + i);
              }
              return newSet;
          });
      }
  }, [currentPage, pagesInView.length, selectedBook, isLoading]);


  useEffect(() => {
    if (selectedBook) {
      const randomWpm = 180 + Math.floor(Math.random() * 41);
      setWpm(randomWpm);
    }
  }, [currentPage, selectedBook]);

  const handleNextPage = () => {
    if (lastVisiblePageNumber >= totalPages) return;
    setAnimationDirection('next');
    setCurrentPage((prev) => Math.min(prev + pageIncrement, totalPages - 1));
  };

  const handlePrevPage = () => {
    if (currentPage === 0) return;
    setAnimationDirection('prev');
    setCurrentPage((prev) => Math.max(prev - pageIncrement, 0));
  };
  
  const handleLayoutChange = (layout: PageLayout) => {
    setPageLayout(layout);
    if (layout === 'double') {
        setCurrentPage(page => page - (page % 2));
    }
  };

  const handleAddNote = () => {
    if (newNote.trim() === "") return;
    const now = new Date();
    const note: Note = {
      id: Date.now(),
      page: currentPage + 1,
      createdAt: now,
      updatedAt: now,
      content: newNote.trim(),
      category: newNoteCategory,
    };
    setNotes((prev) => [note, ...prev]);
    setNewNote("");
    setNewNoteCategory("Important");
  };

  const readingStats = useMemo(() => {
    const totalReadingTimeMs = sessions.reduce((total, session) => {
      return total + (session.endTime - session.startTime);
    }, 0);

    const totalSessions = sessions.length;
    const totalPagesRead = visitedPages.size;
    const averageSessionLengthMs = totalSessions > 0 ? totalReadingTimeMs / totalSessions : 0;

    return {
      totalReadingTime: totalReadingTimeMs,
      totalSessions,
      totalPagesRead,
      averageSessionLength: averageSessionLengthMs,
    };
  }, [sessions, visitedPages]);

  const formatDuration = (ms: number) => {
    if (ms <= 0) return "0s";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      seconds > 0 ? `${seconds}s` : null,
    ].filter(Boolean).join(' ') || '0s';
  };


  // Audio player handlers
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setAudioFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, ...newFiles];
        if (prevFiles.length === 0 && newFiles.length > 0) {
          setCurrentTrackIndex(0);
          setIsPlaying(true);
        }
        return updatedFiles;
      });
    }
  };
  
  const handleNextTrack = () => {
    if (audioFiles.length < 2) return;
    if (isShuffling) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * audioFiles.length);
      } while (nextIndex === currentTrackIndex);
      setCurrentTrackIndex(nextIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % audioFiles.length);
    }
  };

  const handlePrevTrack = () => {
    if (audioFiles.length === 0) return;
    if (isShuffling) {
      handleNextTrack();
      return;
    }
    setCurrentTrackIndex((prev) => (prev - 1 + audioFiles.length) % audioFiles.length);
  };
  
  const togglePlayPause = () => {
    if (audioFiles.length === 0) return;
    setIsPlaying(!isPlaying);
  };
  
  // Audio player effects
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement && audioFiles.length > 0 && currentTrackIndex < audioFiles.length) {
      const trackUrl = URL.createObjectURL(audioFiles[currentTrackIndex]);
      audioElement.src = trackUrl;
      if (isPlaying) {
        audioElement.play().catch(e => console.error("Error playing audio:", e));
      }
      return () => {
        URL.revokeObjectURL(trackUrl);
      };
    }
  }, [currentTrackIndex, audioFiles, isPlaying]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement && audioFiles.length > 0) {
      if (isPlaying) {
        audioElement.play().catch(e => console.error("Error playing audio:", e));
      } else {
        audioElement.pause();
      }
    }
  }, [isPlaying, audioFiles]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const pageNumberText = useMemo(() => {
    if (pageLayout === 'single') {
        return `Page ${currentPage + 1} of ${totalPages}`;
    }
    return `Pages ${currentPage + 1}-${lastVisiblePageNumber} of ${totalPages}`;
  }, [currentPage, lastVisiblePageNumber, pageLayout, totalPages]);

  const VolumeIcon = useMemo(() => {
    if (volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  }, [volume]);

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | null = null;
    if ('dataTransfer' in event) {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        file = event.dataTransfer.files?.[0];
    } else {
        file = (event.target as HTMLInputElement).files?.[0] ?? null;
    }

    if (!file || !file.type.includes('pdf')) {
      toast.error('Invalid File', {
        description: 'Please upload a valid PDF file.',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse PDF.');
      }

      const { text } = await response.json();

      const tempTitle = file.name.replace(/\.pdf$/i, '');
      const tempAuthor = 'Uploaded Book';
      // Create a stable ID from title and author
      const bookId = `${tempTitle}-${tempAuthor}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const newBook: Book = {
        id: bookId,
        title: tempTitle,
        author: tempAuthor,
        content: text,
      };
      
      // Save book metadata (without content) in the background.
      saveBook(newBook).catch(error => {
          console.error("Failed to save book to Firestore:", error);
          toast.error("Sync Error", {
            description: "Could not save the book. Progress may not be saved.",
          });
      });

      // Optimistically update the UI.
      setBooks(prevBooks => {
        const existingBookIndex = prevBooks.findIndex(b => b.id === newBook.id);
        if (existingBookIndex !== -1) {
          const updatedBooks = [...prevBooks];
          updatedBooks[existingBookIndex] = { ...updatedBooks[existingBookIndex], ...newBook }; // Merge to keep old data if any
          return updatedBooks;
        }
        return [...prevBooks, newBook];
      });
      setSelectedBook(newBook);
      
    } catch (error) {
      console.error("Error parsing PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not read the PDF file. It might be corrupted or protected.";
      toast.error("PDF Parsing Error", {
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
      if ('target' in event && event.target) {
        (event.target as HTMLInputElement).value = '';
      }
    }
  };
  
  const handleDownloadNotes = () => {
    if (!selectedBook || notes.length === 0) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Notes for: ${selectedBook.title}`, 14, 22);
    doc.setFontSize(12);
    doc.text(`By: ${selectedBook.author}`, 14, 30);

    const tableData = notes.map(note => [
      format(note.createdAt, "MMM d, yyyy"),
      note.page,
      note.category,
      note.content,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Page', 'Category', 'Note']],
      body: tableData,
      styles: {
        cellPadding: 2,
        fontSize: 10,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        3: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        const str = `Page ${doc.getNumberOfPages()}`;
        doc.setFontSize(10);
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      },
    });

    doc.save(`Notes-${selectedBook.title.replace(/\s/g, '_')}.pdf`);
  };

  if (!selectedBook) {
    if (!showBookSelection) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
          <BookOpen className="w-24 h-24 text-primary mb-6" />
          <h1 className="text-6xl font-headline font-bold text-gray-800 dark:text-gray-200 mb-2">
            Literate
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-md">
            Your distraction-free space for deep reading and focused learning.
          </p>
          <Button size="lg" onClick={() => setShowBookSelection(true)}>
            Start Reading
          </Button>
        </div>
      );
    }

    // Only show the upload card, not the library or trial books
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="font-headline text-xl font-semibold">Literate</span>
          </div>
          <ThemeToggle />
        </header>
        <main className="container mx-auto p-4 md:p-8 flex-grow">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-left">Select a Book</h1>
          <div className="flex flex-1 items-center justify-center min-h-[60vh]">
            <div className="grid grid-cols-1 w-full max-w-xs gap-6">
              <Card
                className={cn(
                  "cursor-pointer hover:shadow-xl transition-all duration-300 rounded-lg group flex flex-col items-center justify-center text-center bg-secondary/50 border-2 border-dashed",
                  isDragging && "border-primary bg-accent/50 scale-105",
                  isUploading && "pointer-events-none"
                )}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={handlePdfUpload}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center p-6 w-full">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground font-semibold">Processing PDF...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6">
                    <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                    <CardTitle className="text-lg">Upload Book</CardTitle>
                    <CardDescription className="text-sm mt-1">Drag & drop or click</CardDescription>
                  </div>
                )}
              </Card>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePdfUpload}
                accept=".pdf"
                className="hidden"
                disabled={isUploading}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={cn(
        "h-screen bg-background font-body grid transition-all duration-300 ease-in-out",
        isAssistantOpen ? "grid-cols-[1fr_400px]" : "grid-cols-[1fr_0px]"
    )}>
        <div className="flex flex-col h-full overflow-hidden">
            <header className="flex items-center justify-between p-2 border-b shrink-0">
                <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setSelectedBook(null)} aria-label="Back to library">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <span className="font-headline text-xl font-semibold truncate" title={selectedBook.title}>
                    {selectedBook.title}
                </span>
                </div>
                
                <div className="flex items-center gap-2">
                <Select value={pageLayout} onValueChange={(v) => handleLayoutChange(v as PageLayout)}>
                    <SelectTrigger className="w-auto md:w-[160px] gap-2">
                        <SelectValue placeholder="Select layout" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="single">
                            <div className="flex items-center gap-2">
                                <RectangleHorizontal className="h-4 w-4" />
                                <span>Single Page</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="double">
                            <div className="flex items-center gap-2">
                                <SplitSquareHorizontal className="h-4 w-4" />
                                <span>Double Page</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
                
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setIsAssistantOpen(prev => !prev)}>
                                <Sparkles className="w-5 h-5" />
                                <span className="sr-only">Toggle AI Assistant</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>AI Assistant</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <ThemeToggle />
                <Sheet>
                    <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <PanelRightOpen className="w-5 h-5" />
                        <span className="sr-only">Open Workspace</span>
                    </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px] p-0 h-full flex flex-col">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Workspace</SheetTitle>
                    </SheetHeader>
                    <Tabs defaultValue="notes" className="flex-grow flex flex-col">
                        <TabsList className="grid w-full grid-cols-3 mt-4 px-4">
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                        <TabsTrigger value="playlist">Playlist</TabsTrigger>
                        <TabsTrigger value="stats">Stats</TabsTrigger>
                        </TabsList>
                        <TabsContent value="notes" className="p-4 overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-2">Add a Note</h3>
                        <div className="space-y-2">
                            <Select value={newNoteCategory} onValueChange={(value) => setNewNoteCategory(value as NoteCategory)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Summary">Summary</SelectItem>
                                    <SelectItem value="Question">Question</SelectItem>
                                    <SelectItem value="Important">Important</SelectItem>
                                    <SelectItem value="Quote">Quote</SelectItem>
                                </SelectContent>
                            </Select>
                            <Textarea
                                placeholder="Type your note here..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                            />
                            <Button onClick={handleAddNote} className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Note
                            </Button>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold">My Notes</h3>
                          <Button variant="outline" size="sm" onClick={handleDownloadNotes} disabled={notes.length === 0}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                        </div>
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="space-y-4">
                            {notes.length > 0 ? notes.map((note) => (
                            <Card key={note.id}>
                                <CardHeader className="p-4">
                                <div className="flex justify-between items-center">
                                    <Badge variant="secondary">{note.category}</Badge>
                                    <CardDescription className="text-xs text-right">
                                        <div>Page {note.page}</div>
                                        <div>{format(note.createdAt, "MMM d, yyyy h:mm a")}</div>
                                    </CardDescription>
                                </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                </CardContent>
                            </Card>
                            )) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No notes taken yet.</p>
                            )}
                            </div>
                        </ScrollArea>
                        </TabsContent>
                        <TabsContent value="playlist" className="p-4 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Audio Playlist</h3>
                            <input
                            type="file"
                            id="audio-upload"
                            multiple
                            accept=".mp3,.wav"
                            onChange={handleAudioUpload}
                            className="hidden"
                            />
                            <label htmlFor="audio-upload">
                            <Button asChild>
                                <span>Upload Audio</span>
                            </Button>
                            </label>
                        </div>
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="space-y-2">
                            {audioFiles.length > 0 ? audioFiles.map((file, index) => (
                                <Card 
                                key={`${file.name}-${index}`} 
                                className={cn(
                                    "p-3 cursor-pointer hover:bg-accent/50", 
                                    index === currentTrackIndex && "bg-accent"
                                )}
                                onClick={() => setCurrentTrackIndex(index)}
                                >
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                </Card>
                            )) : (
                                <div className="text-center py-8">
                                <p className="text-sm text-muted-foreground">No audio files uploaded.</p>
                                <p className="text-xs text-muted-foreground mt-1">Upload MP3 or WAV files to create a playlist.</p>
                                </div>
                            )}
                            </div>
                        </ScrollArea>
                        </TabsContent>
                        <TabsContent value="stats" className="p-4 overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Reading Analytics</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Reading Time</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatDuration(readingStats.totalReadingTime)}</div>
                                <p className="text-xs text-muted-foreground">Across {readingStats.totalSessions} sessions</p>
                            </CardContent>
                            </Card>
                            <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pages Read</CardTitle>
                                <BookCopy className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{readingStats.totalPagesRead}</div>
                                <p className="text-xs text-muted-foreground">Out of {totalPages} total pages</p>
                            </CardContent>
                            </Card>
                            <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                                <Timer className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatDuration(readingStats.averageSessionLength)}</div>
                                <p className="text-xs text-muted-foreground">Average time per session</p>
                            </CardContent>
                            </Card>
                            <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{readingStats.totalSessions}</div>
                                <p className="text-xs text-muted-foreground">Total number of reading sessions</p>
                            </CardContent>
                            </Card>
                        </div>
                        <div className="mt-6">
                            <h4 className="text-md font-semibold mb-2">Session History</h4>
                            <ScrollArea className="h-48 min-h-0">
                            <div className="space-y-2 pr-4">
                                {sessions.length > 0 ? [...sessions].reverse().map((session, index) => (
                                <Card key={index} className="p-3">
                                    <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium">Session {sessions.length - index}</p>
                                    <p className="text-sm text-muted-foreground">{formatDuration(session.endTime - session.startTime)}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{format(new Date(session.startTime), "MMM d, yyyy 'at' h:mm a")}</p>
                                </Card>
                                )) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No session history yet.</p>
                                )}
                            </div>
                            </ScrollArea>
                        </div>
                        </TabsContent>
                    </Tabs>
                    </SheetContent>
                </Sheet>
                </div>
            </header>

            <main className="flex-grow overflow-hidden p-4 flex flex-col items-center">
                <Card className="w-full max-w-5xl flex-grow flex flex-col shadow-lg relative overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div
                    key={currentPage}
                    className={cn(
                        "w-full h-full",
                        animationDirection === 'next' ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left'
                    )}
                    >
                    <CardContent className="p-6 md:p-8 text-lg leading-relaxed h-full flex gap-8">
                        <ScrollArea className="flex-1">
                        <p className="whitespace-pre-wrap">{pagesInView[0]}</p>
                        </ScrollArea>
                        {pagesInView.length > 1 && (
                        <>
                            <Separator orientation="vertical" className="h-full" />
                            <ScrollArea className="flex-1">
                            <p className="whitespace-pre-wrap">{pagesInView[1]}</p>
                            </ScrollArea>
                        </>
                        )}
                    </CardContent>
                    </div>
                )}
                </Card>
            </main>

            <footer className="px-4 pt-2 pb-1 border-t shrink-0 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center justify-between w-full max-w-7xl mx-auto gap-4">
                    <div className="flex items-center gap-1" style={{ width: '260px' }}>
                        <Button variant={isShuffling ? "secondary" : "ghost"} size="icon" onClick={() => setIsShuffling(!isShuffling)} disabled={audioFiles.length === 0} title="Shuffle">
                            <Shuffle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handlePrevTrack} disabled={audioFiles.length === 0} title="Previous Track">
                            <SkipBack className="w-4 h-4" />
                        </Button>
                        <Button variant="default" size="icon" className="w-10 h-10" onClick={togglePlayPause} disabled={audioFiles.length === 0}>
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleNextTrack} disabled={audioFiles.length === 0} title="Next Track">
                            <SkipForward className="w-4 h-4" />
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" title="Volume" className="w-10 h-10">
                              <VolumeIcon className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40" side="top" align="center">
                            <Slider
                              defaultValue={[volume * 100]}
                              max={100}
                              step={1}
                              onValueChange={(value) => setVolume(value[0] / 100)}
                            />
                          </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex items-center justify-center gap-4 flex-grow">
                        <Button variant="ghost" size="icon" onClick={handlePrevPage} disabled={currentPage === 0 || isLoading}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground font-medium w-48 text-center truncate">
                            {isLoading ? "Loading..." : pageNumberText}
                        </span>
                        <Button variant="ghost" size="icon" onClick={handleNextPage} disabled={lastVisiblePageNumber >= totalPages || isLoading}>
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="text-right" style={{ width: '260px' }}>
                        {audioFiles.length > 0 && currentTrackIndex < audioFiles.length ? (
                        <>
                            <p className="font-semibold truncate text-sm" title={audioFiles[currentTrackIndex].name}>{audioFiles[currentTrackIndex].name.replace(/\.[^/.]+$/, "")}</p>
                            <p className="text-muted-foreground text-xs">Track {currentTrackIndex + 1} of {audioFiles.length}</p>
                        </>
                        ) : (
                        <>
                            <p className="font-semibold text-sm">No Audio Loaded</p>
                            <p className="text-muted-foreground text-xs">Upload from workspace</p>
                        </>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-7xl mx-auto mt-2">
                    <Progress value={isLoading ? 0 : (lastVisiblePageNumber / totalPages) * 100} className="h-2"/>
                </div>
                <audio ref={audioRef} onEnded={handleNextTrack} />
            </footer>
        </div>
        <aside className="h-full bg-card border-l overflow-hidden">
            <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h2 className="text-lg font-semibold">AI Assistant</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsAssistantOpen(false)}>
                        <X className="w-5 h-5" />
                        <span className="sr-only">Close Assistant</span>
                    </Button>
                </div>
                <AiAssistant
                    bookContent={selectedBook.content || ''}
                    history={aiHistory}
                    onNewAnswer={(question, answer) => {
                        setAiHistory(prev => [...prev, { question, answer }]);
                    }}
                />
            </div>
        </aside>
    </div>
  );
}

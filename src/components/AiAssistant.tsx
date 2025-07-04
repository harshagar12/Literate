"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, User, Bot } from "lucide-react";
import type { AiConversation } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  question: z.string().min(1, { message: "Please enter a question." }),
});

type AiAssistantProps = {
  bookContent: string;
  history: AiConversation[];
  onNewAnswer: (question: string, answer: string) => void;
};

export default function AiAssistant({ bookContent, history, onNewAnswer }: AiAssistantProps) {
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [history]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: values.question,
          bookContent: bookContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'The AI assistant failed to respond.');
      }

      const result = await response.json();
      onNewAnswer(values.question, result.answer);
    } catch (error) {
      console.error("AI assistant error:", error);
      const message = error instanceof Error ? error.message : "Failed to get an answer from the assistant.";
      toast.error("Error", { description: message });
    } finally {
      setIsLoading(false);
      form.reset();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow overflow-y-auto -mx-4">
        <div className="px-4 space-y-4">
        {history.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground text-sm py-8">
                No questions asked yet. Ask the AI something about the current text.
            </div>
        )}
        {history.map((conv, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-start gap-2 justify-end">
              <p className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs break-words">
                {conv.question}
              </p>
              <Avatar className="h-8 w-8">
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
            </div>
            <div className="flex items-start gap-2">
              <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <p className="bg-secondary text-secondary-foreground p-3 rounded-lg max-w-xs break-words">
                {conv.answer}
              </p>
            </div>
          </div>
        ))}
         {isLoading && (
            <div className="flex items-start gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <p className="bg-secondary text-secondary-foreground p-3 rounded-lg max-w-xs break-words">
                    <Loader2 className="h-4 w-4 animate-spin" />
                </p>
            </div>
        )}
        </div>
        <div ref={scrollAreaRef} />
      </ScrollArea>
      <div className="pt-4 mt-auto">
        <Card>
          <CardContent className="p-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Ask about the text..."
                            {...field}
                            disabled={isLoading}
                            autoComplete="off"
                          />
                          <Button
                            type="submit"
                            size="icon"
                            className="absolute top-0 right-0 h-full w-10"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <p className="text-xs text-muted-foreground text-center px-2 pt-2">
                Relevant sections of the book are sent to the AI to provide context for your questions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

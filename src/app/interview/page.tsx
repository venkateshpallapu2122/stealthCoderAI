
// src/app/interview/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, Book, Lightbulb, Zap, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { handleObjection } from '@/ai/flows/handle-objection-flow';
import { useToast } from "@/hooks/use-toast";

type Suggestion = {
  type: 'rebuttal' | 'comparison' | 'question';
  content: string;
};

export default function InterviewPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript + interimTranscript);
        if (finalTranscript) {
          fetchSuggestions(finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        toast({ variant: 'destructive', title: 'Speech Recognition Error', description: event.error });
        setIsListening(false);
      };

    } else {
      toast({ variant: 'destructive', title: 'Unsupported Browser', description: 'Speech recognition is not supported in this browser.' });
    }
    
    return () => {
        if(recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, [toast]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setSuggestions([]);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };
  
  const fetchSuggestions = async (text: string) => {
      if(isLoading) return;
      setIsLoading(true);
      try {
          const result = await handleObjection({objection: text});
          const newSuggestions: Suggestion[] = [
              {type: 'rebuttal', content: result.rebuttal},
              {type: 'comparison', content: result.comparison},
              {type: 'question', content: result.questionToAsk},
          ];
          setSuggestions(newSuggestions);
      } catch (error) {
          console.error("Error fetching suggestions:", error);
          toast({variant: 'destructive', title: 'AI Error', description: 'Could not fetch suggestions.'});
      } finally {
          setIsLoading(false);
      }
  }

  const getIconForType = (type: Suggestion['type']) => {
    switch (type) {
      case 'rebuttal': return <Zap className="text-yellow-400" />;
      case 'comparison': return <Book className="text-blue-400" />;
      case 'question': return <Lightbulb className="text-green-400" />;
      default: return <Bot />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full h-full flex flex-col gap-4">
        <header className="flex justify-between items-center text-white">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Live Objection Handling & Battlecards</h1>
            <p className="text-sm text-gray-300">Cluely listens for objections and instantly surfaces the right responses, competitor comparisons, or rebuttals — no tab-switching needed.</p>
          </div>
          <Button variant="ghost" size="icon">
            <Settings />
          </Button>
        </header>

        <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                    <Card key={index} className="bg-white/10 border-white/20 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                           <CardTitle className="text-lg flex items-center gap-2">
                               {getIconForType(suggestion.type)}
                               {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p>{suggestion.content}</p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Card className="bg-white/10 border-white/20 text-white h-full flex items-center justify-center">
                    <p className="text-lg">AI suggestions will appear here...</p>
                </Card>
            )}
          </div>
          <div className="space-y-4 flex flex-col">
              <Card className="bg-white/10 border-white/20 text-white flex-1">
                  <CardHeader>
                      <CardTitle>Live Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p>{transcript || "Waiting for you to speak..."}</p>
                  </CardContent>
              </Card>
              <Button onClick={toggleListening} size="lg" className={`w-full ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {isListening ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </Button>
          </div>
        </main>
      </div>
    </div>
  );
}


"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Book, Lightbulb, Zap, Bot, X, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleObjection, HandleObjectionInput, handleObjectionForProductManager } from '@/ai/flows/handle-objection-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import useSimulatedTyper from '@/hooks/use-simulated-typer';

type SuggestionType = 'rebuttal' | 'comparison' | 'question' | 'followUp';

function SuggestionCard({ type, content }: { type: SuggestionType, content: string }) {
    const { typedText, startTyping } = useSimulatedTyper(content);

    useEffect(() => {
        startTyping();
    }, [startTyping]);

    const getIconForType = (type: SuggestionType) => {
        switch (type) {
            case 'rebuttal': return <Zap className="text-yellow-400" />;
            case 'comparison': return <Book className="text-blue-400" />;
            case 'question': return <Lightbulb className="text-green-400" />;
            case 'followUp': return <HelpCircle className="text-orange-400" />;
            default: return <Bot />;
        }
    };

    const getTitleForType = (type: SuggestionType) => {
        switch (type) {
            case 'rebuttal': return 'Rebuttal';
            case 'comparison': return 'Comparison';
            case 'question': return 'Question to Ask';
            case 'followUp': return 'Follow-up Question';
            default: return 'Suggestion';
        }
    }

    return (
        <Card className="bg-black/50 border-white/20 text-white animate-in fade-in-0 duration-500 text-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-2 px-3">
                <CardTitle className="text-base flex items-center gap-2">
                    {getIconForType(type)}
                    {getTitleForType(type)}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
                <p className="whitespace-pre-wrap text-xs">{typedText}</p>
            </CardContent>
        </Card>
    );
}


function InterviewModal({
  isOpen,
  onClose,
  interviewContext,
}: {
  isOpen: boolean;
  onClose: () => void;
  interviewContext: Omit<HandleObjectionInput, 'objection'>;
}) {
  const [transcript, setTranscript] = useState('');
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');
  const [suggestions, setSuggestions] = useState<{type: SuggestionType, content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!isOpen) {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    const startRecognition = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.log("Recognition already started.");
            }
        }
    };

    const stopRecognition = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    if (SpeechRecognition) {
      if (!recognitionRef.current) {
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
           setTranscript(prev => prev + finalTranscript + interimTranscript);
           if (finalTranscript.trim()) {
               setTranscript(prev => prev.trim() + ' ');
           }
        };
        
        recognitionRef.current.onend = () => {
            setIsListening(false);
            if(isOpen) { // Only restart if the modal is supposed to be open
                startRecognition();
            }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          setIsListening(false);
          if (event.error === 'no-speech') {
             // Ignore this error and just restart.
             startRecognition();
             return;
          }

          let description = `An unknown error occurred: ${event.error}`;
          if (event.error === 'network') {
            description = 'Could not connect to the speech recognition service. Please check your internet connection.';
             toast({ variant: 'destructive', title: 'Speech Recognition Error', description });
          } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            description = 'Microphone access was denied. Please enable microphone permissions in your browser settings.';
             toast({ variant: 'destructive', title: 'Speech Recognition Error', description });
          } else {
             console.error('Speech recognition error', event.error);
          }
        };
      }
      
      startRecognition();

    } else {
      toast({ variant: 'destructive', title: 'Unsupported Browser', description: 'Speech recognition is not supported in this browser.' });
    }
    
    return () => {
        stopRecognition();
    }
  }, [isOpen, toast, isListening]);
  

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'x') {
            event.preventDefault();
            
            const finalTranscript = transcript.trim();
            if (!finalTranscript || finalTranscript === lastProcessedTranscript) {
              return;
            }
            
            setIsLoading(true);
            setSuggestions([]);
            setLastProcessedTranscript(finalTranscript);

            try {
                const input: HandleObjectionInput = {
                    objection: finalTranscript,
                    ...interviewContext
                };

                const isProductManager = interviewContext.roleName.toLowerCase().includes('product manager');
                
                let newSuggestions: {type: SuggestionType, content: string}[];

                if (isProductManager) {
                  const result = await handleObjectionForProductManager(input);
                  newSuggestions = [
                      {type: 'rebuttal', content: result.rebuttal},
                      {type: 'comparison', content: result.comparison},
                      {type: 'question', content: result.questionToAsk},
                      {type: 'followUp', content: result.followUpQuestion},
                  ];
                } else {
                  const result = await handleObjection(input);
                  newSuggestions = [
                      {type: 'rebuttal', content: result.rebuttal},
                      {type: 'comparison', content: result.comparison},
                      {type: 'question', content: result.questionToAsk},
                  ];
                }
                setSuggestions(newSuggestions);
                setTranscript('');
                setLastProcessedTranscript('');

            } catch (error: any) {
                console.error("Error fetching suggestions:", error);
                if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
                    toast({
                        variant: 'destructive',
                        title: 'AI Model Overloaded',
                        description: 'The AI is currently busy. Please try again in a moment.'
                    });
                } else if (error.message && error.message.includes('429')) {
                    toast({
                        variant: 'destructive',
                        title: 'Rate Limit Exceeded',
                        description: "You've made too many requests. Please wait a bit before trying again."
                    });
                } else {
                    toast({
                      variant: 'destructive', 
                      title: 'Server Error', 
                      description: 'An unexpected response was received from the server. Please try again.'
                    });
                }
            } finally {
                setIsLoading(false);
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [transcript, interviewContext, toast, lastProcessedTranscript]);
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogOverlay className="bg-transparent" />
        <DialogContent className="bg-transparent text-white border-none shadow-lg max-w-[500px] w-full p-4 top-4 translate-y-0 data-[state=open]:animate-none data-[state=closed]:animate-none flex flex-col max-h-[95vh]">
            <DialogHeader className="flex-shrink-0">
              <div className="flex justify-between items-center text-left">
                <div>
                  <DialogTitle className="text-lg font-bold">Interview Assistant</DialogTitle>
                   <p className="text-xs text-gray-400">Listening... Press Ctrl + Shift + X to generate suggestions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <DialogClose asChild>
                      <Button variant="ghost" size="icon" onClick={onClose}>
                          <X className="h-4 w-4" />
                      </Button>
                    </DialogClose>
                </div>
              </div>
            </DialogHeader>
            
            <ScrollArea className="flex-1 -mx-4" style={{ maxHeight: '40vh' }}>
              <div className="px-4 space-y-2">
                {isLoading && suggestions.length === 0 ? (
                    <div className="text-white min-h-[100px] flex items-center justify-center">
                       <p className="text-sm">Generating...</p>
                    </div>
                ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                       <SuggestionCard key={index} type={suggestion.type} content={suggestion.content} />
                    ))
                ) : (
                    <div className="text-gray-400 min-h-[100px] flex items-center justify-center text-center px-4">
                        <p className="text-sm">Suggestions will appear here when you press Ctrl + Shift + X.</p>
                    </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="flex-shrink-0 mt-2">
                <ScrollArea className="h-20 rounded-md border border-white/20 p-2 bg-black/30">
                  <p className="text-xs text-gray-300">{transcript || "Live transcript will appear here..."}</p>
                </ScrollArea>
            </div>
        </DialogContent>
    </Dialog>
  );
}


export default function OnboardingPage() {
  const [roleName, setRoleName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [interviewContext, setInterviewContext] = useState<Omit<HandleObjectionInput, 'objection'>>({
    roleName: '',
    jobDescription: '',
    resume: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    try {
        const savedRoleName = localStorage.getItem('roleName') || '';
        const savedJobDescription = localStorage.getItem('jobDescription') || '';
        const savedResumeUrl = localStorage.getItem('resumeUrl') || '';
        const savedResumeContent = localStorage.getItem('resumeContent') || '';
        setRoleName(savedRoleName);
        setJobDescription(savedJobDescription);
        setResumeUrl(savedResumeUrl);
        setResumeContent(savedResumeContent);
    } catch (error) {
        console.error("Could not load from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('roleName', roleName);
    } catch (error) {
        console.error("Could not save roleName to localStorage", error);
    }
  }, [roleName]);

  useEffect(() => {
    try {
        localStorage.setItem('jobDescription', jobDescription);
    } catch (error) {
        console.error("Could not save jobDescription to localStorage", error);
    }
  }, [jobDescription]);

  useEffect(() => {
    try {
        localStorage.setItem('resumeUrl', resumeUrl);
    } catch (error) {
        console.error("Could not save resumeUrl to localStorage", error);
    }
  }, [resumeUrl]);

  useEffect(() => {
    try {
        localStorage.setItem('resumeContent', resumeContent);
    } catch (error) {
        console.error("Could not save resumeContent to localStorage", error);
    }
  }, [resumeContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName || !jobDescription || (!resumeUrl && !resumeContent)) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please fill out the role name, job description, and provide a resume.',
        });
        return;
    }
    
    const context = {
        roleName,
        jobDescription,
        resume: resumeContent || resumeUrl
    };
    setInterviewContext(context);
    setIsInterviewStarted(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {!isInterviewStarted ? (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Welcome to Your Interview Copilot</CardTitle>
            <CardDescription>
              Tell us about the role you&apos;re interviewing for, the job description, and provide your resume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name</Label>
                <Input 
                  id="role-name"
                  placeholder="e.g., Senior Product Manager" 
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-description">Job Description</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the job description here..."
                  className="min-h-[150px]"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume-url">Resume URL</Label>
                <Input 
                  id="resume-url" 
                  placeholder="https://example.com/my-resume.pdf" 
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume-content">Or Paste Resume Content</Label>
                <Textarea
                  id="resume-content"
                  placeholder="Paste your resume here..."
                  className="min-h-[200px]"
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                />
              </div>
              <Button className="w-full" type="submit">
                  Start Interview <ArrowRight className="ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      
      <InterviewModal 
        isOpen={isInterviewStarted}
        onClose={() => setIsInterviewStarted(false)}
        interviewContext={interviewContext}
      />
    </div>
  );
}

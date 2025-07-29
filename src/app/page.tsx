
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Book, Lightbulb, Zap, Bot, ScreenShare, X, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleObjection, HandleObjectionInput, handleObjectionForProductManager } from '@/ai/flows/handle-objection-flow';
import { generateCodeAndExplanationFromScreenshot, GenerateCodeAndExplanationFromScreenshotInput } from '@/ai/flows/generate-code-and-explanation-from-screenshot';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

type Suggestion = {
  type: 'rebuttal' | 'comparison' | 'question' | 'code' | 'explanation' | 'followUp';
  content: string;
};

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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
           // Update transcript with both final and interim results for a live feel
          setTranscript(prev => (prev.split(' ').slice(0, -1).join(' ') + ' ' + finalTranscript + interimTranscript).trim());
        };
        
        recognitionRef.current.onend = () => {
          // Automatically restart listening if it stops and the modal is still open
          if(isOpen) {
              try {
                recognitionRef.current?.start();
              } catch(e) {
                console.error("Could not restart speech recognition", e);
              }
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          let description = `An unknown error occurred: ${event.error}`;
          if (event.error === 'network') {
            description = 'Could not connect to the speech recognition service. Please check your internet connection.';
          } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            description = 'Microphone access was denied. Please enable microphone permissions in your browser settings.';
          }
          toast({ variant: 'destructive', title: 'Speech Recognition Error', description });
        };
      }
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.log("Recognition already started.");
      }

    } else {
      toast({ variant: 'destructive', title: 'Unsupported Browser', description: 'Speech recognition is not supported in this browser.' });
    }
    
    return () => {
        if(recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, [isOpen, toast]);
  

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.altKey && event.code === 'Space') {
        event.preventDefault();
        
        const finalTranscript = transcript.trim();
        if (!finalTranscript) {
          toast({
            variant: 'destructive',
            title: 'Transcript Empty',
            description: 'No speech detected to generate suggestions from.',
          });
          return;
        }
        
        setIsLoading(true);
        try {
            const input: HandleObjectionInput = {
                objection: finalTranscript,
                ...interviewContext
            };

            const isProductManager = interviewContext.roleName.toLowerCase().includes('product manager');
            
            let newSuggestions: Suggestion[];

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

        } catch (error) {
            console.error("Error fetching suggestions:", error);
            toast({variant: 'destructive', title: 'AI Error', description: 'Could not fetch suggestions.'});
        } finally {
            setIsLoading(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [transcript, interviewContext, toast]);
  
  const handleScreenAnalysis = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setSuggestions([]);
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        const imageCapture = new (window as any).ImageCapture(videoTrack);
        const bitmap = await imageCapture.grabFrame();
        videoTrack.stop(); 

        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(bitmap, 0, 0);
            const dataUri = canvas.toDataURL('image/png');
            
            const input: GenerateCodeAndExplanationFromScreenshotInput = {
                photoDataUri: dataUri,
                customPrompt: "Analyze the coding question in the screenshot and provide a solution with an explanation."
            };

            const result = await generateCodeAndExplanationFromScreenshot(input);
            const newSuggestions: Suggestion[] = [
                { type: 'code', content: result.code },
                { type: 'explanation', content: result.explanation },
            ];
            setSuggestions(newSuggestions);
        }
    } catch (error: any) {
        console.error("Error analyzing screen:", error);
        let description = 'Could not analyze the screen.';
        if (error.name === 'NotAllowedError' || error.message.includes('disallowed by permissions policy')) {
          description = 'Screen capture is disabled by your browser or a permissions policy in this environment. Please try running the app in a different browser or environment.';
        } else if (error.name === 'NotFoundError') {
          description = 'No screen or window was selected to share.'
        }
        toast({ variant: 'destructive', title: 'Screen Analysis Error', description });
    } finally {
        setIsLoading(false);
    }
  };

  const getIconForType = (type: Suggestion['type']) => {
    switch (type) {
      case 'rebuttal': return <Zap className="text-yellow-400" />;
      case 'comparison': return <Book className="text-blue-400" />;
      case 'question': return <Lightbulb className="text-green-400" />;
      case 'followUp': return <HelpCircle className="text-orange-400" />;
      case 'code': return <Zap className="text-purple-400" />;
      case 'explanation': return <Book className="text-blue-400" />;
      default: return <Bot />;
    }
  };

  const getTitleForType = (type: Suggestion['type']) => {
    switch (type) {
      case 'rebuttal': return 'Rebuttal';
      case 'comparison': return 'Comparison';
      case 'question': return 'Question to Ask';
      case 'followUp': return 'Follow-up Question';
      case 'code': return 'Code Solution';
      case 'explanation': return 'Explanation';
      default: return 'Suggestion';
    }
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogOverlay className="bg-transparent" />
        <DialogContent className="bg-transparent text-white border-none shadow-lg max-w-[500px] w-full p-4 top-4 translate-y-0 data-[state=open]:animate-none data-[state=closed]:animate-none flex flex-col max-h-[95vh]">
            <DialogHeader className="flex-shrink-0">
              <div className="flex justify-between items-center text-left">
                <div>
                  <DialogTitle className="text-lg font-bold">Interview Assistant</DialogTitle>
                   <p className="text-xs text-gray-400">Listening... Press Alt+Space to generate suggestions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleScreenAnalysis} size="icon" variant="ghost" className="text-xs" disabled={isLoading} title="Analyze Screen">
                      <ScreenShare />
                    </Button>
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
                        <Card key={index} className="bg-black/50 border-white/20 text-white animate-in fade-in-0 duration-500 text-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-2 px-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                {getIconForType(suggestion.type)}
                                {getTitleForType(suggestion.type)}
                            </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                              {suggestion.type === 'code' ? (
                                <pre className="bg-black/50 p-2 rounded-md overflow-x-auto"><code className="text-xs font-mono">{suggestion.content}</code></pre>
                              ) : (
                                <p className="whitespace-pre-wrap text-xs">{suggestion.content}</p>
                              )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-gray-400 min-h-[100px] flex items-center justify-center text-center px-4">
                        <p className="text-sm">Suggestions will appear here when you press Alt+Space.</p>
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
    localStorage.setItem('interviewContext', JSON.stringify(context));
    setIsInterviewStarted(true);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {!isInterviewStarted && (
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
      )}
      
      <InterviewModal 
        isOpen={isInterviewStarted}
        onClose={() => setIsInterviewStarted(false)}
        interviewContext={interviewContext}
      />
    </div>
  );
}

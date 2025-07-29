
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Mic, MicOff, Settings, Book, Lightbulb, Zap, Bot, ScreenShare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleObjection, HandleObjectionInput } from '@/ai/flows/handle-objection-flow';
import { generateCodeAndExplanationFromScreenshot, GenerateCodeAndExplanationFromScreenshotInput } from '@/ai/flows/generate-code-and-explanation-from-screenshot';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay } from "@/components/ui/dialog";

type Suggestion = {
  type: 'rebuttal' | 'comparison' | 'question' | 'code' | 'explanation';
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
      setSuggestions([]);
      try {
          const input: HandleObjectionInput = {
              objection: text,
              ...interviewContext
          };
          const result = await handleObjection(input);
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

  const handleScreenAnalysis = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setSuggestions([]);
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        const imageCapture = new (window as any).ImageCapture(videoTrack);
        const bitmap = await imageCapture.grabFrame();
        videoTrack.stop(); // Stop sharing screen

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
    } catch (error) {
        console.error("Error analyzing screen:", error);
        toast({ variant: 'destructive', title: 'Screen Analysis Error', description: 'Could not analyze the screen.' });
    } finally {
        setIsLoading(false);
    }
  };

  const getIconForType = (type: Suggestion['type']) => {
    switch (type) {
      case 'rebuttal': return <Zap className="text-yellow-400" />;
      case 'comparison': return <Book className="text-blue-400" />;
      case 'question': return <Lightbulb className="text-green-400" />;
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
      case 'code': return 'Code Solution';
      case 'explanation': return 'Explanation';
      default: return 'Suggestion';
    }
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
        <DialogContent className="bg-transparent border-none shadow-none max-w-4xl w-full p-0 data-[state=open]:animate-none data-[state=closed]:animate-none">
            <div className="w-full flex flex-col gap-4">
                <DialogHeader className="flex justify-between items-center text-white pt-4 text-left">
                  <div>
                    <DialogTitle className="text-2xl font-bold">Live Objection Handling & Battlecards</DialogTitle>
                    <DialogDescription className="text-sm text-gray-300">Cluely listens for objections and instantly surfaces the right responses, competitor comparisons, or rebuttals — no tab-switching needed.</DialogDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                      <Settings />
                  </Button>
                </DialogHeader>

                <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                    {isLoading && suggestions.length === 0 ? (
                        <Card className="bg-white/10 border-white/20 text-white min-h-[120px] flex items-center justify-center">
                           <p className="text-lg">Generating...</p>
                        </Card>
                    ) : suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                            <Card key={index} className="bg-white/10 border-white/20 text-white animate-in fade-in-0 duration-500">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {getIconForType(suggestion.type)}
                                    {getTitleForType(suggestion.type)}
                                </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  {suggestion.type === 'code' ? (
                                    <pre className="bg-black/50 p-4 rounded-md overflow-x-auto"><code className="text-sm">{suggestion.content}</code></pre>
                                  ) : (
                                    <p className="whitespace-pre-wrap">{suggestion.content}</p>
                                  )}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="bg-white/10 border-white/20 text-white min-h-[120px] flex items-center justify-center">
                            <p className="text-lg">{isListening ? 'Listening for objections...' : 'AI suggestions will appear here...'}</p>
                        </Card>
                    )}
                </div>
                <div className="space-y-4 flex flex-col">
                    <Card className="bg-white/10 border-white/20 text-white flex-1">
                        <CardHeader>
                            <CardTitle>Live Transcript</CardTitle>
                        </CardHeader>
                        <CardContent className="h-48 overflow-y-auto">
                            <p>{transcript || "Waiting for you to speak..."}</p>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={toggleListening} size="lg" className={`w-full ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                        {isListening ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
                        {isListening ? 'Stop' : 'Listen'}
                      </Button>
                      <Button onClick={handleScreenAnalysis} size="lg" variant="outline">
                          <ScreenShare className="mr-2" />
                          Analyze Screen
                      </Button>
                    </div>
                </div>
                </main>
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
      
      <InterviewModal 
        isOpen={isInterviewStarted}
        onClose={() => setIsInterviewStarted(false)}
        interviewContext={interviewContext}
      />
    </div>
  );
}

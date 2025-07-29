"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateCustomCode } from "@/ai/flows/generate-custom-code-from-prompt";
import CodeDisplay from "@/components/CodeDisplay";
import { Camera, Trash2, HelpCircle, Keyboard, Send } from "lucide-react";
import Image from "next/image";

type Mode = "interview" | "exam";

export default function StealthCoderDashboard() {
  const [mode, setMode] = useState<Mode>("interview");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScreenshot = async () => {
    if (screenshots.length >= 3) {
      toast({
        variant: "destructive",
        title: "Screenshot Limit Reached",
        description: "You can only add up to 3 screenshots.",
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "never" },
        audio: false,
      });
      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      track.stop();

      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      context?.drawImage(bitmap, 0, 0);
      const dataUri = canvas.toDataURL("image/png");

      setScreenshots((prev) => [...prev, dataUri]);
    } catch (error) {
      console.error("Screenshot error:", error);
      toast({
        variant: "destructive",
        title: "Screenshot Failed",
        description: "Could not capture screenshot. Please check permissions.",
      });
    }
  };
  
  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt && screenshots.length === 0) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please provide a prompt or a screenshot.",
      });
      return;
    }
    setIsLoading(true);
    setResponse("");
    try {
      const result = await generateCustomCode({
        customPrompt: prompt,
        photoDataUri: screenshots[0], // Flow only supports one screenshot
      });
      setResponse(result.generatedCode);
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "An error occurred while generating the response.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [prompt, screenshots, toast]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
    }
    if (e.altKey && e.key === 'p') {
        e.preventDefault();
        promptTextareaRef.current?.focus();
    }
    // Cannot implement Alt + / for screenshot due to browser security/conflicts
  }, [handleSubmit]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


  const renderInterviewMode = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>Provide screenshots and prompts for the AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Screenshots (up to 3)</h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {screenshots.map((src, index) => (
                <div key={index} className="relative group">
                  <Image src={src} alt={`Screenshot ${index + 1}`} width={100} height={75} className="rounded-md object-cover aspect-video" data-ai-hint="screenshot code" />
                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeScreenshot(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {screenshots.length < 3 && (
                <Button variant="outline" className="aspect-video h-full" onClick={handleScreenshot}>
                  <Camera className="h-6 w-6" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Hotkey: Alt + / (feature conceptual)</p>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Custom Prompt</h3>
            <Textarea
              ref={promptTextareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your question or instructions here..."
              className="min-h-[150px] font-code"
            />
             <p className="text-xs text-muted-foreground mt-1">Hotkey: Alt + P to focus</p>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoading ? "Generating..." : "Send to AI"}
            <Send className="ml-2 h-4 w-4"/>
          </Button>
          <p className="text-xs text-muted-foreground text-center">Hotkey: Ctrl + Enter to send</p>
        </CardContent>
      </Card>
      <CodeDisplay response={response} isLoading={isLoading} />
    </div>
  );

  const renderExamMode = () => (
     <Card className="max-w-3xl mx-auto">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Keyboard /> Coding Exam Mode</CardTitle>
            <CardDescription>This mode is designed for stealth. Use hotkeys for a minimal-UI, focus-retaining experience. The UI below is for setup and practice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2 p-4 border rounded-lg">
                <h4 className="font-semibold">Workflow:</h4>
                <p className="text-sm">1. Use <span className="font-semibold text-primary">Alt + /</span> to capture a screenshot of the problem (up to 3).</p>
                <p className="text-sm">2. Use <span className="font-semibold text-primary">Alt + P</span> to open a minimal prompt window to add text instructions.</p>
                <p className="text-sm">3. Press <span className="font-semibold text-primary">Ctrl + Enter</span> to send to the AI.</p>
                <p className="text-sm">4. The response will appear. Use <span className="font-semibold text-primary">Alt + C</span> to copy only the code.</p>
                <p className="text-sm">5. Use <span className="font-semibold text-primary">Alt + T</span> for human-like typing simulation.</p>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                <HelpCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <span>For a web application, true stealth and global hotkeys are limited by browser security. This mode simulates the workflow described. The UI below can be used to test the functionality.</span>
            </div>
            {renderInterviewMode()}
        </CardContent>
     </Card>
  );

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="interview">Technical Interview Mode</TabsTrigger>
        <TabsTrigger value="exam">Coding Exam Mode</TabsTrigger>
      </TabsList>
      <TabsContent value="interview" className="mt-4">
        {renderInterviewMode()}
      </TabsContent>
      <TabsContent value="exam" className="mt-4">
        {renderExamMode()}
      </TabsContent>
    </Tabs>
  );
}

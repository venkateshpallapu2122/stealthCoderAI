"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCopy, Keyboard, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import useSimulatedTyper from '@/hooks/use-simulated-typer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';

interface CodeDisplayProps {
  response: string;
  isLoading: boolean;
}

function extractCode(text: string): string {
    const codeBlocks = text.match(/```(?:\w+\n)?([\s\S]*?)```/g);
    if (!codeBlocks) return '';
    return codeBlocks.map(block => block.replace(/```(?:\w+)?\n?/, '').replace(/```$/, '')).join('\n\n');
}

function extractExplanation(text: string): string {
    return text.replace(/```(?:\w+\n)?[\s\S]*?```/g, '').trim();
}

export default function CodeDisplay({ response, isLoading }: CodeDisplayProps) {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);
    const [isTypingSimOpen, setIsTypingSimOpen] = useState(false);
    
    const code = useMemo(() => extractCode(response), [response]);
    const explanation = useMemo(() => extractExplanation(response), [response]);

    const { typedText, startTyping, isTyping } = useSimulatedTyper(code);

    const handleCopy = () => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setHasCopied(true);
        toast({ title: "Code Copied!", description: "The code has been copied to your clipboard." });
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleSimulateTyping = () => {
        if (!code || isTyping) return;
        setIsTypingSimOpen(true);
        startTyping();
    };

    const handleCopyFromSim = () => {
        navigator.clipboard.writeText(typedText);
        toast({ title: "Copied from Simulator!" });
        setIsTypingSimOpen(false);
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>AI Response</CardTitle>
                    <CardDescription>The AI is thinking...</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!response) {
         return (
            <Card className="flex flex-col items-center justify-center min-h-[400px]">
                <CardHeader className="text-center">
                    <CardTitle>AI Response</CardTitle>
                    <CardDescription>The generated code and explanation will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m12 14 4-4"/><path d="m12 14 4 4"/><path d="M12 14H2.5"/><path d="m12 14-4-4"/><path d="m12 14-4 4"/><path d="M12 14h9.5"/><path d="M12 2a10 10 0 0 0-9.94 11.66l-2.06 4.34 4.34-2.06A10 10 0 1 0 12 2Z"/></svg>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Response</CardTitle>
                <CardDescription>Review the generated code and explanation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {explanation && (
                    <div>
                        <h3 className="font-semibold mb-2">Explanation</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{explanation}</p>
                    </div>
                )}
                {code && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="font-semibold">Generated Code</h3>
                           <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!code}>
                                    {hasCopied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                                    <span className="ml-2">Copy Code</span>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleSimulateTyping} disabled={!code || isTyping}>
                                    <Keyboard className="h-4 w-4" />
                                    <span className="ml-2">Simulate Typing</span>
                                </Button>
                           </div>
                        </div>
                        <pre className="bg-muted rounded-md p-4 text-sm font-code overflow-x-auto">
                            <code>{code}</code>
                        </pre>
                    </div>
                )}
            </CardContent>
            <Dialog open={isTypingSimOpen} onOpenChange={setIsTypingSimOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Human-Like Typing Simulator</DialogTitle>
                        <DialogDescription>
                            The code is being "typed" below. You can copy it when ready.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea readOnly value={typedText} className="min-h-[200px] font-code" />
                    <DialogFooter>
                        <Button onClick={handleCopyFromSim}>Copy and Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

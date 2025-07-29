import StealthCoderDashboard from '@/components/StealthCoderDashboard';
import { Code2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold font-headline">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="text-foreground">StealthCoderAI</span>
        </h1>
        <p className="hidden md:block text-muted-foreground font-body">
          Your undetectable AI assistant for coding exams and technical interviews.
        </p>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <StealthCoderDashboard />
      </main>
      <footer className="border-t text-center p-4 text-xs text-muted-foreground">
        Powered by Google Gemini. This is a study aid, not a cheat code.
      </footer>
    </div>
  );
}

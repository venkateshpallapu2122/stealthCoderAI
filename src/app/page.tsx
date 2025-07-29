
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
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
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input id="role-name" placeholder="e.g., Senior Product Manager" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the job description here..."
                className="min-h-[150px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume-url">Resume URL</Label>
              <Input id="resume-url" placeholder="https://example.com/my-resume.pdf" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume-content">Or Paste Resume Content</Label>
              <Textarea
                id="resume-content"
                placeholder="Paste your resume here..."
                className="min-h-[200px]"
              />
            </div>
            <Link href="/interview" passHref legacyBehavior>
              <Button className="w-full" asChild>
                <a>
                  Start Interview <ArrowRight className="ml-2" />
                </a>
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

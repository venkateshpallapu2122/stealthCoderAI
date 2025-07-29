
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InterviewPage from './interview/page'; // Import the interview page component

export default function OnboardingPage() {
  const [roleName, setRoleName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeContent, setResumeContent] = useState('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
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
    
    // Store data in localStorage to pass to the interview page
    localStorage.setItem('interviewContext', JSON.stringify({
        roleName,
        jobDescription,
        resumeUrl,
        resumeContent
    }));

    setIsInterviewStarted(true);
  };

  if (isInterviewStarted) {
    return <InterviewPage />;
  }

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
    </div>
  );
}

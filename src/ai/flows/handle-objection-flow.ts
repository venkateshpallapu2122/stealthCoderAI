
'use server';
/**
 * @fileOverview A flow to handle objections during an interview and provide suggestions.
 *
 * - handleObjection - A function that provides rebuttals, comparisons, and questions for an objection.
 * - HandleObjectionInput - The input type for the handleObjection function.
 * - HandleObjectionOutput - The return type for the handleObjection function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HandleObjectionInputSchema = z.object({
  objection: z.string().describe('The objection or question raised by the interviewer.'),
  roleName: z.string().describe("The name of the role the user is interviewing for."),
  jobDescription: z.string().describe("The job description for the role."),
  resume: z.string().describe("The user's resume, either as a URL or as text content."),
});
export type HandleObjectionInput = z.infer<typeof HandleObjectionInputSchema>;

const HandleObjectionOutputSchema = z.object({
  rebuttal: z.string().describe('A direct response or rebuttal to the objection.'),
  comparison: z.string().describe('A relevant comparison to a competitor or alternative.'),
  questionToAsk: z.string().describe('A clarifying or insightful question to ask back to the interviewer.'),
});
export type HandleObjectionOutput = z.infer<typeof HandleObjectionOutputSchema>;

export async function handleObjection(input: HandleObjectionInput): Promise<HandleObjectionOutput> {
  return handleObjectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'handleObjectionPrompt',
  input: { schema: HandleObjectionInputSchema },
  output: { schema: HandleObjectionOutputSchema },
  prompt: `You are an expert interview co-pilot. You are listening to an interview and need to provide real-time suggestions.
The user is being interviewed and has just heard the following objection or question:

"{{{objection}}}"

Here is the context for the interview:
- Role Name: {{{roleName}}}
- Job Description: {{{jobDescription}}}
- User's Resume: {{{resume}}}

Based on this, provide:
1.  A strong, concise rebuttal or response, keeping the user's resume and the job description in mind.
2.  A relevant comparison to a competitor product, technology, or approach that highlights the user's strengths.
3.  An insightful question to ask back to the interviewer to show engagement and turn the conversation.
`,
});

const handleObjectionFlow = ai.defineFlow(
  {
    name: 'handleObjectionFlow',
    inputSchema: HandleObjectionInputSchema,
    outputSchema: HandleObjectionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

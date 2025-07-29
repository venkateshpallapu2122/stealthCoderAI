
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
});
export type HandleObjectionOutput = z.infer<typeof HandleObjectionOutputSchema>;


const prompt = ai.definePrompt({
  name: 'handleObjectionPrompt',
  input: { schema: HandleObjectionInputSchema },
  output: { schema: HandleObjectionOutputSchema },
  prompt: `You are an expert interview co-pilot. You are listening to an interview and need to provide a real-time suggestion.
The user is being interviewed and has just heard the following objection or question:

"{{{objection}}}"

Here is the context for the interview:
- Role Name: {{{roleName}}}
- Job Description: {{{jobDescription}}}
- User's Resume: {{{resume}}}

Based on this, provide a strong, concise rebuttal or response, keeping the user's resume and the job description in mind.
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

export async function handleObjection(input: HandleObjectionInput): Promise<HandleObjectionOutput> {
  return handleObjectionFlow(input);
}


const HandleObjectionForProductManagerOutputSchema = z.object({
  rebuttal: z.string().describe('A direct response or rebuttal to the objection.'),
  followUpQuestion: z.string().describe('A strategic follow-up question to probe deeper into the topic.'),
});
export type HandleObjectionForProductManagerOutput = z.infer<typeof HandleObjectionForProductManagerOutputSchema>;


const pmPrompt = ai.definePrompt({
  name: 'handleObjectionForProductManagerPrompt',
  input: { schema: HandleObjectionInputSchema },
  output: { schema: HandleObjectionForProductManagerOutputSchema },
  prompt: `You are an expert interview co-pilot for a Product Manager. You are listening to an interview and need to provide real-time suggestions.
The user is being interviewed for a Product Manager role and has just heard the following objection or question:

"{{{objection}}}"

Here is the context for the interview:
- Role Name: {{{roleName}}}
- Job Description: {{{jobDescription}}}
- User's Resume: {{{resume}}}

Based on this, provide:
1.  A strong, concise rebuttal or response, keeping the user's resume and the job description in mind.
2.  A strategic follow-up question that the user could ask to demonstrate deep product thinking.
`,
});


const handleObjectionForProductManagerFlow = ai.defineFlow(
  {
    name: 'handleObjectionForProductManagerFlow',
    inputSchema: HandleObjectionInputSchema,
    outputSchema: HandleObjectionForProductManagerOutputSchema,
  },
  async (input) => {
    const { output } = await pmPrompt(input);
    return output!;
  }
);


export async function handleObjectionForProductManager(input: HandleObjectionInput): Promise<HandleObjectionForProductManagerOutput> {
    return handleObjectionForProductManagerFlow(input);
}

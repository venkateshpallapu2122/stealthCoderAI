// src/ai/flows/handle-objection-flow.ts
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

export const HandleObjectionInputSchema = z.object({
  objection: z.string().describe('The objection or question raised by the interviewer.'),
});
export type HandleObjectionInput = z.infer<typeof HandleObjectionInputSchema>;

export const HandleObjectionOutputSchema = z.object({
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

Based on this, provide:
1.  A strong, concise rebuttal or response.
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

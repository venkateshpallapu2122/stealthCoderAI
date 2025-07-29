// src/ai/flows/generate-explanation-for-code.ts
'use server';
/**
 * @fileOverview Explains a block of code.
 *
 * - generateExplanationForCode - A function that explains a block of code.
 * - GenerateExplanationForCodeInput - The input type for the generateExplanationForCode function.
 * - GenerateExplanationForCodeOutput - The return type for the generateExplanationForCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExplanationForCodeInputSchema = z.object({
  code: z.string().describe('The code to explain.'),
});
export type GenerateExplanationForCodeInput = z.infer<typeof GenerateExplanationForCodeInputSchema>;

const GenerateExplanationForCodeOutputSchema = z.object({
  explanation: z.string().describe('The explanation of the code.'),
});
export type GenerateExplanationForCodeOutput = z.infer<typeof GenerateExplanationForCodeOutputSchema>;

export async function generateExplanationForCode(input: GenerateExplanationForCodeInput): Promise<GenerateExplanationForCodeOutput> {
  return generateExplanationForCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExplanationForCodePrompt',
  input: {schema: GenerateExplanationForCodeInputSchema},
  output: {schema: GenerateExplanationForCodeOutputSchema},
  prompt: `You are an expert code explainer. Explain the following code:

  {{code}}`,
});

const generateExplanationForCodeFlow = ai.defineFlow(
  {
    name: 'generateExplanationForCodeFlow',
    inputSchema: GenerateExplanationForCodeInputSchema,
    outputSchema: GenerateExplanationForCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

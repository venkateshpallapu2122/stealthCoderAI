'use server';
/**
 * @fileOverview A flow to generate custom code from a prompt, potentially incorporating a screenshot.
 *
 * - generateCustomCode - A function that handles the generation of code.
 * - GenerateCustomCodeInput - The input type for the generateCustomCode function.
 * - GenerateCustomCodeOutput - The return type for the generateCustomCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCustomCodeInputSchema = z.object({
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "A photo of a coding problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  customPrompt: z.string().describe('Custom instructions or prompts for the AI.'),
});
export type GenerateCustomCodeInput = z.infer<typeof GenerateCustomCodeInputSchema>;

const GenerateCustomCodeOutputSchema = z.object({
  generatedCode: z.string().describe('The generated code based on the prompt and screenshot.'),
});
export type GenerateCustomCodeOutput = z.infer<typeof GenerateCustomCodeOutputSchema>;

export async function generateCustomCode(input: GenerateCustomCodeInput): Promise<GenerateCustomCodeOutput> {
  return generateCustomCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCustomCodePrompt',
  input: {schema: GenerateCustomCodeInputSchema},
  output: {schema: GenerateCustomCodeOutputSchema},
  prompt: `You are an expert coding assistant. Generate code based on the user's request, incorporating a screenshot if provided, and following any custom instructions.

Custom Instructions: {{{customPrompt}}}

{{#if photoDataUri}}
Screenshot: {{media url=photoDataUri}}
{{/if}}
`,
});

const generateCustomCodeFlow = ai.defineFlow(
  {
    name: 'generateCustomCodeFlow',
    inputSchema: GenerateCustomCodeInputSchema,
    outputSchema: GenerateCustomCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

// Implemented the generateCodeFromScreenshot flow with input and output schemas and a prompt to generate code solutions from screenshots.

'use server';

/**
 * @fileOverview Generates code solutions from a screenshot of a coding problem.
 *
 * - generateCodeFromScreenshot - A function that handles the code generation process from a screenshot.
 * - GenerateCodeFromScreenshotInput - The input type for the generateCodeFromScreenshot function.
 * - GenerateCodeFromScreenshotOutput - The return type for the generateCodeFromScreenshot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeFromScreenshotInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A screenshot of a coding problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  customPrompt: z.string().optional().describe('Custom instructions or context for the AI to generate code.'),
});
export type GenerateCodeFromScreenshotInput = z.infer<typeof GenerateCodeFromScreenshotInputSchema>;

const GenerateCodeFromScreenshotOutputSchema = z.object({
  code: z.string().describe('The generated code solution for the problem in the screenshot.'),
});
export type GenerateCodeFromScreenshotOutput = z.infer<typeof GenerateCodeFromScreenshotOutputSchema>;

export async function generateCodeFromScreenshot(input: GenerateCodeFromScreenshotInput): Promise<GenerateCodeFromScreenshotOutput> {
  return generateCodeFromScreenshotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodeFromScreenshotPrompt',
  input: {schema: GenerateCodeFromScreenshotInputSchema},
  output: {schema: GenerateCodeFromScreenshotOutputSchema},
  prompt: `You are an expert software engineer that specializes in generating code for coding problems.

You will be given a screenshot of a coding problem, and you will generate a code solution for the problem.  The code should be compilable and executable.

Use the following as the primary source of information about the coding problem.

Screenshot: {{media url=photoDataUri}}

{{#if customPrompt}}
Custom Instructions: {{{customPrompt}}}
{{/if}}`,
});

const generateCodeFromScreenshotFlow = ai.defineFlow(
  {
    name: 'generateCodeFromScreenshotFlow',
    inputSchema: GenerateCodeFromScreenshotInputSchema,
    outputSchema: GenerateCodeFromScreenshotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

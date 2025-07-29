
'use server';

/**
 * @fileOverview Generates a code solution and explanation from a screenshot of a coding problem.
 *
 * - generateCodeAndExplanationFromScreenshot - A function that handles the code and explanation generation.
 * - GenerateCodeAndExplanationFromScreenshotInput - The input type for the function.
 * - GenerateCodeAndExplanationFromScreenshotOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeAndExplanationFromScreenshotInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A screenshot of a coding problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  customPrompt: z.string().optional().describe('Custom instructions or context for the AI.'),
});
export type GenerateCodeAndExplanationFromScreenshotInput = z.infer<typeof GenerateCodeAndExplanationFromScreenshotInputSchema>;

const GenerateCodeAndExplanationFromScreenshotOutputSchema = z.object({
  code: z.string().describe('The generated code solution for the problem in the screenshot.'),
  explanation: z.string().describe('A detailed explanation of the generated code.'),
});
export type GenerateCodeAndExplanationFromScreenshotOutput = z.infer<typeof GenerateCodeAndExplanationFromScreenshotOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateCodeAndExplanationFromScreenshotPrompt',
  input: {schema: GenerateCodeAndExplanationFromScreenshotInputSchema},
  output: {schema: GenerateCodeAndExplanationFromScreenshotOutputSchema},
  prompt: `You are an expert software engineer who excels at solving coding problems and explaining the solutions clearly.
You will be given a screenshot of a coding problem. Your task is to:
1.  Analyze the problem in the screenshot.
2.  Write a correct and efficient code solution for the problem.
3.  Provide a step-by-step explanation of your code.

Use the following as the primary source of information about the coding problem.

Screenshot: {{media url=photoDataUri}}

{{#if customPrompt}}
Custom Instructions: {{{customPrompt}}}
{{/if}}`,
});

const generateCodeAndExplanationFromScreenshotFlow = ai.defineFlow(
  {
    name: 'generateCodeAndExplanationFromScreenshotFlow',
    inputSchema: GenerateCodeAndExplanationFromScreenshotInputSchema,
    outputSchema: GenerateCodeAndExplanationFromScreenshotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateCodeAndExplanationFromScreenshot(input: GenerateCodeAndExplanationFromScreenshotInput): Promise<GenerateCodeAndExplanationFromScreenshotOutput> {
  return generateCodeAndExplanationFromScreenshotFlow(input);
}

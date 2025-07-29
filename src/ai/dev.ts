import { config } from 'dotenv';
config();

import '@/ai/flows/generate-explanation-for-code.ts';
import '@/ai/flows/generate-custom-code-from-prompt.ts';
import '@/ai/flows/generate-code-from-screenshot.ts';
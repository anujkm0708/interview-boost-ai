import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';
const isGroq = apiKey.startsWith('gsk_');

export const openai = new OpenAI({
  apiKey: apiKey || 'placeholder-key-for-build',
  baseURL: isGroq ? 'https://api.groq.com/openai/v1' : undefined,
});

export const AI_MODEL = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

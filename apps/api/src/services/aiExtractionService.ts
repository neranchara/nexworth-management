import { NexworthAIEngine } from '@nexworth/ai-engine';
import { config } from '../config/index.js';

const aiEngine = new NexworthAIEngine(config.geminiApiKey || '');

export const extractFromText = async (text: string) => {
  return aiEngine.extractFromText(text);
};

export const extractFromImage = async (imageBuffer: Buffer, mimeType: string) => {
  return aiEngine.extractFromImage(imageBuffer, mimeType);
};

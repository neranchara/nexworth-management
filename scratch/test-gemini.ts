import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

async function test() {
  console.log('Listing available models for Key:', apiKey?.substring(0, 5) + '...');
  try {
    // Note: The SDK might not have a direct listModels, we might need to fetch it manually or check docs.
    // Actually, let's try a very basic model name: 'gemini-pro' (again, but with v1 version)
    // Wait, let's try to fetch models using fetch if possible, or just try 'gemini-1.5-flash' again without prefix.
    
    // Most reliable way to test if ANY model works:
    const modelsToTry = [
      'gemini-2.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash', 
      'gemini-2.5-pro',
      'gemini-1.5-flash'
    ];
    for (const m of modelsToTry) {
      try {
        console.log(`Trying model: ${m}...`);
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent('Hi');
        console.log(`✅ Success with ${m}!`);
        return;
      } catch (e: any) {
        console.log(`❌ Failed with ${m}: ${e.message}`);
      }
    }
  } catch (error: any) {
    console.error('❌ General Error:', error.message || error);
  }
}

test();

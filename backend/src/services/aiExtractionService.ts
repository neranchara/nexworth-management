import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

const apiKey = config.geminiApiKey;
const genAI = new GoogleGenerativeAI(apiKey || '');

export interface ExtractedTransaction {
  amount: number;
  categoryName?: string;
  bankName?: string;
  description?: string;
  date?: string;
  isExpense?: boolean;
}

export const extractFromText = async (text: string): Promise<ExtractedTransaction | null> => {
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return null;
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are a financial assistant for a Thai user. 
      Analyze the following short message and extract the transaction details in JSON format.
      Message: "${text}"
      
      Required JSON format:
      {
        "amount": number,
        "categoryName": string (best guess of category, e.g., "อาหาร", "เดินทาง", "ช้อปปิ้ง", "รายได้", etc.),
        "description": string (the specific item bought or income source),
        "isExpense": boolean (true if it's spending, false if it's income)
      }
      
      Return ONLY valid JSON. No markdown formatting or extra text.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonText = response.text();
    
    // Clean up potential markdown formatting
    if (jsonText.startsWith('\`\`\`json')) {
      jsonText = jsonText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (jsonText.startsWith('\`\`\`')) {
      jsonText = jsonText.replace(/\`\`\`/g, '').trim();
    }

    const data = JSON.parse(jsonText);
    return data as ExtractedTransaction;
  } catch (error) {
    console.error('Gemini API Error (Text):', error);
    return null;
  }
};

export const extractFromImage = async (imageBuffer: Buffer, mimeType: string): Promise<ExtractedTransaction | null> => {
   if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return null;
  }
  
  try {
    // gemini-1.5-flash or gemini-2.5-flash supports multimodal
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are a financial assistant. Look at this bank transfer slip from Thailand.
      Extract the transaction details into JSON format.
      
      Required JSON format:
      {
        "amount": number (the transfer amount),
        "bankName": string (the bank of the sender or receiver, depending on context),
        "date": string (ISO format YYYY-MM-DDTHH:mm:ss if possible, or leave null),
        "description": string (name of the receiver or note on the slip),
        "isExpense": boolean (typically true for outbound transfer slips)
      }
      
      Return ONLY valid JSON. No markdown formatting or extra text.
    `;

    const imageParts = [
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response;
    let jsonText = response.text();

    if (jsonText.startsWith('\`\`\`json')) {
      jsonText = jsonText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (jsonText.startsWith('\`\`\`')) {
      jsonText = jsonText.replace(/\`\`\`/g, '').trim();
    }

    const data = JSON.parse(jsonText);
    return data as ExtractedTransaction;
  } catch (error) {
    console.error('Gemini API Error (Image):', error);
    return null;
  }
};

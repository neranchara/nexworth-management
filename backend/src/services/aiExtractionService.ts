import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

const apiKey = config.geminiApiKey;
const genAI = new GoogleGenerativeAI(apiKey || '');

export interface ExtractedTransaction {
  amount: number;
  categoryName?: string;
  accountName?: string;
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const prompt = `
      You are a financial assistant for a Thai user. 
      Analyze the following short message and extract the transaction details in JSON format.
      Message: "${text}"
      
      Required JSON format:
      {
        "amount": number,
        "categoryName": string (best guess of category, e.g., "อาหาร", "เดินทาง", "ช้อปปิ้ง", "รายได้", etc.),
        "accountName": string (if specified, e.g., "กระเป๋า", "KBank", "ไทยพาณิชย์"),
        "description": string (the specific item bought or income source),
        "isExpense": boolean (true if it's spending, false if it's income)
      }
      
      Return ONLY valid JSON. No markdown formatting or extra text.
    `;

    console.log('Gemini Prompt:', prompt);
    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonText = response.text();
    console.log('Gemini Raw Response:', jsonText);
    
    // Clean up potential markdown formatting
    if (jsonText.startsWith('\`\`\`json')) {
      jsonText = jsonText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (jsonText.startsWith('\`\`\`')) {
      jsonText = jsonText.replace(/\`\`\`/g, '').trim();
    }

    try {
      const data = JSON.parse(jsonText);
      console.log('Extracted Data:', data);
      return data as ExtractedTransaction;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Raw Text:', jsonText);
      return null;
    }
  } catch (error: any) {
    console.error('Gemini API Error (Text):', error.message || error);
    return null;
  }
};

export const extractFromImage = async (imageBuffer: Buffer, mimeType: string): Promise<ExtractedTransaction | null> => {
   if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return null;
  }
  
  try {
    // Use gemini-2.5-flash-lite which is confirmed to work with this API key
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const prompt = `
      You are a financial assistant. Look at this bank transfer slip from Thailand.
      Extract the transaction details into JSON format.
      
      Required JSON format:
      {
        "amount": number (the transfer amount),
        "bankName": string (the bank of the sender or receiver, depending on context),
        "accountName": string (if you can guess which of the user's accounts this is for),
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

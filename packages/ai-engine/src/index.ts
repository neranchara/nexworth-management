import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedTransaction {
  amount: number;
  categoryName?: string;
  accountName?: string;
  bankName?: string;
  description?: string;
  date?: string;
  isExpense?: boolean;
}

export class NexworthAIEngine {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractFromText(text: string): Promise<ExtractedTransaction | null> {
    if (!this.apiKey) {
      console.error('AI Engine: API Key is missing');
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
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

      const result = await model.generateContent(prompt);
      const response = result.response;
      let jsonText = response.text();
      
      jsonText = this.cleanJsonText(jsonText);

      try {
        const data = JSON.parse(jsonText);
        return data as ExtractedTransaction;
      } catch (parseError) {
        console.error('AI Engine: JSON Parse Error:', parseError, 'Raw Text:', jsonText);
        return null;
      }
    } catch (error: any) {
      console.error('AI Engine: Gemini API Error (Text):', error.message || error);
      return null;
    }
  }

  async extractFromImage(imageBuffer: Buffer, mimeType: string): Promise<ExtractedTransaction | null> {
    if (!this.apiKey) {
      console.error('AI Engine: API Key is missing');
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
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

      jsonText = this.cleanJsonText(jsonText);

      const data = JSON.parse(jsonText);
      return data as ExtractedTransaction;
    } catch (error) {
      console.error('AI Engine: Gemini API Error (Image):', error);
      return null;
    }
  }

  private cleanJsonText(text: string): string {
    if (text.startsWith('```json')) {
      return text.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (text.startsWith('```')) {
      return text.replace(/```/g, '').trim();
    }
    return text.trim();
  }
}

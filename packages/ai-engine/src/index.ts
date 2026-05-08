import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedTransaction {
  amount: number;
  categoryName?: string;
  accountName?: string;
  bankName?: string;
  description?: string;
  date?: string;
  isExpense?: boolean;
  taxAmount?: number;
  taxType?: 'VAT' | 'WHT' | 'NONE';
  transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'LOAN' | 'DEBT_REPAY';
}

export class NexworthAIEngine {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractFromText(text: string): Promise<ExtractedTransaction | null> {
    if (!this.apiKey) return null;

    const configurations = [
      { model: 'gemini-1.5-flash-latest', apiVersion: 'v1' },
      { model: 'gemini-3-flash', apiVersion: 'v1' },
      { model: 'gemini-3.1-flash-lite', apiVersion: 'v1' }
    ];

    for (const config of configurations) {
      try {
        const model = this.genAI.getGenerativeModel({ 
          model: config.model 
        }, { apiVersion: config.apiVersion as any });

        const prompt = `
          Extract financial data from this Thai message into strict JSON: "${text}"
          Rules:
          - Words starting with "ค่า" are expenses (isExpense: true).
          - Words like "เงินเดือน", "ได้", "ได้รับ", "รับ", "เก็บ", "โอนเข้า" are income (isExpense: false).
          Format: { "amount": number, "description": string, "categoryName": string, "isExpense": boolean, "transactionType": string }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const resultText = response.text();
        
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (error: any) {
        console.warn(`AI Engine Text: ${config.model} failed:`, error.message || error);
        continue;
      }
    }
    return null;
  }

  async extractFromImage(imageBuffer: Buffer, mimeType: string): Promise<ExtractedTransaction | null> {
    if (!this.apiKey) return null;

    // For images, we try v1beta for newest multimodal features or stable v1
    const configurations = [
      { model: 'gemini-1.5-flash', apiVersion: 'v1' },
      { model: 'gemini-2.0-flash', apiVersion: 'v1beta' },
      { model: 'gemini-3-flash', apiVersion: 'v1' }
    ];

    for (const config of configurations) {
      try {
        const model = this.genAI.getGenerativeModel({ 
          model: config.model 
        }, { apiVersion: config.apiVersion as any });

        const prompt = `
          Analyze this Thai bank transfer slip. Extract data to strict JSON.
          Rules:
          - amount: total amount (number)
          - description: receiver/sender name
          - isExpense: true (most slips are outbound)
          - transactionType: 'EXPENSE'
          Return ONLY JSON object.
        `;

        const imagePart = {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType,
          },
        };

        // Correct structure for multimodal input
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch (error: any) {
        console.error(`AI Engine Image: ${config.model} (${config.apiVersion}) failed:`, error.message || error);
      }
    }
    return null;
  }

  async diagnoseUserHealth(metrics: any[], findings: any[]): Promise<{ diagnosis: string; recommendations: string[] } | null> {
    if (!this.apiKey) return null;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

      const prompt = `
        You are an Institutional Grade Security Analyst for Nexworth, a financial management platform.
        Analyze the following user diagnostic data and provide:
        1. A high-level professional diagnosis of the account health (max 3 sentences).
        2. Three specific, actionable recommendations for the Operations team to fix issues.

        Data:
        Metrics: ${JSON.stringify(metrics)}
        Findings: ${JSON.stringify(findings)}

        Return JSON format: { 
          "diagnosis": "string", 
          "recommendations": ["string", "string", "string"],
          "suggestedFixes": [
            { "type": "reconcile_account | sanitize_dates | sync_line", "description": "string", "payload": {} }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error('AI Diagnosis failed:', error.message || error);
    }
    return null;
  }
}

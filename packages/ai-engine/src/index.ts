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

export interface AITelemetry {
  model: string;
  latencyMs: number;
  success: boolean;
}

export interface AIResult<T> {
  data: T | null;
  telemetry: AITelemetry;
}

export class NexworthAIEngine {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractFromText(text: string): Promise<AIResult<ExtractedTransaction>> {
    if (!this.apiKey) {
      return { 
        data: null, 
        telemetry: { model: 'none', latencyMs: 0, success: false } 
      };
    }

    const configurations = [
      { model: 'gemini-2.0-flash', apiVersion: 'v1' },
      { model: 'gemini-2.0-flash-lite', apiVersion: 'v1' },
      { model: 'gemini-1.5-flash', apiVersion: 'v1' },
    ];

    const startTime = Date.now();
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
        if (jsonMatch) {
          return {
            data: JSON.parse(jsonMatch[0]),
            telemetry: { 
              model: config.model, 
              latencyMs: Date.now() - startTime, 
              success: true 
            }
          };
        }
      } catch (error: any) {
        console.warn(`AI Engine Text: ${config.model} failed:`, error.message || error);
        continue;
      }
    }
    return { 
      data: null, 
      telemetry: { model: 'failed-all', latencyMs: Date.now() - startTime, success: false } 
    };
  }

  async extractFromImage(imageBuffer: Buffer, mimeType: string): Promise<AIResult<ExtractedTransaction>> {
    if (!this.apiKey) {
      console.warn('[AI Engine] API Key missing, skipping extraction.');
      return { 
        data: null, 
        telemetry: { model: 'none', latencyMs: 0, success: false } 
      };
    }

    const configurations = [
      { model: 'gemini-2.0-flash', apiVersion: 'v1' },
      { model: 'gemini-2.0-flash-lite', apiVersion: 'v1' },
      { model: 'gemini-1.5-flash', apiVersion: 'v1' },
    ];

    const startTime = Date.now();
    let lastError: any = null;

    for (const config of configurations) {
      try {
        console.log(`[AI Engine] Attempting image extraction with ${config.model} (${config.apiVersion})...`);
        const model = this.genAI.getGenerativeModel({ 
          model: config.model 
        }, { apiVersion: config.apiVersion as any });

        const prompt = `
          Analyze this Thai bank transfer slip image carefully.
          Extract the following data into strict JSON:
          - amount: The total transaction amount (number, required)
          - description: The receiver name or sender name (string)
          - categoryName: Best guess for the category (e.g., Food, Travel, Shopping)
          - type: 'EXPENSE' (default) or 'INCOME' (if receiving money)
          
          Return ONLY a valid JSON object. Do not include markdown formatting or extra text.
          Example: {"amount": 120.50, "description": "Somchai", "category": "Food", "type": "EXPENSE"}
        `;

        const imagePart = {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType,
          },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        console.log(`[AI Engine] ${config.model} raw response:`, text);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          console.log(`[AI Engine] Successfully extracted data using ${config.model}`);
          return {
            data,
            telemetry: { 
              model: config.model, 
              latencyMs: Date.now() - startTime, 
              success: true 
            }
          };
        }
      } catch (error: any) {
        lastError = error;
        console.error(`[AI Engine] Image extraction failed for ${config.model}:`, error.message || error);
        // Continue to next model
      }
    }

    console.error('[AI Engine] All image extraction configurations failed.');
    return { 
      data: null, 
      telemetry: { 
        model: 'failed-all', 
        latencyMs: Date.now() - startTime, 
        success: false 
      } 
    };
  }

  async diagnoseUserHealth(metrics: any[], findings: any[]): Promise<AIResult<{ diagnosis: string; recommendations: string[] }>> {
    const startTime = Date.now();
    if (!this.apiKey) {
      return { 
        data: null, 
        telemetry: { model: 'none', latencyMs: 0, success: false } 
      };
    }

    try {
      const modelName = 'gemini-2.0-flash';
      const model = this.genAI.getGenerativeModel({ model: modelName });

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
      if (jsonMatch) {
        return {
          data: JSON.parse(jsonMatch[0]),
          telemetry: { 
            model: modelName, 
            latencyMs: Date.now() - startTime, 
            success: true 
          }
        };
      }
    } catch (error: any) {
      console.error('AI Diagnosis failed:', error.message || error);
    }
    return { 
      data: null, 
      telemetry: { model: 'gemini-2.0-flash', latencyMs: Date.now() - startTime, success: false } 
    };
  }
}

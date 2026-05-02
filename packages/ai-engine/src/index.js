import { GoogleGenerativeAI } from '@google/generative-ai';
export class NexworthAIEngine {
    genAI;
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);
    }
    async extractFromText(text) {
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
          "categoryName": string (best guess of category, e.g., "Food", "Travel", "Salary"),
          "accountName": string (if specified, e.g., "KBank", "Cash"),
          "description": string (the specific item or source),
          "isExpense": boolean,
          "taxAmount": number (extracted VAT or WHT if mentioned, otherwise 0),
          "taxType": "VAT" | "WHT" | "NONE",
          "transactionType": "INCOME" | "EXPENSE" | "TRANSFER" | "LOAN" | "DEBT_REPAY"
        }
        
        Logic for transactionType:
        - TRANSFER: If moving money between user accounts.
        - LOAN: If lending money or borrowing.
        - DEBT_REPAY: If paying back a loan or credit card.
        - INCOME/EXPENSE: Standard daily flow.
        
        Return ONLY valid JSON. No markdown formatting or extra text.
      `;
            const result = await model.generateContent(prompt);
            const response = result.response;
            let jsonText = response.text();
            jsonText = this.cleanJsonText(jsonText);
            try {
                const data = JSON.parse(jsonText);
                return data;
            }
            catch (parseError) {
                console.error('AI Engine: JSON Parse Error:', parseError, 'Raw Text:', jsonText);
                return null;
            }
        }
        catch (error) {
            console.error('AI Engine: Gemini API Error (Text):', error.message || error);
            return null;
        }
    }
    async extractFromImage(imageBuffer, mimeType) {
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
          "bankName": string (the bank of the sender or receiver),
          "accountName": string (if you can guess which of the user's accounts this is for),
          "date": string (ISO format YYYY-MM-DDTHH:mm:ss if possible, or leave null),
          "description": string (name of the receiver or note on the slip),
          "isExpense": boolean (typically true for outbound transfer slips),
          "taxAmount": number (if any tax is mentioned on the slip, e.g. service fee with tax),
          "taxType": "VAT" | "WHT" | "NONE",
          "transactionType": "INCOME" | "EXPENSE" | "TRANSFER" | "LOAN" | "DEBT_REPAY"
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
            return data;
        }
        catch (error) {
            console.error('AI Engine: Gemini API Error (Image):', error);
            return null;
        }
    }
    cleanJsonText(text) {
        if (text.startsWith('```json')) {
            return text.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        else if (text.startsWith('```')) {
            return text.replace(/```/g, '').trim();
        }
        return text.trim();
    }
}

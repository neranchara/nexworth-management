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
export declare class NexworthAIEngine {
    private genAI;
    private apiKey;
    constructor(apiKey: string);
    extractFromText(text: string): Promise<ExtractedTransaction | null>;
    extractFromImage(imageBuffer: Buffer, mimeType: string): Promise<ExtractedTransaction | null>;
    private cleanJsonText;
}

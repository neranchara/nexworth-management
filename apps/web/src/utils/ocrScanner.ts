import { createWorker } from 'tesseract.js';

/**
 * Local OCR Scanner Utility (ISP Policy: Real Data Extraction)
 * Extracts real text and amounts from bank slips without API keys.
 */
export async function scanAmountFromImage(file: File): Promise<{ amount: string | null, text: string }> {
  console.log('[OCRScanner] Starting local OCR processing...');
  
  const worker = await createWorker('tha+eng');
  
  try {
    const reader = new FileReader();
    const imageData = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

    const { data: { text } } = await worker.recognize(imageData);
    console.log('[OCRScanner] Raw Text Extracted:', text);

    // Logic: Search for amount patterns
    // 1. Look for numbers following "จำนวนเงิน", "Amount", "ยอดเงิน", "Total"
    // 2. Fallback to the largest number found that looks like an amount
    
    const amountRegex = /([\d,]+\.\d{2})|(\d{1,3}(,\d{3})+)|(\d+\.\d{2})/g;
    const matches = text.match(amountRegex);
    
    let detectedAmount = null;
    
    if (matches && matches.length > 0) {
      // Find the largest amount (usually the transaction amount)
      const cleanAmounts = matches.map(m => parseFloat(m.replace(/,/g, '')));
      detectedAmount = Math.max(...cleanAmounts).toString();
      console.log('[OCRScanner] Detected Real Amount:', detectedAmount);
    }

    await worker.terminate();
    return { amount: detectedAmount, text };
  } catch (error) {
    console.error('[OCRScanner] OCR Processing Failed:', error);
    await worker.terminate();
    return { amount: null, text: '' };
  }
}

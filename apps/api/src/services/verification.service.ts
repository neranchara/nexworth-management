/**
 * Bank Slip Verification Service (Mock Implementation)
 * Story: SAM1-SA-BestPractice
 */
export class VerificationService {
  /**
   * Verify QR Payload against Bank/Provider API
   * For Dev/QA: Returns deterministic mock data based on payload
   */
  async verifySlipPayload(payload: string) {
    console.log(`[VerificationService] Verifying payload: ${payload}`);

    // ISP Policy: Mocking Layer for stable Automation Testing
    // In production, this would call SlipOk, EasySlip, or Bank Open API
    
    // Simulate API Delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // ISP Policy: Support realistic mock data from user examples
    let mockAmount = 1250.00;
    let receiver = "NEXWORTH CO., LTD.";

    if (payload.includes('0461')) { mockAmount = 8500.00; receiver = "เนรัญชรา (KBank)"; }
    else if (payload.includes('6121')) { mockAmount = 10000.00; receiver = "เนรัญชรา (SCB/MyMo)"; }
    else if (payload.includes('2026')) { mockAmount = 5000.00; receiver = "BLS (BBL)"; }
    else if (payload.includes('4000') || payload.length > 50) { mockAmount = 4000.00; receiver = "เนรัญชรา (MAKE)"; }

    return {
      success: true,
      data: {
        amount: mockAmount,
        senderName: "สมชาย ใจดี (Mock)",
        receiverName: "NEXWORTH CO., LTD.",
        transTime: new Date().toISOString(),
        transRef: "TR" + Math.random().toString(36).substring(7).toUpperCase(),
        bankName: "KBank",
        category: "อาหารและเครื่องดื่ม"
      }
    };
  }
}

export const verificationService = new VerificationService();

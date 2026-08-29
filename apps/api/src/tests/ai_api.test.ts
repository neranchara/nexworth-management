import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanSlipHandler } from '../controllers/ai.controller.js';
import * as aiExtractionService from '../services/aiExtractionService.js';

vi.mock('../services/aiExtractionService.js', () => ({
  extractFromImage: vi.fn(),
}));

describe('AI API Controller', () => {
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe('scanSlipHandler', () => {
    it('should return 400 if no file is uploaded', async () => {
      mockRequest = {
        parts: async function* () {
          // Yield nothing to simulate no file
        },
      };

      await scanSlipHandler(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
        error: 'No slip image content detected.'
      }));
    });

    it('should extract data and return success with telemetry', async () => {
      const mockFile = {
        type: 'file',
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-image')),
        mimetype: 'image/png',
        filename: 'slip.png'
      };
      mockRequest = {
        parts: async function* () {
          yield mockFile;
        },
        headers: {}
      };

      const mockData = { amount: 100, date: '2026-05-14' };
      const mockTelemetry = { model: 'gemini-1.5-flash', latencyMs: 120, success: true };
      
      (aiExtractionService.extractFromImage as any).mockResolvedValue({
        data: mockData,
        telemetry: mockTelemetry
      });

      await scanSlipHandler(mockRequest, mockReply);

      expect(aiExtractionService.extractFromImage).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        telemetry: mockTelemetry
      });
    });
  });
});

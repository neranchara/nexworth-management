import jsQR from 'jsqr';

/**
 * QR Scanner Utility (ISP Policy: Hybrid Approach)
 * Extract Payload from Bank Slip Mini-QR
 */
export async function scanQRFromImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return resolve(null);

        canvas.width = img.width;
        canvas.height = img.height;
        context.imageSmoothingEnabled = false; // Keep QR edges sharp
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        console.log(`[QRScanner] Scanning image: ${canvas.width}x${canvas.height}`);
        
        // ISP Policy: Multi-attempt for maximum reliability
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code) {
          console.log('[QRScanner] Found QR Payload:', code.data);
          resolve(code.data);
        } else {
          console.warn('[QRScanner] No QR code detected in the image.');
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

import crypto from 'crypto';

interface CachedKey {
  privateKey: string;
  expiresAt: number;
}

class SecurityService {
  private keyCache = new Map<string, CachedKey>();
  private readonly TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // Cleanup expired keys every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  generateKeyPair(): { publicKey: string; keyId: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    const keyId = crypto.randomUUID();
    this.keyCache.set(keyId, {
      privateKey,
      expiresAt: Date.now() + this.TTL,
    });

    return { publicKey, keyId };
  }

  decrypt(keyId: string, encryptedData: string): string | null {
    const cached = this.keyCache.get(keyId);
    if (!cached || cached.expiresAt < Date.now()) {
      this.keyCache.delete(keyId);
      return null;
    }

    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      const decrypted = crypto.privateDecrypt(
        {
          key: cached.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        buffer
      );
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('[SecurityService] Decryption failed:', error);
      return null;
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [keyId, cached] of this.keyCache.entries()) {
      if (cached.expiresAt < now) {
        this.keyCache.delete(keyId);
      }
    }
  }
}

export const securityService = new SecurityService();

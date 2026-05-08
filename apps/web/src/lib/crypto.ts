/**
 * RSA-OAEP Encryption using Web Crypto API
 */

/**
 * Converts a PEM Public Key string to a CryptoKey object
 */
async function importPublicKey(pem: string): Promise<CryptoKey> {
  // Remove PEM headers/footers and whitespace
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  // Decode Base64 string to ArrayBuffer
  const binaryDerString = window.atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

/**
 * Encrypts a plain text string using the provided PEM Public Key
 * Returns a Base64-encoded ciphertext
 */
export async function encryptPassword(plainText: string, publicKeyPem: string): Promise<string> {
  try {
    const publicKey = await importPublicKey(publicKeyPem);
    const encodedData = new TextEncoder().encode(plainText);
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      encodedData
    );

    // Convert ArrayBuffer to Base64 string
    return window.btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  } catch (error) {
    console.error("[CryptoLib] Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

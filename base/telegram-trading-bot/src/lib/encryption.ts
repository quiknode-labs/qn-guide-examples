import CryptoJS from "crypto-js";
import { ENCRYPTION_KEY } from "../utils/constants";

/**
 * Encrypt sensitive data (like private keys)
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("Encryption key not set in environment variables");
  }

  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt encrypted data
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("Encryption key not set in environment variables");
  }

  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Generate a random encryption key
 */
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

/**
 * Verify if the encryption key is valid by testing encryption/decryption
 */
export function verifyEncryptionKey(): boolean {
  try {
    const testData = "test encryption";
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    return decrypted === testData;
  } catch (error) {
    console.error("Encryption key verification failed:", error);
    return false;
  }
}

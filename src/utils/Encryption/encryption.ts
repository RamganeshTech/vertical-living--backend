import crypto from "crypto";

const ENC_KEY = process.env.ENC_KEY || "12345678901234567890123456789012"; // 32 chars
const IV = process.env.IV || "1234567890123456"; // 16 chars

export function encrypt(text: string) {
  const cipher = crypto.createCipheriv("aes-256-cbc", ENC_KEY, IV);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

export function decrypt(encrypted: string) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENC_KEY, IV);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

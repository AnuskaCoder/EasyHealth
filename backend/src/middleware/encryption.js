const crypto = require("crypto");

// AES-256-GCM Encryption Key and Algorithm
const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
  : crypto.scryptSync("easyhealth-phi-encryption-secret-2026", "salt", 32);

/**
 * Encrypt sensitive Patient Health Information (PHI)
 * @param {string|object} data
 * @returns {string} iv:authTag:encryptedText
 */
function encryptPHI(data) {
  const text = typeof data === "object" ? JSON.stringify(data) : String(data);
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt sensitive Patient Health Information (PHI)
 * @param {string} encryptedString
 * @returns {string|object}
 */
function decryptPHI(encryptedString) {
  try {
    const parts = encryptedString.split(":");
    if (parts.length !== 3) return encryptedString;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error("PHI Decryption error:", err.message);
    return "[Encrypted Content - Key Decryption Failed]";
  }
}

module.exports = {
  encryptPHI,
  decryptPHI,
};

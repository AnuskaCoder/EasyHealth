const crypto = require("crypto");

// AES-256-GCM Encryption Key and Algorithm
const ALGORITHM = "aes-256-gcm";
function deriveSecretKey(value) {
  if (!value) throw new Error("ENCRYPTION_KEY is required.");
  const configuredKey = value.trim();
  if (/^[0-9a-f]{64}$/i.test(configuredKey)) return Buffer.from(configuredKey, "hex");

  const base64Key = Buffer.from(configuredKey, "base64");
  if (base64Key.length === 32) return base64Key;

  // Keep older passphrase-style development values usable while deriving an AES-256 key.
  return crypto.scryptSync(configuredKey, "easyhealth-phi-encryption-v1", 32);
}

const SECRET_KEY = deriveSecretKey(process.env.ENCRYPTION_KEY);

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

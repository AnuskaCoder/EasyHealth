/**
 * Secure File Storage Service
 * Encrypted on-disk / blob storage with AES-256-GCM for Medical PDFs and Scans
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { encryptPHI, decryptPHI } = require("../middleware/encryption");

const STORAGE_DIR = path.resolve(__dirname, "../../storage/records");

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const fileStorage = {
  /**
   * Save and encrypt medical document file buffer
   */
  async storeEncryptedFile({ buffer, originalName, mimeType, patientId }) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType) && !originalName.endsWith(".pdf")) {
      throw new Error(`Disallowed file type: ${mimeType}. Only PDF and Medical Scans allowed.`);
    }

    const fileId = `DOC-${patientId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const encryptedData = encryptPHI(buffer.toString("base64"));

    const filePath = path.join(STORAGE_DIR, `${fileId}.enc`);
    fs.writeFileSync(filePath, encryptedData, "utf8");

    return {
      fileId,
      filePath,
      fileSize: buffer.length,
      mimeType,
      originalName,
      isEncrypted: true,
      storageMethod: "AES-256-GCM Encrypted Local Vault",
    };
  },

  /**
   * Decrypt and stream medical document
   */
  async retrieveDecryptedFile(fileId) {
    const filePath = path.join(STORAGE_DIR, `${fileId}.enc`);
    if (!fs.existsSync(filePath)) {
      throw new Error("Encrypted medical document not found");
    }

    const encryptedData = fs.readFileSync(filePath, "utf8");
    const base64Data = decryptPHI(encryptedData);
    return Buffer.from(base64Data, "base64");
  }
};

module.exports = fileStorage;

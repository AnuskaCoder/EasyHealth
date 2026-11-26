/**
 * Centralized Environment Configuration
 * Robust dotenv initialization that searches multiple potential locations:
 * 1. backend/.env
 * 2. .env in project root
 */
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Candidate paths for .env
const envPaths = [
  path.resolve(__dirname, "../../.env"),      // backend/.env
  path.resolve(__dirname, "../../../.env"),   // project root .env
  path.resolve(process.cwd(), ".env"),        // current working directory .env
  path.resolve(process.cwd(), "backend/.env") // backend from root
];

let loadedPath = null;
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedPath = p;
    break;
  }
}

if (!loadedPath) {
  // Try default dotenv fallback
  dotenv.config();
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL || "",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  JWT_SECRET: process.env.JWT_SECRET || "easyhealth-super-secret-jwt-key-2026-production-min32",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "easyhealth-aes-256-encryption-key-32ch",
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://localhost:8000",
  loadedPath,
};

module.exports = env;

import * as dotenv from 'dotenv';
import * as path from 'path';

const nodeEnv = process.env.NODE_ENV || 'local';
const envFile = path.resolve(process.cwd(), `.env.${nodeEnv}`);

dotenv.config({ path: envFile });
console.log(`[Config] Environment: ${nodeEnv} | Loaded: ${envFile}`);

const isLocal = nodeEnv === 'local';
const isStaging = nodeEnv === 'staging';
const isProduction = nodeEnv === 'production';

export const config = {
  // --- Core ---
  nodeEnv,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3002,
  jwtSecret: process.env.JWT_SECRET || 'local_dev_secret_key_123',
  databaseUrl: process.env.DATABASE_URL,

  // --- Flags ---
  isLocal,
  isStaging,
  isProduction,
  isDevelopment: isLocal || isStaging, // true for any non-production environment

  // --- CORS ---
  cors: {
    // Local/Staging: allow all origins for easy testing
    // Production: restrict to specific domains from env var
    origin: (isLocal || isStaging)
      ? true
      : (process.env.CORS_ORIGIN?.split(',') || ['https://nexworth.cc']),
    credentials: true,
  },

  // --- Rate Limiting ---
  rateLimit: {
    // Local/Staging: high limits so tests/dev won't be blocked
    // Production: strict limits
    max: (isLocal || isStaging) ? 10000 : 100,
    timeWindow: '1 minute',
    allowList: (isLocal || isStaging) ? ['127.0.0.1', 'localhost'] : [],
  },

  // --- Auth Rate Limiting ---
  authRateLimit: {
    max: (isLocal || isStaging) ? 100 : 5,
    timeWindow: '1 minute',
  },

  // --- LINE Bot ---
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  },

  // --- AI ---
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

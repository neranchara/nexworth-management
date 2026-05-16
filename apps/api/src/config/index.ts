import * as dotenv from 'dotenv';

// ============================================================
// Environment Resolution Order:
//   NODE_ENV=local       -> .env.local     (Dev & QA work)
//   NODE_ENV=staging     -> .env.staging   (E2E Regression)
//   NODE_ENV=production  -> .env.production (Live / Render)
//   (no NODE_ENV)        -> .env           (fallback)
// ============================================================
const nodeEnv = process.env.NODE_ENV || 'local';
const envFile = `.env.${nodeEnv}`;
// Only load dotenv if not on Render (Render uses Dashboard env vars)
if (!process.env.RENDER) {
  dotenv.config({ path: envFile });
  dotenv.config({ path: `../../${envFile}` });
}
console.log(`[Config] Environment: ${nodeEnv} | RENDER: ${!!process.env.RENDER}`);

const isLocal = nodeEnv === 'local' && !process.env.RENDER;
const isStaging = nodeEnv === 'staging';
const isProduction = nodeEnv === 'production' || !!process.env.RENDER;

export const config = {
  // --- Core ---
  nodeEnv,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
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
      : [
          'https://nexworth.online',
          'https://www.nexworth.online',
          'https://nexworth-management.onrender.com',
          'https://nexworth-api-service.onrender.com'
        ],
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
    adminGroupId: process.env.LINE_ADMIN_GROUP_ID || '', // Group ID for Ops/Dev alerts
  },

  // --- AI ---
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // --- Email (SMTP) ---
  email: {
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Nexworth Security <noreply@nexworth.online>',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};

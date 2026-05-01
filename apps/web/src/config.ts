export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api/v1',
  isProduction: process.env.NODE_ENV === 'production',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
};

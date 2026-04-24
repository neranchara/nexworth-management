import * as dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

console.log('--- ENVIRONMENT CHECK ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Loaded from:', envFile);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

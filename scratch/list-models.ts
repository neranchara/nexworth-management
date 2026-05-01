import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env.local') });
const key = process.env.GEMINI_API_KEY;

async function check() {
  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    console.log("Models:", res.data.models.map((m: any) => m.name).join(', '));
  } catch (e: any) {
    console.log("Error:", e.response?.data || e.message);
  }
}
check();

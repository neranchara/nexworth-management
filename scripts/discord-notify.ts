import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const dotenv = require('../backend/node_modules/dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env.local') });

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscordMessage(title: string, description: string, color: number = 3447003) {
  if (!WEBHOOK_URL) {
    console.error('❌ Error: DISCORD_WEBHOOK_URL not found in .env.local');
    return;
  }

  // Use simple content as fallback and rich embed for beauty
  const payload = {
    content: `**🚀 ${title}**\n${description}`,
    embeds: [
      {
        title: title,
        description: description,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Nexworth Antigravity Agent',
        },
      },
    ],
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('✅ Discord notification sent successfully!');
    } else {
      console.error('❌ Failed to send Discord notification:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error sending Discord notification:', error);
  }
}

const args = process.argv.slice(2);
const title = args[0] || 'System Update';
const description = args[1] || 'No description provided.';
const colorCode = args[2] ? parseInt(args[2]) : 3447003;

sendDiscordMessage(title, description, colorCode);

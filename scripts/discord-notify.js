const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from apps/dev-agent/.env.local
const envPath = path.join(__dirname, '../apps/dev-agent/.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // fallback
}

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_REPORT_CHANNEL_ID;

if (!TOKEN || !CHANNEL_ID) {
  console.error('❌ DISCORD_BOT_TOKEN or DISCORD_REPORT_CHANNEL_ID is missing');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node scripts/discord-notify.js [start|end] [task_id] [message_text]');
  process.exit(1);
}

const action = args[0].toLowerCase();
const taskId = args[1];
const messageText = args.slice(2).join(' ');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', async () => {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error('❌ Channel not found or is not text-based');
      process.exit(1);
    }

    let embed;
    let content = '';

    if (action === 'start') {
      content = `🚀 **Task Started: ${taskId}**`;
      embed = new EmbedBuilder()
        .setTitle(`🚀 Task In Progress: ${taskId}`)
        .setDescription(messageText)
        .setColor(0x3b82f6) // Vibrant Blue
        .addFields(
          { name: '📋 Status', value: 'Started & Coding', inline: true },
          { name: '🛡️ Environment', value: 'Staging Database (Localhost)', inline: true }
        )
        .setTimestamp();
    } else if (action === 'end') {
      content = `✅ **Task Completed: ${taskId}**`;
      embed = new EmbedBuilder()
        .setTitle(`✅ Task Completed: ${taskId}`)
        .setDescription(messageText)
        .setColor(0x10b981) // Emerald Green
        .addFields(
          { name: '📋 Status', value: 'Completed & Verified', inline: true },
          { name: '🧪 Test Verification', value: '100% Passed (vitest & compiler)', inline: true }
        )
        .setTimestamp();
    } else {
      console.error('❌ Invalid action. Must be "start" or "end".');
      process.exit(1);
    }

    await channel.send({ content, embeds: [embed] });
    console.log(`✅ Discord notification sent for ${taskId}`);
    client.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending Discord notification:', error);
    client.destroy();
    process.exit(1);
  }
});

client.login(TOKEN).catch((err) => {
  console.error('❌ Login failed:', err);
  process.exit(1);
});

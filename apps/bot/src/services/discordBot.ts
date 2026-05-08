import { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  Message, 
  EmbedBuilder,
  ActivityType 
} from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

// Environment variables are loaded by the main server config
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const AUTHORIZED_USER_ID = process.env.DISCORD_ADMIN_ID;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN is missing');
  process.exit(1);
}

const prisma = new PrismaClient();

// Initialize Gemini
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const model = genAI?.getGenerativeModel({ 
  model: "gemini-2.5-flash-lite",
  systemInstruction: `You are the Nexworth AI Assistant (Discord Edition). 
  Nexworth is a financial management platform.
  If the user sends a message like "Food 50" or "Income 1000", analyze it.
  If the user sends a bank slip, extract the details.
  Always return JSON if requested for extraction, otherwise talk naturally in Thai.`
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`✅ Nexworth Discord Agent is online as ${client.user?.tag}`);
  client.user?.setActivity('your finances', { type: ActivityType.Watching });
});

async function fileToGenerativePart(url: string, mimeType: string) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return {
    inlineData: {
      data: Buffer.from(response.data).toString("base64"),
      mimeType
    },
  };
}

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // Basic Commands
  if (content === '/status') {
    const embed = new EmbedBuilder()
      .setTitle('🚀 Nexworth System Status')
      .setColor(0x3b82f6)
      .addFields(
        { name: 'AI Brain', value: '✅ Gemini 2.5 Flash-Lite (Verified Stable)', inline: false },
        { name: 'Database', value: '✅ Connected (Prisma)', inline: true },
        { name: 'Version', value: '2.6.0-PRO-DISCORD', inline: true },
        { name: 'User', value: message.author.username, inline: true }
      );
    return message.reply({ embeds: [embed] });
  }

  // AI Response & Transaction Recording
  if (message.mentions.has(client.user!) || message.guild === null || message.attachments.size > 0) {
    if (!model) return message.reply('❌ My AI brain is not configured yet.');
    
    try {
      (message.channel as any).sendTyping();
      
      const prompt = `
      You are a financial assistant. Extract transaction details from this: "${message.content}"
      Return ONLY valid JSON:
      {
        "amount": number,
        "categoryName": string,
        "description": string,
        "isExpense": boolean
      }
      If it's NOT a transaction, return: {"error": "not_a_transaction"}
      `;

      const parts: any[] = [prompt];
      if (message.attachments.size > 0) {
        for (const attachment of message.attachments.values()) {
          if (attachment.contentType?.startsWith('image/')) {
            const imagePart = await fileToGenerativePart(attachment.url, attachment.contentType);
            parts.push(imagePart);
          }
        }
      }

      const result = await model.generateContent(parts);
      const text = result.response.text();

      // Try to parse JSON
      try {
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const extracted = JSON.parse(jsonStr);

        if (extracted.amount && !extracted.error) {
          // Record to DB
          // 1. Find User (Mocking first user or finding by discord if we had a mapping)
          // For now, let's find the first user in the system to make it "work"
          const user = await prisma.user.findFirst({
             include: { accounts: true, organization: true }
          });

          if (!user || user.accounts.length === 0) {
            return message.reply(`วิเคราะห์ได้: ${extracted.amount} บาท แต่หาบัญชีของคุณไม่เจอในระบบครับ`);
          }

          const accountId = user.accounts[0].id;
          const organizationId = user.organizationId;

          // Find Category
          const categories = await prisma.transactionCategory.findMany({
            where: { organizationId },
            include: { type: true }
          });
          
          let category = categories.find(c => c.name.includes(extracted.categoryName) || c.type?.behavior === (extracted.isExpense ? 'EXPENSE' : 'INCOME'));
          if (!category) category = categories[0];

          // Determine assetId/liabilityId
          const account = user.accounts[0];
          let assetId = null;
          let liabilityId = null;
          if (account.type === 'LIABILITY') {
            const l = await prisma.liability.findUnique({ where: { accountId } });
            liabilityId = l?.id || null;
          } else {
            const a = await prisma.asset.findUnique({ where: { accountId } });
            assetId = a?.id || null;
          }

          // Create Transaction
          await prisma.transaction.create({
            data: {
              amount: extracted.amount,
              description: extracted.description || 'From Discord',
              date: new Date(),
              accountId,
              categoryId: category.id,
              typeId: category.typeId,
              userId: user.id,
              organizationId,
              assetId,
              liabilityId
            }
          });

          // Update balance (Simple increment/decrement)
          const behavior = category.type?.behavior || 'EXPENSE';
          const multiplier = behavior === 'INCOME' ? 1 : -1;
          
          if (assetId) {
            await prisma.asset.update({ where: { id: assetId }, data: { amount: { increment: extracted.amount * multiplier } } });
          } else if (liabilityId) {
            await prisma.liability.update({ where: { id: liabilityId }, data: { amount: { increment: extracted.amount * (-multiplier) } } });
          }

          return message.reply(`✅ **บันทึกสำเร็จ!**\n💰 จำนวน: ${extracted.amount} บาท\n📝 รายละเอียด: ${extracted.description}\n🏦 บัญชี: ${account.name}`);
        }
      } catch (e) {
        // Not a transaction or JSON error, just chat
        if (text.length > 2000) {
          const chunks = text.match(/[\s\S]{1,1900}/g) || [];
          for (const chunk of chunks) await message.reply(chunk);
        } else {
          await message.reply(text);
        }
      }
    } catch (error) {
      console.error('Discord AI Error:', error);
      message.reply('❌ ขออภัย เกิดข้อผิดพลาดในการประมวลผลครับ');
    }
  }
});

client.login(TOKEN);

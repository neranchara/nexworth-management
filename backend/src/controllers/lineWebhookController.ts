import { FastifyRequest, FastifyReply } from 'fastify';
import { messagingApi, webhook } from '@line/bot-sdk';
import { prisma } from '../lib/prisma.js';
import * as aiExtractionService from '../services/aiExtractionService.js';
import { adjustAccountBalance } from './transaction.controller.js';
import * as crypto from 'crypto';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const channelSecret = process.env.LINE_CHANNEL_SECRET || '';

const client = new messagingApi.MessagingApiClient({
  channelAccessToken,
});

// Helper to verify LINE signature
const verifySignature = (body: string, signature: string) => {
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
};

export const handleWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
  const signature = request.headers['x-line-signature'] as string;
  
  // Verify signature if configured
  if (channelSecret && signature && request.rawBody) {
    if (!verifySignature(request.rawBody as string, signature)) {
      request.log.error('LINE webhook signature validation failed');
      return reply.status(401).send('Unauthorized');
    }
  }

  const body = request.body as webhook.CallbackRequest;

  if (!body.events || body.events.length === 0) {
    return reply.status(200).send('OK');
  }

  for (const event of body.events) {
    try {
      await processEvent(event);
    } catch (err) {
      console.error('Error processing LINE event:', err);
    }
  }

  return reply.status(200).send('OK');
};

const processEvent = async (event: webhook.Event) => {
  if (!event.source || event.type !== 'message' || !event.source.userId) return;

  const lineUserId = event.source.userId;
  const replyToken = (event as webhook.MessageEvent).replyToken || '';
  const message = (event as webhook.MessageEvent).message;

  const user = await prisma.user.findUnique({
    where: { lineUserId },
    include: { accounts: true }
  });

  if (!user) {
    // Check if they sent a pairing code
    if (message.type === 'text') {
      const text = message.text.trim();
      if (text.startsWith('LINK-')) {
        const pairingCode = text;
        const unlinkedUser = await prisma.user.findUnique({ where: { pairingCode } });
        if (unlinkedUser) {
          await prisma.user.update({
            where: { id: unlinkedUser.id },
            data: { lineUserId, pairingCode: null } // Clear pairing code
          });
          await replyToUser(replyToken, 'เชื่อมต่อบัญชี Nexworth สำเร็จแล้ว! คุณสามารถพิมพ์ข้อความหรือส่งสลิปเพื่อบันทึกรายการได้เลยครับ');
          return;
        } else {
          await replyToUser(replyToken, 'รหัสเชื่อมต่อไม่ถูกต้อง หรือหมดอายุครับ กรุณาตรวจสอบใน Nexworth Dashboard');
          return;
        }
      }
    }
    
    await replyToUser(replyToken, 'สวัสดีครับ! คุณยังไม่ได้เชื่อมต่อบัญชี Nexworth กรุณานำรหัสจากหน้าเว็บ (เช่น LINK-1234) มาพิมพ์ที่นี่เพื่อเชื่อมต่อครับ');
    return;
  }

  // 2. Process Message
  if (message.type === 'text') {
    const text = message.text;
    await replyToUser(replyToken, 'กำลังวิเคราะห์ข้อความของคุณ...');
    
    const extracted = await aiExtractionService.extractFromText(text);
    if (!extracted) {
      await pushToUser(lineUserId, 'ขออภัย ไม่สามารถดึงข้อมูลจากข้อความได้ครับ กรุณาลองใหม่อีกครั้ง');
      return;
    }
    
    await recordTransactionAndNotify(lineUserId, user, extracted);

  } else if (message.type === 'image') {
    await replyToUser(replyToken, 'ได้รับรูปสลิปแล้ว กำลังวิเคราะห์ข้อมูล...');
    
    // Fetch image content from LINE
    const imageContent = await getLineContent(message.id);
    if (!imageContent) {
      await pushToUser(lineUserId, 'ไม่สามารถดาวน์โหลดรูปภาพได้ครับ');
      return;
    }

    const extracted = await aiExtractionService.extractFromImage(imageContent, 'image/jpeg');
    if (!extracted) {
      await pushToUser(lineUserId, 'ขออภัย AI ไม่สามารถอ่านข้อมูลสลิปนี้ได้ชัดเจนครับ');
      return;
    }

    await recordTransactionAndNotify(lineUserId, user, extracted);
  } else {
    await replyToUser(replyToken, 'ระบบรองรับเฉพาะข้อความและรูปภาพสลิปครับ');
  }
};

const recordTransactionAndNotify = async (lineUserId: string, user: any, extracted: aiExtractionService.ExtractedTransaction) => {
  // Simple heuristic for guessing account and category based on extracted data
  // In a real scenario, fuzzy matching against user.accounts and user.categories is needed.
  let accountId = user.accounts.length > 0 ? user.accounts[0].id : null;
  
  // Fetch categories based on user's organization
  const categories = await prisma.transactionCategory.findMany({
    where: { organizationId: user.organizationId },
    include: { type: true }
  });

  // Find a category
  let categoryId = null;
  let typeId = null;
  if (categories && extracted.categoryName) {
    const foundCategory = categories.find((c: any) => c.name.toLowerCase().includes(extracted.categoryName?.toLowerCase() || ''));
    if (foundCategory) {
      categoryId = foundCategory.id;
      typeId = foundCategory.typeId;
    }
  }

  // If no category matched, find a generic one based on isExpense
  if (!categoryId && categories.length > 0) {
    const fallbackBehavior = extracted.isExpense ? 'EXPENSE' : 'INCOME';
    const fallbackCategory = categories.find((c: any) => c.type?.behavior === fallbackBehavior);
    if (fallbackCategory) {
      categoryId = fallbackCategory.id;
      typeId = fallbackCategory.typeId;
    }
  }

  if (!accountId || !categoryId || !typeId) {
    await pushToUser(lineUserId, `ดึงข้อมูลได้: ${extracted.amount} บาท (${extracted.description || extracted.categoryName})\nแต่คุณยังไม่มีบัญชีหรือหมวดหมู่ที่เหมาะสมในระบบครับ กรุณาไปตั้งค่าที่เว็บก่อน`);
    return;
  }

  // Record Transaction
  try {
    const createdTx = await prisma.$transaction(async (tx: any) => {
      // 1. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: extracted.amount,
          description: extracted.description || 'From LINE Bot',
          date: extracted.date ? new Date(extracted.date) : new Date(),
          accountId,
          categoryId,
          typeId,
          userId: user.id
        }
      });
      return transaction;
    });

    // 2. Adjust Account Balance (outside tx to use global prisma client)
    await adjustAccountBalance(createdTx.accountId, createdTx.amount, createdTx.typeId);

    await pushToUser(lineUserId, `✅ บันทึกรายการสำเร็จ!\nจำนวน: ${extracted.amount.toLocaleString()} บาท\nรายละเอียด: ${extracted.description || extracted.categoryName}\nบัญชี: ${user.accounts[0].name}`);
  } catch (error) {
    console.error('Error saving transaction from LINE:', error);
    await pushToUser(lineUserId, 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูลครับ');
  }
};

const replyToUser = async (replyToken: string, text: string) => {
  try {
    await client.replyMessage({
      replyToken,
      messages: [{ type: 'text', text }]
    });
  } catch (e) {
    console.error('LINE Reply Error:', e);
  }
};

const pushToUser = async (to: string, text: string) => {
  try {
    await client.pushMessage({
      to,
      messages: [{ type: 'text', text }]
    });
  } catch (e) {
    console.error('LINE Push Error:', e);
  }
};

const getLineContent = async (messageId: string): Promise<Buffer | null> => {
  try {
    const response = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
      headers: {
        Authorization: `Bearer ${channelAccessToken}`
      }
    });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error('LINE Content Fetch Error:', e);
    return null;
  }
};

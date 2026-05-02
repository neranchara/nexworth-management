import { FastifyRequest, FastifyReply } from 'fastify';
import { messagingApi, webhook } from '@line/bot-sdk';
import { prisma } from '../lib/prisma';
import * as aiExtractionService from '../services/aiExtractionService.js';
import { adjustAccountBalance } from './transaction.controller.js';
import * as crypto from 'crypto';
import { config } from '../config/index.js';

const channelAccessToken = config.line.channelAccessToken;
const channelSecret = config.line.channelSecret;

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
  request.log.info({ headers: request.headers, hasRawBody: !!request.rawBody }, '📥 LINE Webhook Received');

  if (channelSecret && signature && request.rawBody) {
    if (!verifySignature(request.rawBody as string, signature)) {
      request.log.error({ signature, channelSecret: !!channelSecret }, '❌ LINE webhook signature validation failed');
      return reply.status(401).send('Unauthorized');
    }
  }

  const body = request.body as webhook.CallbackRequest;
  request.log.info({ eventCount: body.events?.length || 0 }, '📦 LINE Webhook Body Parsed');

  if (!body.events || body.events.length === 0) {
    return reply.status(200).send('OK');
  }

  for (const event of body.events) {
    try {
      if (event.type === 'postback') {
        await handlePostback(event as webhook.PostbackEvent);
      } else {
        await processEvent(event);
      }
    } catch (err) {
      console.error('Error processing LINE event:', err);
    }
  }

  return reply.status(200).send('OK');
};

const handlePostback = async (event: webhook.PostbackEvent) => {
  const lineUserId = event.source?.userId;
  if (!lineUserId) return;

  const data = new URLSearchParams(event.postback.data);
  const action = data.get('action');

  if (action === 'record') {
    const user = await prisma.user.findUnique({
      where: { lineUserId },
      include: { 
        accounts: { 
          include: { 
            bank: true,
            asset: true,
            liability: true
          } 
        } 
      }
    });
    if (!user) return;

    const extracted: aiExtractionService.ExtractedTransaction = {
      amount: parseFloat(data.get('amt') || '0'),
      description: data.get('desc') || '',
      categoryName: data.get('cat') || '',
      isExpense: data.get('exp') === 'true',
      date: data.get('date') || undefined
    };

    const accountId = data.get('accId') || '';
    
    // Call recording logic directly
    await recordTransactionAndNotify(lineUserId, user, extracted, accountId);
  } else if (action === 'unlink') {
    await prisma.user.updateMany({
      where: { lineUserId },
      data: { lineUserId: null }
    });
    await pushToUser(lineUserId, '🚫 ยกเลิกการเชื่อมต่อบัญชี Nexworth เรียบร้อยแล้วครับ หากต้องการใช้งานใหม่ กรุณาส่งรหัส LINK-xxxx อีกครั้ง');
  }
};

const processEvent = async (event: webhook.Event) => {
  if (!event.source || !event.source.userId) return;

  const lineUserId = event.source.userId;
  const replyToken = (event as any).replyToken || '';
  
  if (event.type !== 'message') return;
  const message = (event as webhook.MessageEvent).message;

  const user = await prisma.user.findUnique({
    where: { lineUserId },
    include: { 
      accounts: { 
        include: { 
          bank: true,
          asset: true,
          liability: true
        } 
      } 
    }
  });

  // Check if they sent a pairing code (even if already linked, to allow switching)
  if (message.type === 'text') {
    const text = message.text.trim();
    if (text.startsWith('LINK-')) {
      const pairingCode = text;
      const targetUser = await prisma.user.findUnique({ where: { pairingCode } });
      if (targetUser) {
        // Unlink old user (if any) and link new one
        await prisma.$transaction([
          prisma.user.updateMany({
            where: { lineUserId },
            data: { lineUserId: null }
          }),
          prisma.user.update({
            where: { id: targetUser.id },
            data: { lineUserId, pairingCode: null }
          })
        ]);
        await replyToUser(replyToken, '🔄 สลับบัญชี Nexworth สำเร็จแล้ว! ตอนนี้บอทผูกกับบัญชีใหม่ของคุณเรียบร้อยครับ');
        return;
      } else if (!user) {
        await replyToUser(replyToken, '❌ รหัสเชื่อมต่อไม่ถูกต้อง หรือหมดอายุครับ');
        return;
      }
      // If already linked and code is wrong, just fall through to normal processing or ignore
    }
  }

  if (!user) {
    await replyToUser(replyToken, 'สวัสดีครับ! คุณยังไม่ได้เชื่อมต่อบัญชี Nexworth กรุณานำรหัสจากหน้าเว็บ (เช่น LINK-1234) มาพิมพ์ที่นี่เพื่อเชื่อมต่อครับ');
    return;
  }

  // 2. Process Message
  if (message.type === 'text') {
    const text = message.text.trim();

    // Handle Rich Menu Commands
    if (text === '💰 เช็คยอดเงิน') {
      const balanceText = user.accounts.map((acc: any) => {
        const assetAmt = acc.asset?.amount || 0;
        const liabilityAmt = acc.liability?.amount || 0;
        const balance = assetAmt - liabilityAmt;
        return `- ${acc.name}: ${balance.toLocaleString()} บาท`;
      }).join('\n');
      await pushToUser(lineUserId, `💰 ยอดเงินปัจจุบันของคุณ:\n${balanceText || 'คุณยังไม่มีบัญชีที่มียอดเงินครับ'}`);
      return;
    }

    if (text === '⚙️ ตั้งค่าบัญชี') {
      await client.replyMessage({
        replyToken,
        messages: [{
          type: 'text',
          text: `⚙️ ตั้งค่าบัญชี Nexworth\n\nบัญชีปัจจุบัน: ${user.email}\nLINE ID: ${lineUserId.slice(0, 5)}...`,
          quickReply: {
            items: [
              { type: 'action', action: { type: 'message', label: '🔗 เชื่อมต่อใหม่', text: 'อยากเชื่อมต่อบัญชีใหม่' } as any },
              { type: 'action', action: { type: 'postback', label: '🚫 เลิกเชื่อมต่อ', data: 'action=unlink', displayText: 'ขอยกเลิกการเชื่อมต่อ LINE ครับ' } as any }
            ]
          }
        }]
      });
      return;
    }

    if (text === '📝 วิธีบันทึกรายการ') {
      await replyToUser(replyToken, '📝 วิธีบันทึกง่ายๆ:\n1. พิมพ์ "ชื่อรายการ จำนวน บัญชี" เช่น "ข้าวแกง 50 กระเป๋า"\n2. หรือส่งรูปสลิปโอนเงินมาได้เลยครับ!');
      return;
    }

    if (text === '📊 สรุปรายเดือน') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          date: { gte: firstDay, lte: lastDay }
        },
        include: { type: true }
      });

      let income = 0;
      let expense = 0;

      monthTransactions.forEach((tx: any) => {
        if (tx.type?.behavior === 'INCOME') income += tx.amount;
        if (tx.type?.behavior === 'EXPENSE') expense += tx.amount;
      });

      const monthName = now.toLocaleString('th-TH', { month: 'long' });
      await pushToUser(lineUserId, `📊 สรุปรายงานเดือน ${monthName}:\n💰 รายรับ: ${income.toLocaleString()} บาท\n💸 รายจ่าย: ${expense.toLocaleString()} บาท\n⚖️ คงเหลือ: ${(income - expense).toLocaleString()} บาท`);
      return;
    }

    if (text === '❓ ช่วยเหลือ') {
      const helpText = `❓ คู่มือการใช้งาน Nexworth Bot
      
1. 📝 บันทึกรายการ: 
   - พิมพ์ข้อความ: "ส้มตำ 60 กระเป๋า"
   - ส่งรูป: ส่งภาพสลิปธนาคารได้เลย

2. 💰 เช็คยอดเงิน: 
   - กดปุ่มในเมนูเพื่อดูยอดเงินทุกบัญชี

3. ⚙️ ตั้งค่า: 
   - จัดการการเชื่อมต่อบัญชีของคุณ

💡 เคล็ดลับ: คุณไม่จำเป็นต้องพิมพ์ชื่อบัญชีให้ตรงเป๊ะ บอทจะพยายามเดาใจคุณเองครับ!`;
      await replyToUser(replyToken, helpText);
      return;
    }

    if (text === '📈 ตลาดการเงิน') {
      const marketText = `📈 รายงานความเคลื่อนไหวตลาด
      
🌟 ราคาทองคำวันนี้ (1 พ.ค. 69)
- ทองคำแท่ง: 🛒รับซื้อ 70,350 | 🏷️ขายออก 70,550
- ทองรูปพรรณ: 🛒รับซื้อ 68,947 | 🏷️ขายออก 71,350

📊 ตลาดหุ้นไทย (SET): 1,480.25 (-0.45%)

💡 ข้อมูลราคาทองคำอ้างอิงจากสมาคมค้าทองคำ (อัปเดตล่าสุด 17:20 น.)`;
      await replyToUser(replyToken, marketText);
      return;
    }

    await pushToUser(lineUserId, 'กำลังวิเคราะห์ข้อความของคุณ...');
    
    const extracted = await aiExtractionService.extractFromText(text);
    if (!extracted) {
      await pushToUser(lineUserId, 'ขออภัย ไม่สามารถดึงข้อมูลจากข้อความได้ครับ กรุณาลองใหม่อีกครั้ง');
      return;
    }
    
    // Check for Account Match
    let matchedAccountId = null;
    if (extracted.accountName && user.accounts.length > 0) {
      const searchName = extracted.accountName.toLowerCase();
      const match = user.accounts.find((a: any) => 
        a.name.toLowerCase().includes(searchName) ||
        (a.bank?.name && a.bank.name.toLowerCase().includes(searchName))
      );
      if (match) matchedAccountId = match.id;
    }

    if (matchedAccountId) {
      await recordTransactionAndNotify(lineUserId, user, extracted, matchedAccountId);
    } else {
      // Show Quick Replies for Account Selection
      const quickReplyItems = user.accounts.slice(0, 13).map((acc: any) => ({
        type: 'action',
        action: {
          type: 'postback',
          label: (acc.name as string).slice(0, 20),
          data: `action=record&amt=${extracted.amount}&desc=${encodeURIComponent(extracted.description || '')}&cat=${encodeURIComponent(extracted.categoryName || '')}&exp=${extracted.isExpense}&accId=${acc.id}`,
          displayText: `เลือกบัญชี: ${acc.name}`
        } as any
      }));

      await client.replyMessage({
        replyToken,
        messages: [{
          type: 'text',
          text: `🔍 สกัดข้อมูลได้:\nจำนวน: ${extracted.amount.toLocaleString()} บาท\nรายการ: ${extracted.description || extracted.categoryName}\n\nกรุณาเลือกบัญชีที่ต้องการบันทึกครับ:`,
          quickReply: { items: quickReplyItems }
        }]
      });
    }

  } else if (message.type === 'image') {
    await replyToUser(replyToken, 'ได้รับรูปสลิปแล้ว กำลังวิเคราะห์ข้อมูล...');
    
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

    // For image, we usually don't have account name, so ask as well if no obvious match
    await client.replyMessage({
      replyToken,
      messages: [{
        type: 'text',
        text: `🔍 สลิปจำนวน: ${extracted.amount.toLocaleString()} บาท\nลงบัญชีไหนดีครับ?`,
        quickReply: {
          items: user.accounts.slice(0, 13).map((acc: any) => ({
            type: 'action',
            action: {
              type: 'postback',
              label: (acc.name as string).slice(0, 20),
              data: `action=record&amt=${extracted.amount}&desc=${encodeURIComponent(extracted.description || '')}&cat=${encodeURIComponent(extracted.categoryName || '')}&exp=${extracted.isExpense}&date=${extracted.date || ''}&accId=${acc.id}`,
              displayText: `ลงบัญชี: ${acc.name}`
            } as any
          }))
        }
      }]
    });
  } else {
    await replyToUser(replyToken, 'ระบบรองรับเฉพาะข้อความและรูปภาพสลิปครับ');
  }
};

const recordTransactionAndNotify = async (lineUserId: string, user: any, extracted: aiExtractionService.ExtractedTransaction, forcedAccountId?: string) => {
  // Use forcedAccountId if provided, otherwise fallback to default logic
  let accountId = forcedAccountId;
  let selectedAccount = null;

  if (accountId) {
    selectedAccount = user.accounts.find((a: any) => a.id === accountId);
  } else {
    // Default fallback logic (should rarely be hit now with interactive flow)
    selectedAccount = user.accounts.length > 0 ? user.accounts[0] : null;
    accountId = selectedAccount?.id || null;
  }
  
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
      // 0. Determine assetId or liabilityId
      const account = await tx.account.findUnique({ where: { id: accountId } });
      let assetId = null;
      let liabilityId = null;
      if (account) {
        if (account.type === 'LIABILITY') {
          const l = await tx.liability.findUnique({ where: { accountId } });
          liabilityId = l?.id || null;
        } else {
          const a = await tx.asset.findUnique({ where: { accountId } });
          assetId = a?.id || null;
        }
      }

      // 1. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: extracted.amount,
          description: extracted.description || 'From LINE Bot',
          date: extracted.date ? new Date(extracted.date) : new Date(),
          accountId,
          categoryId,
          typeId,
          userId: user.id,
          organizationId: user.organizationId,
          assetId,
          liabilityId
        }
      });
      return transaction;
    });

    // 2. Adjust Account Balance (outside tx to use global prisma client)
    await adjustAccountBalance(createdTx.accountId, createdTx.amount, createdTx.typeId);

    const isExactMatch = !!forcedAccountId;
    const matchStatus = isExactMatch ? '✅' : '⚠️ (ลงบัญชีเริ่มต้นให้ก่อน)';
    await pushToUser(lineUserId, `${matchStatus} บันทึกรายการสำเร็จ!\nจำนวน: ${extracted.amount.toLocaleString()} บาท\nรายละเอียด: ${extracted.description}\nบัญชี: ${selectedAccount?.name || 'N/A'}`);
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

import { messagingApi } from '@line/bot-sdk';
import { config } from '../config/index.js';
import * as fs from 'fs';
import * as path from 'path';

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: config.line.channelAccessToken,
});

const clientBlob = new messagingApi.MessagingApiBlobClient({
  channelAccessToken: config.line.channelAccessToken,
});

async function main() {
  console.log('--- Creating Rich Menu ---');

  const richMenu: any = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: 'Nexworth Premium Menu',
    chatBarText: 'เปิดเมนู',
    areas: [
      { bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: 'message', text: '💰 เช็คยอดเงิน' } },
      { bounds: { x: 833, y: 0, width: 833, height: 843 }, action: { type: 'message', text: '📊 สรุปรายเดือน' } },
      { bounds: { x: 1666, y: 0, width: 834, height: 843 }, action: { type: 'message', text: '📝 วิธีบันทึกรายการ' } },
      { bounds: { x: 0, y: 843, width: 833, height: 843 }, action: { type: 'message', text: '⚙️ ตั้งค่าบัญชี' } },
      { bounds: { x: 833, y: 843, width: 833, height: 843 }, action: { type: 'message', text: '📈 ตลาดการเงิน' } },
      { bounds: { x: 1666, y: 843, width: 834, height: 843 }, action: { type: 'message', text: '❓ ช่วยเหลือ' } }
    ]
  };

  try {
    // 1. Create rich menu
    const richMenuResponse = await client.createRichMenu(richMenu);
    const richMenuId = richMenuResponse.richMenuId;
    console.log(`✅ Rich Menu Created: ${richMenuId}`);

    // 2. Upload image using fetch to be sure about headers
    const imagePath = path.join('C:\\Users\\USER\\.gemini\\antigravity\\brain\\2fd983be-bed9-4717-bb2b-bfeaa8c71898\\nexworth_rich_menu_final.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const uploadResponse = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.line.channelAccessToken}`,
        'Content-Type': 'image/jpeg'
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload Failed: ${uploadResponse.status} - ${errorText}`);
    }
    console.log('✅ Image Uploaded Successfully!');

    // 3. Set as default
    await client.setDefaultRichMenu(richMenuId);
    console.log('✅ Rich Menu Set as Default!');

  } catch (error: any) {
    if (error.response) {
      console.error('❌ Error setting up Rich Menu (API Error):');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Error setting up Rich Menu:', error.message);
    }
  }
}

main();

import { Client, GatewayIntentBits, Message, ActivityType, TextChannel, EmbedBuilder } from 'discord.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const AUTHORIZED_USER_ID = process.env.DISCORD_ADMIN_ID;
const REPORT_CHANNEL_ID = process.env.DISCORD_REPORT_CHANNEL_ID;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const PLAN_PATH = path.join(__dirname, '../../../docs/IMPLEMENTATION_PLAN.md');

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) : null;

const HELP_MENU = `
🛠️ **Nexworth Command Center - Help Menu**
------------------------------------------
**📡 System Commands:**
• \`/cmd status\` - Check system health and root path
• \`/cmd help\` - Show this help menu
• \`/cmd run [script]\` - Execute npm scripts (e.g., dev, web, api)

**📑 Project Management:**
• \`/cmd plan\` - Show current implementation plan summary
• \`/cmd create [desc]\` - Add a new task to the plan
• \`/cmd approve [id]\` - Mark a task as COMPLETED
• \`/cmd cancel [id]\` - Mark a task as CANCELLED
• \`/cmd skill\` - List available AI skills/agents

**🧠 AI Intelligence:**
• \`/cmd findsolution [problem]\` - Ask AI for an implementation strategy
• \`/cmd re-solution [topic]\` - Ask AI to rethink or optimize a solution
------------------------------------------
`;

if (!TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN is missing in dev-agent');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Nexworth Dev Agent (LOCAL ONLY) is online as ${client.user?.tag}`);
  client.user?.setActivity('your commands', { type: ActivityType.Listening });
  
  // Start watching the implementation plan
  startRoadmapWatcher();
});

let lastPlanContent = '';

function startRoadmapWatcher() {
  if (!fs.existsSync(PLAN_PATH)) return console.warn(`⚠️ Implementation plan not found at: ${PLAN_PATH}`);

  lastPlanContent = fs.readFileSync(PLAN_PATH, 'utf8');
  console.log('👀 Roadmap Watcher: Active (Polling Mode)');

  setInterval(() => {
    try {
      const newContent = fs.readFileSync(PLAN_PATH, 'utf8');
      if (newContent !== lastPlanContent) {
        console.log('🔔 Roadmap Watcher: Change detected!');
        handlePlanChange(newContent, lastPlanContent);
        lastPlanContent = newContent;
      }
    } catch (err) {
      console.error('❌ Error reading plan file:', err);
    }
  }, 2000);
}

async function handlePlanChange(newContent: string, oldContent: string) {
  if (!REPORT_CHANNEL_ID) return;
  const channel = await client.channels.fetch(REPORT_CHANNEL_ID) as TextChannel;
  if (!channel) return;

  // Simple logic: Find newly checked items
  const oldChecked = (oldContent.match(/- \[x\] .+/g) || []).map(s => s.trim());
  const newChecked = (newContent.match(/- \[x\] .+/g) || []).map(s => s.trim());
  
  const newlyFinished = newChecked.filter(item => !oldChecked.includes(item));
  console.log(`🔍 Delta found: ${newlyFinished.length} new items`);

  if (newlyFinished.length > 0) {
    try {
      const reportTitle = '🏁 **Task Completed!**';
      const reportDesc = newlyFinished.map(item => `✅ ${item.replace('- [x] ', '')}`).join('\n');
      
      const embed = new EmbedBuilder()
        .setTitle('Status Update')
        .setColor(0x50C878)
        .setDescription(reportDesc)
        .setTimestamp();

      // Try to find the "Next Step"
      const roadmapMatch = newContent.match(/## 📅 Roadmap Summary[\s\S]+/);
      if (roadmapMatch) {
        const roadmapText = roadmapMatch[0];
        const nextStep = roadmapText.match(/\d\. \*\*Next:\*\* (.+)/);
        if (nextStep) {
          const nextStepValue = nextStep[1].replace(/\*/g, '');
          embed.addFields({ name: '🚀 Next Step', value: nextStepValue });
        }
      }

      await channel.send({ 
        content: `${reportTitle}\n${reportDesc}`, 
        embeds: [embed] 
      });
      console.log('✅ Report sent to Discord (Text + Embed)');
    } catch (err) {
      console.error('❌ Failed to send embed, trying plain text:', err);
      await channel.send(`🏁 **Task Completed!**\n${newlyFinished.join('\n')}`);
    }
  }
}

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // ONLY respond to commands starting with /cmd
  if (content.startsWith('/cmd ')) {
    if (message.author.id !== AUTHORIZED_USER_ID) {
      return message.reply('❌ **Unauthorized:** You are not allowed to control this system.');
    }

    const commandParts = content.replace('/cmd ', '').trim().split(' ');
    const mainAction = commandParts[0];
    const args = commandParts.slice(1).join(' ');

    // 1. HELP
    if (mainAction === 'help') {
      return message.reply(HELP_MENU);
    }

    // 2. STATUS
    if (mainAction === 'status') {
      return message.reply(`✅ **Dev Agent Status:** Online (Local Mode)\n💻 Root Path: \`${path.join(__dirname, '../../..')}\``);
    }

    // 3. PLAN (Show)
    if (mainAction === 'plan' && !args) {
      if (!fs.existsSync(PLAN_PATH)) return message.reply('❌ Plan file not found.');
      
      const planContent = fs.readFileSync(PLAN_PATH, 'utf8');
      const lines = planContent.split('\n');
      
      const recentTasks = lines.filter(l => l.startsWith('### NEX-')).slice(-5).map(l => l.replace('### ', '🔹 ')).join('\n');
      let roadmapIndex = lines.findIndex(l => l.toLowerCase().includes('roadmap summary'));
      const roadmap = roadmapIndex !== -1 ? lines.slice(roadmapIndex, roadmapIndex + 10).join('\n') : 'Roadmap summary not found.';

      const response = `📊 **Nexworth Master Plan Update**\n\n**🚩 Recent Progress:**\n${recentTasks}\n\n**📅 Roadmap Summary:**\n\`\`\`md\n${roadmap}\n\`\`\``;
      
      return message.reply(response);
    }

    // 4. SKILL
    if (mainAction === 'skill') {
      const skillsPath = path.join(__dirname, '../../../.agents/skills');
      if (!fs.existsSync(skillsPath)) return message.reply('❌ Skills directory not found.');
      
      const skills = fs.readdirSync(skillsPath);
      const embed = new EmbedBuilder()
        .setTitle('🛠️ Available AI Skills')
        .setColor(0xFFA500)
        .setDescription(skills.map(s => `• \`${s}\``).join('\n'));
      return message.reply({ embeds: [embed] });
    }

    // 5. CREATE Task
    if (mainAction === 'create') {
      if (!args) return message.reply('❌ Please specify task description.');
      const newTask = `\n### NEX-NEW: ${args} - [STATUS: PENDING]\n- [ ] Sub-task 1: Initial implementation\n`;
      fs.appendFileSync(PLAN_PATH, newTask);
      return message.reply(`✅ **Task Created:** Added to implementation plan.`);
    }

    // 6. AI: FIND SOLUTION / RE-SOLUTION
    if (mainAction === 'findsolution' || mainAction === 're-solution') {
      if (!model) return message.reply('❌ AI Model (Gemini) not configured.');
      if (!args) return message.reply('❌ Please specify a problem/topic.');

      const prompt = mainAction === 'findsolution' 
        ? `Provide a technical solution and implementation plan for: ${args}`
        : `Rethink and optimize the existing solution for: ${args}`;

      const loadingMsg = await message.reply('🧠 **AI is thinking...**');
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const embed = new EmbedBuilder()
          .setTitle(mainAction === 'findsolution' ? '💡 AI Solution Found' : '🔄 AI Re-solution')
          .setColor(0x9370DB)
          .setDescription(text.substring(0, 4000));
        
        return loadingMsg.edit({ content: '✅ Solution generated:', embeds: [embed] });
      } catch (err) {
        return loadingMsg.edit(`❌ AI Error: ${err}`);
      }
    }

    // 7. APPROVE Task
    if (mainAction === 'approve') {
      if (!args) return message.reply('❌ Please specify task ID (e.g., 701).');
      let content = fs.readFileSync(PLAN_PATH, 'utf8');
      
      const taskRegex = new RegExp(`### NEX-${args}:[\\s\\S]+?(?=###|---)`, 'g');
      const match = content.match(taskRegex);
      
      if (!match) return message.reply(`❌ Task NEX-${args} not found.`);
      
      let updatedTask = match[0]
        .replace(/\[STATUS: [^\]]+\]/g, '[STATUS: COMPLETED & VERIFIED] ✅')
        .replace(/- \[ \]/g, '- [x]');
        
      content = content.replace(match[0], updatedTask);
      fs.writeFileSync(PLAN_PATH, content);
      return message.reply(`✅ **Task NEX-${args} Approved:** Status updated to COMPLETED.`);
    }

    // 8. CANCEL Task
    if (mainAction === 'cancel') {
      if (!args) return message.reply('❌ Please specify task ID (e.g., 701).');
      let content = fs.readFileSync(PLAN_PATH, 'utf8');
      
      const taskRegex = new RegExp(`### NEX-${args}:[\\s\\S]+?(?=###|---)`, 'g');
      const match = content.match(taskRegex);
      
      if (!match) return message.reply(`❌ Task NEX-${args} not found.`);
      
      let updatedTask = match[0]
        .replace(/\[STATUS: [^\]]+\]/g, '[STATUS: CANCELLED] ❌');
        
      content = content.replace(match[0], updatedTask);
      fs.writeFileSync(PLAN_PATH, content);
      return message.reply(`❌ **Task NEX-${args} Cancelled:** Status updated.`);
    }

    // 9. RUN Script
    if (mainAction === 'run') {
      const target = args || 'dev';
      const rootPath = path.join(__dirname, '../../..');
      const msg = await message.reply(`🛰️ **Agentic Action:** Starting \`npm run ${target}\`...`);
      const child = spawn('npm', ['run', target], { cwd: rootPath, shell: true, env: { ...process.env, FORCE_COLOR: 'true' } });
      child.on('close', (code) => msg.edit(`🏁 **Process Finished:** \`npm run ${target}\` exited with code ${code}`));
      return;
    }

    return message.reply('❓ **Unknown Command:** Try `/cmd help` to see available options.');
  }
});

client.login(TOKEN);

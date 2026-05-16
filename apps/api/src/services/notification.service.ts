import { messagingApi } from '@line/bot-sdk';
import { config } from '../config';

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: config.line.channelAccessToken,
});

/**
 * Notification Service
 * Handles institutional-grade alerting via LINE.
 */
export class NotificationService {
  /**
   * Send a security alert to the Admin Group
   */
  async sendSecurityAlert(message: string) {
    const groupId = config.line.adminGroupId;
    if (!groupId) {
      console.warn('[NotificationService] Skipping Security Alert: LINE_ADMIN_GROUP_ID not set');
      return;
    }

    try {
      await client.pushMessage({
        to: groupId,
        messages: [{
          type: 'text',
          text: `🚨 [SECURITY ALERT] 🚨\n\n${message}\n\nTime: ${new Date().toLocaleString('th-TH')}`
        }]
      });
      console.log('[NotificationService] Security Alert sent to Admin Group');
    } catch (error) {
      console.error('[NotificationService] Failed to send Security Alert:', error);
    }
  }

  /**
   * Send an integrity report alert
   */
  async sendIntegrityAlert(score: number, mismatchCount: number) {
    const groupId = config.line.adminGroupId;
    if (!groupId) return;

    const status = score >= 95 ? '✅ NORMAL' : '⚠️ CRITICAL';
    
    try {
      await client.pushMessage({
        to: groupId,
        messages: [{
          type: 'text',
          text: `📊 [INTEGRITY REPORT] ${status}\n\nScore: ${score}%\nMismatches: ${mismatchCount}\n\nAction: Please check Ops Dashboard immediately.`
        }]
      });
    } catch (error) {
      console.error('[NotificationService] Failed to send Integrity Alert:', error);
    }
  }

  /**
   * Send high-value mismatch alert
   */
  async sendHighValueAlert(accountId: string, diff: number) {
    const groupId = config.line.adminGroupId;
    if (!groupId) return;

    try {
      await client.pushMessage({
        to: groupId,
        messages: [{
          type: 'text',
          text: `🔥 [HIGH VALUE MISMATCH] 🔥\n\nAccount: ${accountId}\nDifference: ฿${diff.toLocaleString()}\n\nCritical correction required!`
        }]
      });
    } catch (error) {
      console.error('[NotificationService] Failed to send High Value Alert:', error);
    }
  }

  /**
   * Send a direct message to a specific user
   */
  async sendDirectMessage(to: string, message: string) {
    try {
      await client.pushMessage({
        to,
        messages: [{ type: 'text', text: message }]
      });
    } catch (error) {
      console.error(`[NotificationService] Failed to send DM to ${to}:`, error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

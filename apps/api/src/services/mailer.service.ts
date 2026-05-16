import nodemailer from 'nodemailer';
import { config } from '../config';

/**
 * Mailer Service
 * Handles production-grade email delivery for security and notifications.
 */
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  /**
   * Send Password Reset Email
   * Uses a premium Emerald-themed HTML template.
   */
  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${config.email.frontendUrl}/reset-password?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; border: 1px solid rgba(16, 185, 129, 0.1); overflow: hidden; }
          .header { padding: 40px; text-align: center; background: linear-gradient(to bottom, rgba(16, 185, 129, 0.05), transparent); }
          .logo { width: 48px; height: 48px; margin-bottom: 20px; }
          .content { padding: 40px; text-align: center; color: #94a3b8; }
          .title { color: #f8fafc; font-size: 24px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em; }
          .text { font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
          .button { display: inline-block; padding: 16px 32px; background: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3); }
          .footer { padding: 32px; background: rgba(0, 0, 0, 0.2); text-align: center; font-size: 12px; color: #475569; }
          .warning { margin-top: 32px; padding: 16px; background: rgba(245, 158, 11, 0.05); border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.1); color: #d97706; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #10b981; margin: 0; font-size: 28px; letter-spacing: -1px;">NEXWORTH</h1>
          </div>
          <div class="content">
            <h2 class="title">Secure Password Reset</h2>
            <p class="text">We received a request to reset your password for your Nexworth account. Click the button below to establish new secure credentials.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              This link will expire in 15 minutes. If you did not request this, please ignore this email or contact security support immediately.
            </div>
          </div>
          <div class="footer">
            &copy; 2026 Nexworth Management. Institutional-Grade Asset Security.<br>
            Sent to ${to}
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject: '🔒 Secure Password Reset - Nexworth',
        html: htmlContent,
        text: `Reset your Nexworth password by visiting: ${resetUrl}`, // Fallback plain text
      });
      console.log(`[MailerService] Password reset email sent to ${to}`);
    } catch (error) {
      console.error('[MailerService] Failed to send password reset email:', error);
      throw error;
    }
  }
}

export const mailerService = new MailerService();

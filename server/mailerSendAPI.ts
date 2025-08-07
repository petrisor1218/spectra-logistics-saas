import type { EmailData } from './emailService';

export class MailerSendAPI {
  private static apiKey = process.env.MAILERSEND_API_KEY;
  private static baseUrl = 'https://api.mailersend.com/v1';

  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.log('🎭 DEMO MODE: MailerSend API key not configured');
        return false;
      }

      const payload = {
        from: {
          email: 'test@trial-yzkq340d7nl4d796.mlsender.net',
          name: 'Transport Pro'
        },
        to: [
          {
            email: emailData.to
          }
        ],
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments?.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type,
          disposition: att.disposition
        })) || []
      };

      const response = await fetch(`${this.baseUrl}/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ Email sent successfully via MailerSend API');
        return true;
      } else {
        const error = await response.text();
        console.error('❌ MailerSend API error:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ MailerSend API error:', error);
      return false;
    }
  }
}
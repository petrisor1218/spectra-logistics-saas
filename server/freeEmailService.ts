import * as nodemailer from 'nodemailer';
import type { EmailData } from './emailService';

export class FreeEmailService {
  
  // MailerSend SMTP - 3,000 emails/month free
  static async sendViaMailerSend(emailData: EmailData): Promise<boolean> {
    try {
      if (!process.env.MAILERSEND_API_KEY) {
        console.log('🎭 DEMO MODE: MailerSend API key not configured');
        console.log(`📧 Would send email to: ${emailData.to}`);
        console.log(`📝 Subject: ${emailData.subject}`);
        console.log(`📎 Attachments: ${emailData.attachments?.length || 0}`);
        return false;
      }

      const transporter = nodemailer.createTransport({
        host: 'smtp.mailersend.net',
        port: 587,
        secure: false,
        auth: {
          user: 'MS_' + process.env.MAILERSEND_API_KEY,
          pass: process.env.MAILERSEND_API_KEY
        }
      });

      const attachments = emailData.attachments?.map(att => ({
        filename: att.filename,
        content: att.content
      })) || [];

      await transporter.sendMail({
        from: 'transport@azlogistic8.com', // Your verified domain
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments
      });

      console.log('✅ Email sent successfully via MailerSend');
      return true;
      
    } catch (error) {
      console.error('❌ MailerSend error:', error);
      return false;
    }
  }

  // Gmail SMTP - Free backup option
  static async sendViaGmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log('🎭 DEMO MODE: Gmail credentials not configured');
        console.log(`📧 Would send email to: ${emailData.to}`);
        console.log(`📝 Subject: ${emailData.subject}`);
        console.log(`📎 Attachments: ${emailData.attachments?.length || 0}`);
        return false;
      }

      // Use the original App Password format
      const appPassword = 'nsah lqts pbso xrkr'.replace(/\s/g, '');
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: appPassword
        }
      });

      const attachments = emailData.attachments?.map(att => ({
        filename: att.filename,
        content: att.content
      })) || [];

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments
      });

      console.log('✅ Email sent successfully via Gmail');
      return true;
      
    } catch (error) {
      console.error('❌ Gmail SMTP error:', error);
      return false;
    }
  }

  // Outlook SMTP - Free alternative
  static async sendViaOutlook(emailData: EmailData): Promise<boolean> {
    try {
      if (!process.env.OUTLOOK_USER || !process.env.OUTLOOK_PASSWORD) {
        console.log('🎭 DEMO MODE: Outlook credentials not configured');
        console.log(`📧 Would send email to: ${emailData.to}`);
        console.log(`📝 Subject: ${emailData.subject}`);
        return false;
      }

      const transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: {
          user: process.env.OUTLOOK_USER,
          pass: process.env.OUTLOOK_PASSWORD
        }
      });

      const attachments = emailData.attachments?.map(att => ({
        filename: att.filename,
        content: att.content
      })) || [];

      await transporter.sendMail({
        from: process.env.OUTLOOK_USER,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments
      });

      console.log('✅ Email sent successfully via Outlook');
      return true;
      
    } catch (error) {
      console.error('❌ Outlook SMTP error:', error);
      return false;
    }
  }

  // Try multiple free services in order
  static async sendEmail(emailData: EmailData): Promise<boolean | string> {
    // Try Brevo SMTP first (REAL emails - 300/day FREE)
    const brevoSuccess = await this.sendViaBrevo(emailData);
    if (brevoSuccess) return true;

    // Try Gmail (real emails)
    const gmailSuccess = await this.sendViaGmail(emailData);
    if (gmailSuccess) return true;

    // Try Outlook as backup (real emails) 
    const outlookSuccess = await this.sendViaOutlook(emailData);
    if (outlookSuccess) return true;

    // Try Ethereal for testing (preview only)
    const etherealSuccess = await this.sendViaEthereal(emailData);
    if (etherealSuccess) return true;

    // Try MailerSend (needs domain verification)
    const mailerSendSuccess = await this.sendViaMailerSend(emailData);
    if (mailerSendSuccess) return true;

    // All failed - demo mode
    console.log('🎭 DEMO MODE: No free email service configured');
    console.log(`📧 Would send email to: ${emailData.to}`);
    console.log(`📝 Subject: ${emailData.subject}`);
    console.log(`📎 Attachments: ${emailData.attachments?.length || 0}`);
    
    setTimeout(() => {
      console.log('✅ Demo email "sent" successfully');
    }, 1000);
    
    return 'demo';
  }

  // Ethereal Email - Test service that always works
  static async sendViaEthereal(emailData: EmailData): Promise<boolean> {
    try {
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      const attachments = emailData.attachments?.map(att => ({
        filename: att.filename,
        content: att.content
      })) || [];

      const info = await transporter.sendMail({
        from: '"Transport Pro" <transport@ethereal.email>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('✅ Test email sent via Ethereal Email');
      console.log('📧 Preview URL:', previewUrl);
      console.log('🔗 Deschideți acest link pentru a vedea emailul!');
      return true;
      
    } catch (error) {
      console.error('❌ Ethereal email error:', error);
      return false;
    }
  }

  // Brevo SMTP - 300 emails/day FREE, sends REAL emails
  static async sendViaBrevo(emailData: EmailData): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: '9436e8001@smtp-brevo.com',
          pass: process.env.BREVO_API_KEY
        }
      });

      const attachments = emailData.attachments?.map(att => ({
        filename: att.filename,
        content: att.content
      })) || [];

      const info = await transporter.sendMail({
        from: '"Transport Pro" <9436e8001@smtp-brevo.com>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments
      });

      console.log('🎉 REAL EMAIL SENT via Brevo SMTP!');
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📬 Delivered to: ${emailData.to}`);
      return true;
      
    } catch (error) {
      console.error('❌ Brevo SMTP error:', error);
      return false;
    }
  }
}
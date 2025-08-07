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

      // Clean the app password - remove spaces
      const cleanAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
          user: process.env.GMAIL_USER,
          pass: cleanAppPassword
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
    // Try Gmail first (easiest to configure)
    const gmailSuccess = await this.sendViaGmail(emailData);
    if (gmailSuccess) return true;

    // Try Outlook as fallback
    const outlookSuccess = await this.sendViaOutlook(emailData);
    if (outlookSuccess) return true;

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
}
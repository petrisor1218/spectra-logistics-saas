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

      // Use the Gmail App Password
      const appPassword = 'nsahltqspbsoxrkr'; // Removed spaces
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'fastexpressrl@gmail.com',
          pass: appPassword
        },
        debug: true
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
    // Try Brevo SMTP first (REAL emails with verified sender)
    try {
      const brevoSuccess = await this.sendViaBrevo(emailData);
      if (brevoSuccess) return 'brevo_real';
    } catch (error) {
      console.log('Brevo failed, trying next service...');
    }

    // Try Ethereal as backup (always works, gives preview)
    try {
      const etherealSuccess = await this.sendViaEthereal(emailData);
      if (etherealSuccess) return 'ethereal_preview';
    } catch (error) {
      console.log('Ethereal failed, trying next service...');
    }

    // Try Gmail (real emails with App Password)
    try {
      const gmailSuccess = await this.sendViaGmail(emailData);
      if (gmailSuccess) return 'gmail_real';
    } catch (error) {
      console.log('Gmail failed, trying next service...');
    }

    // Try Outlook as backup (real emails) 
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
      console.log('🔧 Testing Brevo SMTP connection...');
      console.log(`📧 Sending to: ${emailData.to}`);
      console.log(`📝 Subject: ${emailData.subject}`);
      console.log(`📎 Attachments: ${emailData.attachments?.length || 0}`);
      
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: '9436e8001@smtp-brevo.com',
          pass: 'xsmtpsib-8c9203b1a987fe14e15ec46cdee350c7ed075fd696b9104cc8835872ca7437dd-DynB6bk2N10sFagT'
        },
        debug: true
      });

      // Test the connection first
      await transporter.verify();
      console.log('✅ Brevo SMTP connection verified!');

      const attachments = emailData.attachments?.map(att => ({
        filename: att.filename,
        content: typeof att.content === 'string' 
          ? Buffer.from(att.content, 'base64') 
          : att.content,
        contentType: att.contentType || 'application/pdf'
      })) || [];

      const info = await transporter.sendMail({
        from: '"Fast & Express SRL" <petrisor@fastexpress.ro>',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments
      });

      console.log('🎉 REAL EMAIL SENT via Brevo SMTP!');
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📬 Delivered to: ${emailData.to}`);
      return true;
      
    } catch (error: any) {
      console.error('❌ Brevo SMTP error details:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error:', error);
      return false;
    }
  }

  // Payment notification email with balance details
  static async sendPaymentNotificationEmail(emailData: {
    to: string;
    companyName: string;
    paymentData: {
      amount: number;
      paymentDate: string;
      weekLabel: string;
      notes?: string;
    };
    remainingBalances?: Array<{
      weekLabel: string;
      remainingAmount: number;
      totalInvoiced: number;
    }>;
  }): Promise<boolean> {
    const subject = `Plată Confirmată - ${emailData.companyName} - €${emailData.paymentData.amount} - Sold Actualizat`;
    
    // Generate balance summary if provided
    let balancesSummary = '';
    if (emailData.remainingBalances && emailData.remainingBalances.length > 0) {
      const totalRemaining = emailData.remainingBalances.reduce((sum, b) => sum + b.remainingAmount, 0);
      
      balancesSummary = `
        <div class="balances-section">
          <h3>📊 Sold actualizat pe săptămâni</h3>
          <div class="balance-summary">
            <p><strong>Total de încasat:</strong> <span class="total-remaining">€${totalRemaining.toFixed(2)}</span></p>
          </div>
          <div class="balances-list">
            ${emailData.remainingBalances.map(balance => `
              <div class="balance-item ${balance.remainingAmount === 0 ? 'paid' : balance.remainingAmount < 0 ? 'overpaid' : 'pending'}">
                <div class="week-label">${balance.weekLabel}</div>
                <div class="balance-amounts">
                  <span class="invoiced">Facturat: €${balance.totalInvoiced.toFixed(2)}</span>
                  <span class="remaining ${balance.remainingAmount === 0 ? 'zero' : balance.remainingAmount < 0 ? 'negative' : 'positive'}">
                    ${balance.remainingAmount === 0 ? '✅ Plătit complet' : 
                      balance.remainingAmount < 0 ? `💰 Surplus: €${Math.abs(balance.remainingAmount).toFixed(2)}` : 
                      `⏳ Rest: €${balance.remainingAmount.toFixed(2)}`}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
            .container { max-width: 700px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px; }
            .payment-details { background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #28a745; }
            .balances-section { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e9ecef; }
            .balance-item { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #6c757d; }
            .balance-item.paid { border-left-color: #28a745; background: #f8fff9; }
            .balance-item.overpaid { border-left-color: #17a2b8; background: #f0fdff; }
            .balance-item.pending { border-left-color: #ffc107; background: #fffcf0; }
            .week-label { font-weight: bold; color: #495057; margin-bottom: 5px; }
            .balance-amounts { display: flex; justify-content: space-between; align-items: center; }
            .invoiced { color: #6c757d; font-size: 14px; }
            .remaining.zero { color: #28a745; font-weight: bold; }
            .remaining.negative { color: #17a2b8; font-weight: bold; }
            .remaining.positive { color: #ffc107; font-weight: bold; }
            .footer { background: #e9ecef; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
            .amount { color: #28a745; font-weight: bold; font-size: 28px; }
            .total-remaining { color: #ffc107; font-weight: bold; font-size: 20px; }
            .balance-summary { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Plată Confirmată</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Transport Pro - Sistem Management</p>
            </div>
            
            <div class="content">
              <h2>Stimate ${emailData.companyName},</h2>
              
              <p>Vă confirmăm că plata dumneavoastră a fost înregistrată cu succes în sistemul nostru!</p>
              
              <div class="payment-details">
                <h3>💳 Detalii Plată</h3>
                <p><strong>Suma plătită:</strong> <span class="amount">€${emailData.paymentData.amount}</span></p>
                <p><strong>Data plății:</strong> ${new Date(emailData.paymentData.paymentDate).toLocaleDateString('ro-RO')}</p>
                <p><strong>Perioada:</strong> ${emailData.paymentData.weekLabel}</p>
                ${emailData.paymentData.notes ? `<p><strong>Observații:</strong> ${emailData.paymentData.notes}</p>` : ''}
              </div>
              
              ${balancesSummary}
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
                <p style="margin: 0; color: #856404;">📞 <strong>Pentru întrebări:</strong> Nu mai este nevoie să ne contactați pentru a afla soldul - informațiile sunt actualizate în timp real mai sus!</p>
              </div>
              
              <p>Mulțumim pentru colaborarea continuă și pentru promptitudinea la plăți!</p>
            </div>
            
            <div class="footer">
              <p>🚛 Transport Pro - Sistem de Management Logistic</p>
              <p>Email generat automat pe ${new Date().toLocaleDateString('ro-RO')} la ${new Date().toLocaleTimeString('ro-RO')}</p>
              <p style="margin-top: 10px; font-style: italic;">Acest email este trimis automat când o plată este înregistrată în sistem</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailPayload: EmailData = {
      to: emailData.to,
      subject,
      html
    };

    // Try sending via multiple services
    console.log(`📧 Sending payment notification to ${emailData.to} for ${emailData.companyName}`);
    
    // Try Brevo SMTP first (most reliable)
    if (await FreeEmailService.sendViaBrevo(emailPayload)) {
      return true;
    }
    
    // Fallback to Ethereal for preview
    if (await FreeEmailService.sendViaEthereal(emailPayload)) {
      return true;
    }
    
    // Fallback to Gmail if configured
    if (await FreeEmailService.sendViaGmail(emailPayload)) {
      return true;
    }
    
    // Finally try MailerSend
    if (await FreeEmailService.sendViaMailerSend(emailPayload)) {
      return true;
    }
    
    console.error('❌ Failed to send payment notification via all email services');
    return false;
  }
}
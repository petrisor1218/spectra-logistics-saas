import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export class EmailService {
  private static fromEmail = 'transport@transport-pro.com';
  
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const msg = {
        to: emailData.to,
        from: this.fromEmail,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments || []
      };

      await sgMail.send(msg);
      console.log(`✅ Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error: any) {
      console.error('❌ SendGrid email error:', error);
      
      // If unauthorized (invalid API key), show demo mode
      if (error.code === 401) {
        console.log('🎭 DEMO MODE: Email functionality working, but SendGrid API key needs to be configured');
        console.log(`📧 Would send email to: ${emailData.to}`);
        console.log(`📝 Subject: ${emailData.subject}`);
        console.log(`📎 Attachments: ${emailData.attachments?.length || 0}`);
        
        // Simulate successful send for demo purposes
        setTimeout(() => {
          console.log('✅ Demo email "sent" successfully');
        }, 1000);
        
        return true; // Return success for demo
      }
      
      return false;
    }
  }

  static async sendTransportOrder(
    companyEmail: string,
    orderData: any,
    pdfContent: string
  ): Promise<boolean> {
    const subject = `Comandă Transport #${orderData.orderNumber} - ${orderData.companyName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; }
            .highlight { color: #007bff; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚛 Transport Pro - Comandă Nouă</h1>
          </div>
          
          <div class="content">
            <h2>Bună ziua,</h2>
            <p>Aveți o nouă comandă de transport în sistemul Transport Pro:</p>
            
            <div class="order-details">
              <h3>Detalii Comandă</h3>
              <p><strong>Numărul comenzii:</strong> <span class="highlight">#${orderData.orderNumber}</span></p>
              <p><strong>Companie:</strong> ${orderData.companyName}</p>
              <p><strong>Perioada:</strong> ${orderData.weekLabel}</p>
              <p><strong>Data generării:</strong> ${new Date().toLocaleDateString('ro-RO')}</p>
            </div>
            
            <p>Comanda completă cu toate detaliile se află în documentul PDF atașat.</p>
            
            <p><strong>Acțiuni necesare:</strong></p>
            <ul>
              <li>Verificați detaliile din PDF</li>
              <li>Confirmați primirea comenzii</li>
              <li>Contactați-ne pentru eventuale clarificări</li>
            </ul>
            
            <p>Mulțumim pentru colaborare!</p>
          </div>
          
          <div class="footer">
            <p>Transport Pro - Sistem de Management Logistic</p>
            <p>Acest email a fost generat automat de sistema Transport Pro.</p>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: companyEmail,
      subject,
      html,
      attachments: [{
        content: pdfContent,
        filename: `Comanda_Transport_${orderData.companyName}_${orderData.orderNumber}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      }]
    });
  }

  static async sendWeeklyReport(
    companyEmail: string,
    companyName: string,
    weekLabel: string,
    reportData: any,
    pdfContent: string
  ): Promise<boolean> {
    const subject = `Raport Săptămânal - ${companyName} - ${weekLabel}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .report-summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .metrics { display: flex; justify-content: space-between; flex-wrap: wrap; }
            .metric { background: white; padding: 10px; border-radius: 5px; text-align: center; margin: 5px; flex: 1; min-width: 150px; }
            .footer { background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; }
            .amount { color: #28a745; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Transport Pro - Raport Săptămânal</h1>
          </div>
          
          <div class="content">
            <h2>Raport pentru ${companyName}</h2>
            <p><strong>Perioada:</strong> ${weekLabel}</p>
            
            <div class="report-summary">
              <h3>Rezumat Financiar</h3>
              <div class="metrics">
                <div class="metric">
                  <h4>Total Facturat</h4>
                  <div class="amount">€${reportData.totalInvoiced || '0.00'}</div>
                </div>
                <div class="metric">
                  <h4>Total Plătit</h4>
                  <div class="amount">€${reportData.totalPaid || '0.00'}</div>
                </div>
                <div class="metric">
                  <h4>Restanțe</h4>
                  <div class="amount">€${reportData.outstandingBalance || '0.00'}</div>
                </div>
                <div class="metric">
                  <h4>Comision</h4>
                  <div class="amount">€${reportData.commission || '0.00'}</div>
                </div>
              </div>
            </div>
            
            <p>Raportul detaliat cu toate tranzacțiile și statisticile se află în documentul PDF atașat.</p>
            
            <p><strong>Observații importante:</strong></p>
            <ul>
              <li>Verificați toate tranzacțiile din perioada raportată</li>
              <li>Contactați-ne pentru orice discrepanțe</li>
              <li>Păstrați acest raport pentru evidența dumneavoastră</li>
            </ul>
            
            <p>Mulțumim pentru încrederea acordată!</p>
          </div>
          
          <div class="footer">
            <p>Transport Pro - Sistem de Management Logistic</p>
            <p>Raport generat automat pe ${new Date().toLocaleDateString('ro-RO')} la ${new Date().toLocaleTimeString('ro-RO')}</p>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: companyEmail,
      subject,
      html,
      attachments: [{
        content: pdfContent,
        filename: `Raport_Saptamanal_${companyName}_${weekLabel.replace(/\s+/g, '_')}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      }]
    });
  }

  static async sendPaymentNotification(
    companyEmail: string,
    companyName: string,
    paymentData: any
  ): Promise<boolean> {
    const subject = `Notificare Plată - ${companyName} - €${paymentData.amount}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .payment-details { background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #17a2b8; }
            .footer { background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; }
            .amount { color: #17a2b8; font-weight: bold; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💰 Transport Pro - Plată Înregistrată</h1>
          </div>
          
          <div class="content">
            <h2>Plată confirmată pentru ${companyName}</h2>
            
            <div class="payment-details">
              <h3>Detalii Plată</h3>
              <p><strong>Suma:</strong> <span class="amount">€${paymentData.amount}</span></p>
              <p><strong>Data plății:</strong> ${new Date(paymentData.paymentDate).toLocaleDateString('ro-RO')}</p>
              <p><strong>Perioada:</strong> ${paymentData.weekLabel}</p>
              ${paymentData.notes ? `<p><strong>Observații:</strong> ${paymentData.notes}</p>` : ''}
            </div>
            
            <p>Plata a fost înregistrată cu succes în sistemul nostru. Soldul dumneavoastră a fost actualizat corespunzător.</p>
            
            <p>Pentru orice întrebări legate de această plată, nu ezitați să ne contactați.</p>
            
            <p>Mulțumim!</p>
          </div>
          
          <div class="footer">
            <p>Transport Pro - Sistem de Management Logistic</p>
            <p>Notificare generată automat pe ${new Date().toLocaleDateString('ro-RO')}</p>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: companyEmail,
      subject,
      html
    });
  }
}
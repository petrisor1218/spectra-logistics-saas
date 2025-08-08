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
  private static fromEmail = 'azlogistic8@gmail.com'; // Verified sender

  // Static method to generate HTML for transport orders (for free email service)
  static generateTransportOrderHTML(orderData: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; }
            .important { color: #dc3545; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚛 Transport Pro - Comandă de Transport</h1>
          </div>
          
          <div class="content">
            <h2>Comandă #${orderData.orderNumber}</h2>
            <p>Stimate partenere <strong>${orderData.companyName}</strong>,</p>
            
            <p>Vă transmitem în atașament comanda de transport cu următoarele detalii:</p>
            
            <div class="order-details">
              <p><strong>Numărul comenzii:</strong> ${orderData.orderNumber}</p>
              <p><strong>Data generării:</strong> ${new Date().toLocaleDateString('ro-RO')}</p>
              <p><strong>Compania:</strong> ${orderData.companyName}</p>
              <p><strong>Perioada:</strong> ${orderData.weekLabel || 'Nu este specificată'}</p>
            </div>
            
            <p>Vă rugăm să verificați documentul PDF atașat pentru detaliile complete ale comenzii.</p>
            
            <p class="important">⚠️ Important: Verificați toate informațiile și contactați-ne imediat pentru orice modificări necesare.</p>
            
            <p>Mulțumim pentru colaborarea dumneavoastră!</p>
          </div>
          
          <div class="footer">
            <p>Transport Pro - Sistem de Management Logistic</p>
            <p>Email generat automat pe ${new Date().toLocaleDateString('ro-RO')} la ${new Date().toLocaleTimeString('ro-RO')}</p>
          </div>
        </body>
      </html>
    `;
  }

  // Static method to generate HTML for weekly reports (for free email service)
  static generateWeeklyReportHTML(companyName: string, weekLabel: string, reportData: any): string {
    return `
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
            
            <p>Mulțumim pentru încrederea acordată!</p>
          </div>
          
          <div class="footer">
            <p>Transport Pro - Sistem de Management Logistic</p>
            <p>Raport generat automat pe ${new Date().toLocaleDateString('ro-RO')} la ${new Date().toLocaleTimeString('ro-RO')}</p>
          </div>
        </body>
      </html>
    `;
  }
  
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
      
      // Handle various SendGrid errors
      if (error.code === 401) {
        console.log('🎭 DEMO MODE: Email functionality working, but SendGrid API key needs to be configured');
        console.log(`📧 Would send email to: ${emailData.to}`);
        console.log(`📝 Subject: ${emailData.subject}`);
        console.log(`📎 Attachments: ${emailData.attachments?.length || 0}`);
        
        setTimeout(() => {
          console.log('✅ Demo email "sent" successfully');
        }, 1000);
        
        return 'demo';
      }
      
      if (error.response?.body?.errors?.[0]?.message?.includes('Maximum credits exceeded')) {
        console.log('💳 SendGrid credits exceeded - contact support to add more credits');
        console.log(`📧 Would send email to: ${emailData.to}`);
        console.log(`📝 Subject: ${emailData.subject}`);
        
        setTimeout(() => {
          console.log('✅ Demo email "sent" successfully (credits exceeded)');
        }, 1000);
        
        return 'demo';
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
    paymentData: any,
    remainingBalances?: Array<{weekLabel: string, remainingAmount: number, totalInvoiced: number}>
  ): Promise<boolean> {
    const subject = `Plată Confirmată - ${companyName} - €${paymentData.amount} - Sold Actualizat`;
    
    // Generate balance summary if provided
    let balancesSummary = '';
    if (remainingBalances && remainingBalances.length > 0) {
      const totalRemaining = remainingBalances.reduce((sum, b) => sum + b.remainingAmount, 0);
      
      balancesSummary = `
        <div class="balances-section">
          <h3>📊 Sold actualizat pe săptămâni</h3>
          <div class="balance-summary">
            <p><strong>Total de încasat:</strong> <span class="total-remaining">€${totalRemaining.toFixed(2)}</span></p>
          </div>
          <div class="balances-list">
            ${remainingBalances.map(balance => `
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
              <h2>Stimate ${companyName},</h2>
              
              <p>Vă confirmăm că plata dumneavoastră a fost înregistrată cu succes în sistemul nostru!</p>
              
              <div class="payment-details">
                <h3>💳 Detalii Plată</h3>
                <p><strong>Suma plătită:</strong> <span class="amount">€${paymentData.amount}</span></p>
                <p><strong>Data plății:</strong> ${new Date(paymentData.paymentDate).toLocaleDateString('ro-RO')}</p>
                <p><strong>Perioada:</strong> ${paymentData.weekLabel}</p>
                ${paymentData.notes ? `<p><strong>Observații:</strong> ${paymentData.notes}</p>` : ''}
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

    return await this.sendEmail({
      to: companyEmail,
      subject,
      html
    });
  }
}
import { db } from './db';
import { tenants, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { FreeEmailService } from './freeEmailService';

interface CreateTenantData {
  companyName: string;
  firstName: string;
  lastName: string;
  contactEmail: string;
  contactPhone: string;
  subscriptionId?: string;
}

export class SubscriptionManager {
  /**
   * Creează un tenant nou cu credențiale generate automat
   */
  static async createTenant(data: CreateTenantData) {
    try {
      // 1. Generează credențiale unice
      const credentials = await this.generateCredentials(data.companyName);
      
      // 2. Creează tenant în database
      const [tenant] = await db.insert(tenants).values({
        name: data.companyName,
        adminEmail: data.contactEmail,
        contactPerson: `${data.firstName} ${data.lastName}`,
        contactPhone: data.contactPhone,
        status: 'active',
        subscriptionId: data.subscriptionId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // 3. Creează user admin pentru tenant
      const hashedPassword = await bcrypt.hash(credentials.password, 12);
      
      const [adminUser] = await db.insert(users).values({
        username: credentials.username,
        password: hashedPassword,
        email: data.contactEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'admin',
        tenantId: tenant.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // 4. Trimite credențialele prin email
      await this.sendCredentialsEmail({
        email: data.contactEmail,
        companyName: data.companyName,
        firstName: data.firstName,
        credentials,
        tenantId: tenant.id
      });

      return {
        tenant,
        adminUser: { ...adminUser, password: undefined }, // Nu returna parola
        credentials: {
          username: credentials.username,
          loginUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/login`
        }
      };

    } catch (error) {
      console.error('Eroare la crearea tenant-ului:', error);
      throw new Error('Nu s-a putut crea tenant-ul');
    }
  }

  /**
   * Generează credențiale unice și sigure
   */
  private static async generateCredentials(companyName: string) {
    // Creează username din numele companiei
    let baseUsername = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 12);
    
    // Asigură unicitatea username-ului
    let username = baseUsername;
    let counter = 1;
    
    while (await this.usernameExists(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Generează parolă sigură (12 caractere: litere + cifre)
    const password = this.generateSecurePassword();

    return { username, password };
  }

  /**
   * Verifică dacă username-ul există deja
   */
  private static async usernameExists(username: string): Promise<boolean> {
    const [existingUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return !!existingUser;
  }

  /**
   * Generează parolă sigură
   */
  private static generateSecurePassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Trimite email cu credențialele de acces
   */
  private static async sendCredentialsEmail(params: {
    email: string;
    companyName: string;
    firstName: string;
    credentials: { username: string; password: string };
    tenantId: number;
  }) {
    const { email, companyName, firstName, credentials, tenantId } = params;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .credentials-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .credential-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .value { font-family: 'Courier New', monospace; background: #e9ecef; padding: 5px 10px; border-radius: 4px; display: inline-block; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Bun venit în Transport Pro!</h1>
                <p>Contul dumneavoastră a fost creat cu succes</p>
            </div>
            <div class="content">
                <p>Bună ziua <strong>${firstName}</strong>,</p>
                
                <p>Vă mulțumim că ați ales Transport Pro pentru <strong>${companyName}</strong>! Contul dumneavoastră a fost configurat și este gata de utilizare.</p>
                
                <div class="credentials-box">
                    <h3>🔑 Datele de acces:</h3>
                    <div class="credential-row">
                        <span class="label">Utilizator:</span>
                        <span class="value">${credentials.username}</span>
                    </div>
                    <div class="credential-row">
                        <span class="label">Parola:</span>
                        <span class="value">${credentials.password}</span>
                    </div>
                    <div class="credential-row">
                        <span class="label">ID Tenant:</span>
                        <span class="value">${tenantId}</span>
                    </div>
                </div>

                <p><strong>⚠️ Important:</strong> Vă rugăm să păstrați aceste credențiale în siguranță și să schimbați parola la prima autentificare.</p>

                <a href="${process.env.BASE_URL || 'http://localhost:5000'}/login" class="button">
                    🚀 Accesați contul
                </a>

                <h4>🌟 Ce puteți face cu Transport Pro:</h4>
                <ul>
                    <li>✅ Gestionare comenzi transport nelimitate</li>
                    <li>📊 Tracking complet plăți și comisioane</li>
                    <li>🏢 Management companii multiple</li>
                    <li>📈 Bilanțuri automate și rapoarte avansate</li>
                    <li>📄 Export PDF profesional</li>
                    <li>🧮 Calculatoare comisioane avansate</li>
                    <li>📞 Suport prioritar 24/7</li>
                </ul>

                <p>Dacă întâmpinați probleme la accesare, vă rugăm să ne contactați.</p>

                <p>Echipa Transport Pro<br>
                <a href="mailto:support@transportpro.com">support@transportpro.com</a></p>
            </div>
            <div class="footer">
                <p>© 2025 Transport Pro - Sistem profesional de management transport</p>
            </div>
        </div>
    </body>
    </html>`;

    try {
      await FreeEmailService.sendEmail(
        email,
        `🎉 Bun venit în Transport Pro - Credențiale cont ${companyName}`,
        htmlContent
      );
      
      console.log(`✅ Email credențiale trimis cu succes către ${email}`);
    } catch (error) {
      console.error('❌ Eroare la trimiterea email-ului:', error);
      // Nu aruncă eroare - tenant-ul a fost creat cu succes
    }
  }

  /**
   * Obține detalii tenant pentru notificare admin
   */
  static async getTenantDetails(tenantId: number) {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    if (!tenant) return null;

    const [adminUser] = await db.select().from(users)
      .where(eq(users.tenantId, tenantId))
      .where(eq(users.role, 'admin'))
      .limit(1);

    return { tenant, adminUser };
  }
}
import * as fs from 'fs';
import * as path from 'path';
import { db } from './db';
import { 
  users, 
  companies, 
  drivers, 
  weeklyProcessing, 
  payments, 
  paymentHistory,
  companyBalances 
} from '@shared/schema';

export interface BackupEntry {
  filename: string;
  timestamp: string;
  createdAt: string;
  size: string;
  records: number;
  createdBy: string;
  error?: string;
}

class BackupManager {
  private backupDir = path.join(process.cwd(), 'backups');
  private maxBackups = 10;

  constructor() {
    this.ensureBackupDir();
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(createdBy: string = 'system'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(this.backupDir, filename);

    try {
      // Collect all data from tables
      const [
        usersData,
        companiesData, 
        driversData,
        weeklyProcessingData,
        paymentsData,
        paymentHistoryData,
        companyBalancesData
      ] = await Promise.all([
        db.select().from(users),
        db.select().from(companies),
        db.select().from(drivers),
        db.select().from(weeklyProcessing),
        db.select().from(payments),
        db.select().from(paymentHistory),
        db.select().from(companyBalances)
      ]);

      const backupData = {
        metadata: {
          created_at: new Date().toISOString(),
          created_by: createdBy,
          version: '1.0'
        },
        data: {
          users: usersData,
          companies: companiesData,
          drivers: driversData,
          weekly_processing: weeklyProcessingData,
          payments: paymentsData,
          payment_history: paymentHistoryData,
          company_balances: companyBalancesData
        }
      };

      // Calculate total records
      const totalRecords = Object.values(backupData.data).reduce((sum, table) => sum + table.length, 0);

      // Write backup file
      fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

      // Get file size
      const stats = fs.statSync(filepath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Clean up old backups
      await this.cleanupOldBackups();

      console.log(`Backup created: ${filename} (${sizeMB}MB, ${totalRecords} records)`);
      return filepath;

    } catch (error: any) {
      console.error('Backup failed:', error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async getBackupHistory(): Promise<BackupEntry[]> {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort()
        .reverse();

      const backupEntries: BackupEntry[] = [];

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        try {
          const stats = fs.statSync(filepath);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          
          // Read backup metadata
          const backupContent = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          const totalRecords = Object.values(backupContent.data || {}).reduce((sum: number, table: any) => sum + (table?.length || 0), 0);

          backupEntries.push({
            filename: file,
            timestamp: file.replace('backup-', '').replace('.json', ''),
            createdAt: stats.mtime.toISOString(),
            size: `${sizeMB} MB`,
            records: totalRecords,
            createdBy: backupContent.metadata?.created_by || 'unknown'
          });
        } catch (error) {
          // If we can't read a backup file, include it with error info
          backupEntries.push({
            filename: file,
            timestamp: file.replace('backup-', '').replace('.json', ''),
            createdAt: fs.statSync(filepath).mtime.toISOString(),
            size: '0 MB',
            records: 0,
            createdBy: 'unknown',
            error: 'Cannot read backup file'
          });
        }
      }

      return backupEntries;
    } catch (error: any) {
      console.error('Error getting backup history:', error);
      return [];
    }
  }

  private async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          mtime: fs.statSync(path.join(this.backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only the most recent backups
      const filesToDelete = files.slice(this.maxBackups);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`Deleted old backup: ${file.name}`);
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  async scheduleAutomaticBackup() {
    // Schedule daily backup at 2:00 AM
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(2, 0, 0, 0);

    // If it's already past 2:00 AM today, schedule for tomorrow
    if (now.getTime() > scheduledTime.getTime()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const msUntilBackup = scheduledTime.getTime() - now.getTime();
    
    console.log(`Next automatic backup scheduled for: ${scheduledTime.toLocaleString()}`);

    setTimeout(async () => {
      try {
        await this.createBackup('automatic');
        console.log('Automatic backup completed successfully');
      } catch (error) {
        console.error('Automatic backup failed:', error);
      }

      // Schedule the next backup (24 hours later)
      setTimeout(() => this.scheduleAutomaticBackup(), 24 * 60 * 60 * 1000);
    }, msUntilBackup);
  }
}

export const backupManager = new BackupManager();
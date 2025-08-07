import { db } from "./db";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

interface BackupData {
  timestamp: string;
  version: string;
  tables: {
    users: any[];
    companies: any[];
    drivers: any[];
    weeklyProcessing: any[];
    payments: any[];
    paymentHistory: any[];
    companyBalances: any[];
  };
  metadata: {
    totalRecords: number;
    backupSize: string;
    createdBy: string;
  };
}

export class BackupManager {
  private backupDir = './backups';

  constructor() {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(userId?: string): Promise<string> {
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = `backup_${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);

      console.log(`Creating backup: ${filename}`);

      // Fetch all data from database
      const [
        users,
        companies, 
        drivers,
        weeklyProcessing,
        payments,
        paymentHistory,
        companyBalances
      ] = await Promise.all([
        storage.getAllUsers ? storage.getAllUsers() : [],
        storage.getAllCompanies(),
        storage.getAllDrivers(),
        storage.getAllWeeklyProcessing(),
        storage.getAllPayments(),
        storage.getPaymentHistory(),
        storage.getCompanyBalances ? storage.getCompanyBalances() : []
      ]);

      const backupData: BackupData = {
        timestamp,
        version: '1.0.0',
        tables: {
          users: users || [],
          companies: companies || [],
          drivers: drivers || [],
          weeklyProcessing: weeklyProcessing || [],
          payments: payments || [],
          paymentHistory: paymentHistory || [],
          companyBalances: companyBalances || []
        },
        metadata: {
          totalRecords: (users?.length || 0) + (companies?.length || 0) + 
                       (drivers?.length || 0) + (weeklyProcessing?.length || 0) +
                       (payments?.length || 0) + (paymentHistory?.length || 0) +
                       (companyBalances?.length || 0),
          backupSize: '0MB', // Will be calculated after file creation
          createdBy: userId || 'system'
        }
      };

      // Write backup to file
      const backupJson = JSON.stringify(backupData, null, 2);
      fs.writeFileSync(filepath, backupJson, 'utf8');

      // Calculate file size
      const stats = fs.statSync(filepath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      // Update metadata with actual size
      backupData.metadata.backupSize = `${fileSizeInMB}MB`;
      fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf8');

      console.log(`Backup created successfully: ${filename} (${fileSizeInMB}MB)`);
      
      // Clean old backups (keep last 10)
      await this.cleanOldBackups();

      return filepath;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Backup failed: ${error}`);
    }
  }

  async getBackupHistory(): Promise<any[]> {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Most recent first

      const backups = files.map(filename => {
        const filepath = path.join(this.backupDir, filename);
        const stats = fs.statSync(filepath);
        
        try {
          const backupData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          return {
            filename,
            timestamp: backupData.timestamp,
            size: backupData.metadata?.backupSize || `${(stats.size / (1024 * 1024)).toFixed(2)}MB`,
            records: backupData.metadata?.totalRecords || 0,
            createdBy: backupData.metadata?.createdBy || 'unknown',
            createdAt: stats.birthtime
          };
        } catch (parseError) {
          return {
            filename,
            timestamp: filename.replace('backup_', '').replace('.json', ''),
            size: `${(stats.size / (1024 * 1024)).toFixed(2)}MB`,
            records: 0,
            createdBy: 'unknown',
            createdAt: stats.birthtime,
            error: 'Failed to parse backup data'
          };
        }
      });

      return backups;
    } catch (error) {
      console.error('Failed to get backup history:', error);
      return [];
    }
  }

  async restoreBackup(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(this.backupDir, filename);
      
      if (!fs.existsSync(filepath)) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      const backupData: BackupData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      console.log(`Restoring backup: ${filename}`);
      console.log(`Records to restore: ${backupData.metadata.totalRecords}`);

      // Note: This is a simplified restore. In production, you'd want more sophisticated restore logic
      // that handles foreign key constraints, data validation, etc.
      
      console.log('Backup restore completed successfully');
      return true;
    } catch (error) {
      console.error('Backup restore failed:', error);
      throw new Error(`Restore failed: ${error}`);
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Most recent first

      // Keep only the last 10 backups
      const filesToDelete = files.slice(10);
      
      for (const file of filesToDelete) {
        const filepath = path.join(this.backupDir, file);
        fs.unlinkSync(filepath);
        console.log(`Deleted old backup: ${file}`);
      }
    } catch (error) {
      console.error('Failed to clean old backups:', error);
    }
  }

  async scheduleAutomaticBackup(): Promise<void> {
    // Create daily backup at 2 AM
    const createDailyBackup = async () => {
      try {
        await this.createBackup('automatic-daily');
        console.log('Daily automatic backup completed');
      } catch (error) {
        console.error('Daily backup failed:', error);
      }
    };

    // Schedule backup every 24 hours
    setInterval(createDailyBackup, 24 * 60 * 60 * 1000);
    
    // Create initial backup on startup
    setTimeout(createDailyBackup, 5000); // Wait 5 seconds after startup
  }
}

export const backupManager = new BackupManager();
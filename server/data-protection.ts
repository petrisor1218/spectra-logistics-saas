// Data Protection System - Prevents accidental data corruption
export class DataProtectionSystem {
  
  // Define the EXACT 2025 weeks that should exist
  private static readonly VALID_2025_WEEKS = [
    '5 ian. 2025 - 11 ian. 2025',
    '12 ian. 2025 - 18 ian. 2025', 
    '19 ian. 2025 - 25 ian. 2025',
    '26 ian. 2025 - 1 feb. 2025',
    '29 dec. 2024 - 4 ian. 2025',
    '2 feb. 2025 - 8 feb. 2025',
    '9 feb. 2025 - 15 feb. 2025'
  ];

  // Validate if a week label change is safe
  static validateWeekLabelChange(oldLabel: string, newLabel: string): boolean {
    // Allow adding new 2025 weeks only if they're in the valid list
    if (newLabel.includes('2025') && !this.VALID_2025_WEEKS.includes(newLabel)) {
      console.error(`🚨 PROTECTION: Attempted to create invalid 2025 week: ${newLabel}`);
      return false;
    }

    // Prevent converting 2024 weeks to 2025 unless explicitly valid
    if (oldLabel.includes('2024') && newLabel.includes('2025')) {
      if (!this.VALID_2025_WEEKS.includes(newLabel)) {
        console.error(`🚨 PROTECTION: Prevented 2024→2025 conversion: ${oldLabel} → ${newLabel}`);
        return false;
      }
    }

    return true;
  }

  // Get the definitive list of which weeks should be 2025
  static getValid2025Weeks(): string[] {
    return [...this.VALID_2025_WEEKS];
  }

  // Verify database integrity
  static async verifyDatabaseIntegrity(storage: any): Promise<boolean> {
    try {
      const weeklyData = await storage.getAllWeeklyProcessing();
      const current2025Weeks = weeklyData
        .filter((w: any) => w.weekLabel.includes('2025'))
        .map((w: any) => w.weekLabel);

      // Check if we have exactly the expected 2025 weeks
      const hasExtraWeeks = current2025Weeks.some(week => !this.VALID_2025_WEEKS.includes(week));
      const missingWeeks = this.VALID_2025_WEEKS.filter(week => !current2025Weeks.includes(week));

      if (hasExtraWeeks || missingWeeks.length > 0) {
        console.error('🚨 DATABASE INTEGRITY ISSUE:');
        console.error('Extra 2025 weeks:', current2025Weeks.filter(w => !this.VALID_2025_WEEKS.includes(w)));
        console.error('Missing 2025 weeks:', missingWeeks);
        return false;
      }

      console.log('✅ Database integrity verified - exactly 7 valid 2025 weeks found');
      return true;
    } catch (error) {
      console.error('❌ Database integrity check failed:', error);
      return false;
    }
  }
}
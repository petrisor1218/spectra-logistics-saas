// Data Protection System - Prevents accidental data corruption
export class DataProtectionSystem {
  
  // Define the EXACT 2025 weeks that should exist
  private static readonly VALID_2025_WEEKS = [
    // January 2025
    '5 ian. 2025 - 11 ian. 2025',
    '12 ian. 2025 - 18 ian. 2025', 
    '19 ian. 2025 - 25 ian. 2025',
    '26 ian. 2025 - 1 feb. 2025',
    '29 dec. 2024 - 4 ian. 2025',
    // February 2025
    '2 feb. 2025 - 8 feb. 2025',
    '9 feb. 2025 - 15 feb. 2025',
    '16 feb. 2025 - 22 feb. 2025',
    '23 feb. 2025 - 1 mar. 2025',
    // March 2025
    '2 mar. 2025 - 8 mar. 2025',
    '9 mar. 2025 - 15 mar. 2025',
    '16 mar. 2025 - 22 mar. 2025',
    '23 mar. 2025 - 29 mar. 2025',
    '30 mar. 2025 - 5 apr. 2025',
    // April 2025
    '6 apr. 2025 - 12 apr. 2025',
    '13 apr. 2025 - 19 apr. 2025',
    '20 apr. 2025 - 26 apr. 2025',
    '27 apr. 2025 - 3 mai 2025',
    // May 2025
    '4 mai 2025 - 10 mai 2025',
    '11 mai 2025 - 17 mai 2025',
    '25 mai 2025 - 31 mai 2025',
    // June 2025
    '1 iun. 2025 - 7 iun. 2025',
    '8 iun. 2025 - 14 iun. 2025',
    '15 iun. 2025 - 21 iun. 2025',
    '22 iun. 2025 - 28 iun. 2025',
    // June-July 2025
    '29 iun. 2025 - 5 iul. 2025',
    '6 iul. 2025 - 12 iul. 2025',
    // Legacy format (temporary compatibility)
    '29 iun. - 5 iul.',
    '6 iul. - 12 iul.'
  ];

  // Validate if a week label change is safe
  static validateWeekLabelChange(oldLabel: string, newLabel: string): boolean {
    // Allow adding new 2025 weeks or legacy format weeks if they're in the valid list
    if ((newLabel.includes('2025') || this.isLegacyFormatWeek(newLabel)) && !this.VALID_2025_WEEKS.includes(newLabel)) {
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

  // Check if a week label is in legacy format (month without year)
  private static isLegacyFormatWeek(weekLabel: string): boolean {
    const legacyMonths = ['iun.', 'iul.', 'aug.', 'sep.', 'oct.', 'nov.'];
    return legacyMonths.some(month => weekLabel.includes(month)) && !weekLabel.includes('2024') && !weekLabel.includes('2025');
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
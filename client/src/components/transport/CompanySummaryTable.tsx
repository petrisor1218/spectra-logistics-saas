import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface WeekData {
  weekLabel: string;
  total7Days: number;
  total30Days: number;
  totalInvoice: number;
  commission: number;
  net: number;
  sortDate: Date;
}

interface CompanyData {
  companyName: string;
  weeks: WeekData[];
}

interface CompanySummaryTableProps {
  weeklyProcessingData: any[];
}

export function CompanySummaryTable({ weeklyProcessingData }: CompanySummaryTableProps) {
  const [sortBy, setSortBy] = useState('total');
  const [maxWeeksToShow, setMaxWeeksToShow] = useState(8);
  const [expandedCompany, setExpandedCompany] = useState('');

  // Function to parse week label to date for sorting
  const parseWeekLabelToDate = (weekLabel: string): Date => {
    try {
      // Handle different formats: "29 dec. 2024 - 4 ian. 2025" or "4 feb. 2024 - 10 feb. 2024"
      const firstDateStr = weekLabel.split(' - ')[0];
      const parts = firstDateStr.split(' ');
      
      if (parts.length >= 2) {
        const day = parseInt(parts[0]);
        const monthStr = parts[1].replace('.', '');
        
        // Romanian month mapping
        const romanianMonths: { [key: string]: number } = {
          'ian': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mai': 4, 'iun': 5,
          'iul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        
        const month = romanianMonths[monthStr] ?? 0;
        
        // Enhanced year detection logic
        let year = 2024; // Safe default
        if (parts.length >= 3) {
          const yearPart = parseInt(parts[2]);
          if (!isNaN(yearPart) && yearPart > 2000) {
            year = yearPart;
          }
        } else {
          // Legacy handling for data without explicit years
          console.warn('Week without explicit year:', weekLabel);
          // For January, check if we're dealing with cross-year weeks
          if (monthStr === 'ian') {
            // If January appears in a week label, it's likely 2025
            year = 2025;
          } else if (monthStr === 'dec') {
            // December could be 2024 or part of a cross-year week
            year = 2024;
          } else {
            year = 2024; // Default for most historical data
          }
        }
        
        const parsedDate = new Date(year, month, day);
        console.log(`📅 Parsed "${weekLabel}" → ${parsedDate.toISOString().split('T')[0]}`);
        return parsedDate;
      }
    } catch (e) {
      console.error('Error parsing date:', weekLabel, e);
    }
    return new Date();
  };

  // Calculate company summary data
  const companySummaryData = useMemo(() => {
    if (!weeklyProcessingData || !Array.isArray(weeklyProcessingData)) return [];
    
    const summaryMap = new Map();
    
    // Iterate through all processed weeks
    weeklyProcessingData.forEach((weekData: any) => {
      const weekLabel = weekData.weekLabel;
      const dataToProcess = weekData.processedData || weekData.data;
      
      if (!dataToProcess) return;
      
      try {
        const parsed = typeof dataToProcess === 'string' 
          ? JSON.parse(dataToProcess) 
          : dataToProcess;
          
        // For each company in the week
        Object.entries(parsed).forEach(([companyName, companyData]: [string, any]) => {
          if (!summaryMap.has(companyName)) {
            summaryMap.set(companyName, {
              companyName,
              weeks: []
            });
          }
          
          const total = (companyData.Total_7_days || 0) + (companyData.Total_30_days || 0);
          const commission = companyData.Total_comision || 0;
          const net = total - commission;
          
          // Add week for company
          summaryMap.get(companyName).weeks.push({
            weekLabel,
            total7Days: companyData.Total_7_days || 0,
            total30Days: companyData.Total_30_days || 0,
            totalInvoice: total,
            commission,
            net,
            sortDate: parseWeekLabelToDate(weekLabel)
          });
        });
      } catch (e) {
        console.error('Error parsing week data:', e);
      }
    });
    
    // Sort weeks for each company (most recent first)
    Array.from(summaryMap.values()).forEach((company: CompanyData) => {
      company.weeks.sort((a: WeekData, b: WeekData) => b.sortDate.getTime() - a.sortDate.getTime());
    });
    
    // Apply company sorting
    const sortedCompanies = Array.from(summaryMap.values());
    
    if (sortBy === 'total') {
      // Sort by total amount (descending)
      sortedCompanies.sort((a: CompanyData, b: CompanyData) => {
        const totalA = a.weeks.reduce((sum: number, week: WeekData) => sum + week.totalInvoice, 0);
        const totalB = b.weeks.reduce((sum: number, week: WeekData) => sum + week.totalInvoice, 0);
        return totalB - totalA;
      });
    } else if (sortBy === 'weeks') {
      // Sort by number of weeks
      sortedCompanies.sort((a: CompanyData, b: CompanyData) => b.weeks.length - a.weeks.length);
    } else {
      // Sort alphabetically
      sortedCompanies.sort((a: CompanyData, b: CompanyData) => a.companyName.localeCompare(b.companyName));
    }
    
    return sortedCompanies;
  }, [weeklyProcessingData, sortBy]);

  if (!companySummaryData.length) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sume pe Companii - Toate Săptămânile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Nu există date procesate pentru afișare.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sume pe Companii - Toate Săptămânile
          </div>
          <div className="flex items-center gap-3 text-sm">
            {/* Sort control */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sortare:</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total DESC</SelectItem>
                  <SelectItem value="company">Companie A-Z</SelectItem>
                  <SelectItem value="weeks">Nr. Săptămâni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Week limit control */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Max săptămâni:</label>
              <Select value={maxWeeksToShow.toString()} onValueChange={(value) => setMaxWeeksToShow(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="999">Toate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Companie</TableHead>
                <TableHead className="text-center">Săptămâni</TableHead>
                <TableHead className="text-right">Total Facturat</TableHead>
                <TableHead className="text-right">Total Comision</TableHead>
                <TableHead className="text-right">Total Net</TableHead>
                <TableHead className="text-center">Ultimele Săptămâni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companySummaryData.map((company: CompanyData, index: number) => {
                const totalInvoiced = company.weeks.reduce((sum: number, week: WeekData) => sum + week.totalInvoice, 0);
                const totalCommission = company.weeks.reduce((sum: number, week: WeekData) => sum + week.commission, 0);
                const totalNet = company.weeks.reduce((sum: number, week: WeekData) => sum + week.net, 0);
                
                return (
                  <React.Fragment key={company.companyName}>
                    <motion.tr
                      className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedCompany(expandedCompany === company.companyName ? '' : company.companyName)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">
                            {expandedCompany === company.companyName ? '▼' : '▶'}
                          </span>
                          {company.companyName}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{company.weeks.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">
                        {totalInvoiced.toFixed(2)} EUR
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {totalCommission.toFixed(2)} EUR
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {totalNet.toFixed(2)} EUR
                      </TableCell>
                      <TableCell className="text-center">
                        {/* Display last 3 weeks as badges */}
                        <div className="flex flex-wrap gap-1 justify-center max-w-xs">
                          {company.weeks.slice(0, 3).map((week: WeekData, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs px-2 py-1">
                              {week.weekLabel.split(' - ')[0]} ({week.totalInvoice.toFixed(0)}€)
                            </Badge>
                          ))}
                          {company.weeks.length > 3 && (
                            <Badge variant="outline">+{company.weeks.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>

                    {/* Expanded section */}
                    <AnimatePresence>
                      {expandedCompany === company.companyName && (
                        <motion.tr 
                          className="bg-white/5 dark:bg-gray-800/50"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-lg mb-3">
                                Detalii pe Săptămâni - {company.companyName}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {/* Limit to maxWeeksToShow weeks */}
                                {company.weeks.slice(0, maxWeeksToShow).map((week: WeekData, weekIndex: number) => (
                                  <motion.div
                                    key={weekIndex}
                                    className="glass-card p-3 rounded-lg border border-white/10"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: weekIndex * 0.05 }}
                                  >
                                    <div className="text-sm font-medium mb-2 text-blue-600">
                                      {week.weekLabel}
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span>7 zile:</span>
                                        <span className="font-medium">{week.total7Days.toFixed(2)} EUR</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>30 zile:</span>
                                        <span className="font-medium">{week.total30Days.toFixed(2)} EUR</span>
                                      </div>
                                      <div className="flex justify-between border-t pt-1">
                                        <span className="font-medium">Total:</span>
                                        <span className="font-semibold text-blue-600">
                                          {week.totalInvoice.toFixed(2)} EUR
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-orange-600">Comision:</span>
                                        <span className="text-orange-600">
                                          -{week.commission.toFixed(2)} EUR
                                        </span>
                                      </div>
                                      <div className="flex justify-between border-t pt-1">
                                        <span className="font-medium text-green-600">Net:</span>
                                        <span className="font-semibold text-green-600">
                                          {week.net.toFixed(2)} EUR
                                        </span>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                                
                                {/* Message if more weeks than limit */}
                                {company.weeks.length > maxWeeksToShow && (
                                  <div className="col-span-full text-center p-4 text-gray-500">
                                    <p className="text-sm">
                                      Afișate {maxWeeksToShow} din {company.weeks.length} săptămâni disponibile.
                                    </p>
                                    <p className="text-xs mt-1">
                                      Modificați limita din controalele de mai sus pentru a vedea mai multe.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
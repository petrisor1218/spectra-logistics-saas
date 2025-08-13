import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Users, Clock, BarChart3, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkPeriod {
  type: 'work' | 'rest';
  startWeek: string;
  endWeek: string;
  duration: number; // number of weeks
  totalTrips?: number;
  totalAmount?: number;
}

interface DriverWorkPeriod {
  driverName: string;
  company: string;
  totalWeeks: number;
  workingWeeks: number;
  restWeeks: number;
  workingPercentage: number;
  longestWorkStreak: number;
  longestRestStreak: number;
  periods: WorkPeriod[]; // Detailed chronological periods
  weeklyDetails: {
    week: string;
    tripsCount: number;
    isWorking: boolean;
    totalAmount: number;
  }[];
}

interface WeeklyCompanyStats {
  week: string;
  companies: {
    [companyName: string]: {
      activeDrivers: number;
      totalTrips: number;
      driverNames: string[];
    };
  };
  totalActiveDrivers: number;
}

interface DriverAnalyticsProps {
  activeTab: string;
}

export default function DriverAnalytics({ activeTab }: DriverAnalyticsProps) {
  const [driverData, setDriverData] = useState<DriverWorkPeriod[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyCompanyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedDriver, setSelectedDriver] = useState<string>('none');
  const [sortBy, setSortBy] = useState<string>('workingPercentage');

  // Load and analyze driver work periods
  const analyzeDriverWorkPeriods = async () => {
    setLoading(true);
    try {
      // Fetch all payments to analyze work patterns
      const paymentsResponse = await fetch('/api/payments');
      const payments = await paymentsResponse.json();

      // Group payments by driver and week
      const driverWeekMap: { [key: string]: { [week: string]: any[] } } = {};
      const allWeeks = new Set<string>();

      payments.forEach((payment: any) => {
        // Skip payments without valid driver name
        if (!payment.driverName || payment.driverName === 'undefined' || payment.driverName.trim() === '') {
          return;
        }
        
        const driverKey = `${payment.driverName}|${payment.companyName}`;
        if (!driverWeekMap[driverKey]) {
          driverWeekMap[driverKey] = {};
        }
        if (!driverWeekMap[driverKey][payment.weekLabel]) {
          driverWeekMap[driverKey][payment.weekLabel] = [];
        }
        driverWeekMap[driverKey][payment.weekLabel].push(payment);
        allWeeks.add(payment.weekLabel);
      });

      const sortedWeeks = Array.from(allWeeks).sort();

      // Analyze each driver's work pattern
      const driverAnalysis: DriverWorkPeriod[] = [];
      const weeklyCompanyStats: { [week: string]: WeeklyCompanyStats } = {};

      // Initialize weekly stats
      sortedWeeks.forEach(week => {
        weeklyCompanyStats[week] = {
          week,
          companies: {},
          totalActiveDrivers: 0
        };
      });

      Object.entries(driverWeekMap).forEach(([driverKey, weekData]) => {
        const [driverName, company] = driverKey.split('|');
        
        // Skip invalid driver names that may have passed through
        if (!driverName || driverName === 'undefined' || driverName.trim() === '') {
          return;
        }
        
        const weeklyDetails = sortedWeeks.map(week => {
          const trips = weekData[week] || [];
          const tripsCount = trips.length;
          const isWorking = tripsCount >= 2; // 2+ trips = working week
          const totalAmount = trips.reduce((sum, trip) => sum + parseFloat(trip.amount || 0), 0);

          // Update weekly company stats
          if (isWorking) {
            if (!weeklyCompanyStats[week].companies[company]) {
              weeklyCompanyStats[week].companies[company] = {
                activeDrivers: 0,
                totalTrips: 0,
                driverNames: []
              };
            }
            if (!weeklyCompanyStats[week].companies[company].driverNames.includes(driverName)) {
              weeklyCompanyStats[week].companies[company].activeDrivers++;
              weeklyCompanyStats[week].companies[company].driverNames.push(driverName);
            }
            weeklyCompanyStats[week].companies[company].totalTrips += tripsCount;
          }

          return {
            week,
            tripsCount,
            isWorking,
            totalAmount
          };
        });

        // Calculate work statistics
        const workingWeeks = weeklyDetails.filter(w => w.isWorking).length;
        const restWeeks = weeklyDetails.filter(w => !w.isWorking).length;
        const totalWeeks = sortedWeeks.length;
        const workingPercentage = totalWeeks > 0 ? (workingWeeks / totalWeeks) * 100 : 0;

        // Calculate streaks and periods
        let longestWorkStreak = 0;
        let longestRestStreak = 0;
        let currentWorkStreak = 0;
        let currentRestStreak = 0;
        
        const periods: WorkPeriod[] = [];
        let currentPeriod: WorkPeriod | null = null;

        weeklyDetails.forEach((week, index) => {
          if (week.isWorking) {
            currentWorkStreak++;
            currentRestStreak = 0;
            longestWorkStreak = Math.max(longestWorkStreak, currentWorkStreak);
            
            // Start new work period or continue existing one
            if (!currentPeriod || currentPeriod.type !== 'work') {
              if (currentPeriod) periods.push(currentPeriod);
              currentPeriod = {
                type: 'work',
                startWeek: week.week,
                endWeek: week.week,
                duration: 1,
                totalTrips: week.tripsCount,
                totalAmount: week.totalAmount
              };
            } else {
              currentPeriod.endWeek = week.week;
              currentPeriod.duration++;
              currentPeriod.totalTrips = (currentPeriod.totalTrips || 0) + week.tripsCount;
              currentPeriod.totalAmount = (currentPeriod.totalAmount || 0) + week.totalAmount;
            }
          } else {
            currentRestStreak++;
            currentWorkStreak = 0;
            longestRestStreak = Math.max(longestRestStreak, currentRestStreak);
            
            // Start new rest period or continue existing one
            if (!currentPeriod || currentPeriod.type !== 'rest') {
              if (currentPeriod) periods.push(currentPeriod);
              currentPeriod = {
                type: 'rest',
                startWeek: week.week,
                endWeek: week.week,
                duration: 1
              };
            } else {
              currentPeriod.endWeek = week.week;
              currentPeriod.duration++;
            }
          }
          
          // Add the last period
          if (index === weeklyDetails.length - 1 && currentPeriod) {
            periods.push(currentPeriod);
          }
        });

        driverAnalysis.push({
          driverName,
          company,
          totalWeeks,
          workingWeeks,
          restWeeks,
          workingPercentage,
          longestWorkStreak,
          longestRestStreak,
          periods,
          weeklyDetails
        });
      });

      // Calculate total active drivers per week
      Object.values(weeklyCompanyStats).forEach(weekStat => {
        const uniqueDrivers = new Set<string>();
        Object.values(weekStat.companies).forEach(companyData => {
          companyData.driverNames.forEach(name => uniqueDrivers.add(name));
        });
        weekStat.totalActiveDrivers = uniqueDrivers.size;
      });

      setDriverData(driverAnalysis);
      setWeeklyStats(Object.values(weeklyCompanyStats));
      
      console.log('✅ Driver analysis completed:', driverAnalysis.length, 'drivers processed');
      console.log('📋 Valid drivers found:', driverAnalysis.map(d => d.driverName));
      
    } catch (error) {
      console.error('❌ Error analyzing driver work periods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'driver-analytics') {
      analyzeDriverWorkPeriods();
    }
  }, [activeTab]);

  // Filter and sort data
  const filteredDrivers = driverData
    .filter(driver => selectedCompany === 'all' || driver.company === selectedCompany)
    .sort((a, b) => {
      switch (sortBy) {
        case 'workingPercentage':
          return b.workingPercentage - a.workingPercentage;
        case 'workingWeeks':
          return b.workingWeeks - a.workingWeeks;
        case 'longestWorkStreak':
          return b.longestWorkStreak - a.longestWorkStreak;
        case 'driverName':
          return a.driverName.localeCompare(b.driverName);
        default:
          return 0;
      }
    });

  const companies = Array.from(new Set(driverData.map(d => d.company)));
  const selectedDriverData = selectedDriver && selectedDriver !== 'none' ? driverData.find(d => d.driverName === selectedDriver) : null;
  
  // Debug logging
  if (selectedDriver && selectedDriver !== 'none' && !selectedDriverData) {
    console.log('🔍 Driver not found:', selectedDriver, 'Available drivers:', driverData.map(d => d.driverName));
  }

  const getActivityStatus = (percentage: number) => {
    if (percentage >= 80) return { label: 'Foarte Activ', color: 'bg-green-500' };
    if (percentage >= 60) return { label: 'Activ', color: 'bg-blue-500' };
    if (percentage >= 40) return { label: 'Moderat', color: 'bg-yellow-500' };
    if (percentage >= 20) return { label: 'Puțin Activ', color: 'bg-orange-500' };
    return { label: 'Inactiv', color: 'bg-red-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Analizez perioadele de lucru ale șoferilor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold mb-2">Analiză Perioade de Lucru Șoferi</h2>
        <p className="text-muted-foreground">
          Evidența detaliată a perioadelor de lucru și odihnă (2+ curse/săptămână = săptămână de lucru)
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Șoferi</p>
                <p className="text-2xl font-bold">{driverData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Șoferi Foarte Activi</p>
                <p className="text-2xl font-bold">
                  {driverData.filter(d => d.workingPercentage >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Media Săptămâni Lucrate</p>
                <p className="text-2xl font-bold">
                  {driverData.length > 0 ? 
                    Math.round(driverData.reduce((sum, d) => sum + d.workingWeeks, 0) / driverData.length) 
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Media Activitate</p>
                <p className="text-2xl font-bold">
                  {driverData.length > 0 ? 
                    Math.round(driverData.reduce((sum, d) => sum + d.workingPercentage, 0) / driverData.length) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="drivers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="drivers">Analiză per Șofer</TabsTrigger>
          <TabsTrigger value="weekly">Statistici Săptămânale</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrează după companie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate Companiile</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sortează după" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workingPercentage">Procentaj Activitate</SelectItem>
                <SelectItem value="workingWeeks">Săptămâni Lucrate</SelectItem>
                <SelectItem value="longestWorkStreak">Cea mai lungă perioadă</SelectItem>
                <SelectItem value="driverName">Nume Șofer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selectează șofer pentru detalii" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Niciunul selectat</SelectItem>
                {filteredDrivers.map(driver => (
                  <SelectItem key={`${driver.driverName}-${driver.company}`} value={driver.driverName}>
                    {driver.driverName} ({driver.company})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drivers List */}
          <div className="grid gap-4">
            {filteredDrivers.map((driver) => {
              const status = getActivityStatus(driver.workingPercentage);
              return (
                <motion.div
                  key={`${driver.driverName}-${driver.company}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedDriver(driver.driverName)}
                >
                  <Card className={`transition-all hover:shadow-md ${selectedDriver === driver.driverName ? 'ring-2 ring-blue-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-lg">{driver.driverName}</h3>
                            <Badge variant="outline">{driver.company}</Badge>
                            <Badge className={`${status.color} text-white`}>
                              {status.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <span>📅 {driver.workingWeeks}/{driver.totalWeeks} săptămâni lucrate</span>
                            <span>🔥 {driver.longestWorkStreak} săptămâni consecutive</span>
                            <span>😴 {driver.longestRestStreak} săptămâni odihnă</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Progress value={driver.workingPercentage} className="w-32" />
                            <span className="text-sm font-medium">{Math.round(driver.workingPercentage)}%</span>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDriver(driver.driverName)}
                        >
                          Vezi Detalii
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Driver Details Modal/Panel */}
          {selectedDriverData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Detalii Activitate: {selectedDriverData.driverName}</span>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDriver('none')}>
                      Închide
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{selectedDriverData.workingWeeks}</p>
                      <p className="text-sm text-muted-foreground">Săptămâni de Lucru</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{selectedDriverData.restWeeks}</p>
                      <p className="text-sm text-muted-foreground">Săptămâni de Odihnă</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{Math.round(selectedDriverData.workingPercentage)}%</p>
                      <p className="text-sm text-muted-foreground">Procentaj Activitate</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold mb-3">Perioade de Lucru și Odihnă:</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedDriverData.periods.map((period, index) => (
                        <div 
                          key={index}
                          className={`p-4 rounded-lg border ${
                            period.type === 'work' 
                              ? 'bg-green-50 border-green-200 dark:bg-green-900/20' 
                              : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium flex items-center space-x-2">
                                <span className={period.type === 'work' ? 'text-green-600' : 'text-blue-600'}>
                                  {period.type === 'work' ? '🚛 Perioada de Lucru' : '🏠 Perioada de Odihnă'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  ({period.duration} săptămân{period.duration === 1 ? 'ă' : 'i'})
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <strong>De la:</strong> {period.startWeek}
                                {period.startWeek !== period.endWeek && (
                                  <>
                                    <br />
                                    <strong>Până la:</strong> {period.endWeek}
                                  </>
                                )}
                              </div>
                              {period.type === 'work' && period.totalTrips && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  {period.totalTrips} curse totale • €{period.totalAmount?.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              period.type === 'work' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200' 
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-200'
                            }`}>
                              {period.duration}w
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold mb-2">Activitate Detaliată pe Săptămâni:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {selectedDriverData.weeklyDetails.map((week, index) => (
                          <div 
                            key={index}
                            className={`p-2 rounded text-xs border ${
                              week.isWorking 
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20' 
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-800'
                            }`}
                          >
                            <div className="font-medium">{week.week}</div>
                            <div className="text-xs text-muted-foreground">
                              {week.tripsCount} curse • €{week.totalAmount.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolutia Șoferilor Activi pe Săptămâni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {weeklyStats.map((weekStat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{weekStat.week}</h4>
                      <Badge variant="outline">
                        {weekStat.totalActiveDrivers} șoferi activi
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(weekStat.companies).map(([companyName, companyData]) => (
                        <div key={companyName} className="bg-muted p-3 rounded">
                          <p className="font-medium text-sm">{companyName}</p>
                          <p className="text-xs text-muted-foreground">
                            {companyData.activeDrivers} șoferi • {companyData.totalTrips} curse
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
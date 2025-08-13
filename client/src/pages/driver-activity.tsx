import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, TrendingUp, Users, Activity, Car, Home } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface DriverActivity {
  name: string;
  company: string;
  activeWeeks: Array<{
    week: string;
    weekNumber: number;
    tripCount: number;
    revenue: number;
  }>;
  totalTrips: number;
  totalRevenue: number;
  workDays: number;
  restDays: number;
  activityRate: string;
}

interface MonthlyActivity {
  year: number;
  month: number;
  monthName: string;
  totalDrivers: number;
  daysInMonth: number;
  totalWorkingDays: number;
  drivers: DriverActivity[];
  summary: {
    mostActiveDriver: DriverActivity;
    averageTripsPerDriver: number;
    totalTripsAllDrivers: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DriverActivityPage() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(8); // August
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Fetch monthly activity data
  const { data: monthlyActivity, isLoading: isLoadingMonthly } = useQuery<MonthlyActivity>({
    queryKey: ['/api/driver-activity/monthly', selectedYear, selectedMonth],
    enabled: !!selectedYear && !!selectedMonth
  });

  // Fetch detailed driver activity if a driver is selected
  const { data: driverDetails, isLoading: isLoadingDriver } = useQuery({
    queryKey: ['/api/driver-activity/driver', selectedDriver, selectedYear, selectedMonth],
    enabled: !!selectedDriver && !!selectedYear && !!selectedMonth
  });

  const getWorkTimeDistribution = () => {
    if (!monthlyActivity) return [];
    
    return monthlyActivity.drivers.map(driver => ({
      name: driver.name.length > 15 ? driver.name.substring(0, 15) + '...' : driver.name,
      workDays: driver.workDays,
      restDays: driver.restDays,
      activityRate: parseFloat(driver.activityRate)
    }));
  };

  const getTopPerformers = () => {
    if (!monthlyActivity) return [];
    
    return monthlyActivity.drivers
      .slice(0, 5)
      .map(driver => ({
        name: driver.name.length > 12 ? driver.name.substring(0, 12) + '...' : driver.name,
        trips: driver.totalTrips,
        revenue: driver.totalRevenue
      }));
  };

  const getActivityDistribution = () => {
    if (!monthlyActivity) return [];
    
    const ranges = [
      { label: 'Foarte Activi (>80%)', min: 80, max: 100, color: '#22c55e' },
      { label: 'Activi (60-80%)', min: 60, max: 80, color: '#3b82f6' },
      { label: 'Moderați (40-60%)', min: 40, max: 60, color: '#f59e0b' },
      { label: 'Puțin Activi (<40%)', min: 0, max: 40, color: '#ef4444' }
    ];

    return ranges.map(range => {
      const count = monthlyActivity.drivers.filter(driver => {
        const rate = parseFloat(driver.activityRate);
        return rate >= range.min && rate < range.max;
      }).length;

      return {
        name: range.label,
        value: count,
        color: range.color
      };
    }).filter(item => item.value > 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Urmărire Activitate Șoferi</h1>
          <p className="text-muted-foreground">
            Analizează timpul de muncă vs. timpul de odihnă pentru fiecare șofer
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Ianuarie</SelectItem>
              <SelectItem value="2">Februarie</SelectItem>
              <SelectItem value="3">Martie</SelectItem>
              <SelectItem value="4">Aprilie</SelectItem>
              <SelectItem value="5">Mai</SelectItem>
              <SelectItem value="6">Iunie</SelectItem>
              <SelectItem value="7">Iulie</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">Septembrie</SelectItem>
              <SelectItem value="10">Octombrie</SelectItem>
              <SelectItem value="11">Noiembrie</SelectItem>
              <SelectItem value="12">Decembrie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoadingMonthly ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : monthlyActivity ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Șoferi</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyActivity.totalDrivers}</div>
                <p className="text-xs text-muted-foreground">
                  în {monthlyActivity.monthName} {monthlyActivity.year}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Curse</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyActivity.summary.totalTripsAllDrivers}</div>
                <p className="text-xs text-muted-foreground">
                  Medie: {monthlyActivity.summary.averageTripsPerDriver.toFixed(1)} per șofer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Zile Lucrătoare</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyActivity.totalWorkingDays}</div>
                <p className="text-xs text-muted-foreground">
                  din {monthlyActivity.daysInMonth} zile în lună
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cel Mai Activ</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{monthlyActivity.summary.mostActiveDriver.name}</div>
                <p className="text-xs text-muted-foreground">
                  {monthlyActivity.summary.mostActiveDriver.totalTrips} curse
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Work Time Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuția Timpului de Muncă</CardTitle>
                <CardDescription>
                  Timpul de muncă vs. timpul de odihnă pentru fiecare șofer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getWorkTimeDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="workDays" stackId="a" fill="#3b82f6" name="Zile Muncă" />
                    <Bar dataKey="restDays" stackId="a" fill="#e5e7eb" name="Zile Odihnă" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuția Activității</CardTitle>
                <CardDescription>
                  Șoferii distribuiți după rata de activitate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getActivityDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getActivityDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Șoferi După Numărul de Curse</CardTitle>
              <CardDescription>
                Cei mai productivi șoferi în {monthlyActivity.monthName} {monthlyActivity.year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTopPerformers()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="trips" fill="#22c55e" name="Curse" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Drivers List */}
          <Card>
            <CardHeader>
              <CardTitle>Detalii Șoferi</CardTitle>
              <CardDescription>
                Vizualizare detaliată a activității fiecărui șofer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyActivity.drivers.map((driver) => (
                  <div
                    key={driver.name}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedDriver(driver.name === selectedDriver ? null : driver.name)}
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium">{driver.name}</h4>
                        <p className="text-sm text-muted-foreground">{driver.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">{driver.totalTrips}</div>
                        <div className="text-xs text-muted-foreground">Curse</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium">{driver.workDays}</div>
                        <div className="text-xs text-muted-foreground">Zile Muncă</div>
                      </div>
                      
                      <div className="text-center">
                        <Badge variant={parseFloat(driver.activityRate) > 70 ? "default" : "secondary"}>
                          {driver.activityRate}%
                        </Badge>
                      </div>
                      
                      <div className="w-20">
                        <Progress value={parseFloat(driver.activityRate)} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Driver Details Modal/Section */}
          {selectedDriver && driverDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Detalii Activitate: {selectedDriver}
                </CardTitle>
                <CardDescription>
                  Activitate săptămânală în {(driverDetails as any).monthName} {(driverDetails as any).year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(driverDetails as any).summary?.totalActiveWeeks || 0}</div>
                    <div className="text-sm text-muted-foreground">Săptămâni Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{(driverDetails as any).summary?.totalTrips || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Curse</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{((driverDetails as any).summary?.averageTripsPerWeek || 0).toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Medie/Săptămână</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">€{((driverDetails as any).summary?.totalRevenue || 0).toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Total Venit</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="font-medium">Activitate Săptămânală</h4>
                  {((driverDetails as any).weeklyActivity || []).map((week: any) => (
                    <div key={week.week} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{week.week}</div>
                        <div className="text-sm text-muted-foreground">{week.company}</div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge variant={week.isActive ? "default" : "secondary"}>
                          {week.isActive ? "Activ" : "Inactiv"}
                        </Badge>
                        <div className="text-right">
                          <div className="font-medium">{week.tripCount} curse</div>
                          <div className="text-sm text-muted-foreground">€{week.revenue.toFixed(0)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium">Nu există date disponibile</h3>
              <p className="text-muted-foreground">
                Pentru {selectedMonth}/{selectedYear} nu sunt disponibile date despre activitatea șoferilor.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { motion } from "framer-motion";
import { Users, CheckCircle, Euro, Calendar, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StatusCardsProps {
  processedData: any;
  selectedWeek: string;
}

export function StatusCards({ processedData, selectedWeek }: StatusCardsProps) {
  // Fetch company balances for outstanding amounts
  const { data: companyBalances = [] } = useQuery({
    queryKey: ["/api/company-balances"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch all payments for total count
  const { data: allPayments = [] } = useQuery({
    queryKey: ["/api/payments"],
  });

  // Calculate outstanding balances (pending and partial payments)
  const outstandingBalances = companyBalances.filter((balance: any) => 
    balance.status === 'pending' || balance.status === 'partial'
  );
  
  const totalOutstanding = outstandingBalances.reduce((acc: number, balance: any) => 
    acc + parseFloat(balance.outstandingAmount || 0), 0
  );

  // Calculate stats from processed data (if available)
  const totalDrivers = processedData ? Object.values(processedData).reduce((acc: number, company: any) => {
    return acc + Object.keys(company.VRID_details || {}).length;
  }, 0) : 0;

  const processedPayments = processedData ? Object.keys(processedData).length : 0;
  
  const totalValue = processedData ? Object.values(processedData).reduce((acc: number, company: any) => {
    return acc + (company.Total_7_days || 0) + (company.Total_30_days || 0) - (company.Total_comision || 0);
  }, 0) : 0;

  const cards = [
    {
      title: "Restanțe",
      value: `€${totalOutstanding.toFixed(2)}`,
      subtitle: `${outstandingBalances.length} companii cu restanțe`,
      icon: AlertTriangle,
      color: totalOutstanding > 0 ? "bg-red-500" : "bg-green-500",
      textColor: totalOutstanding > 0 ? "text-red-400" : "text-green-400"
    },
    {
      title: "Total Plăți",
      value: allPayments.length || 0,
      subtitle: "Plăți înregistrate",
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-400"
    },
    {
      title: "Companii Active",
      value: companyBalances.length || 0,
      subtitle: "În sistem",
      icon: Users,
      color: "gradient-primary",
      textColor: "text-white"
    },
    {
      title: "Săptămâna Curentă",
      value: selectedWeek || "Nu este selectată",
      subtitle: processedData ? "Date procesate" : "Fără date",
      icon: Calendar,
      color: "bg-purple-500",
      textColor: "text-primary-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-effect rounded-2xl p-6 hover-glow"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-gray-500 text-xs mt-1">{card.subtitle}</p>
                )}
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                <Icon className="text-white" size={24} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

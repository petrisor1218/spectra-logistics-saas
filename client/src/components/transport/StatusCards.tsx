import { motion } from "framer-motion";
import { Users, CheckCircle, Euro, Calendar } from "lucide-react";

interface StatusCardsProps {
  processedData: any;
  selectedWeek: string;
}

export function StatusCards({ processedData, selectedWeek }: StatusCardsProps) {
  // Calculate stats from processed data
  const totalDrivers = Object.values(processedData).reduce((acc: number, company: any) => {
    return acc + Object.keys(company.VRID_details || {}).length;
  }, 0);

  const processedPayments = Object.keys(processedData).length;
  
  const totalValue = Object.values(processedData).reduce((acc: number, company: any) => {
    return acc + (company.Total_7_days || 0) + (company.Total_30_days || 0) - (company.Total_comision || 0);
  }, 0);

  const cards = [
    {
      title: "Total Șoferi",
      value: totalDrivers || 0,
      icon: Users,
      color: "gradient-primary",
      textColor: "text-white"
    },
    {
      title: "Plăți Procesate",
      value: processedPayments || 0,
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-400"
    },
    {
      title: "Valoare Totală",
      value: `€${totalValue.toFixed(0)}`,
      icon: Euro,
      color: "bg-blue-500",
      textColor: "text-blue-400"
    },
    {
      title: "Săptămâna Curentă",
      value: selectedWeek || "Nu este selectată",
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

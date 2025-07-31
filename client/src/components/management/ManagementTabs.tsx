import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building, User } from 'lucide-react';
import { CompanyManagement } from './CompanyManagement';
import { DriverManagement } from './DriverManagement';

interface ManagementTabsProps {
  loadDriversFromDatabase?: () => Promise<any>;
}

export function ManagementTabs({ loadDriversFromDatabase }: ManagementTabsProps) {
  const [activeTab, setActiveTab] = useState<'companies' | 'drivers'>('companies');

  const tabs = [
    {
      id: 'companies' as const,
      label: 'Companii',
      icon: Building,
    },
    {
      id: 'drivers' as const,
      label: 'Șoferi',
      icon: User,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-md border border-white/10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'companies' && <CompanyManagement />}
        {activeTab === 'drivers' && <DriverManagement loadDriversFromDatabase={loadDriversFromDatabase} />}
      </motion.div>
    </div>
  );
}
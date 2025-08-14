import React from 'react';
import AnalyticsDashboard from '../components/dashboard/AnalyticsDashboard';

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <AnalyticsDashboard />
    </div>
  );
};

export default Dashboard;

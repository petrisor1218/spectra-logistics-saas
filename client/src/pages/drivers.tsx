import React from 'react';
import { DriverManagement } from '../components/management/DriverManagement';

const Drivers: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestionarea Șoferilor</h1>
      <DriverManagement />
    </div>
  );
};

export default Drivers;

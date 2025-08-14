import React from 'react';
import { CompanyManagement } from '../components/management/CompanyManagement';

const Companies: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestionarea Companiilor</h1>
      <CompanyManagement />
    </div>
  );
};

export default Companies;

import React from 'react';
import { TransportOrdersView } from '../components/transport/TransportOrdersView';

const TransportOrders: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Comenzile de Transport</h1>
      <TransportOrdersView />
    </div>
  );
};

export default TransportOrders;

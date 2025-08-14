import React from 'react';
import PaymentHistoryView from '../components/payment/PaymentHistoryView';

const Payments: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Istoricul Plăților</h1>
      <PaymentHistoryView />
    </div>
  );
};

export default Payments;

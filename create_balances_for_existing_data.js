// Script pentru crearea bilanțurilor pentru datele existente
const createBalancesForExistingData = async () => {
  const existingData = [
    {
      week_label: "20 iul. - 26 iul.",
      companies: {
        "Fast Express": { totalInvoiced: 6247.07 },
        "Stef Trans": { totalInvoiced: 4699.18 },
        "Toma SRL": { totalInvoiced: 543.03 },
        "DE Cargo Speed": { totalInvoiced: 2777.57 }
      }
    },
    {
      week_label: "22 iun. - 28 iun.",
      companies: {
        "Fast Express": { totalInvoiced: 21249.37 }
      }
    }
  ];

  for (const weekData of existingData) {
    for (const [companyName, data] of Object.entries(weekData.companies)) {
      try {
        const response = await fetch('/api/company-balances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName,
            weekLabel: weekData.week_label,
            totalInvoiced: data.totalInvoiced.toString(),
            totalPaid: '0',
            outstandingBalance: data.totalInvoiced.toString(),
            paymentStatus: 'pending'
          }),
        });
        
        if (response.ok) {
          console.log(`✅ Bilanț creat: ${companyName} - ${weekData.week_label}: €${data.totalInvoiced}`);
        }
      } catch (error) {
        console.error(`❌ Eroare: ${companyName}`, error);
      }
    }
  }
};

// Executăm script-ul
createBalancesForExistingData();
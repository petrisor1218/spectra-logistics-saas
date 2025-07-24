import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { FileText, Eye, Calendar, Truck, Package, AlertCircle, Loader2, Download, Trash2, MapPin, Clock, Euro, Hash, Building2, Route, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransportOrder {
  id: number;
  orderNumber: string;
  companyName: string;
  orderDate: string;
  weekLabel: string;
  vrids: string[];
  totalAmount: string;
  route: string;
  status: string;
  createdAt: string;
}

export function TransportOrdersView() {
  const [orders, setOrders] = useState<TransportOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<TransportOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTransportOrders();
  }, []);

  const loadTransportOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transport-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error loading transport orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-400 bg-yellow-400/10';
      case 'sent': return 'text-blue-400 bg-blue-400/10';
      case 'confirmed': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Proiect';
      case 'sent': return 'Trimis';
      case 'confirmed': return 'Confirmat';
      default: return status;
    }
  };

  const getCompanyDetails = (companyName: string) => {
    const companies: { [key: string]: any } = {
      'Stef Trans': {
        cif: 'RO12345678',
        rc: 'J40/1234/2020',
        adresa: 'Str. Transportatorilor Nr. 15',
        localitate: 'Bucuresti',
        judet: 'Bucuresti',
        contact: '+40 123 456 789'
      },
      'DE Cargo Speed': {
        cif: 'RO87654321',
        rc: 'J05/5678/2019',
        adresa: 'Str. Cargo Nr. 22',
        localitate: 'Constanta',
        judet: 'Constanta',
        contact: '+40 987 654 321'
      },
      'Fast Express': {
        cif: 'RO11223344',
        rc: 'J10/9876/2021',
        adresa: 'Str. Express Nr. 45',
        localitate: 'Buzau',
        judet: 'Buzau',
        contact: '+40 555 123 456'
      }
    };
    
    return companies[companyName] || {
      cif: '[Completati CIF]',
      rc: '[Completati]',
      adresa: '[Completati]',
      localitate: '[Completati]',
      judet: '[Completati]',
      contact: '[Completati]'
    };
  };

  const generatePDF = (order: TransportOrder) => {
    const doc = new jsPDF();
    const companyDetails = getCompanyDetails(order.companyName);
    let currentY = 0;
    
    // Modern Header with Colors and Styling
    // Background gradient effect (simulated with overlapping rectangles)
    doc.setFillColor(240, 245, 255); // Light blue background
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFillColor(59, 130, 246); // Blue gradient top
    doc.rect(0, 0, 210, 8, 'F');
    
    doc.setFillColor(37, 99, 235); // Darker blue
    doc.rect(0, 6, 210, 2, 'F');
    
    // Company Logo Area (decorative box)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(2);
    doc.roundedRect(15, 12, 60, 20, 3, 3, 'FD');
    
    // Company Name with modern styling
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('A Z LOGISTIC EOOD', 20, 22);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Transport & Logistics Solutions', 20, 27);
    
    // Contact info in modern format
    doc.setFillColor(248, 250, 252);
    doc.rect(80, 12, 115, 20, 'F');
    
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('📧 azlogistic8@gmail.com', 85, 18);
    doc.text('🏦 DSK BANK - BG22STSA93000028729251', 85, 22);
    doc.text('🆔 BG206507560 | 📍 Ruser, Ruse, Bulgaria', 85, 26);
    doc.text('💶 TVA: 0%', 85, 30);
    
    // Modern Title Section
    currentY = 50;
    
    // Title background
    doc.setFillColor(37, 99, 235);
    doc.rect(15, currentY, 180, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDIN DE TRANSPORT RUTIER', 105, currentY + 10, { align: 'center' });
    
    doc.setFontSize(12);
    const orderDate = new Date(order.orderDate).toLocaleDateString('ro-RO');
    doc.text(`Nr. ${order.orderNumber} din ${orderDate}`, 105, currentY + 20, { align: 'center' });
    
    currentY += 35;
    
    // Transportator Section with Modern Card Design
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.roundedRect(15, currentY, 180, 50, 2, 2, 'FD');
    
    // Section header
    doc.setFillColor(16, 185, 129);
    doc.rect(15, currentY, 180, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🚛 TRANSPORTATOR', 20, currentY + 6);
    
    // Company details in organized columns
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const leftColumnY = currentY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text(`${order.companyName}`, 20, leftColumnY);
    doc.setFont('helvetica', 'normal');
    doc.text(`CIF: ${companyDetails.cif}`, 20, leftColumnY + 6);
    doc.text(`RC: ${companyDetails.rc}`, 20, leftColumnY + 12);
    doc.text(`📍 ${companyDetails.adresa}`, 20, leftColumnY + 18);
    
    const rightColumnY = leftColumnY;
    doc.text(`${companyDetails.localitate}, ${companyDetails.judet}`, 110, rightColumnY + 6);
    doc.text(`🇷🇴 România`, 110, rightColumnY + 12);
    doc.text(`📞 ${companyDetails.contact}`, 110, rightColumnY + 18);
    
    currentY += 60;
    
    // Route Section
    doc.setFillColor(59, 130, 246);
    doc.rect(15, currentY, 180, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`🌍 RUTA: ${order.route}`, 20, currentY + 10);
    
    // Transport section
    doc.setFont('helvetica', 'bold');
    doc.text('Transport:', 20, 200);
    
    doc.setFont('helvetica', 'normal');
    const vridsText = `VRID-uri: ${order.vrids.join(', ')}`;
    
    // Split VRIDs into multiple lines if too long
    const splitText = doc.splitTextToSize(vridsText, 170);
    currentY = 210;
    splitText.forEach((line: string) => {
      doc.text(line, 20, currentY);
      currentY += 7;
    });
    
    doc.text('ADR: Non ADR', 20, currentY + 10);
    
    currentY += 25;
    doc.text('Locatia si data incarcarii: _______________________________', 20, currentY);
    doc.text('Locatia si data descarcarii: _______________________________', 20, currentY + 10);
    doc.text('Telefon sofer si numar: _______________________________', 20, currentY + 20);
    doc.text('Tip camion: _______________________________', 20, currentY + 30);
    
    // Price section
    doc.setFont('helvetica', 'bold');
    doc.text(`Pret negociat: ${parseFloat(order.totalAmount).toFixed(2)} EUR + TVA: 0%`, 20, currentY + 45);
    doc.text('Metoda de plata: Ordin de plata', 20, currentY + 55);
    
    // Notes
    doc.setFont('helvetica', 'normal');
    const notesText = 'Note: 7 zile, documente originale conform cerintelor (2 CMR originale, T1, CEMT, Certificat auto, Documente de descarcare, Note de transport, Nota de cantarire)';
    const notesSplit = doc.splitTextToSize(notesText, 170);
    let notesY = currentY + 70;
    notesSplit.forEach((line: string) => {
      doc.text(line, 20, notesY);
      notesY += 7;
    });
    
    // Footer
    doc.text('Intocmit de:', 20, notesY + 15);
    doc.text('[Completati Nume]', 20, notesY + 25);
    
    // Page footer
    const pageHeight = doc.internal.pageSize.height;
    doc.text('Pagina 1 din 2', 105, pageHeight - 20, { align: 'center' });
    doc.text(`Transportator: ${order.companyName}`, 105, pageHeight - 10, { align: 'center' });
    
    // Add second page with conditions
    doc.addPage();
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Transportator: ${order.companyName}`, 20, 20);
    doc.text('Conditii generale:', 20, 35);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Dupa confirmarea comenzii, transportatorul se angajeaza sa respecte urmatoarele:', 20, 50);
    
    // Conditions text
    const conditions = [
      '1. Transportul se va efectua cu asigurare CMR valida aferenta vehiculului transportatorului mentionat.',
      'In cazul transportului cu asigurare CMR invalida, transportatorul isi asuma toate daunele, iar',
      'administratorul companiei este solidar responsabil cu bunurile personale. ATENTIE! - Inspectia',
      'cantitatii si calitatii marfii se face de catre soferul transportatorului la locul de incarcare.',
      'Daca la descarcare marfa ajunge deteriorata sau lipsa, transportatorul este obligat sa plateasca',
      'despagubiri pentru daune + 200 euro imagine A Z LOGISTIC EOOD in termen de 10 zile.',
      '',
      '2. Pentru incarcare, masina trebuie sa fie prezenta cu toate echipamentele necesare, cum ar fi',
      'chingi (24 bucati) care sa reziste la o tensiune de 500 DAN (STF = 500DAN) fara prindere,',
      'covoare antiderapante (4 bucati per palet), coltare (48 bucati), prelata in stare buna.',
      'Daca la incarcare se constata ca chingile sunt sub standard, diferenta pana la 24 de chingi',
      'va fi suportata de transportator.',
      '',
      '3. Transportatorul este direct responsabil de plasarea axelor si integritatea incarcaturii in',
      'timpul transportului. Orice problema cu semnalele de greutate in timpul incarcarii,',
      'A Z LOGISTIC EOOD nu este responsabila pentru consecintele suplimentare comenzii.',
      '',
      '4. Transportatorul este responsabil pentru rezervele de livrare inregistrate in CMR.',
      'Chiar daca CMR nu are rezerve, dar destinatarul revine in 5 zile cu obiectii privind',
      'marfurile livrate, transportatorul este obligat sa plateasca daune materiale/dobanzi in',
      'termen de 10 zile.'
    ];
    
    let condY = 65;
    conditions.forEach(condition => {
      doc.text(condition, 20, condY);
      condY += 7;
    });
    
    // Second page footer
    doc.text('Intocmit de:', 20, condY + 20);
    doc.text('[Completati Nume]', 20, condY + 30);
    
    doc.setFont('helvetica', 'bold');
    doc.text('A Z LOGISTIC EOOD', 20, condY + 45);
    doc.text('azlogistic8@gmail.com', 20, condY + 55);
    
    const pageHeight2 = doc.internal.pageSize.height;
    doc.text('Pagina 2 din 2', 105, pageHeight2 - 20, { align: 'center' });
    doc.text(`Transportator: ${order.companyName}`, 105, pageHeight2 - 10, { align: 'center' });
    
    // Save the PDF
    doc.save(`Comanda_Transport_${order.companyName.replace(/\s+/g, '_')}_${order.orderNumber}_${new Date().getTime()}.pdf`);
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (deleteConfirm !== orderId) {
      setDeleteConfirm(orderId);
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/transport-orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrders(orders.filter(order => order.id !== orderId));
        setDeleteConfirm(null);
        setSelectedOrder(null);
      } else {
        throw new Error('Failed to delete transport order');
      }
    } catch (error) {
      console.error('Error deleting transport order:', error);
      alert('Eroare la ștergerea comenzii de transport');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="text-gray-300">Se încarcă comenzile de transport...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <motion.div 
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-6">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-xl"></div>
              <Truck className="relative w-8 h-8 text-blue-400" />
              
              {/* Floating sparkles */}
              <motion.div
                className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  delay: 0 
                }}
              />
              <motion.div
                className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-cyan-400 rounded-full"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2.5,
                  delay: 0.5
                }}
              />
            </div>
          </motion.div>
          
          <div className="space-y-2">
            <motion.h2 
              className="text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Comenzi de Transport
            </motion.h2>
            <motion.p 
              className="text-gray-400 text-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Vizualizați și gestionați comenzile de transport generate
            </motion.p>
            
            {/* Stats indicator */}
            <motion.div 
              className="flex items-center space-x-4 mt-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300">{orders.length} comenzi totale</span>
              </div>
              {orders.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Euro className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">
                    €{orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0).toFixed(2)} total
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        
        <motion.button
          onClick={loadTransportOrders}
          className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-400/40 text-blue-400 transition-all duration-300 overflow-hidden"
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)"
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center space-x-2">
            <motion.div
              animate={{ rotate: loading ? 360 : 0 }}
              transition={{ 
                duration: loading ? 1 : 0,
                repeat: loading ? Infinity : 0,
                ease: "linear"
              }}
            >
              <Package className="w-5 h-5" />
            </motion.div>
            <span className="font-medium">Reîncarcă</span>
          </div>
        </motion.button>
      </motion.div>

      {orders.length === 0 ? (
        <motion.div
          className="relative glass-effect rounded-3xl p-12 text-center overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-red-500/5 rounded-3xl"></div>
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <motion.div
              className="relative inline-block mb-6"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 flex items-center justify-center mx-auto relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-orange-400/30 blur-xl"></div>
                <AlertCircle className="relative w-12 h-12 text-yellow-400" />
                
                {/* Floating particles */}
                <motion.div
                  className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full"
                  animate={{ 
                    y: [0, -10, 0],
                    opacity: [0.7, 1, 0.7],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    delay: 0 
                  }}
                />
                <motion.div
                  className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-400 rounded-full"
                  animate={{ 
                    y: [0, -8, 0],
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.3, 1]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2.5,
                    delay: 1
                  }}
                />
              </div>
            </motion.div>
            
            <motion.h3 
              className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Nu există comenzi de transport
            </motion.h3>
            
            <motion.p 
              className="text-gray-400 text-lg leading-relaxed max-w-md mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Generați comenzi de transport din secțiunea de calcule pentru a le vedea aici.
            </motion.p>
            
            {/* Call to action hint */}
            <motion.div
              className="mt-8 flex items-center justify-center space-x-2 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span>Începeți să procesați date pentru a genera comenzi</span>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              className="group relative glass-effect rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.15,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.15)"
              }}
            >
              {/* Decorative gradient border */}
              <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20">
                <div className="h-full w-full rounded-3xl bg-gray-900/80 backdrop-blur-xl"></div>
              </div>
              
              {/* Content */}
              <div className="relative p-8">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-5">
                    {/* Enhanced Icon */}
                    <motion.div 
                      className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20 flex items-center justify-center"
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-blue-400/30 blur-xl"></div>
                      <FileText className="relative w-8 h-8 text-emerald-400" />
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    </motion.div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <motion.h3 
                          className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                        >
                          Comanda #{order.orderNumber}
                        </motion.h3>
                        
                        <motion.span 
                          className={`px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm ${getStatusColor(order.status)} border border-current/20`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          {getStatusText(order.status)}
                        </motion.span>
                      </div>
                      
                      {/* Enhanced Info Row */}
                      <div className="flex items-center space-x-6 text-sm">
                        <motion.div 
                          className="flex items-center space-x-2 text-gray-300"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.4 }}
                        >
                          <Building2 className="w-4 h-4 text-blue-400" />
                          <span className="font-medium">{order.companyName}</span>
                        </motion.div>
                        
                        <motion.div 
                          className="flex items-center space-x-2 text-gray-300"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.5 }}
                        >
                          <Route className="w-4 h-4 text-purple-400" />
                          <span>{order.route}</span>
                        </motion.div>
                        
                        <motion.div 
                          className="flex items-center space-x-2 text-gray-300"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.6 }}
                        >
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          <span>Săptămâna {order.weekLabel}</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Stats & Actions */}
                  <div className="flex items-center space-x-6">
                    {/* Stats Cards */}
                    <div className="flex space-x-4">
                      <motion.div 
                        className="text-center p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                      >
                        <div className="flex items-center space-x-1 text-xs text-gray-400 mb-1">
                          <Hash className="w-3 h-3" />
                          <span>VRIDs</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                          {order.vrids.length}
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-sm border border-emerald-500/20"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(16, 185, 129, 0.2)" }}
                      >
                        <div className="flex items-center space-x-1 text-xs text-emerald-400 mb-1">
                          <Euro className="w-3 h-3" />
                          <span>Total</span>
                        </div>
                        <div className="text-xl font-bold text-emerald-400">
                          €{parseFloat(order.totalAmount).toFixed(2)}
                        </div>
                      </motion.div>
                    </div>
                    
                    {/* Enhanced Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={() => generatePDF(order)}
                        className="p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 transition-all duration-300"
                        whileHover={{ scale: 1.1, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        title="Descarcă PDF"
                      >
                        <Download className="w-5 h-5" />
                      </motion.button>
                      
                      <motion.button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className={`p-3 rounded-xl transition-all duration-300 ${
                          selectedOrder?.id === order.id 
                            ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' 
                            : 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400'
                        }`}
                        whileHover={{ scale: 1.1, boxShadow: "0 10px 25px rgba(168, 85, 247, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        title="Vezi detalii"
                      >
                        {selectedOrder?.id === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </motion.button>

                      <motion.button
                        onClick={() => handleDeleteOrder(order.id)}
                        className={`p-3 rounded-xl transition-all duration-300 ${
                          deleteConfirm === order.id 
                            ? 'bg-red-500/30 border-red-500/50 text-red-300 shadow-lg shadow-red-500/20' 
                            : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400'
                        }`}
                        whileHover={{ scale: 1.1, boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        title={deleteConfirm === order.id ? "Confirmă ștergerea" : "Șterge comanda"}
                        disabled={deleting}
                      >
                        {deleting && deleteConfirm === order.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedOrder?.id === order.id && (
                    <motion.div
                      className="mt-8 pt-8 border-t border-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8
                      }}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Enhanced Order Information */}
                        <motion.div 
                          className="space-y-4"
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-blue-400" />
                            </div>
                            <h4 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                              Informații Comandă
                            </h4>
                          </div>
                          
                          <div className="space-y-4">
                            {[
                              { label: "Data comandă", value: formatDate(order.orderDate), icon: Calendar, color: "text-blue-400" },
                              { label: "Creat pe", value: formatDate(order.createdAt), icon: Clock, color: "text-purple-400" },
                              { label: "Ruta", value: order.route, icon: MapPin, color: "text-cyan-400" },
                              { label: "Total", value: `€${parseFloat(order.totalAmount).toFixed(2)}`, icon: Euro, color: "text-emerald-400" }
                            ].map((item, idx) => (
                              <motion.div
                                key={item.label}
                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.2)" }}
                              >
                                <div className="flex items-center space-x-3">
                                  <item.icon className={`w-4 h-4 ${item.color}`} />
                                  <span className="text-gray-400 font-medium">{item.label}:</span>
                                </div>
                                <span className={`font-bold ${item.label === 'Total' ? 'text-emerald-400 text-lg' : 'text-white'}`}>
                                  {item.value}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>

                        {/* Enhanced VRIDs Section */}
                        <motion.div 
                          className="space-y-4"
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                              <Package className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h4 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                              VRIDs Incluse ({order.vrids.length})
                            </h4>
                          </div>
                          
                          <motion.div 
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar p-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            {order.vrids.map((vrid, vridIndex) => (
                              <motion.div
                                key={vrid}
                                className="group relative p-3 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 hover:border-emerald-500/40 transition-all duration-300"
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: 0.6 + vridIndex * 0.05 }}
                                whileHover={{ 
                                  scale: 1.05,
                                  boxShadow: "0 8px 25px rgba(16, 185, 129, 0.15)",
                                  borderColor: "rgba(16, 185, 129, 0.4)"
                                }}
                              >
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="relative flex items-center space-x-2">
                                  <Hash className="w-3 h-3 text-emerald-400/60" />
                                  <span className="text-sm font-mono text-gray-300 group-hover:text-white transition-colors duration-300">
                                    {vrid}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
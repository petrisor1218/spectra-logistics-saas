import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FileText, Eye, Calendar, Truck, Package, AlertCircle, Loader2, Download, Trash2 } from "lucide-react";
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
    
    // Company Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('A Z LOGISTIC EOOD', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Billing Data: BG206507560, 206507560', 20, 30);
    doc.text('Adress: Ruser, Ruse,', 20, 37);
    doc.text('Bank: DSK BANK', 20, 44);
    doc.text('Account Euro: BG22STSA93000028729251', 20, 51);
    doc.text('VTA rate: 0%', 20, 58);
    doc.text('Email: azlogistic8@gmail.com', 20, 65);
    
    // Main Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDIN DE TRANSPORT RUTIER', 105, 85, { align: 'center' });
    
    doc.setFontSize(12);
    const orderDate = new Date(order.orderDate).toLocaleDateString('ro-RO');
    doc.text(`Nr. ${order.orderNumber} din ${orderDate}`, 105, 95, { align: 'center' });
    
    // Transportator section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Transportator:', 20, 115);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Denumire Companie: ${order.companyName}`, 20, 125);
    doc.text(`CIF: ${companyDetails.cif}`, 20, 132);
    doc.text(`Numar Registrul Comertului: ${companyDetails.rc}`, 20, 139);
    doc.text(`Adresa Companiei: ${companyDetails.adresa}`, 20, 146);
    doc.text(`Localitate: ${companyDetails.localitate}`, 20, 153);
    doc.text(`Judet: ${companyDetails.judet}`, 20, 160);
    doc.text('Tara: Romania', 20, 167);
    doc.text(`Contact: ${companyDetails.contact}`, 20, 174);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Ruta: ${order.route}`, 20, 185);
    
    // Transport section
    doc.setFont('helvetica', 'bold');
    doc.text('Transport:', 20, 200);
    
    doc.setFont('helvetica', 'normal');
    const vridsText = `VRID-uri: ${order.vrids.join(', ')}`;
    
    // Split VRIDs into multiple lines if too long
    const splitText = doc.splitTextToSize(vridsText, 170);
    let currentY = 210;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Truck className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Comenzi de Transport
            </h2>
            <p className="text-gray-400">Vizualizați și gestionați comenzile de transport generate</p>
          </div>
        </div>
        
        <motion.button
          onClick={loadTransportOrders}
          className="glass-button px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-white/10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Package className="w-4 h-4" />
          <span>Reîncarcă</span>
        </motion.button>
      </div>

      {orders.length === 0 ? (
        <motion.div
          className="glass-effect rounded-2xl p-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Nu există comenzi de transport
          </h3>
          <p className="text-gray-400">
            Generați comenzi de transport din secțiunea de calcule pentru a le vedea aici.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              className="glass-effect rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-400" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          Comanda #{order.orderNumber}
                        </h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {order.companyName} • {order.route} • Săptămâna {order.weekLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {order.vrids.length} VRIDs
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        €{parseFloat(order.totalAmount).toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={() => generatePDF(order)}
                        className="glass-button p-2 rounded-lg hover:bg-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Descarcă PDF"
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        className="glass-button p-2 rounded-lg hover:bg-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Vezi detalii"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        onClick={() => handleDeleteOrder(order.id)}
                        className={`glass-button p-2 rounded-lg transition-colors ${
                          deleteConfirm === order.id 
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                            : 'hover:bg-red-500/10 hover:text-red-400'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={deleteConfirm === order.id ? "Confirmă ștergerea" : "Șterge comanda"}
                        disabled={deleting}
                      >
                        {deleting && deleteConfirm === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
                  <motion.div
                    className="border-t border-white/10 mt-6 pt-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Informații Comandă</span>
                        </h4>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Data comandă:</span>
                            <span className="text-white">{formatDate(order.orderDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Creat pe:</span>
                            <span className="text-white">{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Ruta:</span>
                            <span className="text-white">{order.route}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total:</span>
                            <span className="text-green-400 font-semibold">€{parseFloat(order.totalAmount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                          <Package className="w-4 h-4" />
                          <span>VRIDs Incluse ({order.vrids.length})</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {order.vrids.map((vrid) => (
                            <div
                              key={vrid}
                              className="bg-white/5 rounded-lg px-2 py-1 text-xs text-gray-300 font-mono"
                            >
                              {vrid}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
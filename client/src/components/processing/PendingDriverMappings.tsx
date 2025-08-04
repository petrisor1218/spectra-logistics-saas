import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, UserPlus, X, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface PendingMapping {
  driverName: string;
  suggestedCompany: string;
  alternatives: string[];
}

interface PendingDriverMappingsProps {
  pendingMappings: PendingMapping[];
  setPendingMappings: React.Dispatch<React.SetStateAction<PendingMapping[]>>;
  addDriverToDatabase: (driverName: string, selectedCompany: string) => Promise<string | null>;
  onMappingComplete: () => void;
}

export function PendingDriverMappings({
  pendingMappings,
  setPendingMappings,
  addDriverToDatabase,
  onMappingComplete
}: PendingDriverMappingsProps) {
  const { toast } = useToast();
  const [selectedCompanies, setSelectedCompanies] = useState<Record<string, string>>({});

  // Initialize selected companies with suggestions when pendingMappings changes
  useEffect(() => {
    // Remove duplicates by driver name to prevent React key errors
    const uniqueMappings = pendingMappings.reduce((acc, mapping) => {
      if (!acc.find(m => m.driverName === mapping.driverName)) {
        acc.push(mapping);
      }
      return acc;
    }, [] as typeof pendingMappings);
    
    // Update parent if duplicates were found
    if (uniqueMappings.length !== pendingMappings.length) {
      console.log(`🔧 Eliminat ${pendingMappings.length - uniqueMappings.length} duplicate din pending mappings`);
      setPendingMappings(uniqueMappings);
      return; // Exit early, useEffect will run again with clean data
    }
    
    const initialSelections: Record<string, string> = {};
    pendingMappings.forEach(mapping => {
      if (!selectedCompanies[mapping.driverName]) {
        initialSelections[mapping.driverName] = mapping.suggestedCompany;
      }
    });
    
    if (Object.keys(initialSelections).length > 0) {
      setSelectedCompanies(prev => ({ ...prev, ...initialSelections }));
    }
  }, [pendingMappings]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCompanySelect = (driverName: string, company: string) => {
    setSelectedCompanies(prev => ({
      ...prev,
      [driverName]: company
    }));
  };

  const handleConfirmMapping = async (driverName: string) => {
    const mapping = pendingMappings.find(p => p.driverName === driverName);
    const selectedCompany = selectedCompanies[driverName] || mapping?.suggestedCompany;
    
    if (!selectedCompany) {
      toast({
        title: "Eroare",
        description: "Vă rugăm să selectați o companie pentru șofer",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await addDriverToDatabase(driverName, selectedCompany);
      if (result) {
        // Remove from pending mappings
        setPendingMappings(prev => prev.filter(p => p.driverName !== driverName));
        setSelectedCompanies(prev => {
          const updated = { ...prev };
          delete updated[driverName];
          return updated;
        });

        toast({
          title: "Succes", 
          description: `Șoferul "${driverName}" a fost adăugat la "${selectedCompany}".`,
          variant: "default"
        });

        // Don't call onMappingComplete for individual additions to preserve the full list
        // The data will be reprocessed when all mappings are done or user manually triggers reprocess
      } else {
        throw new Error("Failed to add driver");
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut adăuga șoferul în baza de date",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipMapping = (driverName: string) => {
    setPendingMappings(prev => prev.filter(p => p.driverName !== driverName));
    setSelectedCompanies(prev => {
      const updated = { ...prev };
      delete updated[driverName];
      return updated;
    });
  };

  const handleConfirmAllWithSuggestions = async () => {
    setIsProcessing(true);
    try {
      for (const mapping of pendingMappings) {
        await addDriverToDatabase(mapping.driverName, mapping.suggestedCompany);
      }
      
      setPendingMappings([]);
      setSelectedCompanies({});
      
      toast({
        title: "Succes",
        description: `${pendingMappings.length} șoferi au fost adăugați cu sugestiile automate. Reprocesez datele...`,
        variant: "default"
      });

      onMappingComplete();
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Eroare la adăugarea automată a șoferilor",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (pendingMappings.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="glass-card border-orange-500/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-orange-400">
            <AlertCircle className="w-5 h-5" />
            <span>Șoferi Noi Detectați</span>
          </CardTitle>
          <p className="text-sm text-gray-400">
            Am detectat {pendingMappings.length} șoferi noi care trebuie asignați la companii.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-300">
              Asignați șoferii la companiile potrivite:
            </span>
            <div className="flex space-x-2">
              <Button
                onClick={handleConfirmAllWithSuggestions}
                disabled={isProcessing}
                className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-500/30"
                size="sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Acceptă Toate Sugestiile
              </Button>
              <Button
                onClick={onMappingComplete}
                disabled={isProcessing}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/30"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Finalizează & Reprocesează
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {pendingMappings.map((mapping, index) => {
              const allOptions = [mapping.suggestedCompany, ...mapping.alternatives];
              const selectedCompany = selectedCompanies[mapping.driverName] || mapping.suggestedCompany;
              
              // Create unique key to avoid React duplicate key warnings
              const uniqueKey = `${mapping.driverName}-${index}-${mapping.suggestedCompany}`;
              
              return (
                <motion.div
                  key={uniqueKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-4 border border-orange-500/20 bg-orange-500/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-2">
                        {mapping.driverName}
                      </h4>
                      
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-400">Companie:</span>
                        <Select
                          value={selectedCompany}
                          onValueChange={(value) => handleCompanySelect(mapping.driverName, value)}
                        >
                          <SelectTrigger className="w-48 glass-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-dropdown">
                            {allOptions.map((company, companyIndex) => (
                              <SelectItem key={`${company}-${companyIndex}-${mapping.driverName}`} value={company}>
                                <span className="flex items-center">
                                  {company}
                                  {company === mapping.suggestedCompany && (
                                    <span className="ml-2 text-xs text-green-400">(Sugerată)</span>
                                  )}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleConfirmMapping(mapping.driverName)}
                        disabled={isProcessing}
                        size="sm"
                        className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-500/30"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Confirmă
                      </Button>
                      
                      <Button
                        onClick={() => handleSkipMapping(mapping.driverName)}
                        disabled={isProcessing}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadSectionProps {
  tripData: any;
  invoice7Data: any;
  invoice30Data: any;
  loading: boolean;
  tripFileRef: React.RefObject<HTMLInputElement>;
  invoice7FileRef: React.RefObject<HTMLInputElement>;
  invoice30FileRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (file: File, type: string) => void;
  uploadedFiles: {[key: string]: string[]};
}

export function FileUploadSection({
  tripData,
  invoice7Data,
  invoice30Data,
  loading,
  tripFileRef,
  invoice7FileRef,
  invoice30FileRef,
  handleFileUpload,
  uploadedFiles
}: FileUploadSectionProps) {
  const uploadSections = [
    {
      type: 'trip',
      title: 'Fișier TRIP',
      description: 'Încarcă fișierul CSV cu datele de transport',
      icon: FileSpreadsheet,
      accept: '.csv',
      data: tripData,
      ref: tripFileRef,
      gradientClass: 'gradient-primary',
      fileName: 'trip_data.csv'
    },
    {
      type: 'invoice7',
      title: 'Facturi 7 Zile',
      description: 'Încarcă facturile cu plată la 7 zile',
      icon: FileSpreadsheet,
      accept: '.xlsx,.xls,.csv',
      data: invoice7Data,
      ref: invoice7FileRef,
      gradientClass: 'bg-green-500',
      fileName: 'invoices_7days.xlsx'
    },
    {
      type: 'invoice30',
      title: 'Facturi 30 Zile',
      description: 'Încarcă facturile cu plată la 30 zile',
      icon: FileSpreadsheet,
      accept: '.xlsx,.xls,.csv',
      data: invoice30Data,
      ref: invoice30FileRef,
      gradientClass: 'bg-orange-500',
      fileName: 'invoices_30days.xlsx'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      {uploadSections.map((section, index) => {
        const Icon = section.icon;
        return (
          <motion.div
            key={section.type}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-effect rounded-2xl p-8"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-center mb-6">
              <motion.div 
                className={`w-16 h-16 ${section.gradientClass} rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-glow`}
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(139, 92, 246, 0.3)",
                    "0 0 40px rgba(139, 92, 246, 0.6)",
                    "0 0 20px rgba(139, 92, 246, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Icon className="text-white" size={32} />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">{section.title}</h3>
              <p className="text-gray-400 text-sm">{section.description}</p>
            </div>
            
            <motion.div 
              className="file-upload-zone border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer"
              whileHover={{ 
                borderColor: "hsl(262, 83%, 58%)",
                backgroundColor: "hsla(262, 83%, 58%, 0.1)"
              }}
              onClick={() => section.ref.current?.click()}
            >
              <CloudUpload className="mx-auto text-3xl text-gray-400 mb-4" size={48} />
              <p className="text-gray-300 mb-2">Drag & drop sau click pentru upload</p>
              <p className="text-gray-500 text-sm">{section.accept.replace(',', ', ')} files</p>
              <input
                ref={section.ref}
                type="file"
                className="hidden"
                accept={section.accept}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, section.type);
                }}
              />
            </motion.div>
            
            {section.data && (
              <motion.div 
                className="mt-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="space-y-1">
                  {uploadedFiles[section.type] && uploadedFiles[section.type].length > 0 ? (
                    uploadedFiles[section.type].map((fileName, index) => (
                      <div key={index} className="flex items-center text-green-400">
                        <CheckCircle size={16} className="mr-2" />
                        <span className="text-sm">{fileName}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center text-green-400">
                      <CheckCircle size={16} className="mr-2" />
                      <span className="text-sm">{section.fileName} uploaded</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

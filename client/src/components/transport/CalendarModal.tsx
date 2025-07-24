import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarModalProps {
  showCalendar: boolean;
  calendarDate: Date;
  setCalendarDate: (date: Date) => void;
  setShowCalendar: (show: boolean) => void;
  getDaysInMonth: (date: Date) => any[];
  canSelectDate: (date: Date) => boolean;
  isDateInSelectedWeek: (date: Date) => boolean;
  selectWeekFromCalendar: (date: Date) => void;
  selectedWeek: string;
}

export function CalendarModal({
  showCalendar,
  calendarDate,
  setCalendarDate,
  setShowCalendar,
  getDaysInMonth,
  canSelectDate,
  isDateInSelectedWeek,
  selectWeekFromCalendar,
  selectedWeek
}: CalendarModalProps) {
  const days = getDaysInMonth(calendarDate);
  const monthNames = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];

  const dayNames = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'];

  return (
    <AnimatePresence>
      {showCalendar && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowCalendar(false)}
        >
          <motion.div 
            className="glass-effect rounded-2xl p-8 max-w-md w-full"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Selectează Săptămâna</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowCalendar(false)}
                className="w-8 h-8 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                className="w-10 h-10 glass-effect rounded-xl flex items-center justify-center hover-glow"
              >
                <ChevronLeft className="text-white" size={16} />
              </motion.button>
              <h4 className="text-lg font-semibold text-white">
                {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </h4>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                className="w-10 h-10 glass-effect rounded-xl flex items-center justify-center hover-glow"
              >
                <ChevronRight className="text-white" size={16} />
              </motion.button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className="text-center text-gray-400 text-sm font-medium p-2">
                  {day}
                </div>
              ))}
              
              {days.map((day, index) => {
                const isSelectable = canSelectDate(day.date);
                const isInSelectedWeek = isDateInSelectedWeek(day.date);
                
                return (
                  <motion.button
                    key={index}
                    whileHover={isSelectable ? { scale: 1.1 } : {}}
                    whileTap={isSelectable ? { scale: 0.9 } : {}}
                    onClick={() => isSelectable && selectWeekFromCalendar(day.date)}
                    disabled={!isSelectable}
                    className={`w-10 h-10 text-sm rounded-lg transition-all duration-200 ${
                      !day.isCurrentMonth 
                        ? 'text-gray-500'
                        : !isSelectable
                        ? 'text-gray-500 cursor-not-allowed'
                        : isInSelectedWeek
                        ? 'bg-primary text-white font-bold'
                        : 'text-white hover:bg-white/10 cursor-pointer'
                    }`}
                  >
                    {day.date.getDate()}
                  </motion.button>
                );
              })}
            </div>

            {selectedWeek && (
              <div className="text-center text-gray-400 text-sm mb-4">
                Săptămâna selectată: <span className="text-primary-400 font-medium">{selectedWeek}</span>
              </div>
            )}

            <Button
              onClick={() => setShowCalendar(false)}
              className="w-full gradient-primary hover-glow"
            >
              Confirmă Selecția
            </Button>
            
            <div className="text-center text-gray-500 text-xs mt-4">
              Poți selecta săptămâni din ultimii 2 ani. Săptămâna începe duminica.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

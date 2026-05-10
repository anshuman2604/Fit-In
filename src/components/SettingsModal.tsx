"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, BrainCircuit, ChevronDown } from "lucide-react";

export function SettingsModal({ 
  isOpen, onClose, editProfile, setEditProfile, onSave, onRecalculate, isLoading, isAILoading 
}: any) {
  const iosSpring: any = { type: "spring", stiffness: 300, damping: 30 };

  const handleNumberChange = (field: string, val: string) => {
    if (val === '') {
      setEditProfile({ ...editProfile, [field]: '' });
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num)) {
      setEditProfile({ ...editProfile, [field]: num });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 40 }} 
            transition={iosSpring} 
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 backdrop-blur-3xl rounded-[32px] sm:rounded-[44px] shadow-3xl border border-white/20 dark:border-white/5 overflow-hidden"
          >
            
            {/* AI Calculation Overlay */}
            <AnimatePresence>
              {isAILoading && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="absolute inset-0 z-[120] bg-indigo-600/90 dark:bg-indigo-900/90 backdrop-blur-3xl flex flex-col items-center justify-center text-white p-6 sm:p-12 text-center"
                >
                  <motion.div 
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
                    className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-dashed border-white/20 rounded-full mb-6 flex items-center justify-center"
                  >
                    <BrainCircuit size={28} className="animate-pulse" />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2">AI is Optimizing</h3>
                  <p className="text-xs sm:text-sm font-medium opacity-70">Tailoring your macro split.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* COMPACT MODAL PADDING */}
            <div className="relative p-5 sm:p-10 space-y-5 sm:space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">Adjust Goals</h2>
                  <p className="text-slate-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-1.5 sm:mt-2">Personal metrics</p>
                </div>
                <button onClick={onClose} className="p-2 sm:p-3 bg-slate-100 dark:bg-white/10 rounded-xl sm:rounded-2xl hover:scale-95 transition-all">
                  <X size={18} strokeWidth={3} className="text-slate-500 dark:text-white" />
                </button>
              </div>

              {/* REDUCED SPACING FOR FORM */}
              <form onSubmit={onSave} className="space-y-5 sm:space-y-8 max-h-[80vh] sm:max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                <div className="space-y-5 sm:space-y-8 relative">
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] ml-1">Metrics</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {['age', 'weight_kg', 'height_cm'].map(f => (
                        <div key={f} className="space-y-1">
                          <label className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">{f.replace('_', ' ')}</label>
                          <input 
                            type="number" 
                            value={editProfile[f]} 
                            onChange={e => handleNumberChange(f, e.target.value)} 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl sm:rounded-[18px] p-3 sm:p-4 font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm sm:text-base" 
                          />
                        </div>
                      ))}
                      <div className="space-y-1 relative">
                        <label className="text-[8px] sm:text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Goal</label>
                        <div className="relative">
                          <select 
                            value={editProfile.goal} 
                            onChange={e => setEditProfile({...editProfile, goal: e.target.value})} 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl sm:rounded-[18px] p-3 sm:p-4 font-black text-slate-900 dark:text-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm sm:text-base"
                          >
                            <option value="cut">Cut</option>
                            <option value="bulk">Bulk</option>
                            <option value="recomp">Recomp</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    {/* COMPACT AI BUTTON */}
                    <button type="button" onClick={onRecalculate} className="w-full bg-indigo-600 text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-[22px] shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest">
                      <Sparkles size={14} fill="white" /> Recalculate with AI
                    </button>
                  </div>

                  <div className="space-y-4 pt-4 sm:pt-6 border-t border-slate-100 dark:border-white/5">
                    <h3 className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] ml-1">Targets</h3>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {['target_protein', 'target_carbs', 'target_fats'].map(f => (
                        <div key={f} className="space-y-1 text-center">
                          <label className="text-[7px] sm:text-[8px] font-black uppercase block text-slate-400 tracking-tighter mb-0.5 sm:mb-1">{f.split('_')[1]}</label>
                          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 rounded-xl sm:rounded-[20px] p-2 sm:p-3 shadow-inner">
                            <input 
                              type="number" 
                              value={editProfile[f]} 
                              onChange={e => handleNumberChange(f, e.target.value)} 
                              className="w-full bg-transparent border-none font-black text-center text-slate-900 dark:text-white outline-none text-base sm:text-lg p-0" 
                            />
                            <p className="text-[6px] sm:text-[7px] font-black uppercase text-indigo-500 dark:text-indigo-400">grams</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-1 sm:pt-2">
                  <button type="submit" disabled={isLoading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black font-black py-5 sm:py-6 rounded-2xl sm:rounded-[28px] shadow-2xl transition-all active:scale-95 text-sm sm:text-base uppercase tracking-widest flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Save My Goals"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

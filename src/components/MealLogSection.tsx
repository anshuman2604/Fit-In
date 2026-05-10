"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Search, Loader2, Plus, ChevronRight, CheckCircle2, AlertTriangle, RotateCcw, Check, History, Pencil, Trash2, Flame, X, ChevronDown } from "lucide-react";

export function MealLogSection({ 
  logs, fetchLogs, user, activeTab, setActiveTab, 
  inputText, setInputText, handleLogMealAI, 
  pendingItems, setPendingItems, handleConfirmLogs,
  handleSearch, searchQuery, setSearchQuery, searchResults, setSearchResults, isSearching,
  selectedFood, setSelectedFood, selectFood, qty, setQty, selectedUnit, setSelectedUnit, handleDirectLog,
  isLoading, editingId, setEditingId, editQty, setEditQty, handleUpdateLog, handleDeleteLog
}: any) {
  const iosSpring: any = { type: "spring", stiffness: 300, damping: 30 };
  const searchRef = useRef<HTMLDivElement>(null);

  // FIX: Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setSearchResults]);

  const onSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    handleSearch(val);
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={iosSpring} 
        className="relative glass rounded-[32px] p-7 space-y-6 z-[60]"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Meal Log</h2>
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
            <button onClick={() => setActiveTab("ai")} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'ai' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400'}`}>AI Parser</button>
            <button onClick={() => setActiveTab("precise")} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'precise' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-400'}`}>Precise</button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {pendingItems.length > 0 ? (
            <motion.div key="review" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="bg-indigo-50/30 dark:bg-indigo-500/5 rounded-3xl p-5 border border-indigo-100/30 space-y-3">
                <h3 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] flex items-center gap-2"><CheckCircle2 size={14} /> Review Items</h3>
                {pendingItems.map((item: any) => (
                  <div key={item.id} className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-indigo-100/20 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div><p className="font-black text-base text-gray-900 dark:text-white leading-none">"{item.originalName}"</p></div>
                      <div className="text-right"><p className="font-black text-lg text-indigo-600">{item.quantity}{item.unit}</p></div>
                    </div>
                    <div className="relative">
                      <select value={item.selectedCandidateId || ''} onChange={e => setPendingItems((prev: any) => prev.map((p: any) => p.id === item.id ? { ...p, selectedCandidateId: e.target.value, isUsingAiFallback: false } : p))} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-xl p-3 text-xs font-black dark:text-white appearance-none outline-none">
                        {item.candidates.map((c: any) => (<option key={c.id} value={c.id}>{c.name} ({c.calories} kcal)</option>))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPendingItems([])} className="flex-1 bg-white dark:bg-white/5 text-gray-400 font-black py-3 rounded-2xl border border-gray-100 dark:border-white/5 uppercase text-[9px]">Cancel</button>
                <button onClick={handleConfirmLogs} disabled={isLoading} className="flex-[2] bg-indigo-600 text-white font-black py-3 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-xs uppercase">{isLoading ? <Loader2 className="animate-spin" size={16} /> : "Log Meal"}</button>
              </div>
            </motion.div>
          ) : activeTab === "ai" ? (
            <motion.div key="ai" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="e.g., Maine 2 parathe aur 1 bowl dahi khaya" className="w-full h-28 bg-slate-50 dark:bg-black/30 border-none rounded-2xl p-5 text-base font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-inner dark:text-white" />
              <button onClick={handleLogMealAI} disabled={isLoading || !inputText.trim()} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-black text-base shadow-xl flex items-center justify-center gap-3">{isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> Use AI Magic</>}</button>
            </motion.div>
          ) : (
            <motion.div key="precise" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 relative">
              {!selectedFood ? (
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input type="text" value={searchQuery} onChange={e => onSearchChange(e.target.value)} placeholder="Search foods..." className="w-full bg-gray-100/50 dark:bg-black/30 border-none rounded-2xl pl-11 pr-5 py-4 text-base font-bold dark:text-white shadow-inner" />
                    {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" size={18} />}
                  </div>
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-white/10 z-[300] max-h-64 overflow-y-auto overflow-x-hidden"
                      >
                        {searchResults.map((f: any) => (
                          <button 
                            key={f.id} 
                            onClick={() => selectFood(f)} 
                            className="w-full px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-0 group transition-colors"
                          >
                            <p className="font-black text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{f.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{f.category}</p>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-indigo-50/30 dark:bg-indigo-500/5 rounded-3xl p-5 space-y-4 border border-indigo-100/30">
                  <div className="flex justify-between items-center border-b dark:border-white/5 pb-3">
                    <div><h4 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{selectedFood.name}</h4><p className="text-[8px] font-black text-indigo-400 uppercase italic">Verified</p></div>
                    <button onClick={() => setSelectedFood(null)} className="bg-white dark:bg-white/10 px-2.5 py-1.5 rounded-lg text-indigo-500 font-black text-[8px] uppercase border border-indigo-100/50">Change</button>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1.5"><label className="text-[8px] font-black uppercase text-indigo-400">Qty</label><input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full bg-white dark:bg-black/20 rounded-xl p-3 font-black text-lg shadow-inner border-none dark:text-white" /></div>
                    <div className="flex-1 space-y-1.5 relative">
                      <label className="text-[8px] font-black uppercase text-indigo-400">Unit</label>
                      <div className="relative">
                        <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} className="w-full bg-white dark:bg-black/20 rounded-xl p-3 font-black text-lg appearance-none shadow-inner border-none dark:text-white outline-none">
                          {selectedFood.serving_units?.map((u: any) => (<option key={u.id} value={u.unit_name}>{u.unit_name}</option>))}
                          <option value="g">grams (g)</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <button onClick={handleDirectLog} disabled={isLoading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow-xl text-base uppercase">Log Entry</button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Feed Section - REMOVED HOVER SCALE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2 text-slate-300 dark:text-slate-700">
          <History size={18} />
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Logged Today</h3>
        </div>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {logs.length === 0 && !isLoading && (<motion.div initial={{ opacity: 0 }} className="bg-white/50 dark:bg-white/5 rounded-3xl p-10 border-2 border-dashed flex flex-col items-center gap-3 text-center"><Flame size={28} className="text-gray-300" /><p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Empty</p></motion.div>)}
            {logs.map((l: any) => (
              <motion.div key={l.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={iosSpring} className="relative group">
                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/40 backdrop-blur-2xl rounded-2xl border border-white dark:border-white/5 shadow-md transition-all duration-300" />
                <div className="relative p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-2 rounded-lg ${l.isVerified ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400'}`}>
                        {l.isVerified ? <CheckCircle2 size={18} strokeWidth={3} /> : <AlertTriangle size={18} strokeWidth={3} />}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{l.foodName}</h4>
                        {editingId === l.id ? (
                          <div className="mt-1 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 p-1 rounded-lg border border-indigo-100/30"><input type="number" value={editQty} onChange={e => setEditQty(Number(e.target.value))} className="w-14 bg-transparent border-none text-sm font-black text-indigo-600 dark:text-indigo-400 p-0 ml-2" autoFocus /><div className="flex gap-1"><button onClick={() => handleUpdateLog(l)} className="p-1 bg-indigo-600 text-white rounded-md"><Check size={10} strokeWidth={4} /></button><button onClick={() => setEditingId(null)} className="p-1 bg-white dark:bg-white/10 text-gray-400 rounded-md"><X size={10} strokeWidth={4} /></button></div></div>
                        ) : (<p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Amount: <span className="font-black text-gray-700 dark:text-gray-200">{l.quantity} {l.unit}</span></p>)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-1"><button onClick={() => {setEditingId(l.id); setEditQty(l.quantity);}} className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg active:scale-90 shadow-sm"><Pencil size={14} /></button><button onClick={() => handleDeleteLog(l.id)} className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-lg active:scale-90 shadow-sm"><Trash2 size={14} /></button></div>
                      <span className="text-[7px] font-black uppercase py-1 px-2 rounded-md bg-gray-50 dark:bg-white/5 text-gray-400">{l.isVerified ? 'Verified' : 'AI'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {/* FIX: REMOVED group-hover:scale-105 FROM MACRO BLOCKS */}
                    {[{ label: 'Cal', val: l.macros.calories, color: 'text-orange-500', bg: 'bg-orange-50/50' }, { label: 'Pro', val: l.macros.protein, color: 'text-blue-500', bg: 'bg-blue-50/50' }, { label: 'Carb', val: l.macros.carbs, color: 'text-emerald-500', bg: 'bg-emerald-50/50' }, { label: 'Fat', val: l.macros.fats, color: 'text-purple-500', bg: 'bg-purple-50/50' }].map(m => (<div key={m.label} className={`${m.bg} dark:bg-white/5 rounded-2xl py-2 px-1 text-center transition-all duration-500`}>
                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">{m.label}</p>
                        <p className={`text-xs font-black ${m.color} dark:text-white`}>{Math.round(m.val)}</p>
                      </div>))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

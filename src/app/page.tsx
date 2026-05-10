"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Loader2, LogOut, Settings, Sun, Moon, BrainCircuit
} from "lucide-react";
import { MacroSection } from "@/components/MacroSection";
import { SettingsModal } from "@/components/SettingsModal";
import { MealLogSection } from "@/components/MealLogSection";
import { AskAI } from "@/components/AskAI";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  // Dashboard State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<any>({ goal: "recomp", target_protein: 150 });
  const [activeTab, setActiveTab] = useState<"ai" | "precise">("ai");
  const [inputText, setInputText] = useState("");
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);

  useEffect(() => { setMounted(true); checkUser(); }, []);

  const checkUser = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return router.push("/login");
    setUser(u);
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    if (!p?.is_onboarded) return router.push("/onboarding");
    setProfile(p);
    setEditProfile({ ...p, age: p.age?.toString(), weight_kg: p.weight_kg?.toString(), height_cm: p.height_cm?.toString() });
    fetchLogs(u.id);
  };

  const fetchLogs = async (uid: string) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const { data } = await supabase.from('meal_logs').select('*').eq('user_id', uid).gte('logged_at', today.toISOString()).order('logged_at', { ascending: false });
    if (data) setLogs(data.map(l => ({ id: l.id, foodName: l.food_name, quantity: l.quantity, unit: l.unit, isVerified: l.is_verified, macros: { calories: Number(l.calories), protein: Number(l.protein), carbs: Number(l.carbs), fats: Number(l.fats) } })));
  };

  const handleRecalculateAI = async () => {
    setIsAILoading(true);
    try {
      const res = await fetch("/api/onboarding/calculate", { method: "POST", body: JSON.stringify(editProfile) });
      const d = await res.json();
      if (res.ok) setEditProfile({ ...editProfile, ...d });
    } finally { setIsAILoading(false); }
  };

  const handleLogMealAI = async () => {
    if (!inputText.trim()) return; setIsLoading(true);
    try {
      const res = await fetch("/api/nutrition/parse", { method: "POST", body: JSON.stringify({ text: inputText }) });
      const d = await res.json();
      if (d.items) { setPendingItems(d.items); setInputText(""); }
    } finally { setIsLoading(false); }
  };

  const handleConfirmLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/nutrition/log-bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: pendingItems }) });
      if (res.ok) { fetchLogs(user.id); setPendingItems([]); }
    } finally { setIsLoading(false); }
  };

  const handleSearch = async (v: string) => {
    setSearchQuery(v); if (v.length < 2) return; setIsSearching(true);
    try {
      const res = await fetch(`/api/foods/search?q=${v}`);
      const d = await res.json(); setSearchResults(d);
    } finally { setIsSearching(false); }
  };

  const handleDirectLog = async () => {
    if (!selectedFood) return; setIsLoading(true);
    try {
      const res = await fetch("/api/nutrition/log-direct", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ foodId: selectedFood.id, quantity: qty, unit: selectedUnit }) });
      if (res.ok) { fetchLogs(user.id); setSelectedFood(null); }
    } finally { setIsLoading(false); }
  };

  const handleUpdateLog = async (log: any) => {
    await fetch("/api/nutrition/log/modify", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: log.id, foodId: log.foodId, quantity: editQty, unit: log.unit }) });
    setEditingId(null); fetchLogs(user.id);
  };

  const handleDeleteLog = async (id: string) => { if (confirm("Delete log?")) { await fetch(`/api/nutrition/log/modify?id=${id}`, { method: "DELETE" }); fetchLogs(user.id); } };

  const consumed = logs.reduce((a, c) => ({ calories: a.calories + c.macros.calories, protein: a.protein + c.macros.protein, carbs: a.carbs + c.macros.carbs, fats: a.fats + c.macros.fats }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  const targets = { calories: Math.round((profile?.target_protein || 150)*4 + (profile?.target_carbs || 310)*4 + (profile?.target_fats || 65)*9), protein: profile?.target_protein || 150, carbs: profile?.target_carbs || 310, fats: profile?.target_fats || 65 };

  if (!mounted || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 pb-20 overflow-x-hidden">
      <AnimatePresence>{isAILoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-indigo-600/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white p-10 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-dashed border-white/30 rounded-full mb-6 flex items-center justify-center"><BrainCircuit size={28} className="animate-pulse" /></motion.div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">Coach is thinking...</h3>
        </motion.div>
      )}</AnimatePresence>

      <AskAI />
      <SettingsModal 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} 
        editProfile={editProfile} setEditProfile={setEditProfile}
        isLoading={isLoading} isAILoading={isAILoading}
        onSave={async (e: any) => { e.preventDefault(); setIsLoading(true); await fetch("/api/profile", { method: "PATCH", body: JSON.stringify(editProfile) }); checkUser(); setIsSettingsOpen(false); setIsLoading(false); }}
        onRecalculate={handleRecalculateAI}
      />

      <header className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 sticky top-0 z-[90] transition-all duration-700">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3"><div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none"><Sparkles size={24} /></div><div><h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tighter transition-all duration-500">Fit In AI</h1><p className="text-[9px] uppercase font-black text-gray-400">{profile?.display_name}'s Tracker</p></div></div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="p-3 bg-gray-50 dark:bg-white/5 text-gray-400 rounded-2xl hover:text-indigo-600 transition-all shadow-sm">
              {mounted && (resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />)}
            </button>
            <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="p-3 bg-gray-50 dark:bg-white/5 text-gray-400 rounded-2xl hover:text-red-500 transition-all shadow-sm"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-10">
        <MacroSection consumed={consumed} targets={targets} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <MealLogSection 
              logs={logs} fetchLogs={fetchLogs} user={user}
              activeTab={activeTab} setActiveTab={setActiveTab}
              inputText={inputText} setInputText={setInputText} handleLogMealAI={handleLogMealAI}
              pendingItems={pendingItems} setPendingItems={setPendingItems} handleConfirmLogs={handleConfirmLogs}
              handleSearch={handleSearch} searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} setSearchResults={setSearchResults} isSearching={isSearching}
              selectedFood={selectedFood} setSelectedFood={setSelectedFood} selectFood={(f:any)=>setSelectedFood(f)} qty={qty} setQty={setQty} selectedUnit={selectedUnit} setSelectedUnit={setSelectedUnit} handleDirectLog={handleDirectLog}
              isLoading={isLoading} editingId={editingId} setEditingId={setEditingId} editQty={editQty} setEditQty={setEditQty} handleUpdateLog={handleUpdateLog} handleDeleteLog={handleDeleteLog}
            />
          </div>
          <div className="lg:col-span-5 space-y-10">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-10 text-white shadow-3xl relative overflow-hidden group transition-all duration-700">
              <div className="flex justify-between items-center relative z-10 mb-8"><h3 className="text-2xl font-black tracking-tighter flex items-center gap-3"><Sparkles size={24} /> Insights</h3><button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 backdrop-blur-md"><Settings size={20} /></button></div>
              <div className="space-y-8 relative z-10">
                <div className="space-y-3"><div className="flex justify-between text-xs font-black opacity-70"><span>Daily Progress</span><span>{Math.round((consumed.calories / targets.calories) * 100)}%</span></div><div className="h-4 bg-white/20 rounded-full p-0.5"><motion.div animate={{ width: `${Math.min((consumed.calories / targets.calories) * 100, 100)}%` }} className="h-full bg-white rounded-full shadow-[0_0_20px_white]" /></div></div>
                <div className="grid grid-cols-2 gap-5 pt-4"><div className="bg-white/10 backdrop-blur-md rounded-[28px] p-6 border border-white/5 shadow-inner text-center"><p className="text-[10px] font-black uppercase opacity-60">Remaining</p><p className="text-3xl font-black tracking-tighter mt-1">{Math.max(targets.calories - Math.round(consumed.calories), 0)}</p></div><div className="bg-white/10 backdrop-blur-md rounded-[28px] p-6 border border-white/5 shadow-inner text-center"><p className="text-[10px] font-black uppercase opacity-60">Status</p><p className="text-3xl font-black tracking-tighter mt-1">On Track</p></div></div>
              </div>
            </div>
            <div className="relative group transition-all duration-700">
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[40px] border border-white dark:border-white/5 shadow-2xl transition-all duration-700 group-hover:scale-[1.01]" />
              <div className="relative p-10 space-y-6"><h3 className="text-xl font-black tracking-tight mb-2">Indian Diet Tips</h3><ul className="space-y-5">{["Drink Chaas after lunch.", "Add Ghee to your dal.", "Try Bajra Roti."].map((t, i) => (<li key={i} className="flex gap-4 text-sm text-gray-500 font-bold leading-relaxed hover:translate-x-1 transition-all"><span className="w-7 h-7 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black">{i + 1}</span>{t}</li>))}</ul></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

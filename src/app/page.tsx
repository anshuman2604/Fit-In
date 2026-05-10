"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Loader2, LogOut, Settings, Sun, Moon, BrainCircuit, Dna
} from "lucide-react";
import { MacroSection } from "@/components/MacroSection";
import { SettingsModal } from "@/components/SettingsModal";
import { MealLogSection } from "@/components/MealLogSection";
import { AskAI } from "@/components/AskAI";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  // Settings & Navigation State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<any>({ goal: "recomp", target_protein: 150 });
  const [activeTab, setActiveTab] = useState<"ai" | "precise">("ai");

  // Meal Input State
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

  const fetchLogs = useCallback(async (uid: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', uid)
      .gte('logged_at', today.toISOString())
      .order('logged_at', { ascending: false });

    if (data) {
      setLogs(data.map(l => ({
        id: l.id,
        foodName: l.food_name,
        quantity: l.quantity,
        unit: l.unit,
        isVerified: l.is_verified,
        macros: {
          calories: Number(l.calories),
          protein: Number(l.protein),
          carbs: Number(l.carbs),
          fats: Number(l.fats)
        }
      })));
    }
  }, [supabase]);

  const checkUser = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    
    if (p) {
      if (!p.is_onboarded) {
        router.push("/onboarding");
        return;
      }
      setProfile(p);
      setEditProfile({
        ...p,
        age: p.age?.toString() || "",
        weight_kg: p.weight_kg?.toString() || "",
        height_cm: p.height_cm?.toString() || ""
      });
      fetchLogs(u.id);
    } else {
      router.push("/onboarding");
    }
  }, [supabase, router, fetchLogs]);

  useEffect(() => {
    setMounted(true);
    checkUser();
  }, [checkUser]);

  const handleRecalculateAI = async () => {
    setIsAILoading(true);
    try {
      const res = await fetch("/api/onboarding/calculate", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProfile) 
      });
      const d = await res.json();
      if (res.ok) setEditProfile({ ...editProfile, ...d });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleLogMealAI = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/nutrition/parse", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }) 
      });
      const d = await res.json();
      if (d.items) {
        setPendingItems(d.items);
        setInputText("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/nutrition/log-bulk", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ items: pendingItems }) 
      });
      if (res.ok) {
        if (user) fetchLogs(user.id);
        setPendingItems([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (v: string) => {
    setSearchQuery(v);
    if (v.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/foods/search?q=${v}`);
      const d = await res.json();
      setSearchResults(d);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const selectFood = (f: any) => {
    setSelectedFood(f);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleDirectLog = async () => {
    if (!selectedFood) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/nutrition/log-direct", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ foodId: selectedFood.id, quantity: qty, unit: selectedUnit }) 
      });
      if (res.ok) {
        if (user) fetchLogs(user.id);
        setSelectedFood(null);
        setSearchResults([]);
        setSearchQuery("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLog = async (log: any) => {
    try {
      await fetch("/api/nutrition/log/modify", { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ id: log.id, foodId: log.foodId, quantity: editQty, unit: log.unit }) 
      });
      setEditingId(null);
      if (user) fetchLogs(user.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/nutrition/log/modify?id=${id}`, { method: "DELETE" });
      if (user) fetchLogs(user.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const consumed = logs.reduce((a, c) => ({ 
    calories: a.calories + c.macros.calories, 
    protein: a.protein + c.macros.protein, 
    carbs: a.carbs + c.macros.carbs, 
    fats: a.fats + c.macros.fats 
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const targets = {
    protein: profile?.target_protein || 150,
    carbs: profile?.target_carbs || 310,
    fats: profile?.target_fats || 65,
    calories: Math.round(((profile?.target_protein || 150) * 4) + ((profile?.target_carbs || 310) * 4) + ((profile?.target_fats || 65) * 9)),
  };

  if (!mounted || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-x-hidden">
      <AskAI />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        editProfile={editProfile} 
        setEditProfile={setEditProfile}
        isLoading={isLoading} 
        isAILoading={isAILoading}
        onSave={async (e: any) => { 
          e.preventDefault(); 
          setIsLoading(true); 
          await fetch("/api/profile", { 
            method: "PATCH", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editProfile) 
          }); 
          checkUser(); 
          setIsSettingsOpen(false); 
          setIsLoading(false); 
        }}
        onRecalculate={handleRecalculateAI}
      />

      <header className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 sticky top-0 z-[90]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Sparkles size={22} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tighter">Fit In AI</h1>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{profile?.display_name}'s Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} 
              className="p-2.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-600/20"
            >
              {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={handleLogout} 
              className="p-2.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-600/20"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        <MacroSection consumed={consumed} targets={targets} />
        
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Insights First on Mobile */}
          <div className="order-1 lg:order-2 lg:col-span-5 space-y-6 sm:space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-1000"><Dna size={160} /></div>
              <div className="flex justify-between items-center relative z-10 mb-6">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2"><Sparkles size={20} /> Insights</h3>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 backdrop-blur-md"><Settings size={18} /></button>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-70"><span>Daily Progress</span><span>{Math.round((consumed.calories / targets.calories) * 100)}%</span></div>
                  <div className="h-3 bg-white/20 rounded-full p-0.5"><motion.div animate={{ width: `${Math.min((consumed.calories / targets.calories) * 100, 100)}%` }} className="h-full bg-white rounded-full" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/5 shadow-inner flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Remaining</p>
                    <p className="text-2xl sm:text-3xl font-black mt-1 leading-none">{Math.max(targets.calories - Math.round(consumed.calories), 0)}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/5 shadow-inner flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Status</p>
                    <p className="text-xl sm:text-2xl font-black mt-1 uppercase leading-none">Perfect</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[32px] border border-white dark:border-white/5 shadow-xl group-hover:scale-[1.005]" />
              <div className="relative p-6 sm:p-8 space-y-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white leading-none">Diet Tips</h3>
                <ul className="space-y-4">
                  {["Chaas after lunch.", "Ghee in your dal.", "Try Bajra Roti."].map((t, i) => (
                    <li key={i} className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                      <span className="w-6 h-6 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black">{i + 1}</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Meal Log Section */}
          <div className="order-2 lg:order-1 lg:col-span-7">
            <MealLogSection 
              logs={logs} fetchLogs={fetchLogs} user={user}
              activeTab={activeTab} setActiveTab={setActiveTab}
              inputText={inputText} setInputText={setInputText} handleLogMealAI={handleLogMealAI}
              pendingItems={pendingItems} setPendingItems={setPendingItems} handleConfirmLogs={handleConfirmLogs}
              handleSearch={handleSearch} searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
              searchResults={searchResults} setSearchResults={setSearchResults} isSearching={isSearching}
              selectedFood={selectedFood} setSelectedFood={setSelectedFood} selectFood={selectFood} 
              qty={qty} setQty={setQty} selectedUnit={selectedUnit} setSelectedUnit={setSelectedUnit} handleDirectLog={handleDirectLog}
              isLoading={isLoading} editingId={editingId} setEditingId={setEditingId} editQty={editQty} setEditQty={setEditQty} 
              handleUpdateLog={handleUpdateLog} handleDeleteLog={handleDeleteLog}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

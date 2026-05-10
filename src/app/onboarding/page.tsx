"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  ChevronLeft, 
  User, 
  Ruler, 
  Weight, 
  Activity, 
  Dumbbell, 
  Target, 
  Check,
  Loader2,
  Flame,
  Dna,
  Wheat,
  Droplets
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, title: "Body Metrics", desc: "Let's start with the basics." },
  { id: 2, title: "Lifestyle", desc: "How active is your day-to-day?" },
  { id: 3, title: "Your Goal", desc: "What do you want to achieve?" }
];

const LOADING_MESSAGES = [
  "Analyzing your body metrics...",
  "Calculating maintenance calories (TDEE)...",
  "Optimizing your macro split...",
  "Generating your personalized fitness plan...",
  "Almost there..."
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCalculating, setIsSearching] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [results, setResults] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    age: "",
    gender: "male",
    height: "",
    weight: "",
    activity: "sedentary",
    workouts: false,
    goal: "recomp"
  });

  const router = useRouter();
  const supabase = createClient();

  // Rotate loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCalculating) {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isCalculating]);

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
    else handleCalculate();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleCalculate = async () => {
    setIsSearching(true);
    try {
      const response = await fetch("/api/onboarding/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      alert("Error calculating plan. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFinish = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        age: parseInt(formData.age),
        gender: formData.gender,
        height_cm: parseFloat(formData.height),
        weight_kg: parseFloat(formData.weight),
        activity_level: formData.activity,
        workouts: formData.workouts,
        goal: formData.goal,
        target_calories: results.target_calories,
        target_protein: results.target_protein,
        target_carbs: results.target_carbs,
        target_fats: results.target_fats,
        is_onboarded: true
      });

    if (!error) {
      router.push("/");
      router.refresh();
    }
  };

  if (isCalculating) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-hidden">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-64 h-64 flex items-center justify-center"
        >
          {/* Pulsing AI Rings */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-dashed border-indigo-100 rounded-full"
          />
          <motion.div 
            animate={{ scale: [1.1, 1, 1.1], rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border-2 border-indigo-500/20 rounded-full"
          />
          <div className="w-32 h-32 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
            <Sparkles size={48} className="animate-pulse" fill="currentColor" />
          </div>
        </motion.div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={loadingMsgIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="mt-12 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900">{LOADING_MESSAGES[loadingMsgIndex]}</h2>
            <p className="text-gray-400 font-medium mt-2">Personalizing your experience...</p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-white rounded-[40px] p-10 shadow-2xl border border-white space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check size={32} strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Your Plan is Ready!</h1>
            <p className="text-gray-500 font-medium">Our AI set these targets based on your profile.</p>
          </div>

          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 italic text-indigo-700 text-center font-medium leading-relaxed">
            "{results.explanation}"
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Calories', val: results.target_calories, unit: 'kcal', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Protein', val: results.target_protein, unit: 'g', icon: Dna, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Carbs', val: results.target_carbs, unit: 'g', icon: Wheat, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Fats', val: results.target_fats, unit: 'g', icon: Droplets, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((m) => (
              <div key={m.label} className={`${m.bg} rounded-2xl p-4 text-center border border-white`}>
                <m.icon size={20} className={`${m.color} mx-auto mb-2`} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.label}</p>
                <p className={`text-xl font-black ${m.color}`}>{m.val}</p>
                <p className="text-[10px] font-bold text-gray-400">{m.unit}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-4">
            <button 
              onClick={handleFinish}
              className="w-full bg-gray-900 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
            >
              Accept & Start Tracking <ArrowRight size={20} />
            </button>
            <p className="text-center text-xs text-gray-400 font-medium italic">
              Note: You can fully customize these anytime in settings.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl shadow-indigo-100 overflow-hidden border border-white"
      >
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 flex">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`flex-1 transition-all duration-500 ${s <= currentStep ? 'bg-indigo-600' : ''}`}
            />
          ))}
        </div>

        <div className="p-10 space-y-8">
          <header className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">Step {currentStep} of 3</span>
              <h2 className="text-3xl font-black text-gray-900">{STEPS[currentStep - 1].title}</h2>
              <p className="text-gray-500 font-medium">{STEPS[currentStep - 1].desc}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              {currentStep === 1 && <User size={24} />}
              {currentStep === 2 && <Activity size={24} />}
              {currentStep === 3 && <Target size={24} />}
            </div>
          </header>

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div 
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 appearance-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 text-gray-700">Age</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        type="number" 
                        placeholder="Age"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Height (cm)</label>
                  <div className="relative">
                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="number" 
                      placeholder="e.g. 175"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Current Weight (kg)</label>
                  <div className="relative">
                    <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="number" 
                      placeholder="e.g. 70"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div 
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Activity Level</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                      { id: 'lightly_active', label: 'Lightly Active', desc: '1-3 days of exercise' },
                      { id: 'active', label: 'Active', desc: '3-5 days of exercise' },
                      { id: 'very_active', label: 'Very Active', desc: '6-7 days of heavy exercise' }
                    ].map((level) => (
                      <button 
                        key={level.id}
                        onClick={() => setFormData({...formData, activity: level.id})}
                        className={`p-4 rounded-2xl text-left border-2 transition-all ${formData.activity === level.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        <p className="font-bold text-gray-900">{level.label}</p>
                        <p className="text-xs text-gray-400 font-medium">{level.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Dumbbell size={20} />
                    <span className="font-bold">Do you lift weights?</span>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, workouts: !formData.workouts})}
                    className={`w-14 h-8 rounded-full transition-all flex items-center p-1 ${formData.workouts ? 'bg-indigo-600 justify-end' : 'bg-gray-200 justify-start'}`}
                  >
                    <div className="w-6 h-6 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div 
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'cut', label: 'Lose Weight (Cut)', desc: 'Focus on fat loss while keeping muscle.' },
                    { id: 'bulk', label: 'Gain Muscle (Bulk)', desc: 'Focus on building strength and size.' },
                    { id: 'recomp', label: 'Body Recomp', desc: 'Lose fat and gain muscle simultaneously.' }
                  ].map((goal) => (
                    <button 
                      key={goal.id}
                      onClick={() => setFormData({...formData, goal: goal.id})}
                      className={`p-6 rounded-[28px] text-left border-2 transition-all ${formData.goal === goal.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-50 bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <p className="text-lg font-black text-gray-900">{goal.label}</p>
                      <p className="text-sm text-gray-400 font-medium">{goal.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="pt-6 flex gap-4">
            {currentStep > 1 && (
              <button 
                onClick={handleBack}
                className="p-5 rounded-2xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <button 
              onClick={handleNext}
              disabled={currentStep === 1 && (!formData.age || !formData.height || !formData.weight)}
              className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-2xl font-bold transition-all shadow-xl ${
                currentStep === 1 && (!formData.age || !formData.height || !formData.weight)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-100'
              }`}
            >
              {currentStep === 3 ? "Calculate My Plan" : "Continue"}
              <ArrowRight size={20} />
            </button>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}

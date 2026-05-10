"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MacroCardProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  icon: LucideIcon;
  color: string;
  bgLight: string;
  textColor: string;
}

export function MacroCard({ label, current, target, unit, icon: Icon, color, bgLight, textColor }: MacroCardProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const iosSpring: any = { type: "spring", stiffness: 300, damping: 30 };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={iosSpring}
      className="relative group overflow-hidden"
    >
      {/* Premium Compact Glass Background */}
      <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all duration-500 group-hover:scale-[1.01]" />
      
      <div className="relative p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className={`p-2.5 rounded-xl ${bgLight} dark:bg-white/5 ${textColor} dark:text-white transition-colors duration-500`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
              {current} <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 ml-0.5">{unit}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-gray-400">
            <span className="text-gray-900 dark:text-white">{percentage}%</span>
            <span>Target: {target}</span>
          </div>
          <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-white dark:border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ ...iosSpring, delay: 0.1 }}
              className={`h-full rounded-full ${color}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

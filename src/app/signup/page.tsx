"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-2xl text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Sparkles size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Check your email</h1>
          <p className="text-gray-500 font-medium">
            We've sent a verification link to <span className="font-bold text-gray-900">{email}</span>. 
            Please verify your email to start tracking.
          </p>
          <Link href="/login" className="block w-full bg-gray-900 text-white font-bold py-4 rounded-2xl">
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-2xl shadow-indigo-100 border border-white"
      >
        <div className="flex flex-col items-center text-center mb-8 gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <UserPlus size={32} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h1>
            <p className="text-gray-500 font-medium mt-1">Join the ultimate macro tracking community.</p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
            <input 
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center bg-red-50 p-3 rounded-xl">
              {error}
            </p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign Up"}
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 font-medium text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 font-bold hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

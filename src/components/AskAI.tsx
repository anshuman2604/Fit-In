"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, X, Send, Sparkles, Loader2, User, Bot, ChevronDown, Maximize2, Minimize2, LayoutDashboard
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

export function AskAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<any[]>([
    { role: "model", content: "Hi! I'm your **Fit In Coach**. How can I help you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const iosSpring: any = { type: "spring", stiffness: 300, damping: 30 };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages); setInputText(""); setIsLoading(true);
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", body: JSON.stringify({ messages: newMessages }) });
      const d = await res.json();
      if (res.ok) setMessages([...newMessages, { role: "model", content: d.content }]);
      else setMessages([...newMessages, { role: "model", content: "I hit a snag. Try again!" }]);
    } catch (e) { setMessages([...newMessages, { role: "model", content: "Connection error." }]); }
    finally { setIsLoading(false); }
  };

  return (
    <>
      {!isOpen && (
        <motion.button 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          whileHover={{ scale: 1.05 }} 
          transition={iosSpring} 
          onClick={() => setIsOpen(true)} 
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[200]" // INCREASED Z-INDEX
        >
          <MessageCircle size={24} />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={isFullScreen ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={isFullScreen ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.9 }}
            transition={iosSpring}
            className={`fixed z-[210] bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl flex flex-col overflow-hidden shadow-3xl ${
              isFullScreen 
                ? 'inset-0 w-full h-full' 
                : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-[400px] h-[calc(100%-6rem)] sm:h-[600px] rounded-[32px] border border-white/20 dark:border-white/5'
            }`} // INCREASED Z-INDEX
          >
            <div className="bg-indigo-600 p-4 sm:p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md"><Sparkles size={18} /></div>
                <div><h3 className="font-bold text-sm">Fit In Coach</h3><p className="text-[8px] uppercase font-black tracking-widest opacity-60">Personal Assistant</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 hover:bg-white/10 rounded-lg hidden sm:block">{isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
                <button onClick={() => {setIsOpen(false); setIsFullScreen(false);}} className="p-2 hover:bg-white/10 rounded-lg"><ChevronDown size={18} /></button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-[22px] text-sm leading-relaxed max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'}`}>
                    <ReactMarkdown components={{ strong: ({node, ...props}) => <span className="font-black text-indigo-700 dark:text-indigo-400" {...props} />, p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} /> }}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-xs font-black text-gray-400 flex items-center gap-2 px-4"><Loader2 size={12} className="animate-spin" /> Analyzing data...</div>}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/5">
              <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className="relative">
                <input 
                  type="text" 
                  value={inputText} 
                  onChange={e => setInputText(e.target.value)} 
                  placeholder="Ask anything..." 
                  className="w-full bg-gray-50 dark:bg-slate-900 border-none rounded-2xl pl-5 pr-12 py-3 sm:py-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white" 
                />
                <button type="submit" disabled={!inputText.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"><Send size={16} /></button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

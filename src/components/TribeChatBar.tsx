import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MapPin, X, ArrowRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCityCoordinates } from "@/lib/cities";

interface TribeChatBarProps {
  onSendMessage: (message: string, city: string, coords: [number, number]) => void;
  className?: string;
}

export default function TribeChatBar({ onSendMessage, className }: TribeChatBarProps) {
  const [step, setStep] = useState<'message' | 'city'>('message');
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNext = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim()) return;
    setStep('city');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!city.trim()) return;

    const coords = getCityCoordinates(city);
    if (coords) {
      onSendMessage(message, city, coords);
      reset();
    } else {
      setError("City not found.");
      setTimeout(() => setError(null), 2000);
    }
  };

  const reset = () => {
    setMessage("");
    setCity("");
    setStep('message');
    setError(null);
    setIsFocused(false);
  };

  return (
    <div className={cn(
      "fixed bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 md:px-6 pointer-events-none transition-all duration-300",
      isFocused && "bottom-1/2 translate-y-1/2 md:bottom-10 md:translate-y-0",
      className
    )}>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto"
      >
        <div className={cn(
          "relative h-14 md:h-16 bg-black/90 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl flex items-center transition-all duration-500 overflow-hidden",
          isFocused ? "border-taurus-gold/50 shadow-[0_0_40px_rgba(212,175,55,0.2)] scale-105" : "hover:bg-charcoal"
        )}>
          <AnimatePresence mode="wait">
            {step === 'message' ? (
              <motion.form 
                key="msg-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleNext}
                className="flex-1 flex items-center h-full px-5 md:px-6"
              >
                <MessageSquare className="w-5 h-5 text-taurus-gold/60 mr-3 md:mr-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Write on the wall..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="bg-transparent border-none outline-none flex-1 text-cream placeholder:text-cream/30 text-base font-medium h-full"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="ml-2 w-10 h-10 md:w-11 md:h-11 rounded-full bg-taurus-gold text-space-bg flex items-center justify-center hover:scale-110 active:scale-90 transition-all disabled:opacity-20 disabled:grayscale shadow-lg shadow-black/40"
                >
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="city-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit}
                className="flex-1 flex items-center h-full px-5 md:px-6"
              >
                <div className="flex items-center gap-2 mr-3 md:mr-4 shrink-0">
                  <button type="button" onClick={() => setStep('message')} className="p-2 hover:bg-white/10 rounded-full text-cream/40 active:scale-75 transition-transform">
                    <X size={16} />
                  </button>
                  <MapPin className="w-5 h-5 text-taurus-gold animate-pulse" />
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder={error ? error : "Which city..."}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={cn(
                    "bg-transparent border-none outline-none flex-1 text-cream placeholder:text-cream/30 text-base font-medium h-full",
                    error && "text-red-400 placeholder:text-red-400"
                  )}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!city.trim()}
                  className="ml-2 px-6 md:px-8 h-10 md:h-11 rounded-full bg-taurus-gold text-space-bg flex items-center justify-center font-black uppercase text-[10px] md:text-[11px] tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-black/40"
                >
                  Chat
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

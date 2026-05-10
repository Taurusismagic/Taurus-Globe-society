import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCityCoordinates, MAJOR_CITIES } from "@/lib/cities";

interface TribeChatBarProps {
  onSendMessage: (message: string, city: string, coords: [number, number]) => void;
  className?: string;
}

export default function TribeChatBar({ onSendMessage, className }: TribeChatBarProps) {
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldFollowCursor, setShouldFollowCursor] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Follow cursor logic after 5 seconds
  useEffect(() => {
    if (isMobile) return;

    const timer = setTimeout(() => {
      setShouldFollowCursor(true);
      setIsExpanded(true); // Force expanded when following cursor
    }, 5000);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isMobile]);

  // Handle submit
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || !city.trim()) return;

    const coords = getCityCoordinates(city);
    if (coords) {
      onSendMessage(message, city, coords);
      setMessage("");
      setCity("");
      setError(null);
      setIsExpanded(false);
      setShouldFollowCursor(false);
    } else {
      setError("City not recognized. Try the nearest major city.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const containerVariants = {
    initial: isMobile ? {
      top: "50%",
      left: "50%",
      x: "-50%",
      y: "-50%",
      scale: 1.1
    } : {
      bottom: "2rem",
      left: "50%",
      x: "-50%",
      y: 0,
    },
    following: {
      left: mousePos.x,
      top: mousePos.y,
      x: "-50%",
      y: "-50%",
      transition: { type: "spring", damping: 20, stiffness: 150, mass: 0.5 }
    }
  };

  return (
    <motion.div
      ref={barRef}
      initial="initial"
      animate={shouldFollowCursor && !isMobile ? "following" : "initial"}
      variants={containerVariants}
      className={cn(
        "fixed z-[100] flex flex-col items-center pointer-events-auto",
        className
      )}
    >
      <AnimatePresence>
        {(isExpanded || isMobile || shouldFollowCursor) ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-[90vw] max-w-md bg-black/80 backdrop-blur-2xl border border-taurus-gold/30 p-4 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.2)]"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-taurus-gold font-display italic text-lg tracking-wide">Sync with the Tribe</h3>
              {!isMobile && !shouldFollowCursor && (
                <button onClick={() => setIsExpanded(false)} className="text-cream/40 hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-3"
              animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="What's on your mind?"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:border-taurus-gold/50 transition-colors"
                  autoFocus={isMobile || shouldFollowCursor}
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-taurus-gold/60" size={16} />
                <input
                  type="text"
                  placeholder="Your City (e.g. London, NYC, Tokyo)"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (error) setError(null);
                  }}
                  className={cn(
                    "w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none transition-colors",
                    error ? "border-red-500/50 focus:border-red-500" : "focus:border-taurus-gold/50"
                  )}
                />
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-[10px] mt-1 ml-2 font-medium"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={!message.trim() || !city.trim()}
                className={cn(
                  "w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                  error
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-taurus-gold text-space-bg hover:bg-light-gold"
                )}
              >
                <Send size={18} />
                <span>Broadcast Signal</span>
              </button>
            </motion.form>
          </motion.div>
        ) : (
          <motion.button
            layoutId="chat-bar-trigger"
            onClick={() => setIsExpanded(true)}
            className="px-6 py-3 bg-black/60 backdrop-blur-xl border border-taurus-gold/20 rounded-full text-taurus-gold font-medium flex items-center gap-3 hover:border-taurus-gold/50 transition-all shadow-lg"
          >
            <div className="w-2 h-2 rounded-full bg-taurus-gold animate-pulse" />
            Join the Conversation
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

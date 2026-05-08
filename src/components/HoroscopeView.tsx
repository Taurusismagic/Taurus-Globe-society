import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Moon, Heart, Zap, Briefcase, Globe, Cake, Share2, Check, Sparkles, ArrowLeft } from "lucide-react";
import { getDetailedHoroscope, ZodiacHoroscope } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import { ZODIAC_SIGNS } from "@/constants";

interface HoroscopeViewProps {
  key?: string;
  sign: string;
  onClose: () => void;
}

export default function HoroscopeView({ sign, onClose }: HoroscopeViewProps) {
  const [horoscope, setHoroscope] = useState<ZodiacHoroscope | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'pulse' | 'deep'>('pulse');
  const [showVibeCard, setShowVibeCard] = useState(false);

  useEffect(() => {
    const fetchHoroscope = async () => {
      setLoading(true);
      const data = await getDetailedHoroscope(sign);
      setHoroscope(data);
      setLoading(false);
    };
    fetchHoroscope();
  }, [sign]);

  const signData = ZODIAC_SIGNS.find(s => s.name === sign);

  const formattedDate = horoscope ? (() => {
    const [year, month, day] = horoscope.date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  })() : "";

  const handleShare = async () => {
    if (!horoscope) return;
    
    const shareText = `${signData?.symbol} #${sign} | Signal Received for ${formattedDate}\n\n"${horoscope.short.general}"\n\nRead your full reading on Celestial Connect:`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${sign} Daily Reading`, text: shareText, url: shareUrl });
      } catch (err) { console.log('Share failed:', err); }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) { console.error('Failed to copy:', err); }
    }
  };

  const handleEnterTribe = () => {
    const etString = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const seed = `${sign}_${etString}`;
    
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const h = Math.abs(hash % 360);
    const s = 60 + (Math.abs(hash % 40));
    const l = 60 + (Math.abs(hash % 20));
    const sessionColor = `hsl(${h}, ${s}%, ${l}%)`;
    
    localStorage.setItem("zodiac_session_color", sessionColor);
    localStorage.setItem("user_zodiac_sign", sign || "");
    
    onClose();
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[12000] bg-[#050505] flex flex-col items-center justify-center p-6"
      >
        <div className="relative w-32 h-32 mb-8">
          <motion.svg viewBox="0 0 100 100" className="w-full h-full text-taurus-gold">
            <motion.circle 
              cx="50" cy="50" r="40" 
              fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1 10"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.circle 
              cx="50" cy="50" r="25" 
              fill="none" stroke="currentColor" strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0.2 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx="50" cy="50" r="6" fill="currentColor"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.svg>
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.5em] text-taurus-gold animate-pulse">Receiving {sign} Signal</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-cream/20 italic">Decrypting Celestial Data...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-[12000] bg-[#050505] overflow-y-auto overflow-x-hidden safe-pb overscroll-behavior-y-contain pb-40"
    >
      <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />
      
      {/* Background Ambience (Nebula Style) */}
      <div className="absolute inset-x-0 top-0 h-screen pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#00F5FF]/10 blur-[150px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#8B5CF6]/10 blur-[150px] rounded-full animate-pulse-slow-reverse" />
        <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-taurus-gold/5 blur-[120px] rounded-full animate-pulse" />
        
        {/* Constellation Dots */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 pb-32">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-cream/60 hover:text-white transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Globe</span>
          </button>

          <div className="inline-flex items-center gap-3 px-4 py-2 bg-taurus-gold/10 rounded-full border border-taurus-gold/20">
            <Moon className="w-3 h-3 text-taurus-gold" />
            <span className="text-[9px] font-black uppercase tracking-widest text-taurus-gold">{formattedDate}</span>
          </div>
        </div>

        {horoscope && (
          <div className="space-y-12">
            <div className="text-center space-y-4">
               {horoscope.isBirthdaySeason && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center gap-3 mb-6"
                >
                  <Cake className="w-5 h-5 text-taurus-gold" />
                  <span className="text-xl sm:text-2xl font-black text-white italic tracking-tight underline decoration-taurus-gold/40 underline-offset-8">Happy Birthday, {sign}!</span>
                </motion.div>
              )}

              <h1 className="text-5xl sm:text-8xl lg:text-9xl font-black text-white tracking-tighter uppercase italic leading-[0.8] mb-8">
                {sign}.
              </h1>

              <div className="flex justify-center pt-8 gap-8 items-center">
                <div className="text-center group">
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-taurus-gold/50 mb-2">Sync Level</div>
                   <div className="text-4xl font-display italic text-taurus-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                     {horoscope.alignmentScore}%
                   </div>
                </div>
                
                <div className="w-px h-12 bg-white/10" />

                <div className="text-center group">
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Power Hours</div>
                   <div className="text-sm font-accent font-medium text-cream/80">
                     {horoscope.powerHours}
                   </div>
                </div>
              </div>

              <div className="flex justify-center pt-10">
                <div className="bg-white/5 p-1.5 rounded-full border border-white/10 flex items-center shadow-xl">
                  <button 
                    onClick={() => setViewMode('pulse')}
                    className={cn(
                      "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                      viewMode === 'pulse' ? "bg-taurus-gold text-space-bg shadow-[0_0_20px_rgba(212,175,55,0.4)]" : "text-cream/40 hover:text-white"
                    )}
                  >
                    Pulse
                  </button>
                  <button 
                    onClick={() => { setViewMode('deep'); setIsExpanded(true); }}
                    className={cn(
                      "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                      viewMode === 'deep' ? "bg-taurus-gold text-space-bg shadow-[0_0_20px_rgba(212,175,55,0.4)]" : "text-cream/40 hover:text-white"
                    )}
                  >
                    Deep Read
                  </button>
                </div>
              </div>
            </div>

            {/* Reading Card */}
            <div className="glass-panel p-8 sm:p-12 lg:p-16 rounded-[48px] border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-taurus-gold/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="space-y-12 relative z-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-taurus-gold">
                    <Globe className="w-6 h-6" />
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] opacity-80">The General Vibe</h4>
                  </div>
                  <p className={cn(
                    "text-cream/90 leading-relaxed font-medium transition-all duration-700",
                    viewMode === 'deep' ? "text-xl sm:text-2xl md:text-3xl" : "text-lg sm:text-xl italic font-serif"
                  )}>
                    {viewMode === 'deep' ? horoscope.general : horoscope.short.general}
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {(viewMode === 'pulse' || isExpanded) && (
                    <motion.div
                      key={`horo-content-${viewMode}-${sign}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="space-y-12"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <HoroscopeDetail icon={<Heart size={18} />} title="Love Life" content={viewMode === 'deep' ? horoscope.love : horoscope.short.love} />
                        <HoroscopeDetail icon={<Zap size={18} />} title="Energy" content={viewMode === 'deep' ? horoscope.energy : horoscope.short.energy} />
                        <HoroscopeDetail icon={<Briefcase size={18} />} title="Career" content={viewMode === 'deep' ? horoscope.career : horoscope.short.career} />
                        <HoroscopeDetail icon={<Globe size={18} />} title="Planets & Transits" content={viewMode === 'deep' ? horoscope.planets : horoscope.short.planets} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row items-center gap-6 pt-12 border-t border-white/10">
                  <button 
                    onClick={handleShare}
                    className="w-full sm:w-auto px-10 py-5 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-cream/60 hover:text-taurus-gold transition-all border border-white/10 hover:border-taurus-gold/40 rounded-2xl bg-white/5 active:scale-95"
                  >
                    {isCopied ? (
                      <><Check size={14} className="text-green-500" /><span className="text-green-500">Copied Link</span></>
                    ) : (
                      <><Share2 size={14} /><span>Share Signal</span></>
                    )}
                  </button>

                  <button
                    onClick={() => setShowVibeCard(true)}
                    className="w-full sm:w-auto px-10 py-5 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-taurus-gold/60 hover:text-taurus-gold transition-all border border-taurus-gold/10 hover:bg-taurus-gold/5 rounded-2xl active:scale-95"
                  >
                    <Sparkles size={14} />
                    Preview Vibe Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vibe Card Overlay */}
      <AnimatePresence>
        {showVibeCard && horoscope && (
          <motion.div
            key="vibe-card-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-[420px] aspect-[9/16] bg-[#050505] rounded-[60px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/10"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_#D4AF3720_0%,_transparent_50%)]" />
              
              <div className="relative h-full p-10 flex flex-col items-center justify-between text-center overflow-y-auto custom-scrollbar pt-20">
                <div className="space-y-6 shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-taurus-gold/20 to-transparent border border-taurus-gold/40 flex items-center justify-center mx-auto shadow-2xl">
                    <span className="text-3xl sm:text-4xl">{signData?.symbol}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-taurus-gold">Daily Frequency</h3>
                    <p className="text-[8px] font-bold text-cream/30 uppercase tracking-widest">{formattedDate}</p>
                  </div>
                </div>

                <div className="space-y-6 py-6 shrink-0">
                  <div className="w-8 h-px bg-taurus-gold/30 mx-auto" />
                  <p className="text-2xl sm:text-4xl font-black text-white italic leading-[1.1] tracking-tighter lowercase px-4">
                    {horoscope.short.general}
                  </p>
                  <div className="w-8 h-px bg-taurus-gold/30 mx-auto" />
                </div>

                <div className="space-y-4 shrink-0 pb-10">
                  <h4 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase italic leading-[0.8]">
                    {sign}.
                  </h4>
                  <p className="text-[8px] font-black uppercase tracking-[0.5em] text-taurus-gold/60">Unlock Your Magical Path</p>
                </div>
              </div>

              <button 
                onClick={() => setShowVibeCard(false)}
                className="absolute top-8 right-8 w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all border border-white/5"
              >
                <X size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HoroscopeDetail({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
  return (
    <div className="space-y-4 group">
      <div className="flex items-center gap-3 text-taurus-gold/70 group-hover:text-taurus-gold transition-colors">
        <div className="p-2 bg-taurus-gold/5 rounded-lg border border-taurus-gold/10">
          {icon}
        </div>
        <h5 className="text-[11px] font-black uppercase tracking-[0.3em]">{title}</h5>
      </div>
      <p className="text-base text-cream/70 leading-relaxed font-medium">
        {content}
      </p>
    </div>
  );
}

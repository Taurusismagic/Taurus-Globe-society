import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, Sparkles, Loader2, CheckCircle2, User, Terminal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { ZODIAC_SIGNS } from "@/constants";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1);

  // Form State
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [city, setCity] = useState("");
  const [sign, setSign] = useState("Taurus");
  const [userType, setUserType] = useState<'business' | 'fun'>('fun');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Geocode the city using our existing server endpoint or a simple mock
      const geoResponse = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city })
      });
      const geoData = await geoResponse.json();

      // 2. Call onboard endpoint (which also sends the welcome email)
      const onboardResponse = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName,
          city: geoData.formatted || city,
          sign,
          lat: geoData.latitude || 0,
          lng: geoData.longitude || 0,
          userType
        })
      });

      if (!onboardResponse.ok) {
        throw new Error("Failed to initialize node. Connection lost.");
      }

      setIsSuccess(true);
      await refreshProfile();
      
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-xl"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl glass-panel rounded-[2.5rem] border border-taurus-gold/30 shadow-[0_0_100px_rgba(212,175,55,0.1)] overflow-hidden flex flex-col"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className={cn("h-full bg-taurus-gold transition-all duration-500", step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full")} />
        </div>

        <div className="p-8 md:p-12">
          {isSuccess ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-10"
            >
              <div className="w-24 h-24 bg-taurus-gold/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-taurus-gold/40 shadow-gold">
                <CheckCircle2 className="w-12 h-12 text-taurus-gold" />
              </div>
              <h2 className="text-4xl font-display font-medium text-light-gold mb-4 italic">You're In!</h2>
              <p className="text-cream/50 font-medium text-lg leading-relaxed max-w-sm mx-auto">
                Welcome to our community, {displayName}! You're all set. Check your inbox for a special welcome email.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="text-center">
                <h2 className="text-4xl font-display font-medium text-light-gold tracking-tight italic mb-2">
                  Start Your Journey
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-taurus-gold/60">
                  Step {step} / 3: {step === 1 ? "Who are you?" : step === 2 ? "Where are you?" : "What's your sign?"}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-6">
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taurus-gold/40" />
                        <input 
                          required
                          type="text"
                          placeholder="Display Name"
                          className="input-field pl-12 w-full"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setUserType('fun')}
                          className={cn(
                            "py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all",
                            userType === 'fun' ? "bg-taurus-gold text-charcoal border-taurus-gold" : "bg-white/5 border-white/10 text-cream/40"
                          )}
                        >
                          Individual
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserType('business')}
                          className={cn(
                            "py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all",
                            userType === 'business' ? "bg-taurus-gold text-charcoal border-taurus-gold" : "bg-white/5 border-white/10 text-cream/40"
                          )}
                        >
                          Entrepreneur
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-6">
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taurus-gold/40" />
                        <input 
                          required
                          type="text"
                          placeholder="Current City (e.g. London, Tokyo)"
                          className="input-field pl-12 w-full"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <p className="text-[10px] text-cream/30 text-center uppercase tracking-widest leading-relaxed">
                        Sharing your city helps you find people nearby.
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                      {ZODIAC_SIGNS.map((s) => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => setSign(s.name)}
                          className={cn(
                            "aspect-square flex flex-col items-center justify-center gap-1 rounded-2xl border transition-all",
                            sign === s.name ? "bg-taurus-gold text-charcoal border-taurus-gold" : "bg-white/5 border-white/10 text-cream/40 hover:bg-white/10"
                          )}
                        >
                          <span className="text-xl">{s.symbol}</span>
                          <span className="text-[8px] font-black uppercase tracking-tighter">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="text-clay text-xs text-center font-bold">{error}</p>}

              <div className="flex gap-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-cream/40 hover:text-white transition-all font-black uppercase text-xs tracking-widest"
                  >
                    Back
                  </button>
                )}
                <button 
                  type={step === 3 ? "submit" : "button"}
                  onClick={() => step < 3 && setStep(step + 1)}
                  disabled={loading || (step === 1 && !displayName) || (step === 2 && !city)}
                  className="btn-primary flex-1 flex items-center justify-center gap-3 py-4 font-black uppercase tracking-[0.2em] text-sm"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {step === 3 ? "Join the Tribe" : "Next Step"}
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

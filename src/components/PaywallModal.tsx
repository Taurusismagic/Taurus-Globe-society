import { motion } from "motion/react";
import { X, Sparkles, CheckCircle2, ShieldCheck, CreditCard, Twitter, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (type: 'subscription' | 'x_promotion' = 'subscription') => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email, type })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Could not create checkout session");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-overlay/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-modal w-full max-w-lg rounded-[40px] border border-white/10 shadow-2xl overflow-hidden relative shadow-gold/20 backdrop-blur-3xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 text-cream/40 hover:text-cream transition-all z-10"
        >
          <X className="w-7 h-7" />
        </button>

        <div className="relative h-56 bg-white/[0.02] flex items-center justify-center overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-taurus-gold/20 via-transparent to-transparent" />
          <div className="relative group">
            <div className="absolute inset-0 bg-taurus-gold blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <Sparkles className="w-32 h-32 text-taurus-gold relative z-10 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
          </div>
        </div>

        <div className="p-12 text-center">
          <h2 className="text-4xl font-black mb-4 text-cream tracking-tight">The Inner Circle.</h2>
          <p className="text-cream/50 mb-10 font-medium max-w-xs mx-auto">
            Upgrade your frequency. Join the elite sovereign tribe and manifest your global presence.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-12 text-left px-4">
            {[
              "Join Global Nexus Chat",
              "Access Architect Directory",
              "Direct Frequency Signals",
              "Elite 'Elite' Badge",
              "Priority Access to Tribe Events",
              "Glinting Sovereign Node"
            ].map((feature, i) => (
              <div key={`feature-${i}`} className="flex items-center gap-4 group">
                <div className="w-5 h-5 rounded-full bg-taurus-gold/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-3.5 h-3.5 text-taurus-gold" />
                </div>
                <span className="text-[13px] font-bold text-cream/70 tracking-tight">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-white/[0.03] p-8 rounded-3xl border border-white/5 mb-10 border-dashed relative overflow-hidden group">
            <div className="absolute inset-0 bg-taurus-gold/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <div className="flex items-center justify-between relative z-10">
              <div className="text-left">
                <div className="text-[10px] font-black text-taurus-gold uppercase tracking-[0.2em] mb-1.5 whitespace-nowrap">Membership Tier</div>
                <div className="text-2xl font-black text-cream tracking-tight">Tribe Explorer</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-taurus-gold">$12.99</div>
                <div className="text-[9px] text-cream/30 uppercase font-black tracking-widest">per month</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => handleUpgrade('subscription')}
              disabled={loading}
              className="btn-primary w-full h-16 text-lg flex items-center justify-center gap-4 relative overflow-hidden group/upgrade"
            >
              {loading ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  <span className="font-black uppercase tracking-[0.2em] text-sm">Initialize Membership</span>
                  <motion.div 
                    className="absolute inset-x-0 bottom-0 h-1 bg-white/20"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </>
              )}
            </button>

            <button 
              onClick={() => handleUpgrade('x_promotion')}
              disabled={loading}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-cream/60 hover:text-taurus-gold hover:border-taurus-gold/30 hover:bg-taurus-gold/5 transition-all group"
            >
              <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Request X.com Promotion — $49.99</span>
            </button>
          </div>
          
          <p className="mt-8 text-[9px] text-cream/40 uppercase tracking-[0.3em] font-black flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3 text-taurus-gold" />
            Secured via Stripe Nexus
          </p>
        </div>
      </motion.div>
    </div>
  );
}

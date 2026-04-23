import { motion } from "motion/react";
import { X, Sparkles, CheckCircle2, ShieldCheck, CreditCard } from "lucide-react";
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

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
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
        className="bg-cream w-full max-w-lg rounded-[32px] border-4 border-taurus-gold shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-mid-gray hover:text-charcoal transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative h-48 bg-space-bg flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-taurus-gold/30 to-transparent" />
          <Sparkles className="w-24 h-24 text-taurus-gold animate-pulse relative z-10" />
        </div>

        <div className="p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Unlock the Full Tribe</h2>
          <p className="text-mid-gray mb-8">
            Join the inner circle. Get exclusive access to the Global Chat, Business Directory, and premium profile features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left">
            {[
              "Join Global & Regional Chat",
              "Access Business Member Directory",
              "Send Private Connection Requests",
              "Premium 'Paid' Badge on Profile",
              "Early Access to Tribe Events",
              "Highlighted Golden Pin on Globe"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-forest-green flex-shrink-0" />
                <span className="text-sm font-medium text-charcoal/80">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-taurus-gold/20 mb-8 border-dashed">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-xs font-bold text-mid-gray uppercase tracking-widest mb-1">Membership Plan</div>
                <div className="text-lg font-bold text-taurus-gold">Tribe Explorer</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">$12.99</div>
                <div className="text-[10px] text-mid-gray uppercase">per month</div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleUpgrade}
            disabled={loading}
            className="btn-primary w-full h-14 text-lg flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                 <CreditCard className="w-6 h-6" />
                 <span>Join the Inner Circle</span>
                 <motion.div 
                   className="absolute inset-x-0 bottom-0 h-1 bg-white/30"
                   initial={{ x: "-100%" }}
                   animate={{ x: "100%" }}
                   transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 />
              </>
            )}
          </button>
          
          <p className="mt-6 text-[10px] text-mid-gray uppercase tracking-widest font-bold">
            Securely processed by Stripe. Cancel anytime.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}

import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay/80 backdrop-blur-[2px] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-modal w-full max-w-sm rounded-[32px] border border-white/10 shadow-2xl overflow-hidden relative p-8 backdrop-blur-3xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-cream/40 hover:text-cream transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-taurus-gold/10 rounded-2xl flex items-center justify-center text-taurus-gold mb-6 rotate-3">
             <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-cream tracking-tight mb-2">Access Portal.</h2>
          <p className="text-cream/50 text-sm font-medium">Re-initialize your frequency.</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-taurus-gold/40 group-focus-within:text-taurus-gold transition-colors" />
            <input 
              required
              type="email"
              placeholder="Secure Email"
              className="input-field pl-14"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-taurus-gold/40 group-focus-within:text-taurus-gold transition-colors" />
            <input 
              required
              type="password"
              placeholder="Access Token (Password)"
              className="input-field pl-14"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-clay text-xs font-bold uppercase tracking-wider animate-pulse pt-2 text-center">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3 h-14 mt-6"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                Sign In
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  →
                </motion.span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-cream/30 uppercase font-black tracking-widest">
          Forgotten frequency? <button className="text-taurus-gold hover:text-white transition-colors">Reset</button>
        </p>
      </motion.div>
    </div>
  );
}

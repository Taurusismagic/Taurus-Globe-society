import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
    if (!supabase) return setError("System is currently offline. Please check back later.");
    setLoading(true);
    setError(null);

    try {
      if (!supabase) throw new Error("Connection failed");
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
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
        className="bg-cream w-full max-w-sm rounded-[24px] border-2 border-taurus-gold shadow-2xl overflow-hidden relative p-8"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-mid-gray hover:text-charcoal transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-mid-gray text-center text-sm mb-8">Sign in to your account</p>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mid-gray" />
            <input 
              required
              type="email"
              placeholder="Email Address"
              className="input-field pl-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mid-gray" />
            <input 
              required
              type="password"
              placeholder="Password"
              className="input-field pl-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-clay text-xs font-medium">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-mid-gray">
          Forgot your password? <button className="text-taurus-gold font-bold hover:underline">Reset it</button>
        </p>
      </motion.div>
    </div>
  );
}

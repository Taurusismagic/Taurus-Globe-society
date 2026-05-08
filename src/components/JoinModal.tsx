import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Briefcase, Star, MapPin, Key, User, Mail, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/lib/errorUtils";
import confetti from "canvas-confetti";

interface JoinModalProps {
  key?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (location: [number, number]) => void;
  onboardingPins?: Array<{ lat: number; lng: number; label: string; color: string }>;
}

export default function JoinModal({ isOpen, onClose, onSuccess, onboardingPins }: JoinModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create Profile
      const locationPin = onboardingPins?.[0];
      const profilePath = `profiles/${user.uid}`;
      
      await setDoc(doc(db, 'profiles', user.uid), {
        display_name: name,
        email: email,
        latitude: locationPin?.lat || 0,
        longitude: locationPin?.lng || 0,
        tier: 'member',
        is_visible: true,
        is_banned: false,
        created_at: serverTimestamp(),
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`
      }).catch(error => {
        handleFirestoreError(error, OperationType.WRITE, profilePath);
      });

      // 3. Create welcome notification
      await addDoc(collection(db, 'profiles', user.uid, 'notifications'), {
        title: "Welcome to the Nexus",
        message: "Your frequency has been synchronized. Explore the stars and connect with your tribe.",
        type: 'system',
        is_read: false,
        created_at: serverTimestamp()
      }).catch(err => console.error("Welcome notification failed", err));
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#000000', '#F5E6C0']
      });

      setIsSuccess(true);
      if (locationPin) {
        onSuccess?.([locationPin.lat, locationPin.lng]);
      }
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setName("");
        setEmail("");
        setPassword("");
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto p-4 flex items-center justify-center">
      <motion.div 
        key="join-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        key="join-modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="my-auto glass-modal w-full max-w-sm rounded-[40px] border border-white/10 shadow-2xl overflow-hidden relative overscroll-behavior-contain touch-pan-y z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-cream/40 hover:text-cream transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="join-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black mb-2 text-taurus-gold tracking-tight uppercase italic">Join the Cosmos.</h2>
                  <p className="text-cream/50 text-sm font-medium">Create your Celestial Connect profile.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-5">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taurus-gold/40 group-focus-within:text-taurus-gold transition-colors z-10" />
                    <input 
                      required
                      type="text"
                      placeholder="Display Name"
                      style={{ fontSize: '16px' }}
                      className="input-field pl-12 font-bold w-full relative z-0"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taurus-gold/40 group-focus-within:text-taurus-gold transition-colors z-10" />
                    <input 
                      required
                      type="email"
                      placeholder="Email Address"
                      style={{ fontSize: '16px' }}
                      className="input-field pl-12 font-bold w-full relative z-0"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taurus-gold/40 group-focus-within:text-taurus-gold transition-colors z-10" />
                    <input 
                      required
                      type="password"
                      placeholder="Secure Password"
                      style={{ fontSize: '16px' }}
                      className="input-field pl-12 font-bold w-full relative z-0"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {error && <p className="text-clay text-xs text-center font-bold">{error}</p>}

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full flex items-center justify-center gap-3 py-4 font-black uppercase tracking-widest text-sm"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                          Join Free
                          <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                            →
                          </motion.span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="join-success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-taurus-gold/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-gold border border-taurus-gold/40">
                  <CheckCircle2 className="w-12 h-12 text-taurus-gold" />
                </div>
                <h2 className="text-3xl font-black text-cream mb-2 tracking-tighter uppercase italic">Welcome home.</h2>
                <p className="text-cream/50 font-medium text-base mb-6">
                  Your identity has been verified. Welcome to the tribe.
                </p>
                <div className="inline-block px-4 py-2 bg-taurus-gold/10 border border-taurus-gold/30 rounded-xl">
                  <p className="text-taurus-gold text-[10px] font-black uppercase tracking-[0.3em]">Account Type: Free Member</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

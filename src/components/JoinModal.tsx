import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Briefcase, Star, MapPin, Key, User, Mail, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import confetti from "canvas-confetti";

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (location: [number, number]) => void;
}

export default function JoinModal({ isOpen, onClose, onSuccess }: JoinModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [userType, setUserType] = useState<'business' | 'fun' | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [geoResult, setGeoResult] = useState<{lat: number, lng: number, formatted: string} | null>(null);

  const handleGeocode = async () => {
    if (!locationStr) return setError("Enter a postcode or city");
    setLoading(true);
    setError(null);
    try {
      const geoRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: locationStr })
      });
      const geoData = await geoRes.json();
      if (!geoRes.ok) throw new Error(geoData.error || 'Area not recognized');
      
      setGeoResult({
        lat: geoData.latitude,
        lng: geoData.longitude,
        formatted: geoData.formatted
      });
      
      onSuccess([geoData.latitude, geoData.longitude]);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geoResult) return setStep(1);
    
    setLoading(true);
    setError(null);

    try {
      // 1. Validate Invite Code (If provided)
      if (inviteCode) {
        const inviteRes = await fetch('/api/invite/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: inviteCode })
        });
        const inviteData = await inviteRes.json();
        if (!inviteData.valid) throw new Error(inviteData.error || 'Invalid code');
      }

      // 2. Sign Up
      const authData = await createUserWithEmailAndPassword(auth, email, password);
      
      if (!authData.user) throw new Error("Registry failed");

      // 3. Increment Invite Code if used
      if (inviteCode) {
        await fetch('/api/invite/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: inviteCode, increment: true })
        });
      }

      // 4. Finalize Profile
      await setDoc(doc(db, 'profiles', authData.user.uid), {
        display_name: displayName,
        avatar_url: null,
        city: geoResult.formatted,
        latitude: geoResult.lat,
        longitude: geoResult.lng,
        user_type: userType!,
        bio: null,
        instagram_handle: null,
        twitter_handle: null,
        is_visible: true,
        tier: 'member',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B6914', '#F5E6C0', '#2D5016']
      });

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-space-bg/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-modal w-full max-w-md rounded-[32px] border border-taurus-gold/30 shadow-2xl overflow-hidden relative shadow-gold/20"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-cream/40 hover:text-cream transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-10">
          <div className="flex justify-center gap-2 mb-10">
            {[1, 2, 3].map(i => (
              <div key={i} className={cn("w-2 h-2 rounded-full transition-colors duration-500", step >= i ? "bg-taurus-gold" : "bg-light-gray")} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-10">
                  <div className="inline-flex p-4 rounded-3xl bg-taurus-gold/10 text-taurus-gold mb-6 rotate-6 group-hover:rotate-0 transition-transform">
                    <MapPin className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black mb-3 text-cream tracking-tight">Plant Your Pin.</h2>
                  <p className="text-cream/50 text-sm px-4 font-medium">Verify your location to materialize on the global nexus.</p>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="relative group">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-taurus-gold/40 group-focus-within:text-taurus-gold transition-colors" />
                    <input 
                      required
                      placeholder="City or Postcode"
                      className="input-field pl-14"
                      value={locationStr}
                      onChange={(e) => setLocationStr(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
                    />
                  </div>
                  {error && <p className="text-clay text-xs text-center font-bold animate-pulse uppercase tracking-wider">{error}</p>}
                </div>

                <button 
                  onClick={handleGeocode}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-3 group/btn"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      Verify Coordinates
                      <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        →
                      </motion.span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-10">
                   <h2 className="text-3xl font-black mb-3 text-cream tracking-tight">Your Frequency.</h2>
                   <p className="text-cream/50 text-sm font-medium">How do you manifest your power?</p>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-10">
                  <button
                    onClick={() => setUserType('business')}
                    className={cn(
                      "flex items-center gap-6 p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden group",
                      userType === 'business' 
                        ? "bg-taurus-gold/10 border-taurus-gold shadow-gold" 
                        : "bg-white/5 border-white/5 hover:border-taurus-gold/30"
                    )}
                  >
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500", 
                      userType === 'business' ? "bg-taurus-gold text-white scale-110 rotate-3" : "bg-white/5 text-taurus-gold group-hover:rotate-3")}>
                      <Briefcase className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-lg text-cream">Entrepreneur</div>
                      <div className="text-xs text-cream/40 font-medium mt-1 uppercase tracking-widest">Building the Future</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setUserType('fun')}
                    className={cn(
                      "flex items-center gap-6 p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden group",
                      userType === 'fun' 
                        ? "bg-clay/10 border-clay shadow-2xl shadow-clay/20" 
                        : "bg-white/5 border-white/5 hover:border-clay/30"
                    )}
                  >
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                      userType === 'fun' ? "bg-clay text-white scale-110 -rotate-3" : "bg-white/5 text-clay group-hover:-rotate-3")}>
                      <Star className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-lg text-cream">Community Player</div>
                      <div className="text-xs text-cream/40 font-medium mt-1 uppercase tracking-widest">The High Frequency</div>
                    </div>
                  </button>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="btn-ghost flex-1">Back</button>
                  <button 
                    disabled={!userType}
                    onClick={() => setStep(3)}
                    className="btn-primary flex-[2]"
                  >
                    Calibrate
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black mb-3 text-cream tracking-tight">Final Ritual.</h2>
                  <p className="text-cream/50 text-sm font-medium">Claim your identity within the nexus.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-taurus-gold/40 group-focus-within:text-taurus-gold transition-colors" />
                    <input 
                      required
                      placeholder="Display Name"
                      className="input-field pl-14"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
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
                  <div className="relative group">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-taurus-gold/40 group-focus-within:text-taurus-gold transition-colors" />
                    <input 
                      placeholder="Invite Key (Optional)"
                      className="input-field pl-14"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    />
                  </div>

                  {error && <p className="text-clay text-xs text-center font-bold uppercase tracking-wider animate-pulse pt-2">{error}</p>}

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-ghost flex-1"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex-[2] flex items-center justify-center gap-3"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                          {(inviteCode ? "Initialize Claim" : "Request Access")}
                          <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                            →
                          </motion.span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

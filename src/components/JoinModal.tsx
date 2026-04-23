import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Briefcase, Star, MapPin, Key, User, Mail, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
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
      
      // Visual feedback: Fly to location on globe
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
    if (!supabase) return setError("System offline");
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) throw authError;
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
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          display_name: displayName,
          city: geoResult.formatted,
          latitude: geoResult.lat,
          longitude: geoResult.lng,
          user_type: userType!,
          tier: 'member'
        });
      
      if (profileError) throw profileError;

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay/80 backdrop-blur-[2px] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-cream w-full max-w-md rounded-[32px] border-2 border-taurus-gold shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-mid-gray hover:text-charcoal transition-colors z-10"
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
                <div className="text-center mb-8">
                  <div className="inline-flex p-3 rounded-2xl bg-taurus-gold/10 text-taurus-gold mb-4">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Plant Your Pin</h2>
                  <p className="text-mid-gray text-sm px-4">Enter your City or Postcode to see where you land on the world stage.</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mid-gray/50 pointer-events-none" />
                    <input 
                      required
                      placeholder="e.g. Postcode or City"
                      className="input-field pl-12"
                      value={locationStr}
                      onChange={(e) => setLocationStr(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
                    />
                  </div>
                  {error && <p className="text-clay text-xs text-center font-medium">{error}</p>}
                </div>

                <button 
                  onClick={handleGeocode}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Location"}
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
                <div className="text-center mb-8">
                   <h2 className="text-2xl font-bold mb-2">Define Your Path</h2>
                   <p className="text-mid-gray text-sm">How do you move through the world?</p>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  <button
                    onClick={() => setUserType('business')}
                    className={cn(
                      "flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left group",
                      userType === 'business' 
                        ? "bg-light-gold/30 border-taurus-gold shadow-md" 
                        : "bg-white border-light-gray hover:border-taurus-gold/30"
                    )}
                  >
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-colors", 
                      userType === 'business' ? "bg-taurus-gold text-white" : "bg-forest-green/10 text-forest-green")}>
                      <Briefcase className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base">Entrepreneur</div>
                      <div className="text-xs text-mid-gray mt-0.5">I am building the future.</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setUserType('fun')}
                    className={cn(
                      "flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left group",
                      userType === 'fun' 
                        ? "bg-clay/5 border-clay shadow-md" 
                        : "bg-white border-light-gray hover:border-clay/30"
                    )}
                  >
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                      userType === 'fun' ? "bg-clay text-white" : "bg-clay/10 text-clay")}>
                      <Star className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base">Community Player</div>
                      <div className="text-xs text-mid-gray mt-0.5">I am here for the tribe and the vibe.</div>
                    </div>
                  </button>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-ghost flex-1">Back</button>
                  <button 
                    disabled={!userType}
                    onClick={() => setStep(3)}
                    className="btn-primary flex-[2]"
                  >
                    Continue
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
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Final Ritual</h2>
                  <p className="text-mid-gray text-sm">Enter your invite code or request access.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mid-gray/50 pointer-events-none" />
                    <input 
                      required
                      placeholder="Your Full Name"
                      className="input-field pl-12"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mid-gray/50 pointer-events-none" />
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
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mid-gray/50 pointer-events-none" />
                    <input 
                      required
                      type="password"
                      placeholder="Choose Password"
                      className="input-field pl-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mid-gray/50 pointer-events-none" />
                    <input 
                      placeholder="Invite Code (Optional)"
                      className="input-field pl-12"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    />
                  </div>

                  {error && <p className="text-clay text-xs text-center font-medium">{error}</p>}

                  <div className="flex gap-3 pt-4">
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
                      className="btn-primary flex-[2] flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (inviteCode ? "Claim Spot" : "Request Invite")}
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

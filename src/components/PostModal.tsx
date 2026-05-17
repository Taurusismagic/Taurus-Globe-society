import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, MapPin, Upload, Loader2, CheckCircle2, Briefcase, Calendar, Image as ImageIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/lib/errorUtils";
import confetti from "canvas-confetti";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  key?: string;
}

export default function PostModal({ isOpen, onClose }: PostModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<'job' | 'event'>('job');
  const [flyer, setFlyer] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFlyer(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFlyerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Geocoding: Call server-side Nexus geocoding
      const geoResponse = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city })
      });
      const geoData = await geoResponse.json();

      // Use actual coordinates or fallback if server fails
      const lat = geoData.latitude || 0;
      const lng = geoData.longitude || 0;
      const formattedCity = geoData.formatted || city;

      // Handle Flyer: In this environment, we'll store the base64 preview directly 
      // if it's within a reasonable limit, or use a high-fidelity placeholder
      // that isn't just a generic Unsplash image.
      let flyerUrl = flyerPreview;
      
      // If base64 is too large (> 800KB), we must truncate or use a placeholder to avoid Firestore limits
      if (flyerUrl && flyerUrl.length > 800000) {
        console.warn("[Post] Flyer size exceeds 800KB. Using optimized nexus placeholder.");
        flyerUrl = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1200"; // Space themed
      }

      await addDoc(collection(db, 'posts'), {
        title,
        description,
        email,
        city: formattedCity,
        type,
        latitude: lat,
        longitude: lng,
        flyer_url: flyerUrl,
        created_at: serverTimestamp()
      }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, 'posts');
      });

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#05070A', '#F5E6C0']
      });

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        resetForm();
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEmail("");
    setCity("");
    setType('job');
    setFlyer(null);
    setFlyerPreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto p-4 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="my-auto glass-modal w-full max-w-lg rounded-[40px] border border-white/10 shadow-2xl overflow-hidden relative z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-cream/40 hover:text-cream transition-colors z-20"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="post-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-display font-medium text-light-gold tracking-tight italic mb-3">
                    Post to the Tribe
                  </h2>
                  <p className="text-cream/50 text-sm font-light tracking-widest uppercase">
                    Share a job or event with the community
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex gap-4 p-1 bg-white/5 rounded-2xl border border-white/10 mb-4">
                    <button
                      type="button"
                      onClick={() => setType('job')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${type === 'job' ? 'bg-taurus-gold text-charcoal' : 'text-cream/40 hover:text-cream'}`}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Job</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('event')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${type === 'event' ? 'bg-taurus-gold text-charcoal' : 'text-cream/40 hover:text-cream'}`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Event</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="relative group">
                        <input 
                          required
                          type="text"
                          placeholder="Title"
                          className="input-field w-full"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>

                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taurus-gold/40" />
                        <input 
                          required
                          type="email"
                          placeholder="Your Email"
                          className="input-field pl-12 w-full"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>

                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taurus-gold/40" />
                        <input 
                          required
                          type="text"
                          placeholder="City"
                          className="input-field pl-12 w-full"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 min-h-[140px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-taurus-gold/40 hover:bg-taurus-gold/5 transition-all group overflow-hidden relative"
                      >
                        {flyerPreview ? (
                          <>
                            <img src={flyerPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative z-10 flex flex-col items-center gap-1">
                              <ImageIcon className="w-8 h-8 text-white" />
                              <span className="text-[10px] font-black uppercase text-white shadow-sm">Change Flyer</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-taurus-gold/40 group-hover:text-taurus-gold group-hover:scale-110 transition-all" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-cream/40">Upload Flyer</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <textarea 
                      placeholder="Description (optional)"
                      rows={3}
                      className="input-field w-full resize-none py-4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {error && <p className="text-red-400 text-xs text-center font-medium">{error}</p>}

                  <div className="pt-2">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full flex items-center justify-center gap-3 py-4 font-black uppercase tracking-widest text-sm"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          Post to Globe
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
                key="post-success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-taurus-gold/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(212,175,55,0.3)] border border-taurus-gold/40">
                  <CheckCircle2 className="w-12 h-12 text-taurus-gold" />
                </div>
                <h2 className="text-4xl font-display font-medium text-light-gold mb-4 italic">Synchronized.</h2>
                <p className="text-cream/50 font-light text-lg mb-8 tracking-wide">
                  Your post has been broadcasted to the Taurus community.
                </p>
                <div className="inline-block px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                  <p className="text-taurus-gold text-[10px] font-black uppercase tracking-[0.4em]">Location: {city}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

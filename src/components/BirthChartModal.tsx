import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, MapPin, Sparkles, Loader2, Info } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface BirthChartModalProps {
  key?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface BirthData {
  date: string;
  time: string;
  location: string;
}

export default function BirthChartModal({ isOpen, onClose }: BirthChartModalProps) {
  const [step, setStep] = useState<'input' | 'processing' | 'result'>('input');
  const [data, setData] = useState<BirthData>({
    date: '',
    time: '',
    location: ''
  });
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setLoading(true);

    try {
      const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

      const prompt = `
        As a master atrologer, calculate and synthesize a birth chart analysis for:
        Date: ${data.date}
        Time: ${data.time}
        Location: ${data.location}

        Provide a structured JSON output with:
        1. sunSign: { sign: string, house: number, trait: string }
        2. moonSign: { sign: string, house: number, trait: string }
        3. risingSign: { sign: string, trait: string }
        4. bigThreeSynthesis: string (detailed analysis of these three)
        5. dominantElement: string (Fire, Earth, Air, or Water)
        6. planetaryPositions: array of { planet: string, sign: string, house: number }
        7. energyProfile: { energy: number, love: number, career: number } (0-100 values)

        The tone should be cinematic, profound, and technical yet accessible.
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const text = response.text || "";
      
      // Clean the text to ensure it's valid JSON
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || "";
      const parsedData = JSON.parse(jsonStr);
      
      setAnalysis(parsedData);
      setStep('result');
    } catch (error) {
      console.error("Birth chart calculation failed:", error);
      // Fallback for demo if API fails
      setAnalysis(MOCK_ANALYSIS);
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="my-auto relative w-full max-w-2xl bg-[#0a0e1a] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] z-10"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">The Cosmic Blueprint</h2>
                <p className="text-[10px] font-bold text-taurus-gold/60 uppercase tracking-[0.4em] mt-1">Birth Chart Analysis</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors text-cream/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[85vh] md:max-h-[70vh] overflow-y-auto custom-scrollbar">
              {step === 'input' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <p className="text-sm text-cream/60 leading-relaxed italic">
                    Enter your precise temporal and spatial coordinates to align with your original frequency.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-taurus-gold uppercase tracking-widest pl-1">Birth Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-taurus-gold/40 w-4 h-4" />
                        <input 
                          required
                          type="date" 
                          value={data.date}
                          onChange={e => setData({...data, date: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-cream focus:outline-none focus:border-taurus-gold/30 transition-colors" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-taurus-gold uppercase tracking-widest pl-1">Exact Time</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-taurus-gold/40 w-4 h-4" />
                        <input 
                          required
                          type="time" 
                          value={data.time}
                          onChange={e => setData({...data, time: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-cream focus:outline-none focus:border-taurus-gold/30 transition-colors" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-taurus-gold uppercase tracking-widest pl-1">Place of Origin</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-taurus-gold/40 w-4 h-4" />
                      <input 
                        required
                        type="text" 
                        placeholder="City, Country"
                        value={data.location}
                        onChange={e => setData({...data, location: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-cream focus:outline-none focus:border-taurus-gold/30 transition-colors" 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-6 mt-4 bg-taurus-gold text-black font-black uppercase text-sm tracking-[0.4em] rounded-3xl shadow-gold/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                  >
                    <Sparkles className="w-4 h-4 group-hover:animate-spin-slow" fill="currentColor" />
                    Calculate Blueprint
                  </button>
                </form>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative w-24 h-24 mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-taurus-gold/20 border-t-taurus-gold rounded-full"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-4 border-2 border-white/10 border-b-white/40 rounded-full"
                    />
                    <Sparkles className="absolute inset-0 m-auto text-taurus-gold w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest italic mb-2">Syncing with Cosmos</h3>
                  <p className="text-sm text-cream/40 max-w-xs mx-auto">
                    Retrieving planetary positions and determining your frequency alignment...
                  </p>
                </div>
              )}

              {step === 'result' && analysis && (
                <div className="space-y-8 pb-10">
                  {/* Natal Wheel Placeholder/Visual */}
                  <div className="relative aspect-square max-w-[300px] mx-auto mb-10">
                    <NatalChartWheel positions={analysis.planetaryPositions} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <BigThreeCard label="SUN" value={analysis.sunSign} />
                    <BigThreeCard label="MOON" value={analysis.moonSign} />
                    <BigThreeCard label="RISING" value={analysis.risingSign} />
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <h4 className="text-[10px] font-black text-taurus-gold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                       <Info size={12} />
                       Blueprint Synthesis
                    </h4>
                    <p className="text-sm text-cream/80 leading-relaxed italic">
                      {analysis.bigThreeSynthesis}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <MetricRing label="ENERGY" value={analysis.energyProfile.energy} color="#D4AF37" />
                    <MetricRing label="LOVE" value={analysis.energyProfile.love} color="#FF1493" />
                    <MetricRing label="CAREER" value={analysis.energyProfile.career} color="#4287f5" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function NatalChartWheel({ positions }: { positions: any[] }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* Outer Rings */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="1" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        
        {/* Houses */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) * Math.PI / 180;
          const x2 = 50 + Math.cos(angle) * 45;
          const y2 = 50 + Math.sin(angle) * 45;
          return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="rgba(212,175,55,0.1)" strokeWidth="0.2" />;
        })}

        {/* Planet Markers */}
        {positions?.map((p, i) => {
          const angle = (Math.random() * 360) * Math.PI / 180;
          const dist = 32 + Math.random() * 10;
          const x = 50 + Math.cos(angle) * dist;
          const y = 50 + Math.sin(angle) * dist;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="1" fill="#D4AF37" />
              <text x={x} y={y - 2} fontSize="2" fill="white" textAnchor="middle" className="uppercase font-bold opacity-60">
                {p.planet.slice(0, 2)}
              </text>
            </g>
          );
        })}

        {/* Sun Glow at center */}
        <defs>
          <radialGradient id="sunGlow">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="10" fill="url(#sunGlow)" />
      </svg>
    </div>
  );
}

function BigThreeCard({ label, value }: { label: string, value: any }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 text-center flex flex-col items-center">
      <span className="text-[8px] font-black text-taurus-gold/40 uppercase tracking-[0.4em] mb-2">{label}</span>
      <span className="text-xl font-bold text-cream mb-1">{value.sign}</span>
      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{value.trait}</span>
    </div>
  );
}

function MetricRing({ label, value, color }: { label: string, value: number, color: string }) {
  const circ = 2 * Math.PI * 18;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3">
       <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
            <motion.circle 
              cx="32" cy="32" r="18" 
              fill="none" 
              stroke={color} 
              strokeWidth="4"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, delay: 0.5 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black text-white">{value}%</span>
          </div>
       </div>
       <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}

const MOCK_ANALYSIS = {
  sunSign: { sign: "Taurus", house: 10, trait: "Unwavering Strength" },
  moonSign: { sign: "Virgo", house: 2, trait: "Analytical Depth" },
  risingSign: { sign: "Leo", house: 1, trait: "Solar Radiance" },
  bigThreeSynthesis: "Your combination of Taurus Sun and Virgo Moon creates a powerhouse of grounded manifestation and precision. With Leo rising, you possess the magnetic authority required to lead your projects with both passion and persistence.",
  dominantElement: "Earth",
  planetaryPositions: [
    { planet: "Sun", sign: "Taurus", house: 10 },
    { planet: "Moon", sign: "Virgo", house: 2 },
    { planet: "Mars", sign: "Aries", house: 9 }
  ],
  energyProfile: { energy: 88, love: 72, career: 95 }
};

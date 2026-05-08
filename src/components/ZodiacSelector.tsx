import React, { useMemo } from "react";
import { motion } from "motion/react";
import { ZODIAC_SIGNS } from "@/constants";
import { cn } from "@/lib/utils";

interface ZodiacSelectorProps {
  onSelect: (sign: string, pos: { x: number, y: number }) => void;
  className?: string;
}

export default function ZodiacSelector({ onSelect, className }: ZodiacSelectorProps) {
  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      {/* 2.0 Background Orbital Geometry */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full border border-white/5 animate-spin-slow-reverse" />
        <div className="absolute w-[400px] h-[400px] md:w-[700px] md:h-[700px] rounded-full border border-taurus-gold/5 animate-pulse-slow" />
        <div className="absolute w-[150px] h-[150px] md:w-[250px] md:h-[250px] rounded-full border border-taurus-gold/20 animate-spin-slow opacity-20" />
        
        {/* Core Radiance */}
        <div className="absolute w-32 h-32 bg-taurus-gold/10 blur-[80px] rounded-full animate-pulse" />
      </div>

      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        className="relative w-full h-full flex items-center justify-center font-sans"
      >
        {ZODIAC_SIGNS.map((sign, index) => {
          const angle = (index / ZODIAC_SIGNS.length) * 2 * Math.PI - Math.PI / 2;
          
          return (
            <ZodiacOrbitItem 
              key={`orbit-item-${sign.name}-${index}`}
              sign={sign}
              angle={angle}
              onSelect={(pos) => onSelect(sign.name, pos)}
              index={index}
            />
          );
        })}
      </motion.div>
    </div>
  );
}

function ZodiacOrbitItem({ 
  sign, 
  angle, 
  onSelect,
  index
}: { 
  sign: typeof ZODIAC_SIGNS[0], 
  angle: number, 
  onSelect: (pos: { x: number, y: number }) => void,
  index: number,
  key?: string
}) {
  // Responsive radius
  const [radius, setRadius] = React.useState(280);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const updateRadius = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const minDimension = Math.min(width, height);
      if (width < 640) setRadius(minDimension * 0.38);
      else if (width < 768) setRadius(minDimension * 0.42);
      else if (width < 1024) setRadius(280);
      else setRadius(350);
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      onSelect({ x, y });
    }
  };

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <motion.button
      ref={buttonRef}
      initial={{ opacity: 0, scale: 0, rotate: angle * 180 / Math.PI }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        x, 
        y,
        rotate: 0 
      }}
      whileHover={{ 
        scale: 1.2,
        zIndex: 50,
        x: x * 1.05, // "Expansion gravity"
        y: y * 1.05,
        transition: { type: "spring", stiffness: 300, damping: 15 }
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        delay: index * 0.05,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      onClick={handleClick}
      className="absolute group flex flex-col items-center justify-center cursor-pointer pointer-events-auto"
      style={{
        width: '60px',
        height: '60px',
        marginLeft: '-30px',
        marginTop: '-30px'
      }}
    >
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        className="relative flex flex-col items-center"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-taurus-gold/0 group-hover:bg-taurus-gold/20 rounded-full blur-xl transition-all duration-300" />
        
        {/* Icon Circle */}
        <div className="relative w-12 h-12 md:w-16 md:h-16 bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 group-hover:border-taurus-gold/60 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.3)]">
          <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">{sign.symbol}</span>
          
          {/* Internal Orbit Ring Decoration */}
          <div className="absolute inset-1 rounded-full border border-white/5 group-hover:border-taurus-gold/20 animate-spin-slow opacity-0 group-hover:opacity-100" />
        </div>

        {/* Label (Floating) */}
        <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center whitespace-nowrap">
          <p className="text-[10px] font-black text-taurus-gold uppercase tracking-[0.2em] drop-shadow-md">{sign.name}</p>
          <p className="text-[8px] font-bold text-cream/40 uppercase tracking-tighter">{sign.dates}</p>
        </div>
      </motion.div>
    </motion.button>
  );
}

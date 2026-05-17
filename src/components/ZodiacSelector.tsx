import React, { useMemo } from "react";
import { motion } from "motion/react";
import { ZODIAC_SIGNS } from "@/constants";
import { cn } from "@/lib/utils";

interface ZodiacSelectorProps {
  onSelect: (sign: string, pos: { x: number, y: number }) => void;
  className?: string;
}

export default function ZodiacSelector({ onSelect, className }: ZodiacSelectorProps) {
  const [radius, setRadius] = React.useState(280);

  React.useEffect(() => {
    const updateRadius = () => {
      const width = Math.min(window.innerWidth, 1200); // Caps radius for ultra-wide
      const height = window.innerHeight;
      const minDimension = Math.min(width, height);
      
      // Orbital refinement: Perfect spacing to clear the globe
      if (width < 640) setRadius(minDimension * 0.35);
      else if (width < 1024) setRadius(minDimension * 0.38);
      else setRadius(Math.min(height * 0.38, 400));
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  return (
    <div className={cn("relative w-full aspect-square max-w-[90vh] flex items-center justify-center z-10", className)}>
      {/* 2.0 Background Orbital Geometry synced with radius */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="absolute rounded-full border border-white/5 animate-spin-slow-reverse" 
          style={{ width: radius * 2, height: radius * 2 }}
        />
        <div 
          className="absolute rounded-full border border-taurus-gold/5 animate-pulse-slow" 
          style={{ width: radius * 2.2, height: radius * 2.2 }}
        />
      </div>

      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
        className="relative w-0 h-0 pointer-events-none flex items-center justify-center"
      >
        {ZODIAC_SIGNS.map((sign, index) => {
          const angle = (index / ZODIAC_SIGNS.length) * 2 * Math.PI - Math.PI / 2;
          
          return (
            <ZodiacOrbitItem 
              key={`orbit-item-${sign.name}-${index}`}
              sign={sign}
              angle={angle}
              radius={radius}
              onSelect={(pos) => onSelect(sign.name, pos)}
              index={index}
              rotationDuration={180}
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
  radius,
  onSelect,
  index,
  rotationDuration
}: { 
  sign: typeof ZODIAC_SIGNS[0], 
  angle: number, 
  radius: number,
  onSelect: (pos: { x: number, y: number }) => void,
  index: number,
  rotationDuration: number,
  key?: string
}) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

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
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        x, 
        y,
        translateX: '-50%',
        translateY: '-50%'
      }}
      whileHover={{ 
        scale: 1.15,
        zIndex: 50,
        x: x * 1.05,
        y: y * 1.05,
        translateX: '-50%',
        translateY: '-50%',
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ 
        delay: index * 0.05,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      onClick={handleClick}
      className="absolute group flex flex-col items-center justify-center cursor-pointer pointer-events-auto z-10"
    >
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: rotationDuration, repeat: Infinity, ease: "linear" }}
        className="relative flex flex-col items-center"
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-taurus-gold/0 group-hover:bg-taurus-gold/30 rounded-full blur-2xl transition-all duration-300" />
        
        {/* Icon Circle */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-black/80 backdrop-blur-3xl border border-white/20 group-hover:border-taurus-gold/80 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]">
          <span className="text-2xl sm:text-2xl md:text-3xl group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]">{sign.symbol}</span>
          
          {/* Internal Orbit Ring Decoration */}
          <div className="absolute inset-0.5 rounded-full border border-white/5 group-hover:border-taurus-gold/20 animate-spin-slow opacity-0 group-hover:opacity-100" />
        </div>

        {/* Label (Floating) */}
        <div className="absolute top-full mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-center whitespace-nowrap bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 shadow-2xl">
          <p className="text-[10px] font-black text-taurus-gold uppercase tracking-[0.2em]">{sign.name}</p>
          <p className="text-[8px] font-bold text-cream/40 uppercase tracking-tighter">{sign.dates}</p>
        </div>
      </motion.div>
    </motion.button>

  );
}

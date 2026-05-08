import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface CosmicTransitionProps {
  startPos: { x: number; y: number };
  symbol: string;
  onComplete: () => void;
  key?: string | number;
}

export default function CosmicTransition({ startPos, symbol, onComplete }: CosmicTransitionProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500); // Duration of the animation
    return () => clearTimeout(timer);
  }, [onComplete]);

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Light Beam from origin to center */}
      <motion.div
        initial={{ 
          opacity: 0,
          scaleX: 0,
          rotate: Math.atan2(centerY - startPos.y, centerX - startPos.x) * 180 / Math.PI 
        }}
        animate={{ 
          opacity: [0, 1, 0],
          scaleX: [0, 1, 1],
          x: [startPos.x, startPos.x],
          y: [startPos.y, startPos.y],
        }}
        transition={{ duration: 1.5, ease: "circOut" }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: Math.sqrt(Math.pow(centerX - startPos.x, 2) + Math.pow(centerY - startPos.y, 2)),
          height: '4px',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.8), #fff)',
          transformOrigin: 'left center',
          boxShadow: '0 0 30px rgba(212,175,55,0.8)',
          filter: 'blur(1px)'
        }}
      />

      {/* Travelling Symbol */}
      <motion.div
        initial={{ x: startPos.x - 20, y: startPos.y - 20, scale: 1, opacity: 1 }}
        animate={{ 
          x: centerX - 20, 
          y: centerY - 20, 
          scale: [1, 2, 0],
          opacity: [1, 1, 0]
        }}
        transition={{ duration: 1.5, ease: "circIn" }}
        className="absolute text-4xl filter drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]"
      >
        {symbol}
      </motion.div>

      {/* Central Vortex / Nebula Swirl */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{ 
            scale: [0, 1, 1.5, 2], 
            opacity: [0, 1, 0.8, 0],
            rotate: 720
          }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="relative w-[400px] h-[400px] md:w-[600px] md:h-[600px]"
        >
          {/* Swirl Layers */}
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,#00F5FF,transparent,#8B5CF6,transparent)] opacity-40 blur-3xl animate-spin-slow" />
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg,transparent,#D4AF37,transparent,#00F5FF,transparent)] opacity-30 blur-2xl animate-spin-slow reverse" />
          
          {/* Particle Explosions */}
          {[...Array(20)].map((_, i) => (
             <motion.div
               key={i}
               initial={{ scale: 0, x: 0, y: 0 }}
               animate={{ 
                 scale: [0, 1, 0],
                 x: (Math.random() - 0.5) * 400,
                 y: (Math.random() - 0.5) * 400
               }}
               transition={{ duration: 2, delay: 0.5 + Math.random() * 0.5 }}
               className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_#fff]"
             />
          ))}
          
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_100px_50px_#fff] opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Screen White Flash */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 0] }}
        transition={{ duration: 2.5, times: [0, 0.6, 0.8, 1] }}
        className="absolute inset-0 bg-white z-[110]"
      />
    </div>
  );
}

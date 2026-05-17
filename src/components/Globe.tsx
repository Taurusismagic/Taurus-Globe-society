import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import GlobeGL from "react-globe.gl";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

import { Signal } from "@/hooks/useSignals";

interface GlobeProps {
  members: any[];
  posts?: any[];
  signals?: Signal[];
  targetLocation?: [number, number] | null;
  onGlobeClick?: (lat: number, lng: number) => void;
  className?: string;
}

const Globe = React.memo(({ members, posts = [], signals = [], targetLocation, onGlobeClick, className }: GlobeProps) => {
  const globeEl = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const rendererConfig = useMemo(() => ({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance" as const
  }), []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Use a higher resolution texture for better detail
  const globeMaterial = useMemo(() => {
    if (globeEl.current) {
        const material = globeEl.current.getGlobeMaterial();
        material.roughness = 0.6;
        material.metalness = 0.3;
    }
  }, []);

  const htmlElements = useMemo(() => {
    const uniqueMap = new Map();
    
    members.forEach((m, index) => {
      const baseId = m.id || m.uid || `m-${index}`;
      const uniqueId = `marker-member-${baseId}`;
      if (!uniqueMap.has(uniqueId)) {
        uniqueMap.set(uniqueId, { ...m, uniqueId, markerType: 'member' });
      }
    });

    posts.forEach((p, index) => {
      const baseId = p.id || `p-${index}`;
      const uniqueId = `marker-post-${baseId}`;
      if (!uniqueMap.has(uniqueId)) {
        uniqueMap.set(uniqueId, { ...p, uniqueId, markerType: 'post' });
      }
    });

    signals.forEach((s) => {
      const uniqueId = `marker-signal-${s.id}`;
      if (!uniqueMap.has(uniqueId)) {
        uniqueMap.set(uniqueId, { ...s, uniqueId, markerType: 'signal' });
      }
    });

    return Array.from(uniqueMap.values());
  }, [members, posts, signals]);

  const generateHtmlElement = useCallback((d: any) => {
    const el = document.createElement('div');
    el.className = 'globe-html-marker';
    
    if (d.markerType === 'signal') {
        const isSeed = d.isSeed;
        const colorClass = isSeed ? "text-taurus-gold" : "text-red-500";
        const bgClass = isSeed ? "border-taurus-gold/50" : "border-red-500/50";
        const dotClass = isSeed ? "bg-taurus-gold shadow-[0_0_25px_#D4AF37]" : "bg-red-600 shadow-[0_0_25px_#DC2626]";
        const lineClass = isSeed ? "via-taurus-gold/60 to-taurus-gold" : "via-red-500/60 to-red-600";
        const label = isSeed ? "COSMIC MESSAGE" : d.city;

        el.innerHTML = `
          <div class="signal-flag pointer-events-auto group relative cursor-pointer pt-6 px-10 -mt-6 -mx-10 select-none touch-manipulation">
            <!-- The Bubble -->
            <div class="signal-bubble absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 scale-50 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto group-active:opacity-100 group-active:scale-100 group-active:pointer-events-auto">
               <div class="relative bg-black/95 backdrop-blur-3xl border ${bgClass} px-5 py-3 rounded-[24px] shadow-[0_0_50px_rgba(0,0,0,0.9)] min-w-[160px] text-center border-b-4">
                  <p class="text-[13px] text-cream font-bold leading-snug mb-1">"${d.message}"</p>
                  <p class="text-[9px] ${colorClass} font-black uppercase tracking-[0.2em] opacity-80">${label}</p>
                  <!-- Arrow -->
                  <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black border-r border-b ${bgClass} rotate-45"></div>
               </div>
            </div>

            <!-- The Stalk -->
            <div class="relative flex flex-col items-center">
               <!-- High Visibility Tip -->
               <div class="w-4 h-4 md:w-3 md:h-3 ${dotClass} rounded-full animate-pulse group-active:scale-150 transition-transform"></div>
               <!-- The Line -->
               <div class="w-[2px] h-10 md:h-8 bg-gradient-to-t from-transparent ${lineClass} mt-[-2px]"></div>
            </div>
          </div>
        `;
        return el;
    }
    
    if (d.markerType === 'post') {
      const icon = d.type === 'job' ? '💼' : '🎉';
      el.innerHTML = `
        <div class="group relative flex items-center justify-center cursor-pointer">
          <div class="p-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 scale-75 group-hover:scale-110 transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
             <div class="w-6 h-6 flex items-center justify-center text-lg">
                ${icon}
             </div>
          </div>
          <div class="absolute -top-16 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-taurus-gold/30 px-5 py-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] shadow-[0_0_40px_rgba(0,0,0,0.8)] scale-90 group-hover:scale-100">
             <div class="flex flex-col items-center">
                <p class="text-[8px] font-black uppercase tracking-[0.4em] text-taurus-gold mb-1.5">${d.type} IN ${d.city.split(',')[0]}</p>
                <p class="text-[14px] font-bold text-white tracking-tight leading-none">${d.title}</p>
                <div class="mt-2.5 text-[9px] text-white/40 font-mono font-medium border-t border-white/10 pt-2 w-full text-center">${d.email}</div>
             </div>
          </div>
        </div>
      `;
    } else {
      const signalColor = '#D4AF37'; 
      el.innerHTML = `
        <div class="group relative flex items-center justify-center cursor-pointer">
          <div class="w-3 h-3 rounded-full relative z-10" style="background-color: ${signalColor}; box-shadow: 0 0 20px ${signalColor}80;"></div>
          <div class="absolute inset-0 w-12 h-12 -left-4.5 -top-4.5 rounded-full animate-ping opacity-5" style="background-color: ${signalColor};"></div>
          
          <div class="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] scale-90 group-hover:scale-100">
             <p class="text-[10px] font-bold text-cream">${d.display_name || "Joining..."}</p>
          </div>
        </div>
      `;
    }
    return el;
  }, []);

  const onGlobeReady = useCallback(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.enableZoom = false; // Disable zoom to keep the cinematic framing
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.autoRotate = false;
      controls.autoRotateSpeed = 0.4;
    }
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full bg-transparent overflow-visible", className)}>
      <GlobeGL
        ref={globeEl}
        onGlobeReady={onGlobeReady}
        width={dimensions.width}
        height={dimensions.height || 1}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#D4AF37"
        atmosphereAltitude={0.25}
        rendererConfig={rendererConfig}
        
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

        htmlElementsData={htmlElements}
        htmlElementKey="uniqueId"
        htmlLat={(d: any) => d.latitude || d.lat}
        htmlLng={(d: any) => d.longitude || d.lng}
        htmlElement={generateHtmlElement}
        
        enablePointerInteraction={true}
      />
      
      {/* Decorative Aura */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
         <div className="w-[80%] h-[80%] rounded-full bg-taurus-gold/5 blur-[100px] animate-pulse-slow" />
      </div>
    </div>
  );
});

export default Globe;

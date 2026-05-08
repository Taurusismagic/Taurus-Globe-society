import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import GlobeGL from "react-globe.gl";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/context/AuthContext";

interface GlobeProps {
  members: any[];
  targetLocation?: [number, number] | null;
  onGlobeClick?: (lat: number, lng: number) => void;
  onboardingPins?: Array<{ lat: number; lng: number; label: string; color: string }>;
  className?: string;
}

const Globe = React.memo(({ members, targetLocation, onGlobeClick, onboardingPins, className }: GlobeProps) => {
  const globeEl = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Optimize renderer config
  const rendererConfig = useMemo(() => ({
    antialias: window.devicePixelRatio < 2,
    alpha: true,
    powerPreference: "high-performance" as const
  }), []);

  // Handle resize
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

  const [countries, setCountries] = useState<any[]>([]);

  // Load GeoJSON for countries and pre-calculate labels
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(res => res.json())
      .then(data => {
        const featuresWithLabels = data.features.map((f: any, idx: number) => {
          let minX = 180, minY = 90, maxX = -180, maxY = -90;
          const traverse = (c: any) => {
            if (Array.isArray(c[0])) c.forEach(traverse);
            else {
              minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]);
              minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]);
            }
          };
          traverse(f.geometry.coordinates);
          
          const props = f.properties;
          const name = props.name || props.NAME || props.ADMIN || props.admin || "";
          const baseId = props.id || props.iso_a3 || props.ISO_A3 || `region-${idx}`;
          const id = `${baseId}-${name.replace(/\s+/g, '-').toLowerCase()}-${idx}`;
          const area = (maxX - minX) * (maxY - minY);

          return {
            lat: (minY + maxY) / 2,
            lng: (minX + maxX) / 2,
            name,
            id,
            area
          };
        })
        .filter((l: any) => l.name && l.area > 5)
        .sort((a: any, b: any) => b.area - a.area);

        setCountries(featuresWithLabels);
      });
  }, []);

  // Memoize labels and points to prevent recalculation on every re-render
  const data = useMemo(() => {
    if (!countries.length) return { points: [], labels: [] };

    const attractors = [
      { lat: 40.7128, lng: -74.0060 }, // NYC
      { lat: 51.5074, lng: -0.1278 },  // London
      { lat: 35.6762, lng: 139.6503 }, // Tokyo
      { lat: 48.8566, lng: 2.3522 },   // Paris
      { lat: 25.2048, lng: 55.2708 },  // Dubai
      { lat: 1.3521, lng: 103.8198 },  // Singapore
      { lat: 19.0760, lng: 72.8777 },  // Mumbai
      { lat: 31.2304, lng: 121.4737 }, // Shanghai
      { lat: -23.5505, lng: -46.6333 },// Sao Paulo
      { lat: 6.5244, lng: 3.3792 },    // Lagos
      { lat: -33.8688, lng: 151.2093 },// Sydney
      { lat: 19.4326, lng: -99.1332 }, // CDMX
      { lat: -1.2921, lng: 36.8219 },  // Nairobi
      { lat: 30.0444, lng: 31.2357 },  // Cairo
      { lat: 37.5665, lng: 126.9780 }, // Seoul
      { lat: 34.0522, lng: -118.2437 },// LA
      { lat: 55.7558, lng: 37.6173 },  // Moscow
      { lat: -34.6037, lng: -58.3816 },// BA
      { lat: 39.9042, lng: 116.4074 }, // Beijing
      { lat: 28.6139, lng: 77.2090 },  // Delhi
      { lat: -26.2041, lng: 28.0473 }, // Johannesburg
      { lat: 43.6532, lng: -79.3832 }, // Toronto
      { lat: 34.6937, lng: 135.5023 }, // Osaka
      { lat: -37.8136, lng: 144.9631 },// Melbourne
      { lat: 14.5995, lng: 120.9842 }, // Manila
      { lat: 6.4654, lng: 3.4064 },    // Lagos (extra density)
    ];

    const labels = countries.slice(0, 40); // Only show top 40 major regions for that "glint" look

    const pts: Array<{ lat: number; lng: number; color: string }> = [];
    
    // Create clusters around attractors
    attractors.forEach(attractor => {
      // Create a dense core and then a sparser "square" grid around it
      const clusterSize = 20 + Math.floor(Math.random() * 30);
      for (let i = 0; i < clusterSize; i++) {
        // Grid-like jitter for the "square" cluster look
        const gridSize = 1.5;
        const gridX = Math.round((Math.random() - 0.5) * 10);
        const gridY = Math.round((Math.random() - 0.5) * 10);
        
        const lat = attractor.lat + gridY * (gridSize / 2) + (Math.random() - 0.5) * 0.4;
        const lng = attractor.lng + gridX * (gridSize / 2) + (Math.random() - 0.5) * 0.4;
        
        pts.push({
          lat,
          lng,
          color: Math.random() > 0.1 ? '#D4AF37' : '#FF1493'
        });
      }
    });

    return { points: pts, labels };
  }, [countries]);

  const { points: backgroundPoints } = data;

  // Handle fly-to
  useEffect(() => {
    if (targetLocation && globeEl.current) {
      globeEl.current.pointOfView({
        lat: targetLocation[0],
        lng: targetLocation[1],
        altitude: 1.8
      }, 1500);
    }
  }, [targetLocation]);

  const onGlobeReady = useCallback(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 1.8;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
    }
  }, []);

  const htmlElements = useMemo(() => {
    const uniqueMap = new Map();
    members.forEach((m, index) => {
      const baseId = m.id || m.uid || `m-${index}`;
      const uniqueId = `globe-marker-${baseId}`;
      if (!uniqueMap.has(uniqueId)) {
        uniqueMap.set(uniqueId, { ...m, uniqueId });
      }
    });
    return Array.from(uniqueMap.values());
  }, [members]);

  const generateHtmlElement = useCallback((d: any) => {
    const el = document.createElement('div');
    // Ensure element has a predictable class for internal tracking if needed
    el.className = 'globe-html-marker';
    const signalColor = d.user_type === 'business' ? '#FF1493' : '#D4AF37'; 
    el.innerHTML = `
      <div class="group relative flex items-center justify-center cursor-pointer">
        <div class="w-2.5 h-2.5 rounded-full relative z-10" style="background-color: ${signalColor}; box-shadow: 0 0 15px ${signalColor};"></div>
        <div class="absolute inset-0 w-8 h-8 -left-2.5 -top-2.5 rounded-full animate-ping opacity-10" style="background-color: ${signalColor};"></div>
      </div>
    `;
    return el;
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-transparent animate-fade-in ${className}`}>
      <GlobeGL
        ref={globeEl}
        onGlobeReady={onGlobeReady}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#ffffff"
        atmosphereAltitude={0.2}
        rendererConfig={rendererConfig}
        
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

        htmlElementsData={htmlElements}
        htmlElementKey="uniqueId"
        htmlLat={(d: any) => d.latitude || d.lat}
        htmlLng={(d: any) => d.longitude || d.lng}
        htmlElement={generateHtmlElement}
        
        enablePointerInteraction={false}
        autoRotate={true}
        autoRotateSpeed={0.4}
      />

      <div className="absolute inset-0 pointer-events-none globe-vignette opacity-40" />
    </div>
  );
});

export default Globe;

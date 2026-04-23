import React, { useEffect, useRef, useState, useMemo } from "react";
import GlobeGL from "react-globe.gl";
import { useMembers } from "@/hooks/useMembers";
import { useAuth } from "@/context/AuthContext";

// Simple point-in-polygon for country detection
function isPointInPoly(poly: any, pt: [number, number]) {
  const [lng, lat] = pt;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

interface GlobeProps {
  members: any[];
  targetLocation?: [number, number] | null;
  className?: string;
}

export default function Globe({ members, targetLocation, className }: GlobeProps) {
  const globeEl = useRef<any>();
  const { profile: myProfile } = useAuth();
  const [countries, setCountries] = useState<any[]>([]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  // Load GeoJSON for countries
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(res => res.json())
      .then(data => setCountries(data.features));
  }, []);

  // Calculate country member density for heatmap
  const tribeStats = useMemo(() => {
    const stats: Record<string, { count: number, business: number, fun: number }> = {};
    if (!countries.length || !members.length) return stats;

    members.forEach(m => {
      // Find country for this member
      const country = countries.find(c => {
        if (c.geometry.type === 'Polygon') {
          return isPointInPoly(c.geometry.coordinates[0], [m.longitude, m.latitude]);
        } else if (c.geometry.type === 'MultiPolygon') {
          return c.geometry.coordinates.some((poly: any) => isPointInPoly(poly[0], [m.longitude, m.latitude]));
        }
        return false;
      });

      if (country) {
        const id = country.properties.ISO_A3;
        if (!stats[id]) stats[id] = { count: 0, business: 0, fun: 0 };
        stats[id].count++;
        if (m.user_type === 'business') stats[id].business++;
        else stats[id].fun++;
      }
    });
    return stats;
  }, [countries, members]);

  const selectedStats = useMemo(() => {
    if (!selectedCountry) return null;
    return tribeStats[selectedCountry.properties.ISO_A3] || { count: 0, business: 0, fun: 0 };
  }, [selectedCountry, tribeStats]);

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

  const maxDensity = Math.max(...Object.values(tribeStats).map(s => s.count), 1);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <GlobeGL
        ref={globeEl}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#8B6914"
        atmosphereAltitude={0.2}
        
        // Country Heatmap (Glint style)
        polygonsData={countries}
        polygonCapColor={(d: any) => {
          const stats = tribeStats[d.properties.ISO_A3];
          if (!stats) return 'rgba(139, 105, 20, 0.05)';
          const intensity = stats.count / maxDensity;
          return `rgba(139, 105, 20, ${0.1 + intensity * 0.6})`;
        }}
        polygonSideColor={() => 'rgba(0, 0, 0, 0)'}
        polygonStrokeColor={(d: any) => 
          d.properties.ISO_A3 === hoveredCountry || d.properties.ISO_A3 === selectedCountry?.properties?.ISO_A3 ? '#8B6914' : 'rgba(139, 105, 20, 0.15)'
        }
        polygonLabel={(d: any) => `
           <div class="bg-space-bg/90 border border-taurus-gold/30 p-2 rounded-lg text-[10px] uppercase font-black text-taurus-gold">
             ${d.properties.ADMIN} | ${tribeStats[d.properties.ISO_A3]?.count || 0} Members
           </div>
        `}
        onPolygonHover={(d: any) => setHoveredCountry(d ? d.properties.ISO_A3 : null)}
        onPolygonClick={(d: any) => setSelectedCountry(d)}
        
        // Member Markers (Custom HTML glint-style)
        htmlElementsData={members}
        htmlLat={(d: any) => d.latitude}
        htmlLng={(d: any) => d.longitude}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          const isBusiness = d.user_type === 'business';
          const isPremium = d.tier === 'paid';
          
          el.innerHTML = `
            <div class="group relative flex items-center justify-center">
              <div class="absolute w-4 h-4 rounded-full ${isBusiness ? 'bg-forest-green' : 'bg-clay'} ${isPremium ? 'animate-pulse' : ''}"></div>
              <div class="w-1.5 h-1.5 rounded-full bg-taurus-gold shadow-gold"></div>
              
              <!-- Tooltip (Detailed Intel) -->
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div class="bg-space-bg/90 backdrop-blur-md border border-taurus-gold/30 p-3 rounded-xl whitespace-nowrap shadow-2xl">
                  <div class="text-[10px] font-black uppercase tracking-widest text-taurus-gold mb-1">Taurus Detected</div>
                  <div class="text-sm font-bold text-cream">${d.display_name}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[9px] px-1.5 py-0.5 rounded ${isBusiness ? 'bg-forest-green/20 text-light-green' : 'bg-clay/20 text-clay'} font-bold uppercase">
                      ${isBusiness ? 'Entrepreneur' : 'Community'}
                    </span>
                    ${isPremium ? '<span class="text-[9px] bg-taurus-gold text-white px-1.5 py-0.5 rounded font-bold uppercase">Premium</span>' : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
          return el;
        }}
        enablePointerInteraction={true}
      />

      {/* Selected Country Intel Card (Glint Inspired) */}
      {selectedCountry && (
        <div className="absolute top-10 right-10 z-20 w-72">
           <div className="bg-space-bg/80 backdrop-blur-xl border-2 border-taurus-gold/40 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-5 border-b border-taurus-gold/20 flex justify-between items-center">
                 <div>
                    <div className="text-[10px] font-black text-taurus-gold uppercase tracking-widest mb-1">Regional Intel</div>
                    <div className="text-xl font-bold text-cream leading-none tracking-tight">${selectedCountry.properties.ADMIN}</div>
                 </div>
                 <button onClick={() => setSelectedCountry(null)} className="p-1 hover:bg-taurus-gold/10 rounded-full transition-colors text-taurus-gold">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                 </button>
              </div>
              <div className="p-5 space-y-6">
                 <div>
                    <div className="text-[9px] font-black text-taurus-gold/60 uppercase tracking-[0.2em] mb-3">Tribe Composition</div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <div className="text-2xl font-black text-cream">${selectedStats?.count || 0}</div>
                          <div className="text-[8px] font-bold text-cream/40 uppercase tracking-widest mt-1">Total Members</div>
                       </div>
                       <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <div className="text-2xl font-black text-forest-green">${selectedStats?.business || 0}</div>
                          <div className="text-[8px] font-bold text-forest-green/60 uppercase tracking-widest mt-1">Leaders</div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="pt-2">
                    <div className="text-[9px] font-black text-taurus-gold/60 uppercase tracking-[0.2em] mb-2">Tribe Activity Level</div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-taurus-gold shadow-gold animate-pulse" 
                        style={{ width: `${Math.min(((selectedStats?.count || 0) / maxDensity) * 100, 100)}%` }}
                       ></div>
                    </div>
                 </div>
              </div>
              <div className="p-4 bg-taurus-gold/5 flex justify-center">
                 <button className="text-[10px] font-black uppercase tracking-widest text-taurus-gold hover:text-light-gold transition-colors">
                    Access Local Database →
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Tribe Intel Overlay (Legend) */}
      <div className="absolute bottom-10 right-10 z-10 pointer-events-none">
        <div className="bg-space-bg/60 backdrop-blur-lg border border-taurus-gold/20 p-5 rounded-2xl shadow-gold/10">
          <div className="text-[10px] font-black text-taurus-gold uppercase tracking-[0.2em] mb-3">Tribe Density Index</div>
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-taurus-gold shadow-gold"></div>
                <span className="text-[11px] font-bold text-cream/70 uppercase">Member Node</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-forest-green shadow-[0_0_10px_rgba(45,80,22,0.5)]"></div>
                <span className="text-[11px] font-bold text-cream/70 uppercase">Business Leader</span>
             </div>
             <div className="w-full h-1 bg-gradient-to-r from-taurus-gold/10 to-taurus-gold rounded-full mt-1"></div>
             <div className="flex justify-between text-[8px] text-taurus-gold font-bold uppercase tracking-widest">
                <span>Low Activity</span>
                <span>Tribe Stronghold</span>
             </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none globe-vignette" />
    </div>
  );
}

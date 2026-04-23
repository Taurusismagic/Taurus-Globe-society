import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, blockedIds, whoBlockedMeIds } = useAuth();

  const allRelatedBlockIds = React.useMemo(() => [...blockedIds, ...whoBlockedMeIds], [blockedIds, whoBlockedMeIds]);

  const fetchMembers = async () => {
    if (!supabase || supabase.isDummy) {
      setLoading(false);
      return;
    }
    let query = supabase
      .from('profiles')
      .select('id, display_name, latitude, longitude, user_type, avatar_url, tier')
      .eq('is_visible', true);

    if (allRelatedBlockIds.length > 0) {
      query = query.not('id', 'in', `(${allRelatedBlockIds.join(',')})`);
    }
    
    const { data } = await query;
    
    if (data) {
      setMembers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();

    if (!supabase || supabase.isDummy) return;

    const channel = supabase.channel('members-view')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        fetchMembers();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      if (supabase && !supabase.isDummy) supabase.removeChannel(channel);
    };
  }, [allRelatedBlockIds]);

  const globeMarkers = members.map(m => ({
    location: [m.latitude, m.longitude] as [number, number],
    // Visitors see smaller, translucent pins? 
    // COBE doesn't handle opacity per-marker easily in the default shader,
    // but we can adjust size.
    size: profile ? 0.08 : 0.04,
  }));

  return { members, globeMarkers, loading, refresh: fetchMembers };
}

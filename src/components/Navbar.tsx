import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { User, LogOut, ShieldCheck, Globe as GlobeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface NavbarProps {
  onJoinClick: () => void;
  onSignInClick: () => void;
  onProfileClick: () => void;
}

export default function Navbar({ onJoinClick, onSignInClick, onProfileClick }: NavbarProps) {
  const { user, profile, loading, signOut } = useAuth();
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase || supabase.isDummy) return;
    
    async function fetchCount() {
      if (!supabase || supabase.isDummy) return;
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      setMemberCount(count);
    }
    fetchCount();

    // Realtime subscription for member count
    const channel = supabase.channel('member-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      if (supabase && !supabase.isDummy) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-space-bg/80 backdrop-blur-md border-b border-taurus-gold/20 h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-taurus-gold font-bold text-2xl tracking-tighter cursor-default">
          Taurus<span className="text-cream/90">Is</span>Magic
        </span>
        {memberCount !== null && (
          <div className="hidden sm:flex items-center gap-1.5 ml-4 px-3 py-1 bg-forest-green/20 border border-taurus-gold/10 rounded-full">
            <span className="flex h-1.5 w-1.5 rounded-full bg-taurus-gold animate-pulse" />
            <span className="text-[11px] font-bold text-taurus-gold uppercase tracking-wider">
              {memberCount.toLocaleString()} Taurus worldwide
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!loading && !user ? (
          <>
            <button 
              onClick={onSignInClick}
              className="text-mid-gray hover:text-light-gold text-sm font-medium transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={onJoinClick}
              className="btn-primary"
            >
              Join the Tribe
            </button>
          </>
        ) : !loading && user ? (
          <div className="flex items-center gap-4">
             {profile?.tier === 'paid' && (
              <div className="hidden md:flex items-center gap-1 text-[10px] font-bold text-forest-green bg-light-green px-2 py-0.5 rounded uppercase tracking-widest border border-forest-green/20">
                <ShieldCheck className="w-3 h-3" />
                Paid Member
              </div>
            )}
            <button 
              onClick={onProfileClick}
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-full bg-taurus-gold/10 border border-taurus-gold/30 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-taurus-gold" />
                )}
              </div>
              <span className="hidden sm:inline text-cream font-medium text-sm truncate max-w-[120px]">
                {profile?.display_name || user.email}
              </span>
            </button>
            <button 
              onClick={signOut}
              className="p-2 text-mid-gray hover:text-clay transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-8 bg-white/5 animate-pulse rounded-md" />
        )}
      </div>
    </nav>
  );
}

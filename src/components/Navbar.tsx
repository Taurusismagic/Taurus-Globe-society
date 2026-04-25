import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { User, LogOut, ShieldCheck, Globe as GlobeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/lib/errorUtils";

interface NavbarProps {
  onJoinClick: () => void;
  onSignInClick: () => void;
  onProfileClick: () => void;
}

export default function Navbar({ onJoinClick, onSignInClick, onProfileClick }: NavbarProps) {
  const { user, profile, loading, signOut } = useAuth();
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    const path = 'profiles';
    const q = query(collection(db, path), where('is_visible', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMemberCount(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 h-20 px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-taurus-gold rounded-xl flex items-center justify-center text-white shadow-gold rotate-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <span className="text-taurus-gold font-black text-2xl tracking-tight cursor-default select-none">
          Taurus<span className="text-cream/90">Is</span>Magic
        </span>
        {memberCount !== null && (
          <div className="hidden lg:flex items-center gap-2 ml-6 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
            <span className="flex h-2 w-2 rounded-full bg-taurus-gold animate-pulse shadow-gold" />
            <span className="text-[10px] font-black text-taurus-gold uppercase tracking-[0.2em]">
              {memberCount.toLocaleString()} Nodes Worldwide
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!loading && !user ? (
          <>
            <button 
              onClick={onSignInClick}
              className="text-cream/60 hover:text-light-gold text-sm font-medium transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={onJoinClick}
              className="btn-primary shadow-gold"
            >
              Join the Tribe
            </button>
          </>
        ) : !loading && user ? (
          <div className="flex items-center gap-4">
             {profile?.tier === 'paid' && (
              <div className="hidden md:flex items-center gap-1 text-[10px] font-bold text-taurus-gold bg-taurus-gold/10 px-2 py-0.5 rounded uppercase tracking-widest border border-taurus-gold/30">
                <ShieldCheck className="w-3 h-3" />
                Founding Member
              </div>
            )}
            <button 
              onClick={onProfileClick}
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-full bg-taurus-gold/10 border border-taurus-gold/30 flex items-center justify-center overflow-hidden shadow-gold/20 transition-transform group-hover:scale-105 group-hover:border-taurus-gold">
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
              className="p-2 text-cream/40 hover:text-clay transition-colors"
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

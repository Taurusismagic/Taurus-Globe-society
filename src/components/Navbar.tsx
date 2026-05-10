import React from "react";
import { ShieldCheck, User as UserIcon, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";

interface NavbarProps {
  memberCount: number;
  onJoinClick: () => void;
  onProfileClick: () => void;
  className?: string;
}

export default function Navbar({ memberCount: realMemberCount, onJoinClick, onProfileClick, className }: NavbarProps) {
  const [displayCount, setDisplayCount] = React.useState(942);
  const { user, profile } = useAuth();
  const { sendMockNotification } = useNotifications();

  React.useEffect(() => {
    // Fluctuating logic for "Taurus Tribe" live feeling
    const interval = setInterval(() => {
      setDisplayCount(prev => {
        // Natural jitter: -3 to +3
        const change = Math.floor(Math.random() * 7) - 3;
        let next = prev + change;
        
        // Boundaries: 900 - 1000
        if (next < 900) next = 900 + Math.floor(Math.random() * 5);
        if (next > 1000) next = 1000 - Math.floor(Math.random() * 5);
        
        return next;
      });
    }, 2500); // Updated every 2.5s for "High Activity" feel

    return () => clearInterval(interval);
  }, []);

  const handleTestNotification = () => {
    const types: any[] = ['system', 'message', 'task', 'update'];
    const type = types[Math.floor(Math.random() * types.length)];
    const titles = ["Planetary Drift", "Telepathy Sync", "Mission Update", "Nexus Pulse"];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const messages = [
      "A shift in Taurus gravity has been detected.",
      "Another member of the tribe reached out to your frequency.",
      "Your daily manifestation task is ready for review.",
      "A new spiritual patch has been applied to the Nexus."
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    sendMockNotification(type, title, message);
  };

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-4 pointer-events-auto",
      className
    )}>
      {/* Left side: Logo */}
      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
        <div className="w-10 h-10 bg-taurus-gold/20 rounded-xl flex items-center justify-center border border-taurus-gold/30 group-hover:bg-taurus-gold/40 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]">
          <ShieldCheck className="w-6 h-6 text-taurus-gold" />
        </div>
        <span className="text-xl font-display font-medium text-light-gold tracking-tight italic">
          TaurusIsMagic
        </span>
      </div>

      {/* Center: Live Status */}
      <div className="hidden lg:flex items-center gap-6">
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            {displayCount + realMemberCount} Members Active
          </span>
        </div>
        
        <div className="flex flex-col items-center">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-taurus-gold/40">Current Time</span>
            <TimeDisplay />
        </div>

        <div className="flex flex-col items-center">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-taurus-gold/40">Network Status</span>
            <span className="text-[10px] font-mono font-medium text-taurus-gold uppercase tracking-widest">Online</span>
        </div>
      </div>

      {/* Right side: Action */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Button 
               variant="ghost"
               onClick={handleTestNotification}
               className="hidden sm:flex items-center gap-2 text-white/40 hover:text-taurus-gold hover:bg-white/5 text-[10px] font-black uppercase tracking-widest px-4"
            >
              <Send className="w-3 h-3" /> Test Alert
            </Button>
            
            <NotificationBell />

            <button 
              onClick={onProfileClick}
              className="group flex items-center gap-3 p-1 pr-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-taurus-gold/10 border border-taurus-gold/20 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-taurus-gold" />
                )}
              </div>
              <span className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-widest">
                {profile?.display_name || 'Taurus'}
              </span>
            </button>
          </>
        ) : (
          <Button 
            variant="default"
            onClick={onJoinClick}
            className="bg-taurus-gold hover:bg-light-gold text-charcoal font-black uppercase tracking-widest text-[11px] px-8 py-6 rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.6)] hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Post a Job / Event
          </Button>
        )}
      </div>
    </nav>
  );
}

function TimeDisplay() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-[10px] font-mono font-medium text-white/80">
      {time.toLocaleTimeString([], { hour12: false })}
    </span>
  );
}

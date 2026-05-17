import React from "react";
import { ShieldCheck, User as UserIcon, Send, Instagram, Twitter, Music, Ghost, DollarSign, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";

interface NavbarProps {
  memberCount: number;
  onJoinClick: () => void;
  onProfileClick: () => void;
  className?: string;
}

export default function Navbar({ memberCount: realMemberCount, onJoinClick, onProfileClick, className }: NavbarProps) {
  const [activeJitter, setActiveJitter] = React.useState(12);
  const { user, profile, signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();

  React.useEffect(() => {
    // Subtle live jitter to represent "current online seekers"
    const interval = setInterval(() => {
      setActiveJitter(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        let next = prev + change;
        if (next < 5) next = 5;
        if (next > 25) next = 25;
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-4 pointer-events-auto",
      className
    )}>
      {/* Left side: Logo */}
      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
        <div className="w-8 h-8 md:w-10 md:h-10 bg-taurus-gold/20 rounded-lg md:rounded-xl flex items-center justify-center border border-taurus-gold/30 group-hover:bg-taurus-gold/40 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]">
          <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-taurus-gold" />
        </div>
        <span className="text-lg md:text-xl font-display font-medium text-light-gold tracking-tight italic hidden sm:block">
          TaurusIsMagic
        </span>
      </div>

      {/* Center: Live Status */}
      <div className="hidden lg:flex items-center gap-6">
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
            {realMemberCount} Stars / {activeJitter} Online
          </span>
        </div>
        
        <div className="flex flex-col items-center">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-taurus-gold/40">Current Time</span>
            <TimeDisplay />
        </div>

        <div className="flex flex-col items-center">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-taurus-gold/40">Community Connection</span>
            <span className="text-[10px] font-mono font-medium text-taurus-gold uppercase tracking-widest">Online</span>
        </div>
      </div>

      {/* Right side: Action */}
      <div className="flex items-center gap-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-taurus-gold hover:bg-white/10 transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="flex flex-col items-center gap-3">
          {user && (
            <div className="flex items-center gap-4">
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
                <span className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-widest hidden sm:block">
                  {profile?.display_name || 'Taurus'}
                </span>
              </button>
            </div>
          )}

          <Button 
            variant="default"
            onClick={onJoinClick}
            className="bg-taurus-gold hover:bg-light-gold text-[#FF69B4] font-black uppercase tracking-widest text-[9px] md:text-[10px] px-4 md:px-6 py-2.5 md:py-4 rounded-lg md:rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.6)] hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center gap-2"
          >
            <Send className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden xs:inline">Post your event or a job</span>
            <span className="xs:hidden">Post</span>
          </Button>

          <div className="flex items-center gap-6 px-2">
            <a 
              href="https://open.spotify.com/user/taurusismagic?utm_source=chatgpt.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#FF69B4] hover:text-white transition-all transform hover:scale-125"
              title="Spotify"
            >
              <Music className="w-6 h-6 md:w-7 md:h-7" />
            </a>
            <a 
              href="https://x.com/taurusismagic?utm_source=chatgpt.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#FF69B4] hover:text-white transition-all transform hover:scale-125"
              title="X (Twitter)"
            >
              <Twitter className="w-6 h-6 md:w-7 md:h-7" />
            </a>
            <a 
              href="https://www.instagram.com/taurusismagic/?utm_source=chatgpt.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#FF69B4] hover:text-white transition-all transform hover:scale-125"
              title="Instagram"
            >
              <Instagram className="w-6 h-6 md:w-7 md:h-7" />
            </a>
            <a 
              href="https://www.snapchat.com/@taurusismagic?utm_source=chatgpt.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#FF69B4] hover:text-white transition-all transform hover:scale-125"
              title="Snapchat"
            >
              <Ghost className="w-6 h-6 md:w-7 md:h-7" />
            </a>
            <a 
              href="https://cash.app/$Taurusismagic" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#FF69B4] hover:text-white transition-all transform hover:scale-125"
              title="CashApp"
            >
              <DollarSign className="w-7 h-7 md:w-8 md:h-8" />
            </a>
          </div>
        </div>
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

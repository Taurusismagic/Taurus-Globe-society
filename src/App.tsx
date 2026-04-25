import { useState } from "react";
import Globe from "@/components/Globe";
import Navbar from "@/components/Navbar";
import JoinModal from "@/components/JoinModal";
import SignInModal from "@/components/SignInModal";
import ProfilePanel from "@/components/ProfilePanel";
import ChatPanel from "@/components/ChatPanel";
import PaywallModal from "@/components/PaywallModal";
import AdminPanel from "@/components/AdminPanel";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useMembers } from "@/hooks/useMembers";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, Users, LayoutDashboard, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

function MainApp() {
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const { members, globeMarkers, loading: membersLoading } = useMembers();

  // Modals & Panels State
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [targetProfileId, setTargetProfileId] = useState<string | undefined>(undefined);

  // Globe Flight State
  const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);

  const handleJoinSuccess = (location: [number, number]) => {
    setTargetLocation(location);
    // After a delay, open profile?
  };

  const openProfile = (id?: string) => {
    setTargetProfileId(id);
    setIsProfileOpen(true);
  };

  return (
    <div className="relative w-full h-screen bg-space-bg overflow-hidden text-cream">
      {/* 1. The Globe (Background Layer) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Deep Space Background */}
        <div className="absolute inset-0 bg-space-bg">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--color-taurus-gold)_0%,_transparent_70%)] blur-[120px]" />
          
          {/* Subtle Starfield */}
          <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-150 contrast-150 mix-blend-overlay" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[120vh] h-[120vh] max-w-[1200px] max-h-[1200px]">
              <Globe 
                members={members} 
                targetLocation={targetLocation}
                className="opacity-100"
              />
            </div>
          </div>
        </div>
        
        {/* Masking and Vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(5,5,5,0.8)]" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-space-bg via-transparent to-space-bg/30 opacity-40" />
      </div>

      {/* 2. Navigation */}
      <Navbar 
        onJoinClick={() => setIsJoinOpen(true)}
        onSignInClick={() => setIsSignInOpen(true)}
        onProfileClick={() => openProfile()}
      />

      {/* 3. Floating Quick Actions (Desktop Sidebar / Mobile Bottom Bar) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 lg:left-8 lg:translate-x-0 lg:bottom-1/2 lg:translate-y-1/2 flex lg:flex-col gap-4">
        <ActionButton 
          icon={<MessageCircle />} 
          label="Tribe Chat" 
          onClick={() => setIsChatOpen(true)}
          active={isChatOpen}
          badge={profile?.tier === 'paid' ? undefined : "Lock"}
        />
        <ActionButton 
          icon={<Users />} 
          label="Members" 
          onClick={() => setIsChatOpen(true)} // Example
          active={false}
          badge="Soon"
        />
        {isAdmin && (
           <ActionButton 
            icon={<LayoutDashboard />} 
            label="Admin" 
            onClick={() => setIsAdminOpen(true)}
            active={isAdminOpen}
            badge="Alert"
          />
        )}
      </div>

      {/* 4. Modals & Panels */}
      <AnimatePresence>
        {isJoinOpen && (
          <JoinModal 
            isOpen={isJoinOpen} 
            onClose={() => setIsJoinOpen(false)} 
            onSuccess={handleJoinSuccess}
          />
        )}
        {isSignInOpen && (
          <SignInModal 
            isOpen={isSignInOpen} 
            onClose={() => setIsSignInOpen(false)} 
          />
        )}
        {isProfileOpen && (
          <ProfilePanel 
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)} 
            targetId={targetProfileId}
          />
        )}
        {isChatOpen && (
          <ChatPanel 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            onUpgradeClick={() => {
              setIsChatOpen(false);
              setIsPaywallOpen(true);
            }}
          />
        )}
        {isPaywallOpen && (
          <PaywallModal 
            isOpen={isPaywallOpen} 
            onClose={() => setIsPaywallOpen(false)} 
          />
        )}
        {isAdminOpen && (
          <AdminPanel 
            isOpen={isAdminOpen} 
            onClose={() => setIsAdminOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* 5. Welcome/Onboarding Overlay (Optional) */}
      {!user && !authLoading && (
        <div className="absolute bottom-24 left-8 max-w-sm pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.8, type: "spring", damping: 20 }}
            className="glass-modal border-white/10 p-10 rounded-[40px] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-taurus-gold to-transparent opacity-30" />
            
            <h1 className="text-3xl font-black text-taurus-gold text-glow mb-4 leading-[1.1] tracking-tight">
              Initialize Your Frequency.
            </h1>
            <p className="text-cream/60 text-sm leading-relaxed mb-8 font-medium">
              You are invited to join the sovereign tribe. Visualize the collective and claim your node on the world map.
            </p>
            <button 
              onClick={() => setIsJoinOpen(true)}
              className="btn-primary w-full pointer-events-auto flex items-center justify-center gap-2 group/btn"
            >
              Get Started
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                →
              </motion.span>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon, label, onClick, active, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-300",
        active 
          ? "bg-taurus-gold border-taurus-gold text-white shadow-lg shadow-taurus-gold/30 scale-110" 
          : "glass-panel border-white/5 text-taurus-gold hover:border-taurus-gold/30 hover:bg-white/10"
      )}
    >
      {icon}
      
      {/* Tooltip */}
      <span className="absolute left-16 hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity bg-charcoal text-cream text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border border-white/5 backdrop-blur-xl whitespace-nowrap shadow-2xl pointer-events-none">
        {label}
      </span>

      {/* Badge */}
      {badge && (
        <span className={cn(
          "absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
          badge === "Soon" ? "bg-mid-gray text-white" : "bg-clay text-white"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

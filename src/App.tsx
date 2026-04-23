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
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(5,5,5,1)]" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-space-bg via-transparent to-space-bg/50 opacity-60" />
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-space-bg/60 backdrop-blur-xl border border-taurus-gold/20 p-8 rounded-[32px] shadow-gold/20 shadow-2xl"
          >
            <h1 className="text-3xl font-bold text-taurus-gold text-glow mb-4 leading-tight">Claim your spot on the world stage.</h1>
            <p className="text-cream/80 text-sm leading-relaxed mb-6 font-medium">
              Join thousands of Taurus leaders, entrepreneurs, and dreamers in our exclusive global community.
            </p>
            <button 
              onClick={() => setIsJoinOpen(true)}
              className="btn-primary pointer-events-auto shadow-gold"
            >
              Get Started
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
        "group relative flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-300 backdrop-blur-md",
        active 
          ? "bg-taurus-gold border-taurus-gold text-white shadow-lg shadow-taurus-gold/30 scale-110" 
          : "bg-space-bg/60 border-taurus-gold/20 text-taurus-gold hover:border-taurus-gold/50 hover:bg-space-bg/80"
      )}
    >
      {icon}
      
      {/* Tooltip */}
      <span className="absolute left-16 hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity bg-cream text-charcoal text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md border border-taurus-gold/20 whitespace-nowrap shadow-xl pointer-events-none">
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

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import Globe from "@/components/Globe";
import HoroscopeView from "@/components/HoroscopeView";
import ZodiacSelector from "@/components/ZodiacSelector";
import CosmicTransition from "@/components/CosmicTransition";
import ProfilePanel from "@/components/ProfilePanel";
import Navbar from "@/components/Navbar";
import CosmicErrorBoundary from "@/components/CosmicErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import PostModal from "@/components/PostModal";
import { useMembers } from "@/hooks/useMembers";
import { usePosts } from "@/hooks/usePosts";
import { useSignals } from "@/hooks/useSignals";
import { ZODIAC_SIGNS } from "@/constants";
import ChatPanel from "@/components/ChatPanel";
import AdminPanel from "@/components/AdminPanel";
import PaywallModal from "@/components/PaywallModal";
import ChatBar from "@/components/TribeChatBar";
import OnboardingModal from "@/components/OnboardingModal";

function MainApp() {
  const { user, profile, isAdmin } = useAuth();
  const { members } = useMembers();
  const { posts } = usePosts();
  const { signals, addSignal } = useSignals();
  
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [transitionData, setTransitionData] = useState<{ sign: string; pos: { x: number; y: number } } | null>(null);

  // Trigger onboarding if logged in but no profile
  useEffect(() => {
    if (user && !profile) {
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (profile) {
      setIsOnboardingOpen(false);
    }
  }, [user, profile]);

  // Auto-show selector after 5 seconds or upon first click
  useEffect(() => {
    if (!showSelector && !selectedSign && !transitionData) {
      const timer = setTimeout(() => {
        setShowSelector(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSelector, selectedSign, transitionData]);

  const handleGlobalClick = () => {
    if (!selectedSign && !showSelector && !transitionData) {
      setShowSelector(true);
    }
  };

  const handleSignSelect = (sign: string, pos: { x: number, y: number }) => {
    setTransitionData({ sign, pos });
    setShowSelector(false);
  };

  const finalizeSelection = () => {
    if (transitionData) {
      setSelectedSign(transitionData.sign);
      setTransitionData(null);
    }
  };

  return (
    <div 
      onClick={handleGlobalClick}
      className="relative min-h-dvh w-full bg-space-bg text-cream font-sans selection:bg-taurus-gold/30 overflow-hidden"
    >
      <div className="scanline" />
      
      <Navbar 
        memberCount={members.length} 
        onJoinClick={() => setIsPostModalOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)}
      />
      
      {/* 1. Cinematic Globe Layer (Fixed in background) */}
      <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        {/* Deep Starfield Backdrop */}
        <div className="absolute inset-0 star-field opacity-30 animate-pulse-slow" />
        <div className="absolute inset-0 star-field opacity-20 rotate-45 scale-150 animate-pulse-slow-reverse" />
        
        {/* Atmosphere Glows */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_30%,_#00F5FF_0%,_transparent_50%)]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_70%,_#8B5CF6_0%,_transparent_50%)]" />
        
        {/* Centered Globe Container */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
             <div className="w-[85vw] h-[85vw] md:w-[900px] md:h-[900px] rounded-full border border-taurus-gold/10 animate-spin-slow" />
             <div className="absolute w-[70vw] h-[70vw] md:w-[700px] md:h-[700px] rounded-full border border-taurus-gold/5 animate-spin-slow-reverse" />
             <div className="absolute w-[50vw] h-[50vw] md:w-[500px] md:h-[500px] rounded-full border border-white/5 opacity-50" />
          </div>
          <Globe 
            members={members} 
            posts={posts}
            signals={signals}
            className={cn("transition-all duration-1000", transitionData ? "scale-150 blur-sm opacity-50" : "opacity-100")}
          />
        </div>
      </div>

      {/* 2. UI Layers */}
      <div className="relative z-10 w-full min-h-dvh flex flex-col pointer-events-none">
        <main className="flex-1 w-full relative flex items-center justify-center">
          {/* Top Title - Absolutely positioned for perfect vertical centering of globe */}
          <AnimatePresence>
            {!showSelector && !selectedSign && !transitionData && (
              <motion.div 
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 0, filter: 'blur(10px)' }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-24 sm:top-32 md:top-40 z-10 text-center px-6 w-full"
              >
                <div className="inline-block relative">
                   <motion.div 
                     animate={{ opacity: [0.3, 0.6, 0.3] }}
                     transition={{ duration: 4, repeat: Infinity }}
                     className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] md:text-[10px] font-black uppercase tracking-[1em] text-taurus-gold/60"
                   >
                     Cosmic Sync v2.0
                   </motion.div>
                   <h1 className="text-5xl sm:text-7xl md:text-9xl font-display font-medium text-light-gold tracking-tighter drop-shadow-[0_0_60px_rgba(245,230,192,0.15)] italic">
                     Taurus Is Magic
                   </h1>
                   <div className="h-px w-full bg-gradient-to-r from-transparent via-taurus-gold/40 to-transparent mt-4" />
                </div>
              </motion.div>
            )}
            {(showSelector || selectedSign) && (
               <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-24 sm:top-32 md:top-40 z-10 text-center px-6 w-full"
              >
                <h1 className="text-3xl md:text-5xl font-display font-medium text-light-gold tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] italic">
                   What's your sign?
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Central Interaction Area - Perfectly Centered */}
          <div className="relative z-20 w-full flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
              {showSelector && !selectedSign && !transitionData && (
                <motion.div
                  key="main-zodiac-selector"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="w-full flex items-center justify-center"
                >
                  <ZodiacSelector 
                    onSelect={handleSignSelect} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Subtext */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-24 sm:bottom-32 md:bottom-40 z-10 text-center px-6 w-full"
          >
             <p className="text-cream/50 text-[10px] sm:text-sm md:text-lg font-accent font-light tracking-[0.3em] md:tracking-[0.6em] uppercase">
                Join us and explore the stars
             </p>
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {isProfileOpen && (
          <ProfilePanel 
            key="side-profile-panel"
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)} 
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
        {isAdminOpen && (
          <AdminPanel 
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
          />
        )}
        {isPaywallOpen && (
          <PaywallModal 
            isOpen={isPaywallOpen}
            onClose={() => setIsPaywallOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 4. Full Screen Horoscope View */}
      <AnimatePresence>
        {selectedSign && (
          <HoroscopeView 
            key={`horoscope-view-${selectedSign}`}
            sign={selectedSign} 
            onClose={() => setSelectedSign(null)} 
          />
        )}
      </AnimatePresence>

      {/* 5. Cosmic Transition Animation */}
      <AnimatePresence>
        {transitionData && (
          <CosmicTransition 
            key={`cosmic-transition-${transitionData.sign}`}
            startPos={transitionData.pos}
            symbol={ZODIAC_SIGNS.find(s => s.name === transitionData.sign)?.symbol || ""}
            onComplete={finalizeSelection}
          />
        )}
      </AnimatePresence>

      {/* 6. Action Modals */}
      <AnimatePresence>
        {isPostModalOpen && (
          <PostModal 
            key="global-post-modal"
            isOpen={isPostModalOpen} 
            onClose={() => setIsPostModalOpen(false)} 
          />
        )}
        {isOnboardingOpen && (
          <OnboardingModal 
            isOpen={isOnboardingOpen}
            onClose={() => setIsOnboardingOpen(false)}
          />
        )}
      </AnimatePresence>

      <ChatBar onSendMessage={addSignal} />

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-space-bg/80 via-transparent to-space-bg/40" />
    </div>
  );
}

export default function App() {
  return (
    <CosmicErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </CosmicErrorBoundary>
  );
}

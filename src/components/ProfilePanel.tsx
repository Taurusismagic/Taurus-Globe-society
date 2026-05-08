import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, MapPin, Instagram, Twitter, Edit2, Save, LogOut, CheckCircle2, ShieldCheck, ExternalLink, Ban, Unlock, AlertTriangle, Lock, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import ReportModal from "./ReportModal";
import { handleFirestoreError, OperationType } from "@/lib/errorUtils";
import { useNotifications } from "@/hooks/useNotifications";

interface ProfilePanelProps {
  key?: string;
  isOpen: boolean;
  onClose: () => void;
  targetId?: string;
}

export default function ProfilePanel({ isOpen, onClose, targetId }: ProfilePanelProps) {
  const { user, profile: myProfile, refreshProfile, blockedIds, whoBlockedMeIds, refreshBlocks, signOut } = useAuth();
  const { sendMockNotification } = useNotifications();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

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
  
  // Edit state
  const [editData, setEditData] = useState<any>({});

  const isOwnProfile = targetId === user?.uid || !targetId;
  const isBlocked = targetId ? blockedIds.includes(targetId) : false;
  const hasBlockedMe = targetId ? whoBlockedMeIds.includes(targetId) : false;

  useEffect(() => {
    async function fetchTargetProfile() {
      if (!isOpen) return;
      setLoading(true);
      const idToFetch = targetId || user?.uid;
      if (!idToFetch) return setLoading(false);

      if (hasBlockedMe) {
        setProfile({ id: idToFetch, display_name: "Blocked User", city: "Hidden", is_blocked: true });
        setLoading(false);
        return;
      }

      const path = `profiles/${idToFetch}`;
      try {
        const docRef = doc(db, 'profiles', idToFetch);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({ id: docSnap.id, ...data });
          setEditData(data);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    }
    fetchTargetProfile();
  }, [isOpen, targetId, user?.uid, hasBlockedMe]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const path = `profiles/${user.uid}`;
    try {
      const docRef = doc(db, 'profiles', user.uid);
      await updateDoc(docRef, {
        display_name: editData.display_name,
        bio: editData.bio || null,
        instagram_handle: editData.instagram_handle || null,
        twitter_handle: editData.twitter_handle || null,
        is_visible: editData.is_visible,
        avatar_url: editData.avatar_url || null,
        updated_at: serverTimestamp()
      });
      
      setProfile({...profile, ...editData});
      setIsEditing(false);
      await refreshProfile();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!user || !targetId) return;
    setBlockLoading(true);
    const path = `blocks/${user.uid}_${targetId}`;
    try {
      const blockId = `${user.uid}_${targetId}`;
      const blockRef = doc(db, 'blocks', blockId);
      
      if (isBlocked) {
        await deleteDoc(blockRef);
      } else {
        await setDoc(blockRef, {
          blocker_id: user.uid,
          blocked_id: targetId,
          created_at: serverTimestamp()
        });
      }
      await refreshBlocks();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setBlockLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[110] flex justify-end pointer-events-none">
        <motion.div 
          key="profile-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-overlay/40 backdrop-blur-[1px] pointer-events-auto"
        />
        
        <motion.div
          key="profile-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
           transition={{ type: "spring", damping: 30, stiffness: 300 }}
           className="relative w-full md:max-w-[420px] glass-panel h-full border-l border-white/5 shadow-2xl flex flex-col pointer-events-auto overscroll-behavior-contain"
        >
          <div className="p-5 md:p-8 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
            <div>
              <h2 className="font-black text-xl md:text-2xl text-taurus-gold tracking-tighter">
                {isOwnProfile ? "My Profile" : "Member Profile"}
              </h2>
              <p className="text-[10px] text-cream/40 uppercase font-black tracking-widest mt-1">Verified Member</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-cream/40 hover:text-cream">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide pb-[calc(1.5rem+env(safe-area-inset-bottom))] touch-pan-y overscroll-behavior-contain">
            {loading && !profile ? (
              <div className="animate-pulse space-y-8">
                <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] mx-auto" />
                <div className="space-y-3">
                  <div className="h-8 bg-white/5 rounded-xl w-3/4 mx-auto" />
                  <div className="h-4 bg-white/5 rounded-lg w-1/2 mx-auto" />
                </div>
              </div>
            ) : profile ? (
              <div className="space-y-10">
                {/* Header Info */}
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-32 h-32 rounded-[2.5rem] bg-taurus-gold/10 border-2 border-white/10 flex items-center justify-center overflow-hidden mb-6 shadow-2xl transition-all"
                    >
                      {isEditing ? (
                        <input 
                          type="text" 
                          placeholder="Image URL"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => setEditData({...editData, avatar_url: e.target.value})}
                        />
                      ) : null}
                      {profile.is_blocked || hasBlockedMe ? (
                         <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <Lock className="w-10 h-10 text-taurus-gold/40" />
                         </div>
                      ) : editData.avatar_url ? (
                        <img src={editData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-14 h-14 text-taurus-gold" />
                      )}
                    </motion.div>
                    {isOwnProfile && isEditing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-[2.5rem] pointer-events-none border-2 border-taurus-gold animate-pulse">
                        <Edit2 className="text-white w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <input 
                      value={editData.display_name} 
                      onChange={(e) => setEditData({...editData, display_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 text-center font-black text-2xl mb-3 text-cream focus:border-taurus-gold outline-none backdrop-blur-md"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <h3 className="text-3xl font-black mb-2 text-cream tracking-tight">
                        {profile.display_name}
                        {isBlocked && <span className="ml-2 text-clay text-[10px] tracking-widest uppercase font-black">(Restricted)</span>}
                      </h3>
                      <div className="flex items-center gap-3 mb-6">
                        <div className={cn(
                          "text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.15em] border",
                          profile.user_type === 'business' ? "bg-taurus-gold/10 border-taurus-gold/30 text-taurus-gold" : "bg-clay/10 border-clay/30 text-clay"
                        )}>
                          {profile.user_type === 'business' ? "Entrepreneur" : "Member"}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-cream/40 text-sm font-bold uppercase tracking-widest">
                    <MapPin className="w-4 h-4 text-taurus-gold" />
                    <span>{hasBlockedMe ? "Signal Lost" : profile.city}</span>
                  </div>
                </div>

                {hasBlockedMe ? (
                   <div className="glass-card border-clay/20 p-8 rounded-[2.5rem] text-center">
                      <Lock className="w-10 h-10 text-clay mx-auto mb-4" />
                      <p className="text-lg text-clay font-black uppercase tracking-tight">Frequency Jammed</p>
                      <p className="text-sm text-cream/40 mt-2 font-medium">This member has restricted your access to their frequency.</p>
                   </div>
                ) : (
                  <>
                    {/* Bio Section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-taurus-gold uppercase tracking-[0.25em] flex items-center gap-3">
                        About Me
                        <div className="flex-1 h-[1px] bg-white/5" />
                      </h4>
                      {isEditing ? (
                        <textarea 
                          value={editData.bio || ""}
                          onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl min-h-[120px] text-[14px] text-cream placeholder:text-cream/20 outline-none focus:border-taurus-gold backdrop-blur-md font-medium"
                          placeholder="What is your mission?"
                        />
                      ) : (
                        <p className="text-cream/70 text-[15px] leading-relaxed font-medium italic">
                          "{profile.bio || "This node is currently silent. Awaits initialization."}"
                        </p>
                      )}
                    </div>

                    {/* Social Section */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-taurus-gold uppercase tracking-[0.25em] flex items-center gap-3">
                        Connect
                        <div className="flex-1 h-[1px] bg-white/5" />
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/5 transition-all">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-taurus-gold group-hover:scale-110 transition-transform">
                            <Instagram className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[9px] text-cream/30 uppercase font-black tracking-widest mb-1">Instagram</div>
                            {isEditing ? (
                              <input 
                                value={editData.instagram_handle || ""}
                                onChange={(e) => setEditData({...editData, instagram_handle: e.target.value})}
                                className="text-sm w-full outline-none bg-transparent border-b border-white/10 text-cream focus:border-taurus-gold font-bold"
                                placeholder="@username"
                              />
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-cream">{profile.instagram_handle ? `@${profile.instagram_handle}` : "Offline"}</span>
                                {profile.instagram_handle && (
                                  <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" className="text-taurus-gold hover:scale-125 transition-transform">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/5 transition-all">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-taurus-gold group-hover:scale-110 transition-transform">
                            <Twitter className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[9px] text-cream/30 uppercase font-black tracking-widest mb-1">Twitter / X</div>
                            {isEditing ? (
                              <input 
                                value={editData.twitter_handle || ""}
                                onChange={(e) => setEditData({...editData, twitter_handle: e.target.value})}
                                className="text-sm w-full outline-none bg-transparent border-b border-white/10 text-cream focus:border-taurus-gold font-bold"
                                placeholder="@username"
                              />
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-cream">{profile.twitter_handle ? `@${profile.twitter_handle}` : "Offline"}</span>
                                {profile.twitter_handle && (
                                  <a href={`https://twitter.com/${profile.twitter_handle}`} target="_blank" className="text-taurus-gold hover:scale-125 transition-transform">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {isOwnProfile ? (
                  <div className="pt-10 space-y-4">
                    {isEditing ? (
                      <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-3"
                      >
                        {loading ? <div className="w-6 h-6 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <> <Save className="w-5 h-5" /> Save Profile </>}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="btn-ghost w-full flex items-center justify-center gap-3 font-black"
                      >
                        <Edit2 className="w-5 h-5" />
                        Edit Profile
                      </button>
                    )}
                    <button 
                      onClick={handleTestNotification}
                      className="btn-ghost w-full flex items-center justify-center gap-3 font-black mt-2"
                    >
                      <Send className="w-5 h-5" />
                      Test Alert
                    </button>

                    <button 
                      onClick={signOut} 
                      className="w-full flex items-center justify-center gap-2 py-3 text-cream/20 hover:text-clay font-black transition-all text-[10px] uppercase tracking-[0.2em]"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                 ) : !hasBlockedMe && (
                  <div className="pt-10 space-y-4">
                     <button
                        onClick={handleToggleBlock}
                        disabled={blockLoading}
                        className={cn(
                          "w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all font-black uppercase text-xs tracking-widest",
                          isBlocked 
                            ? "bg-forest-green/10 text-taurus-gold border border-taurus-gold/20" 
                            : "bg-clay/10 text-clay border border-clay/20"
                        )}
                     >
                        {blockLoading ? (
                          <div className="w-6 h-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : isBlocked ? (
                          <> <Unlock className="w-5 h-5" /> Unblock Member </>
                        ) : (
                          <> <Ban className="w-5 h-5" /> Block Member </>
                        )}
                     </button>

                     <button
                        onClick={() => setIsReportOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-cream/20 hover:text-clay transition-all font-black text-[10px] uppercase tracking-[0.2em]"
                     >
                        <AlertTriangle className="w-4 h-4" />
                        Report Flag
                     </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>

      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={targetId || ""}
        contentType="profile"
      />
    </>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}

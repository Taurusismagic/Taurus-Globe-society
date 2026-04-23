import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, MapPin, Instagram, Twitter, Edit2, Save, LogOut, CheckCircle2, ShieldCheck, ExternalLink, Ban, Unlock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import ReportModal from "./ReportModal";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  targetId?: string;
}

export default function ProfilePanel({ isOpen, onClose, targetId }: ProfilePanelProps) {
  const { user, profile: myProfile, refreshProfile, blockedIds, whoBlockedMeIds, refreshBlocks } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  // Edit state
  const [editData, setEditData] = useState<any>({});

  const isOwnProfile = targetId === user?.id || !targetId;
  const isBlocked = targetId ? blockedIds.includes(targetId) : false;
  const hasBlockedMe = targetId ? whoBlockedMeIds.includes(targetId) : false;

  useEffect(() => {
    async function fetchTargetProfile() {
      if (!isOpen || !supabase) return;
      setLoading(true);
      const idToFetch = targetId || user?.id;
      if (!idToFetch) return setLoading(false);

      // If they blocked me, I shouldn't see their profile details (per "interact in any way")
      if (hasBlockedMe) {
        setProfile({ id: idToFetch, display_name: "Blocked User", city: "Hidden", is_blocked: true });
        setLoading(false);
        return;
      }

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', idToFetch)
        .single();
      
      setProfile(data);
      setEditData(data);
      setLoading(false);
    }
    fetchTargetProfile();
  }, [isOpen, targetId, user?.id, hasBlockedMe]);

  const handleSave = async () => {
    if (!user || !supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editData.display_name,
          bio: editData.bio,
          instagram_handle: editData.instagram_handle,
          twitter_handle: editData.twitter_handle,
          is_visible: editData.is_visible,
          avatar_url: editData.avatar_url
        })
        .eq('id', user.id);
      
      if (error) throw error;
      setProfile(editData);
      setIsEditing(false);
      await refreshProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!user || !targetId || !supabase) return;
    setBlockLoading(true);
    try {
      if (isBlocked) {
        // Unblock
        await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', targetId);
      } else {
        // Block
        await supabase
          .from('blocks')
          .insert({
            blocker_id: user.id,
            blocked_id: targetId
          });
      }
      await refreshBlocks();
    } catch (err) {
      console.error(err);
    } finally {
      setBlockLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex justify-end pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-overlay/40 backdrop-blur-[1px] pointer-events-auto"
        />
        
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-[420px] bg-cream h-full border-l-4 border-taurus-gold shadow-2xl flex flex-col pointer-events-auto"
        >
          <div className="p-6 flex items-center justify-between border-b border-taurus-gold/10">
            <h2 className="font-bold text-xl flex items-center gap-2">
              {isOwnProfile ? "Your Profile" : "Member Profile"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-taurus-gold/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {loading && !profile ? (
              <div className="animate-pulse space-y-4">
                <div className="w-24 h-24 bg-mid-gray/20 rounded-full" />
                <div className="h-6 bg-mid-gray/20 rounded w-1/2" />
                <div className="h-4 bg-mid-gray/20 rounded w-3/4" />
              </div>
            ) : profile ? (
              <div className="space-y-8">
                {/* Header Info */}
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full bg-taurus-gold/20 border-2 border-taurus-gold flex items-center justify-center overflow-hidden mb-4">
                      {isEditing ? (
                        <input 
                          type="text" 
                          placeholder="Image URL"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => setEditData({...editData, avatar_url: e.target.value})}
                        />
                      ) : null}
                      {profile.is_blocked || hasBlockedMe ? (
                         <div className="w-full h-full bg-mid-gray/20 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-mid-gray" />
                         </div>
                      ) : editData.avatar_url ? (
                        <img src={editData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-taurus-gold" />
                      )}
                    </div>
                    {isOwnProfile && isEditing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full pointer-events-none">
                        <Edit2 className="text-white w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <input 
                      value={editData.display_name} 
                      onChange={(e) => setEditData({...editData, display_name: e.target.value})}
                      className="input-field text-center font-bold text-xl mb-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <h3 className="text-2xl font-bold mb-1">
                        {profile.display_name}
                        {isBlocked && <span className="ml-2 text-clay text-xs tracking-widest uppercase">(Blocked)</span>}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                          profile.user_type === 'business' ? "bg-light-green text-forest-green" : "bg-clay/10 text-clay"
                        )}>
                          {profile.user_type === 'business' ? "Business" : "Taurus Member"}
                        </div>
                        {profile.tier === 'paid' && (
                          <div className="text-[10px] font-bold bg-taurus-gold text-white px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Premium
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-mid-gray text-sm">
                    <MapPin className="w-4 h-4 text-taurus-gold" />
                    <span>{hasBlockedMe ? "Hidden location" : profile.city}</span>
                  </div>
                </div>

                {hasBlockedMe ? (
                   <div className="bg-clay/5 border border-clay/20 p-6 rounded-2xl text-center">
                      <Lock className="w-8 h-8 text-clay mx-auto mb-3" />
                      <p className="text-sm text-clay font-medium">You cannot view this profile</p>
                      <p className="text-xs text-mid-gray mt-1">This user has restricted their interactions.</p>
                   </div>
                ) : (
                  <>
                    {/* Bio Section */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-taurus-gold uppercase tracking-[0.2em] border-b border-taurus-gold/10 pb-2">About</h4>
                      {isEditing ? (
                        <textarea 
                          value={editData.bio || ""}
                          onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          className="w-full p-4 bg-white border border-light-gray rounded-xl min-h-[100px] text-sm"
                          placeholder="Tell the tribe about yourself..."
                        />
                      ) : (
                        <p className="text-charcoal/80 text-sm leading-relaxed whitespace-pre-wrap italic">
                          {profile.bio || "No bio yet. This Taurus is a mystery..."}
                        </p>
                      )}
                    </div>

                    {/* Social Section */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-bold text-taurus-gold uppercase tracking-[0.2em] border-b border-taurus-gold/10 pb-2">Connect</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-light-gray/50 flex items-center justify-center text-charcoal">
                            <Instagram className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[10px] text-mid-gray uppercase font-bold">Instagram</div>
                            {isEditing ? (
                              <input 
                                value={editData.instagram_handle || ""}
                                onChange={(e) => setEditData({...editData, instagram_handle: e.target.value})}
                                className="text-sm w-full outline-none bg-transparent border-b border-light-gray focus:border-taurus-gold"
                                placeholder="@username"
                              />
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{profile.instagram_handle ? `@${profile.instagram_handle}` : "Not linked"}</span>
                                {profile.instagram_handle && (
                                  <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" className="text-taurus-gold hover:scale-110 transition-transform">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-light-gray/50 flex items-center justify-center text-charcoal">
                            <Twitter className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="text-[10px] text-mid-gray uppercase font-bold">Twitter / X</div>
                            {isEditing ? (
                              <input 
                                value={editData.twitter_handle || ""}
                                onChange={(e) => setEditData({...editData, twitter_handle: e.target.value})}
                                className="text-sm w-full outline-none bg-transparent border-b border-light-gray focus:border-taurus-gold"
                                placeholder="@username"
                              />
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{profile.twitter_handle ? `@${profile.twitter_handle}` : "Not linked"}</span>
                                {profile.twitter_handle && (
                                  <a href={`https://twitter.com/${profile.twitter_handle}`} target="_blank" className="text-taurus-gold hover:scale-110 transition-transform">
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
                  <div className="pt-8 space-y-4">
                    {isEditing ? (
                      <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <Save className="w-5 h-5" /> Save Changes </>}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="btn-ghost w-full flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-5 h-5" />
                        Edit Profile
                      </button>
                    )}
                  </div>
                 ) : !hasBlockedMe && (
                  <div className="pt-8 space-y-3">
                     <button
                        onClick={handleToggleBlock}
                        disabled={blockLoading}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold",
                          isBlocked 
                            ? "bg-light-green text-forest-green hover:bg-forest-green/10" 
                            : "bg-clay/10 text-clay hover:bg-clay/20"
                        )}
                     >
                        {blockLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isBlocked ? (
                          <> <Unlock className="w-5 h-5" /> Unblock User </>
                        ) : (
                          <> <Ban className="w-5 h-5" /> Block Member </>
                        )}
                     </button>

                     <button
                        onClick={() => setIsReportOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-mid-gray hover:text-clay transition-all font-bold text-xs"
                     >
                        <AlertTriangle className="w-4 h-4" />
                        Report Member
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
    </AnimatePresence>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}

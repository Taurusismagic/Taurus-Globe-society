import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Lock, Sparkles, MessageCircle, MoreVertical, X, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import ReportModal from "./ReportModal";
import { handleFirestoreError, OperationType } from "@/lib/errorUtils";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
  targetUserId?: string | null;
}

export default function ChatPanel({ isOpen, onClose, onUpgradeClick, targetUserId }: ChatPanelProps) {
  const { user, profile, blockedIds, whoBlockedMeIds } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatMode, setChatMode] = useState<'global' | 'local' | 'direct'>('global');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reporting State
  const [reportState, setReportState] = useState<{
    isOpen: boolean;
    targetId: string;
    contentId?: string;
  }>({
    isOpen: false,
    targetId: "",
  });

  const isPaid = profile?.tier === 'paid';
  const allRelatedBlockIds = useMemo(() => [...blockedIds, ...whoBlockedMeIds], [blockedIds, whoBlockedMeIds]);

  useEffect(() => {
    if (targetUserId) {
      setChatMode('direct');
    } else {
      setChatMode('global');
    }
  }, [targetUserId, isOpen]);

  useEffect(() => {
    if (!isOpen || !isPaid) return;

    let path = 'messages';
    let messagesRef = collection(db, path);
    let q;

    if (chatMode === 'direct' && targetUserId && user) {
      path = 'direct_messages';
      messagesRef = collection(db, path);
      // For direct messages, we look for both directions
      const participants = [user.uid, targetUserId].sort();
      q = query(
        messagesRef,
        where('participants', '==', participants),
        orderBy('created_at', 'desc'),
        limit(50)
      );
    } else if (chatMode === 'local' && profile?.city) {
      q = query(
        messagesRef, 
        where('city', '==', profile.city),
        orderBy('created_at', 'desc'), 
        limit(50)
      );
    } else {
      q = query(messagesRef, orderBy('created_at', 'desc'), limit(50));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Client-side block filtering
      if (allRelatedBlockIds.length > 0) {
        msgs = msgs.filter(m => !allRelatedBlockIds.includes((m as any).user_id));
      }

      setMessages(msgs.reverse());
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [isOpen, isPaid, allRelatedBlockIds, chatMode, targetUserId, user, profile?.city]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !isPaid || !profile) return;

    const msg = newMessage;
    setNewMessage("");
    const isDirect = chatMode === 'direct' && targetUserId;
    const path = isDirect ? 'direct_messages' : 'messages';
    
    try {
      const data: any = {
        user_id: user.uid,
        author_name: profile.display_name,
        author_avatar: profile.avatar_url,
        content: msg,
        created_at: serverTimestamp()
      };

      if (isDirect) {
        data.participants = [user.uid, targetUserId!].sort();
        data.recipient_id = targetUserId;
      } else {
        data.city = profile.city;
      }

      await addDoc(collection(db, path), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
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
           className="relative w-full max-w-[420px] glass-panel h-full border-l border-taurus-gold/30 shadow-2xl flex flex-col pointer-events-auto"
        >
          <div className="p-4 sm:p-8 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
            <div>
              <h2 className="font-black text-xl sm:text-2xl flex items-center gap-3 text-taurus-gold tracking-tighter">
                <div className="w-8 h-8 rounded-lg bg-taurus-gold flex items-center justify-center text-white shadow-gold">
                  <MessageCircle className="w-5 h-5" />
                </div>
                Tribe Nexus
              </h2>
              <p className="text-[10px] text-cream/40 uppercase font-black tracking-widest mt-1">Encrypted Frequency</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-cream/40 hover:text-cream">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {isPaid && (
              <div className="px-4 sm:px-8 py-4 border-b border-white/5 bg-white/[0.01] flex gap-2">
                <button 
                  onClick={() => setChatMode('global')}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    chatMode === 'global' ? "bg-taurus-gold text-white shadow-gold" : "text-cream/40 hover:text-cream/60 bg-white/5"
                  )}
                >
                  Global
                </button>
                <button 
                  onClick={() => setChatMode('local')}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    chatMode === 'local' ? "bg-taurus-gold text-white shadow-gold" : "text-cream/40 hover:text-cream/60 bg-white/5"
                  )}
                >
                  Local ({profile?.city?.split(',')[0] || 'Unknown'})
                </button>
                {targetUserId && (
                   <button 
                    onClick={() => setChatMode('direct')}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      chatMode === 'direct' ? "bg-clay text-white shadow-lg shadow-clay/20" : "text-cream/40 hover:text-cream/60 bg-white/5"
                    )}
                  >
                    Direct
                  </button>
                )}
              </div>
            )}

            {!isPaid && (
              <div className="absolute inset-0 z-20 bg-space-bg/60 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 bg-taurus-gold/20 rounded-[2rem] flex items-center justify-center mb-8 border border-taurus-gold/30 shadow-gold"
                >
                  <Lock className="w-10 h-10 text-taurus-gold" />
                </motion.div>
                <h3 className="text-2xl font-black mb-4 text-cream tracking-tight">Authorized Personnel Only.</h3>
                <p className="text-cream/50 text-base mb-10 font-medium">
                  This frequency is reserved for initialized members of the tribe. Upgrade your credentials to enter the nexus.
                </p>
                <button 
                  onClick={onUpgradeClick}
                  className="btn-primary w-full flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  Upgrade Credentials
                </button>
              </div>
            )}

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scrollbar-hide"
            >
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={cn("flex gap-4", msg.user_id === user?.uid ? "flex-row-reverse" : "")}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10 shadow-lg">
                    <img src={msg.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user_id}`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className={cn("flex flex-col max-w-[75%]", msg.user_id === user?.uid ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-3 mb-1.5 px-1">
                      <span className="text-[10px] font-black text-taurus-gold uppercase tracking-widest">{msg.author_name || "Anonymous"}</span>
                      {msg.created_at?.toDate && (
                        <span className="text-[9px] text-cream/30 font-medium">{formatDistanceToNow(msg.created_at.toDate())} ago</span>
                      )}
                    </div>
                    <div className={cn(
                      "px-5 py-3 rounded-2xl text-[14px] leading-relaxed shadow-lg relative group/msg font-medium",
                      msg.user_id === user?.uid 
                        ? "bg-taurus-gold text-white rounded-tr-none shadow-gold/20" 
                        : "bg-white/5 text-cream/90 rounded-tl-none border border-white/10 backdrop-blur-md"
                    )}>
                      {msg.content}
                      
                      {msg.user_id !== user?.uid && (
                        <button 
                          onClick={() => setReportState({ isOpen: true, targetId: msg.user_id, contentId: msg.id })}
                          className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 text-cream/20 hover:text-clay opacity-0 group-hover/msg:opacity-100 transition-all"
                          title="Report Flag"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 sm:p-8 bg-white/[0.02] border-t border-white/5">
              <form onSubmit={handleSend} className="relative group">
                <input 
                  disabled={!isPaid}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isPaid ? "Type a signal..." : "Initialization Required"}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 pr-14 text-base text-cream placeholder:text-cream/20 focus:border-taurus-gold/50 focus:bg-white/10 outline-none transition-all duration-300 backdrop-blur-md"
                />
                <button 
                  disabled={!isPaid || !newMessage.trim()}
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-taurus-gold text-white rounded-xl flex items-center justify-center disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-gold shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      <ReportModal 
        isOpen={reportState.isOpen}
        onClose={() => setReportState(prev => ({ ...prev, isOpen: false }))}
        targetId={reportState.targetId}
        contentType="message"
        contentId={reportState.contentId}
      />
    </AnimatePresence>
  );
}

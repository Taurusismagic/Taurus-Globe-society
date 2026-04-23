import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Lock, Sparkles, MessageCircle, MoreVertical, X, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import ReportModal from "./ReportModal";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick: () => void;
}

export default function ChatPanel({ isOpen, onClose, onUpgradeClick }: ChatPanelProps) {
  const { user, profile, blockedIds, whoBlockedMeIds } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
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
  const allRelatedBlockIds = React.useMemo(() => [...blockedIds, ...whoBlockedMeIds], [blockedIds, whoBlockedMeIds]);

  useEffect(() => {
    if (!isOpen || !isPaid || !supabase || supabase.isDummy) return;

    async function fetchMessages() {
      if (!supabase || supabase.isDummy) return;
      // Fetch messages excluding those from people I blocked or who blocked me
      let query = supabase
        .from('messages')
        .select('*, profiles(display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (allRelatedBlockIds.length > 0) {
        query = query.not('user_id', 'in', `(${allRelatedBlockIds.join(',')})`);
      }

      const { data } = await query;
      
      if (data) setMessages(data.reverse());
    }
    fetchMessages();

    const channel = supabase.channel('chat-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        if (!supabase || supabase.isDummy) return;
        // Skip if sender is blocked
        if (allRelatedBlockIds.includes(payload.new.user_id)) return;

        // Fetch profile info for the new message
        const { data } = await supabase.from('profiles').select('display_name, avatar_url').eq('id', payload.new.user_id).single();
        const msgWithProfile = { ...payload.new, profiles: data };
        
        // Prevent duplicates
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, msgWithProfile];
        });
      })
      .subscribe();

    return () => {
      if (supabase && !supabase.isDummy) supabase.removeChannel(channel);
    };
  }, [isOpen, isPaid, allRelatedBlockIds]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !isPaid || !supabase) return;

    const msg = newMessage;
    setNewMessage("");
    
    try {
      const { error } = await supabase.from('messages').insert({
        user_id: user.id,
        content: msg
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
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
           className="relative w-full max-w-[420px] bg-cream h-full border-l-4 border-clay shadow-2xl flex flex-col pointer-events-auto"
        >
          <div className="p-6 flex items-center justify-between border-b border-clay/10">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-clay" />
              Tribe Chat
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-clay/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!isPaid && (
              <div className="absolute inset-0 z-20 bg-cream/10 backdrop-blur-[6px] flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-taurus-gold rounded-full flex items-center justify-center mb-6 shadow-glow">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Paid Feature</h3>
                <p className="text-mid-gray text-sm mb-8">
                  The Global Chat is a sacred space for our paid members. Upgrade now to connect with the tribe.
                </p>
                <button 
                  onClick={onUpgradeClick}
                  className="btn-primary w-full max-w-[200px] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade Now
                </button>
              </div>
            )}

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-3", msg.user_id === user?.id ? "flex-row-reverse" : "")}>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-mid-gray/20 flex-shrink-0">
                    <img src={msg.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user_id}`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className={cn("flex flex-col max-w-[80%]", msg.user_id === user?.id ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-mid-gray">{msg.profiles?.display_name || "Unknown"}</span>
                      <span className="text-[9px] text-mid-gray/60">{formatDistanceToNow(new Date(msg.created_at))} ago</span>
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-2xl text-sm shadow-sm relative group/msg",
                      msg.user_id === user?.id ? "bg-taurus-gold text-white rounded-tr-none" : "bg-white text-charcoal rounded-tl-none border border-light-gray"
                    )}>
                      {msg.content}
                      
                      {msg.user_id !== user?.id && (
                        <button 
                          onClick={() => setReportState({ isOpen: true, targetId: msg.user_id, contentId: msg.id })}
                          className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-mid-gray/40 hover:text-clay opacity-0 group-hover/msg:opacity-100 transition-all"
                          title="Report Message"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-white border-t border-light-gray">
              <form onSubmit={handleSend} className="relative">
                <input 
                  disabled={!isPaid}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isPaid ? "Message the tribe..." : "Upgrade to chat"}
                  className="w-full h-12 bg-cream/50 border border-light-gray rounded-full px-6 pr-12 text-sm focus:border-taurus-gold outline-none transition-colors"
                />
                <button 
                  disabled={!isPaid || !newMessage.trim()}
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-taurus-gold text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4" />
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

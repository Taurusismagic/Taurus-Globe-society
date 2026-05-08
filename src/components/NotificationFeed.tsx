import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Settings, 
  Info, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NotificationFeedProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function NotificationFeed({ isOpen, onClose, onOpenSettings }: NotificationFeedProps) {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'task': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'update': return <Info className="w-4 h-4 text-purple-400" />;
      case 'system': return <AlertCircle className="w-4 h-4 text-taurus-gold" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1001] bg-black/20 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed top-20 right-6 z-[1002] w-full max-w-[400px] bg-[#0A0D12]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-5 h-5 text-white/80" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-taurus-gold rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Cosmic Alerts</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">
                    {unreadCount} New Synchronization{unreadCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onOpenSettings}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                  <Bell className="w-12 h-12 mb-4 stroke-[1px]" />
                  <p className="text-sm italic">The void is silent...</p>
                  <p className="text-[10px] uppercase tracking-widest mt-2">No active notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((n) => (
                    <motion.div
                      layout
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "group relative p-4 rounded-xl transition-all duration-300",
                        n.is_read ? "bg-transparent opacity-60 hover:opacity-100" : "bg-white/5 border border-white/5"
                      )}
                    >
                      <div className="flex gap-4">
                        <div className="mt-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "text-sm font-bold tracking-tight mb-1",
                              n.is_read ? "text-white/60" : "text-white"
                            )}>
                              {n.title}
                            </h4>
                            <span className="text-[9px] text-white/30 uppercase tracking-tighter whitespace-nowrap mt-1">
                              {n.created_at ? formatDistanceToNow(n.created_at.toDate(), { addSuffix: true }) : 'Just now'}
                            </span>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                          
                          <div className="mt-3 flex items-center gap-3">
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className={cn(
                                "text-[10px] uppercase font-black tracking-widest transition-colors",
                                n.is_read ? "text-white/20 cursor-default" : "text-taurus-gold hover:text-light-gold"
                              )}
                              disabled={n.is_read}
                            >
                              {n.is_read ? 'Handled' : 'Mark Synchronized'}
                            </button>
                            {n.link && (
                              <a 
                                href={n.link} 
                                className="text-[10px] uppercase font-black tracking-widest text-white/40 hover:text-white flex items-center gap-1"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => deleteNotification(n.id)}
                          className="absolute top-4 right-4 p-1 rounded-md bg-red-500/0 hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-2"
                >
                  <CheckCheck className="w-3 h-3" /> Mark All Read
                </button>
                <div className="h-4 w-px bg-white/10" />
                <p className="text-[10px] font-mono text-white/20 tabular-nums">
                  {notifications.length} Total Alerts
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

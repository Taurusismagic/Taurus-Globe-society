import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationFeed from './NotificationFeed';
import NotificationSettings from './NotificationSettings';

export default function NotificationBell() {
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <div className="relative">
      <button 
        onClick={() => setIsFeedOpen(!isFeedOpen)}
        className="relative p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 group shadow-[0_0_15px_rgba(255,255,255,0.05)]"
      >
        <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-taurus-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-taurus-gold text-[10px] font-black text-charcoal items-center justify-center tabular-nums">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      <NotificationFeed 
        isOpen={isFeedOpen} 
        onClose={() => setIsFeedOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <NotificationSettings 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

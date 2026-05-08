import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Bell, Mail, Smartphone, Settings } from 'lucide-react';
import { useNotifications, NotificationPreferences } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { preferences, updatePreferences } = useNotifications();

  const togglePreference = (key: keyof NotificationPreferences) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  const SettingRow = ({ 
    icon: Icon, 
    label, 
    description, 
    enabled, 
    onToggle 
  }: { 
    icon: any, 
    label: string, 
    description: string, 
    enabled: boolean, 
    onToggle: () => void 
  }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-taurus-gold" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight">{label}</h4>
          <p className="text-[11px] text-white/40">{description}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${enabled ? 'bg-taurus-gold' : 'bg-white/10'}`}
      >
        <motion.div 
          animate={{ x: enabled ? 22 : 2 }}
          className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-lg"
        />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 m-auto z-[1101] w-full max-w-md h-fit max-h-[90vh] bg-[#0A0D12] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-taurus-gold/10 flex items-center justify-center border border-taurus-gold/20">
                  <Shield className="w-6 h-6 text-taurus-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-medium text-light-gold italic">Frequency Controls</h2>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Notification Management</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-full transition-colors duration-300 text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-taurus-gold/60 ml-4 mb-2">Synchronization Tiers</p>
                
                <SettingRow 
                  icon={Bell}
                  label="System Alerts"
                  description="Crucial nexus updates and security pings."
                  enabled={preferences.system_enabled}
                  onToggle={() => togglePreference('system_enabled')}
                />
                
                <SettingRow 
                  icon={Smartphone}
                  label="Mission Tasks"
                  description="Real-time updates on your active goals."
                  enabled={preferences.task_enabled}
                  onToggle={() => togglePreference('task_enabled')}
                />
                
                <SettingRow 
                  icon={Mail}
                  label="Tribe Messages"
                  description="Direct psychic echoes from other members."
                  enabled={preferences.message_enabled}
                  onToggle={() => togglePreference('message_enabled')}
                />
              </div>

              <div className="pt-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-taurus-gold/60 ml-4 mb-2">Out-of-Nexus Echoes</p>
                
                <SettingRow 
                  icon={Mail}
                  label="Email Digest"
                  description="Weekly celestial summary sent to your inbox."
                  enabled={preferences.email_digest}
                  onToggle={() => togglePreference('email_digest')}
                />
              </div>
            </div>

            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-center">
              <Button 
                onClick={onClose}
                className="w-full bg-taurus-gold hover:bg-light-gold text-charcoal font-black uppercase tracking-widest py-6 rounded-xl"
              >
                Confirm Alignments
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

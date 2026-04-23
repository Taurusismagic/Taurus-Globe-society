import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, AlertCircle, CheckCircle2, MessageSquare, User, Trash2, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'all'>('pending');

  const fetchReports = async () => {
    if (!supabase || supabase.isDummy) return;
    setLoading(true);
    
    let query = supabase
      .from('reports')
      .select('*, reporter:reporter_id(display_name), reported:reported_id(display_name)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setReports(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, filter]);

  const handleAction = async (reportId: string, action: 'reviewed' | 'resolved') => {
    if (!supabase || supabase.isDummy) return;
    const { error } = await supabase
      .from('reports')
      .update({ status: action })
      .eq('id', reportId);
    
    if (!error) {
      fetchReports();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-space-bg/95 backdrop-blur-xl p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-cream w-full max-w-5xl h-[80vh] rounded-[32px] border-4 border-taurus-gold shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-taurus-gold/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-taurus-gold rounded-xl flex items-center justify-center text-white shadow-glow">
                <Shield className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-charcoal">Tribe Oversight</h2>
                <p className="text-xs text-mid-gray font-bold uppercase tracking-widest">Admin Control Center</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex bg-white rounded-full p-1 border border-light-gray">
                {(['pending', 'reviewed', 'all'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                      filter === f ? "bg-taurus-gold text-white" : "hover:bg-light-gray text-mid-gray"
                    )}
                  >
                    {f}
                  </button>
                ))}
             </div>
             <button onClick={onClose} className="p-2 hover:bg-taurus-gold/10 rounded-full transition-colors text-mid-gray">
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {loading ? (
            <div className="h-full flex items-center justify-center">
               <Loader2 className="w-8 h-8 animate-spin text-taurus-gold" />
            </div>
          ) : reports.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
               <CheckCircle2 className="w-16 h-16 text-forest-green/20 mb-4" />
               <h3 className="text-xl font-bold">Clear Skies</h3>
               <p className="text-mid-gray">No {filter !== 'all' ? filter : ''} reports found. The tribe is peaceful.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div 
                  key={report.id}
                  className="bg-white border border-light-gray rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden"
                >
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    report.status === 'pending' ? "bg-clay" : "bg-forest-green"
                  )} />

                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className={cn(
                             "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                             report.content_type === 'message' ? "bg-light-gold text-taurus-gold" : "bg-clay/10 text-clay"
                           )}>
                             {report.content_type} Report
                           </span>
                           <span className="text-xs text-mid-gray">{formatDistanceToNow(new Date(report.created_at))} ago</span>
                        </div>
                        <h4 className="font-bold text-lg">{report.reason}</h4>
                      </div>
                      
                      <div className="text-right">
                         <div className="text-[10px] text-mid-gray uppercase font-bold tracking-widest">Reporter</div>
                         <div className="text-sm font-medium">{report.reporter?.display_name || "Unknown"}</div>
                      </div>
                    </div>

                    <div className="bg-cream/50 rounded-xl p-4 text-sm text-charcoal/80 border border-light-gray/50 italic">
                      "{report.description || "No additional description provided."}"
                    </div>

                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-taurus-gold" />
                          <span className="text-xs font-bold text-mid-gray uppercase">Reported: </span>
                          <span className="text-sm font-medium">{report.reported?.display_name || report.reported_id}</span>
                       </div>
                       {report.content_id && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-taurus-gold" />
                            <span className="text-xs font-bold text-mid-gray uppercase">Content ID: </span>
                            <span className="text-xs font-mono">{report.content_id.slice(0, 8)}...</span>
                          </div>
                       )}
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-light-gray pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                    <button 
                      onClick={() => handleAction(report.id, 'reviewed')}
                      disabled={report.status === 'reviewed'}
                      className="flex-1 py-2 px-4 rounded-xl bg-forest-green/10 text-forest-green text-xs font-bold hover:bg-forest-green/20 transition-all disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                    <button 
                      onClick={() => handleAction(report.id, 'resolved')}
                      className="flex-1 py-2 px-4 rounded-xl bg-clay text-white text-xs font-bold hover:shadow-lg transition-all"
                    >
                      Ban User
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

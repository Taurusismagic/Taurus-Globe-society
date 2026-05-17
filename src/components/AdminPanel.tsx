import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, AlertCircle, CheckCircle2, MessageSquare, User, Trash2, Eye, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { handleFirestoreError, OperationType } from "@/lib/errorUtils";
import { useAuth } from "@/context/AuthContext";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [tab, setTab] = useState<'reports' | 'promos'>('reports');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'reports') {
        const reportsRef = collection(db, 'reports');
        let reportsQ = query(reportsRef, orderBy('created_at', 'desc'));
        if (filter !== 'all') {
          reportsQ = query(reportsRef, where('status', '==', filter), orderBy('created_at', 'desc'));
        }
        const reportsSnap = await getDocs(reportsQ);
        setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        const promosRef = collection(db, 'promotion_requests');
        const promosQ = query(promosRef, orderBy('created_at', 'desc'));
        const promosSnap = await getDocs(promosQ).catch(err => {
           return { docs: [] } as any;
        });
        setPromos(promosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, tab);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, filter, tab]);

  const handleAction = async (reportId: string, action: 'reviewed' | 'resolved', reportedId?: string) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      
      if (action === 'resolved' && reportedId) {
        // Atomic batch for resolving report AND banning user
        const batch = writeBatch(db);
        batch.update(reportRef, { status: action });
        batch.update(doc(db, 'profiles', reportedId), { is_banned: true });
        await batch.commit();
      } else {
        await updateDoc(reportRef, { status: action });
      }
      
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const handlePromoAction = async (promoId: string, action: string) => {
    try {
      const promoRef = doc(db, 'promotion_requests', promoId);
      await updateDoc(promoRef, { status: action });
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `promotion_requests/${promoId}`);
    }
  };

  if (!isOpen || !isAdmin) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-space-bg/95 backdrop-blur-xl p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel w-full max-w-5xl h-[80vh] rounded-[32px] border border-taurus-gold/30 shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-taurus-gold/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-taurus-gold rounded-xl flex items-center justify-center text-white shadow-gold">
                <Shield className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-cream">Tribe Oversight</h2>
                <p className="text-xs text-cream/40 font-bold uppercase tracking-widest">Admin Control Center</p>
             </div>
          </div>

          <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 backdrop-blur-md self-start">
              <button
                onClick={() => setTab('reports')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  tab === 'reports' ? "bg-white/10 text-taurus-gold shadow-lg" : "text-cream/30 hover:text-cream"
                )}
              >
                Reports
              </button>
              <button
                onClick={() => setTab('promos')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  tab === 'promos' ? "bg-white/10 text-taurus-gold shadow-lg" : "text-cream/30 hover:text-cream"
                )}
              >
                Promos
              </button>
          </div>
          
          <div className="flex items-center gap-4">
             {tab === 'reports' && (
               <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 backdrop-blur-md">
                  {(['pending', 'reviewed', 'all'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all",
                        filter === f ? "bg-taurus-gold text-white shadow-gold" : "hover:bg-white/10 text-cream/30 hover:text-cream"
                      )}
                    >
                      {f}
                    </button>
                  ))}
               </div>
             )}
             <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-cream/40 hover:text-cream">
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {loading ? (
            <div className="h-full flex items-center justify-center">
               <div className="w-8 h-8 animate-spin rounded-full border-2 border-taurus-gold border-t-transparent" />
            </div>
          ) : tab === 'reports' ? (
            reports.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-16 h-16 text-forest-green/40 mb-4" />
                <h3 className="text-xl font-bold text-cream">Clear Skies</h3>
                <p className="text-cream/40">No {filter !== 'all' ? filter : ''} reports found. Everything is peaceful.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {reports.map((report) => (
                <div 
                  key={report.id}
                  className="glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden"
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
                             report.content_type === 'message' ? "bg-taurus-gold/20 text-taurus-gold" : "bg-clay/20 text-clay"
                           )}>
                             {report.content_type} Report
                           </span>
                           <span className="text-xs text-cream/30">
                             {report.created_at?.toDate ? formatDistanceToNow(report.created_at.toDate()) : "unknown"} ago
                           </span>
                        </div>
                        <h4 className="font-bold text-lg text-cream">{report.reason}</h4>
                      </div>
                      
                      <div className="text-right">
                         <div className="text-[10px] text-cream/30 uppercase font-bold tracking-widest">Reporter</div>
                         <div className="text-sm font-medium text-cream">{report.reporter_name || "Unknown"}</div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 text-sm text-cream/70 border border-white/5 italic">
                      "{report.description || "No additional description provided."}"
                    </div>

                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-taurus-gold" />
                          <span className="text-xs font-bold text-cream/30 uppercase">Reported: </span>
                          <span className="text-sm font-medium text-cream/80">{report.reported_name || report.reported_id}</span>
                       </div>
                       {report.content_id && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-taurus-gold" />
                            <span className="text-xs font-bold text-cream/30 uppercase">Content ID: </span>
                            <span className="text-xs font-mono text-cream/50">{report.content_id.slice(0, 8)}...</span>
                          </div>
                       )}
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                    <button 
                      onClick={() => handleAction(report.id, 'reviewed')}
                      disabled={report.status === 'reviewed'}
                      className="flex-1 py-2 px-4 rounded-xl bg-forest-green/20 text-light-green text-xs font-bold hover:bg-forest-green/30 transition-all disabled:opacity-30"
                    >
                      Dismiss
                    </button>
                    <button 
                      onClick={() => handleAction(report.id, 'resolved', report.reported_id)}
                      className="flex-1 py-2 px-4 rounded-xl bg-clay text-white text-xs font-bold hover:brightness-110 shadow-lg transition-all"
                    >
                      Ban User
                    </button>
                  </div>
                </div>
                ))}
              </div>
            )
          ) : (
            promos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Shield className="w-16 h-16 text-taurus-gold/20 mb-4" />
                <h3 className="text-xl font-bold text-cream">No Promo Requests</h3>
                <p className="text-cream/40">Manifest your first promotion requests from the community.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {promos.map((promo) => (
                  <div 
                    key={promo.id}
                    className="glass-card rounded-2xl p-6 flex items-center justify-between relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-taurus-gold" />
                    <div className="flex-1">
                       <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter bg-taurus-gold/20 text-taurus-gold">
                            X.com Promotion
                          </span>
                          <span className="text-xs text-cream/30">
                             {promo.created_at?.toDate ? formatDistanceToNow(promo.created_at.toDate()) : "unknown"} ago
                          </span>
                       </div>
                       <div className="text-sm font-bold text-cream">User ID: <span className="text-taurus-gold">{promo.user_id}</span></div>
                       <div className="text-[10px] text-cream/40 mt-1 uppercase font-black tracking-widest">Status: {promo.status}</div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handlePromoAction(promo.id, 'completed')}
                        disabled={promo.status === 'completed'}
                        className="py-2 px-4 rounded-xl bg-forest-green/20 text-light-green text-xs font-bold hover:bg-forest-green/30 transition-all disabled:opacity-30"
                       >
                          {promo.status === 'completed' ? 'Processed' : 'Mark Completed'}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}

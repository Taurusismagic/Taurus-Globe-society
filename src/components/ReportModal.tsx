import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertTriangle, Send, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string; // The user ID being reported
  contentType: 'message' | 'profile';
  contentId?: string; // Message ID if applicable
}

const REASONS = [
  "Spam or unwanted content",
  "Hate speech or symbols",
  "Harassment or bullying",
  "Nudity or sexual activity",
  "Violence or dangerous organizations",
  "Selling illegal or regulated goods",
  "Fraud or scams",
  "Inappropriate name or profile"
];

export default function ReportModal({ isOpen, onClose, targetId, contentType, contentId }: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !user) return;

    setLoading(true);
    setError(null);

    try {
      // Get target profile name
      const targetDoc = await getDoc(doc(db, 'profiles', targetId));
      const targetName = targetDoc.exists() ? targetDoc.data().display_name : "Unknown";
      const myName = (user as any).displayName || "Cosmic Member";

      await addDoc(collection(db, 'reports'), {
        reporter_id: user.uid,
        reporter_name: myName,
        reported_id: targetId,
        reported_name: targetName,
        content_type: contentType,
        content_id: contentId || null,
        reason,
        description: description || null,
        status: 'pending',
        created_at: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason("");
        setDescription("");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-overlay/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-modal w-full max-w-md rounded-[32px] border border-white/10 shadow-2xl overflow-hidden relative p-8 backdrop-blur-3xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-cream/40 hover:text-cream transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-clay/10 rounded-2xl flex items-center justify-center text-clay mb-6 rotate-3">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-cream tracking-tight mb-2">Report Content.</h2>
          <p className="text-cream/50 text-sm font-medium">
            Help us keep the community safe.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="report-success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <CheckCircle2 className="w-16 h-16 text-forest-green mb-6" />
              <h3 className="text-2xl font-black text-cream tracking-tight">Report Sent.</h3>
              <p className="text-cream/40 text-sm font-medium">Thank you for your report. Our team will review it shortly.</p>
            </motion.div>
          ) : (
            <motion.form 
              key="report-form"
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black text-taurus-gold uppercase tracking-[0.2em] mb-3 ml-1">Report Reason</label>
                <select
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-cream focus:border-clay outline-none transition-all"
                >
                  <option value="" className="bg-charcoal text-cream">Select a reason...</option>
                  {REASONS.map((r) => (
                    <option key={`report-reason-${r.replace(/\s+/g, '-').toLowerCase()}`} value={r} className="bg-charcoal text-cream">{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-taurus-gold uppercase tracking-[0.2em] mb-3 ml-1">Additional Details (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-cream min-h-[120px] focus:border-clay outline-none transition-all placeholder:text-cream/20"
                  placeholder="Tell us what's wrong..."
                />
              </div>

              {error && <p className="text-clay text-xs font-bold uppercase tracking-wider animate-pulse text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || !reason}
                className="btn-primary w-full flex items-center justify-center gap-3 h-14 mt-4"
                style={{ backgroundColor: 'var(--color-clay)' }}
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 shadow-lg" />
                    Submit Report
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

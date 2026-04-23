import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, AlertTriangle, Send, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
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
    if (!reason || !user || !supabase || supabase.isDummy) return;

    setLoading(true);
    setError(null);

    try {
      const { error: reportError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_id: targetId,
          content_type: contentType,
          content_id: contentId,
          reason,
          description,
          status: 'pending'
        });

      if (reportError) throw reportError;

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
        className="bg-cream w-full max-w-md rounded-[28px] border-2 border-clay shadow-2xl overflow-hidden relative p-8"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-mid-gray hover:text-charcoal transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-clay/10 rounded-full flex items-center justify-center text-clay mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Report Content</h2>
          <p className="text-mid-gray text-sm mt-1">
            Help us keep the Taurus tribe safe and respectful.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <CheckCircle2 className="w-16 h-16 text-forest-green mb-4" />
              <h3 className="text-lg font-bold">Thank You</h3>
              <p className="text-mid-gray text-sm">Your report has been submitted correctly and will be reviewed by our team.</p>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-bold text-mid-gray uppercase tracking-widest mb-2 ml-1">Reason</label>
                <select
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white border border-light-gray rounded-xl p-3 text-sm focus:border-clay outline-none transition-colors"
                >
                  <option value="">Select a reason...</option>
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-mid-gray uppercase tracking-widest mb-2 ml-1">Details (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-light-gray rounded-xl p-4 text-sm min-h-[100px] focus:border-clay outline-none transition-colors"
                  placeholder="Provide more context about this report..."
                />
              </div>

              {error && <p className="text-clay text-xs font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || !reason}
                className="btn-primary w-full flex items-center justify-center gap-3 h-12 mt-6"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
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

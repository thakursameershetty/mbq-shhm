import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2 } from 'lucide-react';

interface LifestyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | number;
  onComplete: () => void;
}

const ACTIVITY_OPTIONS = ['Mostly sitting', 'Mixed activity', 'Physically active'];
const SLEEP_OPTIONS = ['Before 11 PM', '11 PM – 1 AM', 'After 1 AM'];
const LETTERS = ['A', 'B', 'C'];

function OptionList({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      {options.map((opt, idx) => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3
            ${selected === opt
              ? 'border-[#6057D7] bg-indigo-50/50 text-[#1A1A19] shadow-sm'
              : 'border-[#E8E8E5] bg-white hover:border-[#D4D4CE] text-[#5A5A55]'
            }`}
        >
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs font-bold text-white
              ${selected === opt ? 'bg-[#6057D7]' : 'bg-[#8B8B86]'}`}
          >
            {LETTERS[idx]}
          </div>
          <span className="text-sm font-semibold">{opt}</span>
        </button>
      ))}
    </div>
  );
}

export default function LifestyleModal({ isOpen, onClose, userId, onComplete }: LifestyleModalProps) {
  const [dailyActivity, setDailyActivity] = useState('');
  const [sleepTiming, setSleepTiming] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const allAnswered = dailyActivity !== '' && sleepTiming !== '';

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${userId}/lifestyle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyActivity, sleepTiming }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem('userProfile', JSON.stringify(data.user));
        }
        setIsSubmitted(true);
        onComplete();
      } else {
        alert('Failed to save your answers. Please try again.');
      }
    } catch (err) {
      console.error('Lifestyle submit error', err);
      alert('Failed to save your answers.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-[#E8E8E5]"
        >
          {isSubmitted ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F9F9F8]">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A19] mb-3">Saved!</h2>
              <p className="text-[#5A5A55] max-w-sm mx-auto mb-6">
                Your lifestyle details have been added to your profile.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-[#6057D7] hover:bg-[#4F46B8] text-white rounded-full font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-6 border-b border-[#E8E8E5] bg-[#F9F9F8]">
                <div>
                  <h2 className="text-xl font-bold text-[#1A1A19]">Lifestyle Details</h2>
                  <p className="text-sm text-[#8B8B86] mt-1">A couple of quick questions to complete your profile.</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#E8E8E5] rounded-full transition-colors text-[#5A5A55]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white space-y-8">
                <div>
                  <h3 className="text-[#1A1A19] font-bold text-lg mb-4">1. Typical Daily Activity Level</h3>
                  <OptionList options={ACTIVITY_OPTIONS} selected={dailyActivity} onSelect={setDailyActivity} />
                </div>
                <div>
                  <h3 className="text-[#1A1A19] font-bold text-lg mb-4">2. Sleep Timing (Most days)</h3>
                  <OptionList options={SLEEP_OPTIONS} selected={sleepTiming} onSelect={setSleepTiming} />
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-[#E8E8E5] bg-[#F9F9F8] flex justify-between items-center shrink-0">
                <span className="text-sm font-medium text-[#8B8B86]">
                  Answered: <span className="font-bold text-[#1A1A19]">{(dailyActivity ? 1 : 0) + (sleepTiming ? 1 : 0)}</span> of 2
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitting}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm
                    ${allAnswered
                      ? 'bg-[#6057D7] text-white hover:bg-indigo-700 hover:shadow-md'
                      : 'bg-[#E8E8E5] text-[#A0A09D] cursor-not-allowed'
                    }`}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

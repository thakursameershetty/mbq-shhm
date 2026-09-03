import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardCheck } from 'lucide-react';

interface MyAnswersModalProps {
  isOpen: boolean;
  onClose: () => void;
  panelName: string;
  rawAnswers: string[];
}

// rawAnswers entries are stored as "Question: <q> | Answer: <a>" strings
// (see PatientSurveyModal's submit payload) — split back into pairs for display.
const parseAnswer = (entry: string) => {
  const [qPart, aPart] = entry.split('| Answer:');
  return {
    question: (qPart || '').replace('Question:', '').trim(),
    answer: (aPart || '').trim(),
  };
};

export default function MyAnswersModal({ isOpen, onClose, panelName, rawAnswers }: MyAnswersModalProps) {
  if (!isOpen) return null;

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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-[#E8E8E5]"
        >
          <div className="flex items-center justify-between p-6 border-b border-[#E8E8E5] bg-[#F9F9F8]">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A19]">Your Answers — {panelName}</h2>
              <p className="text-sm text-[#8B8B86] mt-1">What you submitted for this panel's phenotypic survey.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#E8E8E5] rounded-full transition-colors text-[#5A5A55]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white">
            {rawAnswers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <ClipboardCheck className="w-8 h-8 text-[#A0A09D] mb-4" />
                <p className="text-[#8B8B86]">No answers found for this panel.</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-xl mx-auto">
                {rawAnswers.map((entry, idx) => {
                  const { question, answer } = parseAnswer(entry);
                  return (
                    <div key={idx} className="bg-[#F9F9F8] rounded-2xl border border-[#E8E8E5] p-5">
                      <p className="text-[#1A1A19] font-semibold text-sm mb-2">{idx + 1}. {question}</p>
                      <p className="text-[#5A5A55] text-sm">{answer || '—'}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

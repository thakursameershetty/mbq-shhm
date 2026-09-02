import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

import img1 from '../assets/illustations/1.png';
import img2 from '../assets/illustations/2.png';
import img3 from '../assets/illustations/3.png';
import img4 from '../assets/illustations/4.png';
import img5 from '../assets/illustations/5.png';
import img6 from '../assets/illustations/6.png';
import img8 from '../assets/illustations/8.png';

const TUTORIAL_IMAGES = [img1, img2, img3, img4, img5, img6, img8];

const TUTORIAL_STEPS = [
  { title: "Before You Begin", desc: ["Do not eat, drink, smoke, or chew gum for at least 30 minutes before collecting the sample.", "Wash your hands thoroughly."] },
  { title: "Step 1: Open the Swab", desc: ["Carefully open the sterile swab packet.", "Hold the swab by the handle. Do not touch the soft cotton tip."] },
  { title: "Step 2: Swab the Left Cheek", desc: ["Place the swab inside your mouth.", "Rub the swab firmly against the inside of your left cheek.", "Continue for 15–20 seconds minimum.", "Avoid touching your tongue."], timer: 20 },
  { title: "Step 3: Swab the Right Cheek", desc: ["Using the same swab, rub the inside of your right cheek.", "Continue for 15–20 seconds minimum.", "Again, avoid touching your tongue."], timer: 20 },
  { title: "Step 4: Place Swab in Collection Tube", desc: ["Open the pre-labeled collection tube containing the solution.", "Immediately place the swab tip into the tube."] },
  { title: "Step 5: Mix the Sample", desc: ["Close the tube if required.", "Gently swirl or rotate the swab in the solution for about 10 seconds."], timer: 10 },
  { title: "Step 6: Seal the Tube", desc: ["Tightly close the collection tube cap.", "Ensure it is securely sealed."] },
  { title: "Step 7: Pack for Return", desc: ["Place the sealed collection tube into the provided zip pouch.", "Seal the pouch.", "Return the sample according to the kit instructions."] },
];

export default function SwabTutorial({ onClose }: { onClose: () => void }) {
  const [tutorialStep, setTutorialStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (timeLeft === null || timeLeft === 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const step = TUTORIAL_STEPS[tutorialStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A19]/40 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-w-lg w-full border border-[#E8E8E5] relative overflow-y-auto max-h-[90vh]"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg md:text-xl font-bold text-[#1A1A19]">Sample Collection Guide</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F7F7F5] text-[#8B8B86] transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="w-56 h-56 md:w-64 md:h-64 mx-auto mb-6 flex items-center justify-center overflow-hidden">
            <img
              src={TUTORIAL_IMAGES[Math.min(tutorialStep, TUTORIAL_IMAGES.length - 1)]}
              alt={`Step ${tutorialStep}`}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="min-h-[140px]">
            <h4 className="font-bold text-lg mb-3 text-[#6057D7]">{step.title}</h4>
            <ul className="space-y-3 mb-6">
              {step.desc.map((descLine, i) => (
                <li key={i} className="text-sm text-[#1A1A19] flex gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3FC2AC] flex-shrink-0" />
                  <span className="leading-relaxed">{descLine}</span>
                </li>
              ))}
            </ul>
          </div>

          {step.timer && (
            <div className="mb-6 flex justify-center h-12">
              {timeLeft === null ? (
                <button onClick={() => setTimeLeft(step.timer!)} className="bg-gradient-to-r from-[#6057D7] to-[#4B44B3] text-white px-8 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
                  Start {step.timer}s Timer
                </button>
              ) : (
                <div className="text-3xl font-extrabold text-[#1A1A19] flex items-center gap-3">
                  {timeLeft > 0 ? <Loader2 className="animate-spin text-[#3FC2AC]" size={28} /> : <CheckCircle2 className="text-[#3FC2AC]" size={28} />}
                  <span className={timeLeft === 0 ? "text-[#3FC2AC]" : ""}>00:{timeLeft.toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>
          )}

          {!step.timer && <div className="h-12 mb-6" />}

          <div className="flex flex-wrap sm:flex-nowrap justify-center sm:justify-between items-center mt-6 pt-6 border-t border-[#E8E8E5] gap-4">
            <button
              disabled={tutorialStep === 0}
              onClick={() => { setTutorialStep(prev => prev - 1); setTimeLeft(null); }}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors w-full sm:w-auto text-center order-2 sm:order-1 ${tutorialStep === 0 ? 'text-transparent cursor-default' : 'text-[#8B8B86] hover:bg-[#F7F7F5] active:scale-95'}`}
            >
              Previous
            </button>

            <div className="flex gap-1.5 order-1 sm:order-2 w-full sm:w-auto justify-center mb-2 sm:mb-0">
              {TUTORIAL_STEPS.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === tutorialStep ? 'bg-[#6057D7]' : 'bg-[#E8E8E5]'}`} />
              ))}
            </div>

            {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
              <button
                onClick={() => { triggerHaptic('light'); setTutorialStep(prev => prev + 1); setTimeLeft(null); }}
                className="px-6 py-2.5 bg-[#F7F7F5] rounded-xl font-semibold text-[#1A1A19] hover:bg-[#E8E8E5] text-sm transition-colors active:scale-95 w-full sm:w-auto order-3"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => { triggerHaptic('medium'); onClose(); }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#6057D7] to-[#3FC2AC] text-white rounded-xl font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all w-full sm:w-auto order-3"
              >
                <CheckCircle2 size={16} />
                Got It
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ScrollText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/lib/utils';
import { theme } from '../theme';
import { GENE_CATALOG } from '@/lib/mbq';

// ── Terms & Conditions Modal ────────────────────────────────────────────────
function TermsModal({
  onAgree,
  onDecline,
}: {
  onAgree: (platformConsent: boolean) => void;
  onDecline: () => void;
}) {
  const [platformConsent, setPlatformConsent] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    // Consider "scrolled enough" when within 100px of bottom
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setHasScrolled(true);
    }
  };

  const canAgree = hasScrolled;

  const sections = [
    {
      num: '1', title: 'Nature of Participation',
      items: [
        'My participation is completely voluntary.',
        'I may withdraw from the program at any time by contacting MyBodyQode.',
        'Participation involves providing personal information, lifestyle-related questionnaire responses, and a saliva sample for genetic testing.',
        'My participation does not establish a doctor-patient relationship with MyBodyQode.',
      ],
    },
    {
      num: '2', title: 'Wellness and Educational Purpose',
      items: [
        'MyBodyQode is not a diagnostic, treatment, or disease-screening service.',
        'Reports are intended for educational, wellness, and lifestyle awareness purposes only.',
        'Results should not be used to diagnose, treat, cure, or prevent any medical condition.',
        'I should consult a qualified healthcare professional regarding any medical concerns.',
      ],
    },
    {
      num: '3', title: 'DNA Sample Collection and Testing',
      intro: 'I voluntarily consent to:',
      items: [
        'Providing a non-invasive buccal (cheek) swab sample for DNA analysis.',
        'Genetic testing by an accredited partner laboratory.',
        'Generation of genotype results for selected lifestyle-related genetic markers.',
        'Secure sharing of those genotype results with MyBodyQode for report generation.',
      ],
      note: 'The laboratory performs the genetic analysis. MyBodyQode interprets the results and generates educational wellness reports.',
    },
    {
      num: '4', title: 'Phenotype Questionnaire Participation',
      intro: 'I voluntarily consent to provide:',
      items: [
        'Lifestyle information.',
        'Habit-related information.',
        'Wellness-related questionnaire responses.',
        'Feedback regarding my experiences and observations.',
      ],
      note: 'These responses may be used together with my genotype information to generate more personalized reports.',
    },
    {
      num: '5', title: 'AI-Assisted Personalization',
      items: [
        'MyBodyQode may use automated systems and AI-assisted analysis.',
        'My genotype data and questionnaire responses may be combined to generate personalized wellness insights.',
        'AI-generated outputs are educational in nature and are not medical advice.',
      ],
    },
    {
      num: '6', title: 'Data Privacy and Security',
      intro: 'MyBodyQode may collect: Name, contact details, demographic information, questionnaire responses, genetic testing results, and platform interaction data.',
      items: [
        'My information will be protected using reasonable security safeguards.',
        'Access is restricted to authorized personnel and approved systems.',
        'MyBodyQode does not sell my personal genetic information.',
      ],
    },
    {
      num: '7', title: 'Data Ownership',
      items: [
        'I remain the owner of my personal and genetic information.',
        'MyBodyQode acts as a custodian of this information for the purpose of delivering services.',
        'I may request access, correction, or deletion of my information subject to applicable legal and operational requirements.',
      ],
    },
    {
      num: '9', title: 'Sample Retention and Disposal',
      items: [
        'My biological sample may be retained temporarily by the partner laboratory for quality assurance purposes.',
        'Samples may be securely destroyed according to laboratory retention policies unless additional consent is provided.',
        'Retention periods may vary according to laboratory requirements and applicable regulations.',
      ],
    },
    {
      num: '10', title: 'Risks and Limitations',
      items: [
        'Genetic information provides tendencies and predispositions, not certainties.',
        'Results may not fully explain my health, fitness, behavior, or lifestyle outcomes.',
        'Environmental, lifestyle, and personal factors also influence outcomes.',
      ],
    },
    {
      num: '11', title: 'Withdrawal',
      items: [
        'Participation is voluntary.',
        'I may request withdrawal from the program.',
        'Certain data already used in aggregated or anonymized analyses may not be removable after processing.',
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-2xl bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* ── Sticky Header ── */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-[#F0F0EE] flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6057D7] to-[#4B44B3] flex items-center justify-center flex-shrink-0">
            <ScrollText size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#1A1A19] leading-tight">Consent & Participation Agreement</h2>
            <p className="text-xs text-[#8B8B86] mt-0.5">MyBodyQode Early Access Program</p>
          </div>
          <button
            onClick={onDecline}
            className="p-2 rounded-full hover:bg-[#F7F7F5] text-[#8B8B86] transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scroll hint pill */}
        {!hasScrolled && (
          <div className="flex justify-center pt-2 flex-shrink-0">
            <span className="text-[11px] text-[#6057D7] bg-[#6057D7]/8 border border-[#6057D7]/20 rounded-full px-3 py-1 font-medium">
              📜 Please scroll down to read the full agreement
            </span>
          </div>
        )}

        {/* ── Scrollable Content ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-5"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Intro */}
          <div className="bg-gradient-to-br from-[#6057D7]/6 to-[#3FC2AC]/6 border border-[#6057D7]/15 rounded-2xl p-4">
            <p className="text-sm text-[#3a3a38] leading-relaxed">
              Thank you for volunteering to participate in the <strong>MyBodyQode (MBQ) Early Access Program</strong>.
              MBQ is a wellness and lifestyle personalization platform that combines genetic information, questionnaire
              responses, and AI-assisted analysis to provide educational insights about certain lifestyle-related traits.
            </p>
            <p className="text-sm text-[#3a3a38] leading-relaxed mt-2 font-medium">
              Please carefully read and acknowledge the following information before participating.
            </p>
          </div>

          {/* Sections */}
          {sections.map((sec) => (
            <div key={sec.num} className="border border-[#EBEBEA] rounded-2xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-7 h-7 rounded-lg bg-[#6057D7]/10 text-[#6057D7] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {sec.num}
                </span>
                <h3 className="text-sm font-bold text-[#1A1A19]">{sec.title}</h3>
              </div>
              {sec.intro && (
                <p className="text-xs text-[#6b6b68] mb-2 leading-relaxed">{sec.intro}</p>
              )}
              <ul className="space-y-1.5">
                {sec.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-[#3a3a38] leading-relaxed">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-[#3FC2AC] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              {sec.note && (
                <p className="text-xs text-[#6b6b68] mt-2 pt-2 border-t border-[#F0F0EE] leading-relaxed italic">{sec.note}</p>
              )}
            </div>
          ))}

          {/* Section 8 — Optional Platform Consent */}
          <div className="border border-[#3FC2AC]/30 bg-[#3FC2AC]/5 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-7 h-7 rounded-lg bg-[#3FC2AC]/20 text-[#138a6a] text-xs font-bold flex items-center justify-center flex-shrink-0">8</span>
              <h3 className="text-sm font-bold text-[#1A1A19]">Optional Platform Improvement Consent</h3>
            </div>
            <p className="text-xs text-[#6b6b68] leading-relaxed mb-3">
              MyBodyQode continuously improves its reports and algorithms. You may choose whether anonymized and
              de-identified information can be used for platform improvement, algorithm enhancement, user experience
              optimization, and internal scientific evaluation. <strong>This consent is optional and does not affect your participation.</strong>
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => { setPlatformConsent(!platformConsent); triggerHaptic('light'); }}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${platformConsent ? 'bg-[#3FC2AC] border-[#3FC2AC]' : 'border-[#D0D0CE] group-hover:border-[#3FC2AC]'}`}
                >
                  {platformConsent && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs text-[#3a3a38] leading-relaxed">I consent to the use of anonymized data for platform improvement.</span>
              </label>
            </div>
          </div>

          {/* Participant Declaration */}
          <div className="bg-[#1A1A19] rounded-2xl p-4 space-y-2">
            <h3 className="text-sm font-bold text-white">Participant Declaration</h3>
            <p className="text-xs text-white/70 leading-relaxed">By selecting "I Agree" below, I confirm that:</p>
            <ul className="space-y-1.5">
              {[
                'I am at least 18 years of age.',
                'I have read and understood this consent document.',
                'I voluntarily agree to participate in the MyBodyQode Early Access Program.',
                'I consent to genetic testing, questionnaire participation, and AI-assisted report generation as described above.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-white/80 leading-relaxed">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[#3FC2AC] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom spacer so content clears the sticky footer */}
          <div className="h-2" />
        </div>

        {/* ── Sticky Footer ── */}
        <div className="px-6 py-4 border-t border-[#F0F0EE] flex-shrink-0 space-y-2.5">
          {!canAgree && (
            <p className="text-center text-[11px] text-[#8B8B86]">
              Scroll to the bottom to enable the agreement buttons.
            </p>
          )}
          <motion.button
            whileHover={canAgree ? { scale: 1.01 } : {}}
            whileTap={canAgree ? { scale: 0.99 } : {}}
            onClick={() => {
              if (canAgree) {
                triggerHaptic('medium');
                onAgree(platformConsent);
              }
            }}
            disabled={!canAgree}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${canAgree
              ? 'bg-gradient-to-r from-[#6057D7] to-[#3FC2AC] text-white shadow-md hover:shadow-lg'
              : 'bg-[#F0F0EE] text-[#B0B0AE] cursor-not-allowed'
              }`}
          >
            ✓ I Agree and Wish to Participate
          </motion.button>
          <button
            onClick={onDecline}
            className="w-full py-3 rounded-xl text-sm font-medium text-[#8B8B86] hover:bg-[#F7F7F5] transition-colors"
          >
            I Do Not Agree
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    if (localStorage.getItem('userProfile')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showGeneSelection, setShowGeneSelection] = useState(false);
  const [pendingConsent, setPendingConsent] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [showPendingScreen, setShowPendingScreen] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [allowDuplicateEmail, setAllowDuplicateEmail] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  // State to hold the form data
  const [formData, setFormData] = useState({
    username: '', fullName: '', email: '', otp: '', countryCode: '+91', phone: '', age: '', gender: ''
  });

  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);

  // Countdown timer logic for OTP resend
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Auto-verify OTP
  useEffect(() => {
    if (formData.otp.length === 6 && !isEmailVerified && !verifyingOtp) {
      const verifyOtp = async () => {
        setVerifyingOtp(true);
        try {
          const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, otp: formData.otp })
          });
          const data = await response.json();
          if (data.success) {
            setIsEmailVerified(true);
            setToastMessage({ type: 'success', text: 'Email verified successfully!' });
          } else {
            setToastMessage({ type: 'error', text: data.error || 'Invalid OTP' });
          }
        } catch (error) {
          console.error(error);
          setToastMessage({ type: 'error', text: 'Failed to verify OTP' });
        } finally {
          setVerifyingOtp(false);
        }
      };
      verifyOtp();
    }
  }, [formData.otp, formData.email, isEmailVerified, verifyingOtp]);

  // Toast auto-dismiss timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Debounced check for username existence
  useEffect(() => {
    const checkUsername = async () => {
      const username = formData.username.trim();
      const hasInvalidChars = /[^a-zA-Z0-9._]/.test(username);
      if (!username || hasInvalidChars || username.length < 5) {
        setUsernameExists(false);
        setCheckingUsername(false);
        return;
      }

      try {
        setCheckingUsername(true);
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          setUsernameExists(data.exists);
        }
      } catch (err) {
        console.error("Error checking username:", err);
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData?.username]);

  // Check Email existence
  useEffect(() => {
    const checkEmail = async () => {
      const e = formData.email.trim();
      if (!e || !e.includes('@')) {
        setEmailExists(null);
        setCheckingEmail(false);
        setAllowDuplicateEmail(false);
        return;
      }
      setCheckingEmail(true);
      try {
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(e)}`);
        const data = await response.json();
        setEmailExists(data.exists);
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingEmail(false);
      }
    };
    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
  }, [formData.email]);


  const toggleGene = (label: string) => {
    triggerHaptic('light');
    setSelectedGenes((prev) => prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (e.target.name === 'fullName') {
      val = val.toUpperCase();
    }
    setFormData({ ...formData, [e.target.name]: val });
  };

  const validateAge = (data = formData) => {
    const { age } = data;
    if (!age) return "Age is required.";
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) return "Please enter a valid age.";
    return null;
  };

  const ageError = validateAge();

  const getEmailSuggestion = () => {
    const email = formData.email.trim();
    if (!email.includes('@')) return null;
    const parts = email.split('@');
    if (parts.length !== 2) return null;
    const [localPart, domainPart] = parts;
    if (!domainPart) return null;

    let suggestedDomain = domainPart;
    const lowerDomain = domainPart.toLowerCase();

    const replacements: Record<string, string> = {
      'gnail.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gmail.con': 'gmail.com',
      'gmail.co': 'gmail.com',
      'yahoo.con': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'hotmail.con': 'hotmail.com',
      'advaitlabs.con': 'advaitlabs.com',
      'syntags.com': 'syntags.co',
      'reaidy.com': 'reaidy.io',
      'reaidy.co': 'reaidy.io',
      'elp-in.con': 'elp-in.com',
      'spotmies.com': 'spotmies.ai',
      'spotmies.co': 'spotmies.ai',
    };

    if (replacements[lowerDomain]) {
      suggestedDomain = replacements[lowerDomain];
    } else if (lowerDomain.endsWith('.con')) {
      suggestedDomain = lowerDomain.replace(/\.con$/, '.com');
    }

    if (suggestedDomain !== domainPart) {
      return `${localPart}@${suggestedDomain}`;
    }
    return null;
  };

  const emailSuggestion = getEmailSuggestion();
  const missingAtSymbol = emailTouched && formData.email.length > 0 && !formData.email.includes('@');

  const isFormPerfectlyFilled =
    formData.username.trim().length >= 5 && !/[^a-zA-Z0-9._]/.test(formData.username) && !usernameExists && !checkingUsername &&
    formData.fullName.trim().length > 0 &&
    formData.email.trim().length > 0 && formData.email.includes('@') && !missingAtSymbol && !emailSuggestion &&
    (emailExists === false || allowDuplicateEmail) && !checkingEmail &&
    formData.phone.trim().length > 4 &&
    !ageError &&
    formData.gender !== '' &&
    formData.otp.trim().length === 6;

  const handleSendOtp = async () => {
    triggerHaptic('medium');
    if (!formData.email || !formData.email.includes('@')) {
      setToastMessage({ type: 'error', text: 'Please enter a valid email first.' });
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone
        })
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        setOtpTimer(30);
        setToastMessage({ type: 'success', text: 'OTP sent! Please check your email.' });
      } else {
        setToastMessage({ type: 'error', text: data.error || 'Failed to send OTP' });
      }
    } catch (error) {
      console.error(error);
      setToastMessage({ type: 'error', text: 'Failed to connect to the server.' });
    } finally {
      setSendingOtp(false);
    }
  };

  // Called when the form's submit button is clicked — shows T&C first
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');

    let updatedFormData = { ...formData };

    if (updatedFormData.username.trim().length < 5) {
      setToastMessage({ type: 'error', text: 'Username must be at least 5 characters long.' });
      return;
    }
    if (/[^a-zA-Z0-9._]/.test(updatedFormData.username)) {
      setToastMessage({ type: 'error', text: 'Username can only contain letters, numbers, dots, and underscores.' });
      return;
    }
    if (usernameExists) {
      setToastMessage({ type: 'error', text: 'This username is already taken.' });
      return;
    }
    if (missingAtSymbol) {
      setToastMessage({ type: 'error', text: "Email address must include an '@' symbol." });
      return;
    }

    const currentAgeError = validateAge(updatedFormData);
    if (currentAgeError) {
      setToastMessage({ type: 'error', text: currentAgeError });
      return;
    }
    setShowTerms(true);
  };

  // Called after user agrees to T&C — this is where the actual backend call happens
  const handleSubmit = async (_platformConsent: boolean) => {
    setShowTerms(false);
    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        phone: `${formData.countryCode} ${formData.phone}`,
        age: parseInt(formData.age, 10),
        dob: null,
        gender: formData.gender,
        geneType: selectedGenes.filter(Boolean).join(', '),
        otp: formData.otp
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 429) {
        setToastMessage({ type: 'error', text: data.message });
        setLoading(false);
        return;
      }

      if (response.status === 409) {
        setToastMessage({ type: 'error', text: data.message || 'User already exists. Please login.' });
        setLoading(false);
        setShowPendingScreen(true);
        return;
      }

      if (data.success) {
        setToastMessage({ type: 'success', text: 'Profile mapped and data linked successfully!' });
        setLoading(false);
        setShowPendingScreen(true);
      } else {
        setToastMessage({ type: 'error', text: data.error || data.message || 'Registration failed' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Network Error', error);
      setToastMessage({ type: 'error', text: 'Could not connect to the server.' });
      setLoading(false);
    }
  };

  const renderToast = () => (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -40, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -40, x: '-50%' }}
          className={`fixed top-6 left-1/2 px-4 py-2.5 rounded-full shadow-xl text-sm font-semibold z-[9999] flex items-center gap-2 whitespace-nowrap border pr-2 ${toastMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}
        >
          {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className={`p-1.5 rounded-full transition-colors ml-1 ${toastMessage.type === 'error' ? 'hover:bg-red-100 text-red-600' : 'hover:bg-green-100 text-green-600'}`}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );



  // ── Sample Pending screen ───────────────────────────────────────────────────
  if (showPendingScreen) {
    return (
      <>
        {renderToast()}
        <AnimatePresence mode="wait">
          <motion.div
            key="pending-prompt"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-lg mx-auto mt-8 sm:mt-12 px-4"
          >
            <div className={theme.card}>
              <div className="flex justify-center mb-6">
                <div className="relative flex items-center justify-center w-16 h-16">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-[#3FC2AC]/20 animate-ping" />
                  <span className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#6057D7] to-[#3FC2AC]">
                    <CheckCircle2 size={20} className="text-white" strokeWidth={2} />
                  </span>
                </div>
              </div>

              <h2 className={theme.heading}>Awaiting Admin Approval</h2>
              <p className="text-sm text-[#8B8B86] text-center mb-6 leading-relaxed">
                Your registration and payment are being verified by our team. We'll notify you once your request is <strong className="text-[#1A1A19]">approved</strong> and a volunteer is assigned for sample collection.
              </p>

              <div className="bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-4 mb-8 text-center shadow-inner">
                <p className="text-sm text-[#5A5A55]">
                  You will receive an email at <strong className="text-[#1A1A19]">{formData.email}</strong> once your request is reviewed. <br /><br />
                  <span className="text-[#6057D7] font-semibold">Please check your spam email folder!</span>
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className={`${theme.buttonPrimary} flex items-center justify-center gap-2`}
              >
                Go to Login
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </>
    );
  }

  // ── Normal registration form ────────────────────────────────────────────────
  return (
    <>
      {renderToast()}

      {/* Full Page Loading Overlay — shown while the registration request is submitted */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#F7F7F5]/90 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full border border-[#E8E8E5] flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="animate-spin text-[#6057D7] mb-4" size={48} />
              <h3 className="text-xl font-bold text-[#1A1A19]">Submitting your registration...</h3>
              <p className="text-sm text-[#8B8B86] mt-2 text-center">This will only take a moment.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms & Conditions Modal — rendered at root level so it overlays everything */}
      <AnimatePresence>
        {showTerms && (
          <TermsModal
            onAgree={(platformConsent) => {
              setShowTerms(false);
              setPendingConsent(platformConsent);
              setShowGeneSelection(true);
            }}
            onDecline={() => setShowTerms(false)}
          />
        )}
      </AnimatePresence>

      {/* Gene Selection — shown after Terms are accepted, before submitting for admin approval */}
      <AnimatePresence>
        {showGeneSelection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4"
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
            >
              <h2 className={theme.heading}>Select Your Tests</h2>
              <p className={theme.subheading}>Choose the test(s) your DNA sample will be analyzed for. You can select as many as you like.</p>

              <div className="text-left space-y-5 mb-2">
                {GENE_CATALOG.map((category) => (
                  <div key={category.name}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#8B8B86] mb-2 pl-1">{category.name}</h3>
                    <div className="flex flex-col gap-2">
                      {category.options.map((opt, optIdx) => {
                        const checked = selectedGenes.includes(opt.label);
                        return (
                          <label
                            key={opt.label}
                            onClick={(e) => { e.preventDefault(); toggleGene(opt.label); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${checked
                              ? 'border-[#6057D7] bg-[#6057D7]/8 ring-4 ring-[#6057D7]/10'
                              : 'border-[#E8E8E5] bg-white/50 hover:border-[#D0D0CE]'
                              }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${checked ? 'bg-[#6057D7] border-[#6057D7]' : 'border-[#D0D0CE]'
                                }`}
                            >
                              {checked && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="text-sm text-[#1A1A19] flex-1">{opt.label}</span>
                            {opt.tier === 'pro' ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#6057D7] bg-[#6057D7]/10 px-2 py-0.5 rounded-full shrink-0">
                                Pro
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8B8B86] bg-[#8B8B86]/10 px-2 py-0.5 rounded-full shrink-0">
                                Lite {optIdx + 1}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={selectedGenes.length > 0 ? { scale: 1.02 } : {}}
                whileTap={selectedGenes.length > 0 ? { scale: 0.98 } : {}}
                disabled={selectedGenes.length === 0}
                onClick={() => {
                  setShowGeneSelection(false);
                  handleSubmit(pendingConsent);
                }}
                className={`w-full font-medium tracking-wide rounded-xl px-4 py-4 mt-2 transition-all duration-300 ${selectedGenes.length > 0
                  ? 'bg-gradient-to-r from-[#6057D7] to-[#3FC2AC] hover:opacity-90 text-white shadow-[0_4px_20px_rgb(96,87,215,0.25)] active:scale-[0.98]'
                  : 'bg-[#F0F0ED] text-[#8B8B86] cursor-not-allowed'
                  }`}
              >
                Continue
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg mx-auto mt-8 sm:mt-12 px-4 pb-24 sm:pb-36"
      >
        <div className={theme.card}>
          <h2 className={theme.heading}>Create Profile</h2>
          <p className={theme.subheading}>Link your phenotype data with your lab results.</p>
          <p className="text-xs text-[#8B8B86] mb-6 font-medium">* Every field is required</p>

          <form onSubmit={handleFormSubmit}>
            <div className="relative mb-4">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Unique Username"
                className={`${theme.input} !mb-0 ${/[^a-zA-Z0-9._]/.test(formData.username) || usernameExists || (formData.username.length > 0 && formData.username.length < 5) ? '!border-orange-300 focus:!ring-orange-500/10 focus:!border-orange-400' : ''}`}
                required
              />
              {checkingUsername && !/[^a-zA-Z0-9._]/.test(formData.username) && formData.username.length >= 5 && (
                <div className="absolute right-4 top-[18px]"><Loader2 className="animate-spin text-[#8B8B86]" size={16} /></div>
              )}
              <AnimatePresence>
                {/[^a-zA-Z0-9._]/.test(formData.username) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-sm text-orange-600 bg-orange-50/80 px-3 py-2.5 rounded-xl border border-orange-200 mt-2 flex flex-col gap-1.5 shadow-sm">
                      <span className="flex items-center gap-1.5 font-semibold"><AlertCircle size={14} strokeWidth={2.5} /> Only letters, numbers, dots ".", and underscores allowed "_".</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, username: formData.username.replace(/[^a-zA-Z0-9._]/g, '') })}
                        className="text-left text-xs text-orange-800 hover:text-orange-900 bg-orange-100/50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg font-bold transition-colors w-max"
                      >
                        Suggestion: {formData.username.replace(/[^a-zA-Z0-9._]/g, '')}
                      </button>
                    </div>
                  </motion.div>
                )}
                {usernameExists && !/[^a-zA-Z0-9._]/.test(formData.username) && formData.username.length >= 5 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-sm text-red-600 bg-red-50/80 px-3 py-2.5 rounded-xl border border-red-200 mt-2 flex flex-col gap-1.5 shadow-sm">
                      <span className="flex items-center gap-1.5 font-semibold"><AlertCircle size={14} strokeWidth={2.5} /> This username is already taken.</span>
                    </div>
                  </motion.div>
                )}
                {formData.username.length > 0 && formData.username.length < 5 && !/[^a-zA-Z0-9._]/.test(formData.username) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-sm text-orange-600 bg-orange-50/80 px-3 py-2.5 rounded-xl border border-orange-200 mt-2 flex flex-col gap-1.5 shadow-sm">
                      <span className="flex items-center gap-1.5 font-semibold"><AlertCircle size={14} strokeWidth={2.5} /> Username must be at least 5 characters.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Legal Name" className={`${theme.input} uppercase`} required />
            <div className="relative mb-4">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => setEmailTouched(true)}
                placeholder="Email Address"
                disabled={isEmailVerified}
                className={`${theme.input} !mb-0 ${missingAtSymbol || emailSuggestion ? '!border-orange-300 focus:!ring-orange-500/10 focus:!border-orange-400' : ''} ${isEmailVerified ? 'bg-[#F7F7F5]/50 cursor-not-allowed opacity-80' : ''}`}
                required
              />
              {isEmailVerified && (
                <div className="absolute right-4 top-[18px]"><CheckCircle2 className="text-green-500" size={16} /></div>
              )}
              <AnimatePresence>
                {missingAtSymbol && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-sm text-red-600 bg-red-50/80 px-3 py-2.5 rounded-xl border border-red-200 mt-2 flex flex-col gap-1.5 shadow-sm">
                      <span className="flex items-center gap-1.5 font-semibold"><AlertCircle size={14} strokeWidth={2.5} /> Email address must include an '@' symbol.</span>
                    </div>
                  </motion.div>
                )}
                {emailSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-sm text-orange-600 bg-orange-50/80 px-3 py-2.5 rounded-xl border border-orange-200 mt-2 flex flex-col gap-1.5 shadow-sm">
                      <span className="flex items-center gap-1.5 font-semibold"><AlertCircle size={14} strokeWidth={2.5} /> Double check your email.</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, email: emailSuggestion })}
                        className="text-left text-xs text-orange-800 hover:text-orange-900 bg-orange-100/50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg font-bold transition-colors w-max"
                      >
                        Did you mean: {emailSuggestion}?
                      </button>
                    </div>
                  </motion.div>
                )}
                {emailExists && !allowDuplicateEmail && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-sm text-[#1A1A19] bg-[#EBE9FC] px-4 py-3 rounded-xl border border-[#6057D7]/30 mt-2 flex flex-col gap-2.5 shadow-sm">
                      <span className="flex items-center gap-2 font-semibold">
                        <AlertCircle size={16} className="text-[#6057D7]" /> This email is already registered.
                      </span>
                      <p className="text-xs text-[#5A5A55] leading-relaxed">
                        You can login to your existing account, or create an additional profile under this email.
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Link to="/login" className="flex-1 text-center py-2 bg-white rounded-lg border border-[#D0D0CE] text-sm font-semibold text-[#1A1A19] hover:bg-[#F7F7F5] transition-colors shadow-sm">
                          Go to Login
                        </Link>
                        <button
                          type="button"
                          onClick={() => setAllowDuplicateEmail(true)}
                          className="flex-1 text-center py-2 bg-gradient-to-r from-[#6057D7] to-[#4B44B3] rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                        >
                          Create New Profile
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!isEmailVerified && formData.email.length > 0 && !missingAtSymbol && !emailSuggestion && (emailExists === false || allowDuplicateEmail) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="flex flex-col gap-3 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || otpTimer > 0}
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${sendingOtp || otpTimer > 0
                        ? 'bg-[#F0F0ED] text-[#B0B0AE] cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg active:scale-95'
                        }`}
                    >
                      {sendingOtp ? <Loader2 className="animate-spin" size={18} /> : (otpSent ? (otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend OTP') : 'Send OTP')}
                    </button>

                    <AnimatePresence>
                      {otpSent && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative"
                        >
                          <input
                            type="text"
                            name="otp"
                            value={formData.otp}
                            onChange={handleChange}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className={`${theme.input} !mb-0 text-center tracking-[0.2em] font-mono`}
                            required
                          />
                          {verifyingOtp ? (
                            <div className="absolute right-4 top-[18px]"><Loader2 className="animate-spin text-[#8B8B86]" size={16} /></div>
                          ) : formData.otp.length === 6 && !isEmailVerified && (
                            <div className="absolute right-4 top-[18px]"><CheckCircle2 className="text-[#8B8B86]" size={16} /></div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mb-4">
              {/* Unified Country Code & Phone Input */}
              <div className="relative">
                <div className={`flex w-full bg-white/50 text-[#2C2C2A] rounded-xl border border-[#E8E8E5] focus-within:ring-4 focus-within:ring-[#6057D7]/10 focus-within:bg-white focus-within:border-[#6057D7]/30 transition-all duration-300`}>
                  <div className="relative w-[110px] flex-shrink-0 border-r border-[#E8E8E5]">
                    <select name="countryCode" onChange={handleChange} className="w-full h-full appearance-none cursor-pointer pl-4 pr-8 py-3.5 outline-none bg-transparent hover:bg-black/5 transition-colors font-medium text-sm rounded-l-xl" required defaultValue="+91">
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+7">🇷🇺 +7</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+974">🇶🇦 +974</option>
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+20">🇪🇬 +20</option>
                      <option value="+998">🇺🇿 +998</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8B8B86]">
                      <ChevronDown size={14} strokeWidth={2.5} />
                    </div>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, '');
                      handleChange(e);
                    }}
                    maxLength={formData.countryCode === '+91' ? 10 : 15}
                    placeholder="Phone Number"
                    className="w-full bg-transparent px-4 py-3.5 outline-none placeholder-[#A0A09D]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Age */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#8B8B86] mb-2 pl-1 text-left">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter Age"
                min="0"
                max="120"
                className={`${theme.input} w-full !mb-0`}
                required
              />
              <AnimatePresence>
                {ageError && formData.age !== '' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-sm text-orange-600 bg-orange-50/80 px-3 py-2.5 rounded-xl border border-orange-200 mt-2 flex flex-col gap-1.5 shadow-sm">
                      <span className="flex items-center gap-1.5 font-semibold"><AlertCircle size={14} strokeWidth={2.5} /> {ageError}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mb-4 text-left">
              <label className="block text-sm font-medium text-[#8B8B86] mb-1.5 pl-1">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Other'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center justify-center gap-2 py-3.5 rounded-xl border cursor-pointer transition-all duration-200 text-sm font-medium ${formData.gender === option
                      ? 'border-[#6057D7] bg-[#6057D7]/8 text-[#1A1A19] ring-4 ring-[#6057D7]/10'
                      : 'border-[#E8E8E5] bg-white/50 text-[#5A5A55] hover:border-[#D0D0CE]'
                      }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={formData.gender === option}
                      onChange={handleChange}
                      className="sr-only"
                      required
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={isFormPerfectlyFilled ? { scale: 1.02 } : {}}
              whileTap={isFormPerfectlyFilled ? { scale: 0.98 } : {}}
              type="submit" disabled={loading}
              className={`w-full font-medium tracking-wide rounded-xl px-4 py-4 mt-4 transition-all duration-300 ${isFormPerfectlyFilled
                ? 'bg-gradient-to-r from-[#6057D7] to-[#3FC2AC] hover:opacity-90 text-white shadow-[0_4px_20px_rgb(96,87,215,0.25)] active:scale-[0.98]'
                : 'bg-[#F0F0ED] text-[#8B8B86] hover:bg-[#E8E8E5]'
                }`}
            >
              {loading ? 'Mapping Profile...' : 'Review & Agree to Terms'}
            </motion.button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link to="/login" className={theme.buttonSecondary}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </motion.div>
    </>
  );
}

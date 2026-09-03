import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Activity, LogOut, AlertCircle, Sparkles, Users, ArrowLeft, ClipboardList } from 'lucide-react';
import { OrderTracking } from '@/components/ui/order-tracking';
import { useNavigate, Link } from 'react-router-dom';
import { triggerHaptic } from '@/lib/utils';
import { formatUserId, getGeneColor, getRequiredGenes } from '@/lib/mbq';
import PatientSurveyModal from '@/components/PatientSurveyModal';
import MyAnswersModal from '@/components/MyAnswersModal';
import LifestyleModal from '@/components/LifestyleModal';
import AIReportModal from '@/components/AIReportModal';
import ReportViewerModal from '@/components/ReportViewerModal';
import FloatingChatbot from '@/components/FloatingChatbot';
import SwabTutorial from '@/components/SwabTutorial';

// Timestamps without an explicit UTC/offset marker (e.g. Python's `datetime.utcnow().isoformat()`)
// get parsed as local time by the JS Date constructor. Since these are always produced in UTC
// on the backend, force that interpretation so IST conversion is correct for every viewer.
const normalizeTimestamp = (dateInput?: string | number | Date | null) => {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(dateInput)) {
    return `${dateInput}Z`;
  }
  return dateInput;
};

const formatIST = (dateInput?: string | number | Date | null, fallback: string = 'Pending') => {
  if (!dateInput) return fallback;
  const date = new Date(normalizeTimestamp(dateInput) as string | number | Date);
  if (isNaN(date.getTime())) return fallback;
  const formatted = date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(',', '');
  return `${formatted} IST`;
};

// Prefer the AI report's own merge timestamp (set per-report when the Python backend
// generates it) over the shared status_timestamps.generated, which only reflects the
// most recent report and is identical across all of a user's reports.
const getReportGeneratedAt = (reportData: any, fallback?: string | null) =>
  reportData?.generated_at || reportData?.ai_report?._meta?.merged_at || fallback || null;

export default function PatientDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [showLifestyleModal, setShowLifestyleModal] = useState(false);
  const [selectedAIReport, setSelectedAIReport] = useState<{ geneName: string, content: string } | null>(null);
  const [viewReportData, setViewReportData] = useState<{ testName: string; reportData: any; variants: any; mbqId?: string; generatedAt?: string | null; gender?: string | null } | null>(null);
  const [fetchDataStatus, setFetchDataStatus] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  const [hasMultipleProfiles, setHasMultipleProfiles] = useState(false);
  const [showSwabTutorial, setShowSwabTutorial] = useState(false);

  // Switch Accounts state
  const [showSwitchAccountsModal, setShowSwitchAccountsModal] = useState(false);
  const [switchAccountsProfiles, setSwitchAccountsProfiles] = useState<any[]>([]);
  const [switchingAccountsLoading, setSwitchingAccountsLoading] = useState(false);
  const [surveyTestName, setSurveyTestName] = useState<string>('');
  const [viewAnswersPanel, setViewAnswersPanel] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('userProfile');
    if (data) {
      const parsed = JSON.parse(data);
      setUser(parsed);

      if (parsed.email) {
        fetch(`/api/users/by-email/${encodeURIComponent(parsed.email)}`)
          .then(res => res.json())
          .then(profiles => {
            if (Array.isArray(profiles) && profiles.length > 1) {
              setHasMultipleProfiles(true);
            }
          })
          .catch(err => console.error("Error fetching profiles count:", err));
      }

      // Fetch latest profile to keep tracking updated
      const fetchLatestProfile = () => {
        fetch(`/api/users/${parsed.id}`)
          .then(res => res.json())
          .then(latestData => {
            if (!latestData.error) {
              setUser(latestData);
              localStorage.setItem('userProfile', JSON.stringify(latestData));
            } else if (latestData.error === 'User not found.') {
              localStorage.removeItem('userProfile');
              setUser(null);
              navigate('/login');
            }
          })
          .catch(err => console.error("Error fetching latest profile:", err));
      };

      fetchLatestProfile();
      const interval = setInterval(fetchLatestProfile, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/users/${user.id}`);
      const data = await res.json();
      if (!data.error) {
        setUser(data);
        localStorage.setItem('userProfile', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const handleSwitchAccounts = async () => {
    if (!user?.email) return;
    setSwitchingAccountsLoading(true);
    try {
      const response = await fetch(`/api/users/by-email/${encodeURIComponent(user.email)}`);
      const data = await response.json();
      if (response.ok && Array.isArray(data) && data.length > 1) {
        setSwitchAccountsProfiles(data);
        setShowSwitchAccountsModal(true);
      } else {
        setFetchDataStatus({ type: 'warning', message: 'No other profiles found for this email.' });
        setTimeout(() => setFetchDataStatus(null), 4000);
      }
    } catch (err) {
      console.error('Error fetching profiles', err);
      setFetchDataStatus({ type: 'error', message: 'Failed to fetch profiles.' });
      setTimeout(() => setFetchDataStatus(null), 4000);
    } finally {
      setSwitchingAccountsLoading(false);
    }
  };

  const renderField = (label: string, path: string[], block = false) => {
    const getVal = (obj: any, p: string[]) => p.reduce((acc, k) => (acc ? acc[k] : ''), obj);
    let val = getVal(user, path);

    if (typeof val === 'object' && val !== null) {
      const values = Object.values(val).filter(Boolean);
      if (label === 'Age' && values.length >= 2) {
        val = `${values[0]}yrs (${values[1]})`;
      } else {
        val = values.join(' - ');
      }
    }

    if (block) {
      return (
        <div className="text-sm">
          <span className="text-[#8B8B86] block mb-0.5">{label}</span>
          <span className="font-medium text-[#1A1A19]">{val || 'N/A'}</span>
        </div>
      );
    }

    return (
      <div className="text-sm flex flex-row items-start sm:items-center justify-between sm:justify-start gap-4">
        <span className="text-[#8B8B86] w-auto sm:w-20 flex-shrink-0 pt-0.5 sm:pt-0">{label}:</span>
        <span className="font-medium text-[#1A1A19] text-right sm:text-left break-all sm:break-normal">{val || 'N/A'}</span>
      </div>
    );
  };

  // Same rendering as renderField, but for values collected directly on the
  // user record (age/phone/email) rather than nested under phenotypic_analysis.
  const renderRawField = (label: string, val: any) => (
    <div className="text-sm flex flex-row items-start sm:items-center justify-between sm:justify-start gap-4">
      <span className="text-[#8B8B86] w-auto sm:w-20 flex-shrink-0 pt-0.5 sm:pt-0">{label}:</span>
      <span className="font-medium text-[#1A1A19] text-right sm:text-left break-all sm:break-normal">{val || 'N/A'}</span>
    </div>
  );

  const getGenePills = (geneString: string) => {
    if (!geneString) return null;
    const genes = geneString.split(', ');
    return (
      <div className="flex flex-col gap-2">
        {genes.map((gene, idx) => (
          <div key={idx} className={`px-4 py-1.5 rounded-full border font-medium text-sm tracking-wide w-fit shadow-sm ${getGeneColor(gene)}`}>
            {gene}
          </div>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="w-full flex justify-center mt-20">
        <p className="text-[#8B8B86]">Please <Link to="/login" className="text-[#6057D7] hover:underline">log in</Link> to view your dashboard.</p>
      </div>
    );
  }

  // Oldest report generated first, so the tracking pipeline and button lists read
  // chronologically rather than in whatever order the keys happen to sit in the JSON.
  const sortedReportEntries: [string, any][] = user.reports
    ? Object.entries(user.reports).sort(([, a]: [string, any], [, b]: [string, any]) => {
      const timeA = new Date(normalizeTimestamp(getReportGeneratedAt(a, user.status_timestamps?.generated)) as any).getTime();
      const timeB = new Date(normalizeTimestamp(getReportGeneratedAt(b, user.status_timestamps?.generated)) as any).getTime();
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    })
    : [];

  const dashboardActions = user ? (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-6">
      <button
        onClick={() => setShowTracking(true)}
        className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#6057D7] text-white rounded-full text-xs sm:text-sm font-medium hover:bg-[#4B44B3] transition-colors shadow-sm cursor-pointer"
      >
        <Activity size={16} />
        Track Updates
      </button>
      {user.reports && Object.keys(user.reports).length > 0 ? (
        sortedReportEntries
          .filter(([, reportData]: [string, any]) => reportData.verified)
          .map(([geneName, reportData]: [string, any]) => (
          <div key={geneName} className="flex gap-2">
            {reportData.url && (
              <a
                href={reportData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#027A48] text-white rounded-full text-xs sm:text-sm font-medium hover:bg-[#026c3f] transition-colors shadow-sm"
              >
                <FileText size={16} />
                Legacy {geneName} PDF
              </a>
            )}
            {reportData.ai_report && (
              <button
                onClick={() => setViewReportData({ testName: geneName, reportData: reportData.ai_report, variants: reportData.variants, mbqId: formatUserId(user.id, user.created_at), generatedAt: getReportGeneratedAt(reportData, user.status_timestamps?.generated), gender: user.gender })}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#6057D7] text-white rounded-full text-xs sm:text-sm font-medium hover:bg-[#4F46B8] transition-colors shadow-sm cursor-pointer"
              >
                <Sparkles size={16} />
                View {geneName} Report
              </button>
            )}
            {user.report_answers?.[`${geneName}_custom`] && (
              <button
                onClick={() => setViewAnswersPanel(geneName)}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#F0F0ED] text-[#1A1A19] rounded-full text-xs sm:text-sm font-medium hover:bg-[#E8E8E5] transition-colors shadow-sm cursor-pointer"
              >
                <ClipboardList size={16} />
                My Answers
              </button>
            )}
          </div>
        ))
      ) : user.report_verified && user.report_url ? (
        <a
          href={user.report_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#027A48] text-white rounded-full text-xs sm:text-sm font-medium hover:bg-[#026c3f] transition-colors shadow-sm"
        >
          <FileText size={16} />
          View Legacy Report
        </a>
      ) : null}
      {hasMultipleProfiles && (
        <button
          onClick={handleSwitchAccounts}
          disabled={switchingAccountsLoading}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#F0F0ED] text-[#1A1A19] rounded-full text-xs sm:text-sm font-medium hover:bg-[#E8E8E5] transition-colors shadow-sm cursor-pointer"
        >
          <Users size={16} className={switchingAccountsLoading ? 'animate-pulse' : ''} />
          Switch
        </button>
      )}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-50 text-red-600 border border-red-100 rounded-full text-xs sm:text-sm font-medium hover:bg-red-100 transition-colors shadow-sm cursor-pointer"
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto mt-8 sm:mt-12 px-4 pb-12"
    >
      <div className="bg-white/80 backdrop-blur-xl rounded-[24px] p-6 sm:p-10 border border-white/60 shadow-[0_8px_32px_rgb(0,0,0,0.04)] mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-4">
        <div className="flex-1 w-full min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A19] tracking-tight mb-2 break-words">Hello, {user.full_name?.toUpperCase()}</h1>
          <p className="text-[#8B8B86] text-sm">User ID: {formatUserId(user.id, user.created_at)}</p>
          {dashboardActions}
        </div>
      </div>

      {/* Fetch Data status toast */}
      <AnimatePresence>
        {fetchDataStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium border ${fetchDataStatus.type === 'success'
              ? 'bg-[#ECFDF3] text-[#027A48] border-[#027A48]/20'
              : fetchDataStatus.type === 'warning'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-600 border-red-100'
              }`}
          >
            <AlertCircle size={16} className="shrink-0" />
            {fetchDataStatus.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rejected request banner */}
      {user.request_status === 'rejected' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4"
        >
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Your request needs attention</p>
            <p className="text-xs text-red-600 mt-0.5">
              We weren't able to verify your request. Please contact our support team for help.
            </p>
          </div>
        </motion.div>
      )}

      {/* Collection guide card — shown once the request is approved, before the sample is collected */}
      {user.request_status === 'accepted' && !user.sample_collected && (
        <motion.button
          type="button"
          onClick={() => setShowSwabTutorial(true)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 w-full flex items-center gap-3 bg-[#EBE9FC] border border-[#6057D7]/20 hover:bg-[#E3E0FA] rounded-2xl px-5 py-4 text-left transition-colors cursor-pointer"
        >
          <ClipboardList size={18} className="text-[#6057D7] shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1A1A19]">Your request is approved!</p>
            <p className="text-xs text-[#6057D7] mt-0.5">
              See what to expect when your sample is collected.
            </p>
          </div>
          <span className="material-symbols-rounded text-[#6057D7] shrink-0" aria-hidden="true">chevron_right</span>
        </motion.button>
      )}

      {/* Questionnaire banners — one per purchased panel (Caffeine Sensitivity /
          Muscle Performance / Hair), driven by the patient's own purchase +
          answer state rather than lab progress. Shows as soon as the request
          is approved so the patient can answer before the lab even starts;
          once answered, generation fires automatically in the background
          (see request-generation / report-answers on the server) so this
          only ever asks for input once per panel. */}
      {user.request_status === 'accepted' && user.gene_type && (() => {
        const requiredGenes = getRequiredGenes(user.gene_type);
        const genesByPanel: Record<string, string[]> = {};
        requiredGenes.forEach(({ panel, name }) => {
          if (!genesByPanel[panel]) genesByPanel[panel] = [];
          genesByPanel[panel].push(name);
        });
        const reportAnswers = user.report_answers || {};
        const reports = user.reports || {};

        return Object.entries(genesByPanel).map(([panelName, panelGenes]) => {
          const alreadyAnswered = !!reportAnswers[panelName];
          const panelData = reports[panelName];

          if (!alreadyAnswered) {
            return (
              <motion.div
                key={panelName}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-amber-500 rounded-2xl p-6 sm:px-6 sm:py-4 w-full shadow-md cursor-pointer hover:shadow-lg transition-all"
                onClick={() => {
                  setSurveyTestName(panelName);
                  setShowSurveyModal(true);
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-4 w-full text-left">
                  <span className="bg-amber-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm mb-1 sm:mb-0">
                    Action Required
                  </span>
                  <p className="text-sm font-medium text-white flex-1 mb-2 sm:mb-0">
                    Please submit your Phenotypic Survey ({panelGenes.length * 5} questions) for {panelName} so that you can get your report
                  </p>
                  <button
                    className="inline-flex items-center gap-1 font-bold text-amber-700 bg-white pl-5 pr-4 py-2.5 sm:py-2 rounded-full hover:bg-white/90 transition-colors shadow-sm whitespace-nowrap shrink-0 self-end sm:self-auto"
                  >
                    Answer Now <span className="material-symbols-rounded text-[20px]" aria-hidden="true">chevron_right</span>
                  </button>
                </div>
              </motion.div>
            );
          }

          // Already answered — if the lab hasn't produced a report yet, show a
          // quiet, non-actionable status instead of asking for input again.
          if (!panelData || !panelData.ai_report) {
            return (
              <motion.div
                key={panelName}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-3 bg-[#F4F4F2] border border-[#E8E8E5] rounded-2xl px-5 py-4"
              >
                <ClipboardList size={18} className="text-[#8B8B86] shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#5A5A55]">Your {panelName} answers are in</p>
                  <p className="text-xs text-[#8B8B86] mt-0.5">
                    We'll generate your report automatically as soon as the lab finishes processing your sample.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewAnswersPanel(panelName)}
                  className="text-xs font-semibold text-[#6057D7] hover:text-[#4F46B8] transition-colors whitespace-nowrap shrink-0"
                >
                  View My Answers
                </button>
              </motion.div>
            );
          }

          return null;
        });
      })()}

      {/* Null phenotypic data banner */}
      {!user.phenotypic_analysis?.personal_profile?.dailyActivity && (
        <motion.button
          type="button"
          onClick={() => setShowLifestyleModal(true)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 w-full flex items-center gap-3 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-2xl px-5 py-4 text-left transition-colors cursor-pointer"
        >
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Lifestyle data is missing</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Complete the questionnaire for your test to fill in your profile.
            </p>
          </div>
          <span className="material-symbols-rounded text-amber-600 shrink-0" aria-hidden="true">chevron_right</span>
        </motion.button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gene Profile (Existing - Read Only) */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <h3 className="text-[#8B8B86] text-xs font-semibold tracking-wider uppercase mb-6">Genomic Profile</h3>
          {getGenePills(user.gene_type)}
        </div>

        {/* Personal Profile — age/mobile/email are collected at registration; activity/sleep
            only come from the (currently unfilled) lifestyle questionnaire. */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <h3 className="text-[#8B8B86] text-xs font-semibold tracking-wider uppercase mb-4">Personal Profile</h3>
          <div className="space-y-3">
            {renderRawField('Age', user.age)}
            {renderRawField('Mobile', user.phone)}
            {renderRawField('Email', user.email)}
            {renderField('Activity', ['phenotypic_analysis', 'personal_profile', 'dailyActivity'])}
            {renderField('Sleep', ['phenotypic_analysis', 'personal_profile', 'sleepTiming'])}
          </div>
        </div>

        {/* Dynamic AI Profile Sections — each only shows once that section actually has data */}
        {user.phenotypic_analysis?.caffeine_response && (
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <h3 className="text-[#8B8B86] text-xs font-semibold tracking-wider uppercase mb-4">Caffeine & Stimulant Response</h3>
            <div className="space-y-3">
              {renderField('Sleep Impact', ['phenotypic_analysis', 'caffeine_response', 'sleepImpact'], true)}
              {renderField('Duration', ['phenotypic_analysis', 'caffeine_response', 'durationOfEffect'], true)}
              {typeof user.phenotypic_analysis.caffeine_response?.sensitivity === 'object' && user.phenotypic_analysis.caffeine_response?.sensitivity !== null ? (
                <>
                  {renderField('Physical Sensitivity', ['phenotypic_analysis', 'caffeine_response', 'sensitivity', 'physicalSensitivity'], true) ||
                    renderField('Physical Sensitivity', ['phenotypic_analysis', 'caffeine_response', 'sensitivity', 'physical'], true)}
                  {renderField('Small Dose Sensitivity', ['phenotypic_analysis', 'caffeine_response', 'sensitivity', 'smallDoseSensitivity'], true) ||
                    renderField('Small Dose Sensitivity', ['phenotypic_analysis', 'caffeine_response', 'sensitivity', 'smallDose'], true)}
                </>
              ) : (
                renderField('Sensitivity', ['phenotypic_analysis', 'caffeine_response', 'sensitivity'], true)
              )}
              {renderField('Tolerance', ['phenotypic_analysis', 'caffeine_response', 'tolerance'], true)}
            </div>
          </div>
        )}

        {user.phenotypic_analysis?.hair_scalp_characteristics && (
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <h3 className="text-[#8B8B86] text-xs font-semibold tracking-wider uppercase mb-4">Hair & Scalp Characteristics</h3>
            <div className="space-y-3">
              {renderField('Thickness', ['phenotypic_analysis', 'hair_scalp_characteristics', 'thickness'], true)}
              {renderField('Texture', ['phenotypic_analysis', 'hair_scalp_characteristics', 'texture'], true)}
              {renderField('Scalp Type', ['phenotypic_analysis', 'hair_scalp_characteristics', 'scalpType'], true)}
              {renderField('Sweating', ['phenotypic_analysis', 'hair_scalp_characteristics', 'sweating'], true)}
              {renderField('Stability', ['phenotypic_analysis', 'hair_scalp_characteristics', 'stability'], true)}
            </div>
          </div>
        )}

        {user.phenotypic_analysis?.physical_performance && (
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.02)] md:col-span-2">
            <h3 className="text-[#8B8B86] text-xs font-semibold tracking-wider uppercase mb-4">Physical Performance & Recovery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#F7F7F5] p-3 rounded-lg border border-[#E8E8E5]">
                {renderField('Power', ['phenotypic_analysis', 'physical_performance', 'power'], true)}
              </div>
              <div className="bg-[#F7F7F5] p-3 rounded-lg border border-[#E8E8E5]">
                {renderField('Endurance', ['phenotypic_analysis', 'physical_performance', 'endurance'], true)}
              </div>
              <div className="bg-[#F7F7F5] p-3 rounded-lg border border-[#E8E8E5]">
                {renderField('Recovery', ['phenotypic_analysis', 'physical_performance', 'recovery'], true)}
              </div>
              <div className="bg-[#F7F7F5] p-3 rounded-lg border border-[#E8E8E5] sm:col-span-2 lg:col-span-1">
                {renderField('Training Preference', ['phenotypic_analysis', 'physical_performance', 'trainingPreference'], true)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Track Updates Modal */}
      <AnimatePresence>
        {showTracking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-w-md w-full border border-[#E8E8E5] relative"
              onAnimationStart={() => triggerHaptic('medium')}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#1A1A19] flex items-center gap-2">
                  <Activity className="text-[#6057D7] w-5 h-5" />
                  Your Profile Journey
                </h3>
                <button
                  onClick={() => setShowTracking(false)}
                  className="p-1.5 hover:bg-[#F7F7F5] rounded-full text-[#8B8B86] hover:text-[#1A1A19] transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-[#F7F7F5] rounded-2xl p-4 mb-6 text-xs text-[#5A5A55] border border-[#E8E8E5]">
                <div className="flex justify-between items-center mb-1">
                  <span>Participant ID:</span>
                  <span className="font-mono font-bold text-[#1A1A19]">{formatUserId(user.id, user.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Email Registered:</span>
                  <span className="font-semibold text-[#1A1A19]">{user.email}</span>
                </div>
              </div>

              <div className="pl-2">
                <OrderTracking
                  steps={[
                    {
                      name: "User Registered",
                      timestamp: formatIST(user.created_at || user.status_timestamps?.registered, 'Completed'),
                      isCompleted: true
                    },
                    {
                      name: "Admin Approval",
                      timestamp: user.request_status === 'rejected'
                        ? 'Rejected'
                        : formatIST(user.status_timestamps?.accepted),
                      isCompleted: user.request_status === 'accepted',
                      isPendingReview: user.request_status === 'pending'
                    },
                    {
                      name: "Sample Collected",
                      timestamp: formatIST(user.status_timestamps?.collected),
                      isCompleted: !!user.sample_collected
                    },
                    {
                      name: "Sample Received",
                      timestamp: formatIST(user.status_timestamps?.received),
                      isCompleted: !!user.sample_received
                    },
                    ...(user.reports && Object.keys(user.reports).length > 0
                      ? sortedReportEntries.map(([geneName, reportData]: [string, any]) => ({
                        name: `Report Generated — ${geneName}`,
                        timestamp: reportData?.ai_report
                          ? (reportData.verified
                            ? formatIST(getReportGeneratedAt(reportData, user.status_timestamps?.generated))
                            : "(Waiting for Admin Approval)")
                          : "Pending",
                        isCompleted: !!reportData?.verified,
                        isPendingReview: !!reportData?.ai_report && !reportData?.verified
                      }))
                      : [{
                        name: "Report Generated",
                        timestamp: user.status_timestamps?.generated
                          ? (user.report_verified
                            ? formatIST(user.status_timestamps.generated)
                            : "(Waiting for Admin Approval)")
                          : "Pending",
                        isCompleted: !!user.report_verified,
                        isPendingReview: !!user.report_generated && !user.report_verified
                      }])
                  ]}
                />
              </div>

              {user.reports && Object.keys(user.reports).length > 0 && sortedReportEntries.some(([, r]: [string, any]) => r.verified) ? (
                <div className="mt-6 pt-4 border-t border-[#E8E8E5] flex flex-col gap-3">
                  {sortedReportEntries
                    .filter(([, reportData]: [string, any]) => reportData.verified)
                    .map(([geneName, reportData]: [string, any]) => (
                    <div key={geneName} className="flex flex-col sm:flex-row gap-2">
                      {reportData.url && reportData.url !== '#' && (
                        <a
                          href={reportData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-3.5 bg-[#027A48] hover:bg-[#026c3f] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 text-center no-underline"
                        >
                          <FileText size={18} />
                          View {geneName} PDF
                        </a>
                      )}
                      {reportData.ai_report && (
                        <button
                          onClick={() => setViewReportData({ testName: geneName, reportData: reportData.ai_report, variants: reportData.variants, mbqId: formatUserId(user.id, user.created_at), generatedAt: getReportGeneratedAt(reportData, user.status_timestamps?.generated), gender: user.gender })}
                          className="flex-1 py-3.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          <Sparkles size={18} />
                          View {geneName} Report
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (!user.reports || Object.keys(user.reports).length === 0) && user.report_verified && user.report_url ? (
                <div className="mt-6 pt-4 border-t border-[#E8E8E5]">
                  <a
                    href={user.report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-[#027A48] hover:bg-[#026c3f] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 text-center no-underline"
                  >
                    <FileText size={18} />
                    View Legacy Report
                  </a>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-w-sm w-full border border-[#E8E8E5] text-center"
            >
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A19] mb-2">Confirm Logout</h3>
              <p className="text-[#8B8B86] text-sm mb-6">Are you sure you want to log out of your account?</p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 px-4 bg-[#F7F7F5] hover:bg-[#E8E8E5] text-[#5A5A55] rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('userProfile');
                    navigate('/login');
                  }}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {user && (
        <PatientSurveyModal
          isOpen={showSurveyModal}
          onClose={() => setShowSurveyModal(false)}
          userId={user.id}
          testName={surveyTestName}
          genes={getRequiredGenes(user.gene_type || '')
            .filter((g) => g.panel === surveyTestName)
            .map((g) => g.name)}
          onComplete={() => {
            refreshUser();
          }}
        />
      )}

      {user && (
        <MyAnswersModal
          isOpen={!!viewAnswersPanel}
          onClose={() => setViewAnswersPanel(null)}
          panelName={viewAnswersPanel || ''}
          rawAnswers={(viewAnswersPanel && user.report_answers?.[`${viewAnswersPanel}_custom`]) || []}
        />
      )}

      {user && (
        <LifestyleModal
          isOpen={showLifestyleModal}
          onClose={() => setShowLifestyleModal(false)}
          userId={user.id}
          onComplete={() => {
            refreshUser();
          }}
        />
      )}

      {/* Switch Accounts Modal */}
      <AnimatePresence>
        {showSwitchAccountsModal && switchAccountsProfiles.length > 1 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSwitchAccountsModal(false)}
              className="absolute inset-0 bg-[#1A1A19]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-xl p-6 md:p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#1A1A19]">Switch Accounts</h3>
                  <p className="text-[#8B8B86] text-sm mt-1">Select a profile to continue.</p>
                </div>
                <button
                  onClick={() => setShowSwitchAccountsModal(false)}
                  className="p-2 text-[#8B8B86] hover:bg-[#F0F0ED] rounded-full transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {switchAccountsProfiles.map((profile, idx) => {
                  const isCurrentProfile = profile.id === user.id;
                  return (
                    <button
                      key={profile.id || idx}
                      onClick={() => {
                        if (!isCurrentProfile) {
                          localStorage.setItem('userProfile', JSON.stringify(profile));
                          setUser(profile);
                          setShowSwitchAccountsModal(false);
                          window.scrollTo(0, 0);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group ${isCurrentProfile
                        ? 'border-[#6057D7] bg-[#F9F9F8]'
                        : 'border-[#E8E8E5] hover:border-[#6057D7] hover:bg-[#F9F9F8]'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0 ${isCurrentProfile
                        ? 'bg-[#EBE9FC] text-[#6057D7]'
                        : 'bg-[#F0F0ED] text-[#8B8B86] group-hover:bg-[#EBE9FC] group-hover:text-[#6057D7]'
                        }`}>
                        <span className="font-semibold text-lg">{profile.full_name?.charAt(0) || 'U'}</span>
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h4 className="font-bold text-[#1A1A19] truncate">{profile.full_name}</h4>
                        <p className="text-sm text-[#8B8B86] truncate">@{profile.username}</p>
                      </div>
                      {isCurrentProfile && (
                        <div className="text-xs font-semibold text-[#6057D7] bg-[#EBE9FC] px-2 py-1 rounded-md">
                          Active
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedAIReport && (
        <AIReportModal
          isOpen={!!selectedAIReport}
          onClose={() => setSelectedAIReport(null)}
          markdownContent={selectedAIReport.content}
          geneName={selectedAIReport.geneName}
        />
      )}

      {viewReportData && (
        <ReportViewerModal
          isOpen={!!viewReportData}
          onClose={() => setViewReportData(null)}
          reportData={viewReportData.reportData}
          geneVariants={viewReportData.variants}
          testName={viewReportData.testName}
          mbqId={viewReportData.mbqId}
          generatedAt={viewReportData.generatedAt}
          gender={viewReportData.gender}
        />
      )}

      {showSwabTutorial && <SwabTutorial onClose={() => setShowSwabTutorial(false)} />}

      {/* Floating Chatbot */}
      {user && user.reports && Object.values(user.reports).some((r: any) => r.verified) && (
        <FloatingChatbot userName={user.full_name} contextData={user.reports} />
      )}
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, XCircle, User, Phone, Mail, Calendar, ClipboardCheck, Loader2 } from 'lucide-react';
import { formatUserId, getGeneColor } from '@/lib/mbq';
import AdminNav from '@/components/AdminNav';

export default function AdminRequestsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ id: number, name: string } | null>(null);

  const fetchPatients = (silent = false) => {
    if (!silent) setLoading(true);
    fetch('/api/admin/patients')
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.error('Error fetching patients:', err))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(() => fetchPatients(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const updateRequestStatus = async (id: number, status: 'accepted' | 'rejected') => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/users/${id}/request-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        setPatients((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || 'Failed to update request status');
      }
    } catch (err) {
      console.error(err);
      alert('Connection failed');
    } finally {
      setActionLoading(null);
      setRejectDialog(null);
    }
  };

  const pendingRequests = patients.filter((p) => (p.request_status || 'pending') === 'pending');

  const filteredRequests = pendingRequests.filter((patient) => {
    const searchTerms = searchQuery
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (searchTerms.length === 0) return true;

    return searchTerms.some((term) => {
      const nameMatch = patient.full_name?.toLowerCase().includes(term);
      const emailMatch = patient.email?.toLowerCase().includes(term);
      const usernameMatch = patient.username?.toLowerCase().includes(term);
      const phoneMatch = patient.phone?.includes(term);
      const idMatch = formatUserId(patient.id, patient.created_at).toLowerCase().includes(term) || patient.id.toString().includes(term);
      return nameMatch || emailMatch || usernameMatch || phoneMatch || idMatch;
    });
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 mx-auto"
    >
      <AdminNav />

      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-[#E8E8E5] text-xs font-semibold text-[#6057D7] tracking-widest uppercase mb-2 shadow-sm backdrop-blur-md"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Admin Portal
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1A19]">New Requests</h2>
          <p className="text-[#8B8B86] text-base font-medium max-w-xl leading-relaxed">
            Verify payment and accept or reject new registrations before they move to the Volunteer sample-collection stage.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A09D] z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, id..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/60 backdrop-blur-xl border border-[#E8E8E5] text-sm rounded-2xl pl-4 pr-10 py-2.5 outline-none focus:ring-4 focus:ring-[#6057D7]/15 focus:border-[#6057D7]/30 transition-all shadow-sm placeholder:text-[#A0A09D] font-medium"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#6057D7]/5 to-[#3FC2AC]/5 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#6057D7] mb-4" size={40} />
            <p className="text-[#8B8B86] text-sm font-medium">Fetching new requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-white/40 backdrop-blur-md border border-[#E8E8E5] rounded-3xl p-8">
            <ClipboardCheck className="w-12 h-12 text-[#A0A09D] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#1A1A19]">No pending requests</h3>
            <p className="text-sm text-[#8B8B86] mt-1">New registrations awaiting approval will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredRequests.map((patient, i) => {
                const isActionLoading = actionLoading === patient.id;
                const genesList = patient.gene_type ? patient.gene_type.split(/,\s*(?![^(]*\))/) : [];

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(i * 0.05, 0.5) }}
                    key={patient.id}
                    className="bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_4px_24px_rgb(0,0,0,0.03)] rounded-3xl p-6 transition-all duration-300 hover:shadow-md hover:bg-white flex flex-col justify-between min-h-[320px]"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F4F4F2] to-[#E8E8E5] border border-[#D4D4CE] flex items-center justify-center text-sm font-bold text-[#1A1A19] shadow-inner shrink-0">
                          {patient.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF5E5] text-[#B87A00] text-[10px] font-bold uppercase tracking-wider">
                          Pending
                        </span>
                      </div>

                      <div className="mb-4">
                        <h3 className="font-bold text-[#1A1A19] text-lg leading-tight mb-1">{patient.full_name?.toUpperCase()}</h3>
                        <p className="text-xs font-mono font-medium text-[#8B8B86] flex items-center gap-1">
                          <User size={12} /> ID: {formatUserId(patient.id, patient.created_at)} ({patient.username})
                        </p>
                      </div>

                      <div className="space-y-2 mb-4 text-xs text-[#5A5A55]">
                        <div className="flex items-center gap-2">
                          <Mail size={12} className="text-[#8B8B86]" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-[#8B8B86]" />
                          <span>{patient.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-[#8B8B86]" />
                          <span>{patient.age ? `${patient.age} years` : 'N/A'} • {patient.gender || 'N/A'}</span>
                        </div>
                      </div>

                      {genesList.length > 0 && (
                        <div className="mb-6 pt-3 border-t border-[#F0F0ED]">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#A0A09D] block mb-2">
                            Selected Tests
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {genesList.map((g: string, idx: number) => (
                              <span key={idx} className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getGeneColor(g)}`}>
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateRequestStatus(patient.id, 'accepted')}
                        disabled={isActionLoading}
                        className="flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm bg-gradient-to-r from-[#6057D7] to-[#3FC2AC] hover:opacity-90 text-white shadow-[0_4px_12px_rgba(96,87,215,0.15)] disabled:opacity-50"
                      >
                        {isActionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setRejectDialog({ id: patient.id, name: patient.full_name || 'this user' })}
                        disabled={isActionLoading}
                        className="flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Reject
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Reject Confirmation Modal */}
      <AnimatePresence>
        {rejectDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-[#E8E8E5]"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4 mx-auto">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-center text-[#1A1A19] mb-2">Reject Request?</h3>
              <p className="text-center text-sm text-[#8B8B86] mb-8">
                Are you sure you want to reject {rejectDialog.name}'s request? Their record is kept but hidden from the Volunteer sample-collection page.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectDialog(null)}
                  disabled={actionLoading === rejectDialog.id}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-[#5A5A55] bg-[#F4F4F2] hover:bg-[#E8E8E5] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateRequestStatus(rejectDialog.id, 'rejected')}
                  disabled={actionLoading === rejectDialog.id}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading === rejectDialog.id ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

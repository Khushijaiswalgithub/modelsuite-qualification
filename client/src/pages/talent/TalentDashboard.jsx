import { useEffect, useState } from 'react';
import TalentSidebar from '../../components/talent/TalentSidebar';
import AvailableTasksList from '../../components/talent/AvailableTasksList';
import MyTasksList from '../../components/talent/MyTasksList';
import { fetchAvailableTasks, fetchMyTasks } from '../../api/talent';
import { fetchMySubmissions } from '../../api/submissions';
import { useAuth } from '../../context/AuthContext';

const SubmissionsTimeline = ({ submissions }) => {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="py-12 px-6 text-center rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.015)',
          border: '1px dashed rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
        }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
          style={{ margin: '0 auto 10px', opacity: 0.3 }} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        No past submissions found.
      </div>
    );
  }

  const fmtDate = (raw) => {
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (isNaN(d)) return raw;
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return raw; }
  };

  const STATUS_BADGE_STYLE = {
    Pending: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
    Approved: { bg: 'rgba(16,185,129,0.08)', text: '#10B981', border: 'rgba(16,185,129,0.25)' },
    Rejected: { bg: 'rgba(239,68,68,0.08)', text: '#EF4444', border: 'rgba(239,68,68,0.25)' },
  };

  const STATUS_DOT_BG = {
    Pending: 'bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    Approved: 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    Rejected: 'bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  };

  return (
    <div className="relative pl-6 border-l border-white/10 flex flex-col gap-6 ml-2">
      {submissions.map((sub, i) => {
        const badge = STATUS_BADGE_STYLE[sub.reviewStatus] || STATUS_BADGE_STYLE.Pending;
        const dotBg = STATUS_DOT_BG[sub.reviewStatus] || STATUS_DOT_BG.Pending;
        return (
          <div key={sub._id} className="relative group animate-fade-slide" style={{ animationDelay: `${i * 0.05}s` }}>
            {/* Timeline Dot */}
            <div className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full ${dotBg} transition-all duration-300 group-hover:scale-125`} />

            {/* Content Card */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                <h3 className="font-semibold text-text-primary text-[14px] leading-tight">
                  {sub.taskId?.title || 'Deleted Task'}
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full border font-semibold tracking-wide"
                  style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}>
                  {sub.reviewStatus}
                </span>
              </div>

              <p className="text-[11.5px] mb-3" style={{ color: '#4B5563' }}>
                Submitted on {fmtDate(sub.createdAt)}
              </p>

              {sub.notes && (
                <div className="text-[12.5px] text-text-muted bg-white/[0.01] border border-white/[0.03] rounded-lg p-3 mb-3 italic">
                  &ldquo;{sub.notes}&rdquo;
                </div>
              )}

              {sub.fileUrl && (
                <div className="flex items-center">
                  <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-primary hover:text-white transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Submission File
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TalentDashboard = () => {
  const { user } = useAuth();
  const [availableTasks, setAvailableTasks] = useState([]);
  const [myTasks, setMyTasks]               = useState([]);
  const [submissions, setSubmissions]       = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadAvailable = async () => {
    try { const { data } = await fetchAvailableTasks(); setAvailableTasks(data); }
    catch { setError('Failed to load available tasks'); }
  };

  const loadMyTasks = async () => {
    try { const { data } = await fetchMyTasks(); setMyTasks(data); }
    catch { setError('Failed to load your tasks'); }
  };

  const loadSubmissions = async () => {
    try { const { data } = await fetchMySubmissions(); setSubmissions(data); }
    catch { setError('Failed to load submission history'); }
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoadingData(true);
      try {
        await Promise.all([
          loadAvailable(),
          loadMyTasks(),
          loadSubmissions()
        ]);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingData(false);
      }
    };
    initData();
  }, []);

  const handleRefresh = () => {
    loadAvailable();
    loadMyTasks();
    loadSubmissions();
  };

  if (isLoadingData) {
    return (
      <div className="flex min-h-screen" style={{ background: '#050505' }}>
        <TalentSidebar />
        <main className="ml-[220px] flex-1 flex flex-col items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-primary mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-text-muted">Loading your portal...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#050505' }}>
      <TalentSidebar />

      <main className="ml-[220px] flex-1 px-8 py-8" style={{ maxWidth: 'calc(100vw - 220px)' }}>

        {/* Header */}
        <div className="mb-7 page-section">
          <h1 className="text-[22px] font-semibold tracking-tight"
            style={{ color: '#F0F0F0', fontFamily: 'Poppins, sans-serif' }}>
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-0.5 text-[13px]" style={{ color: '#6B7280' }}>
            Browse available tasks below and claim one to get started.
          </p>
        </div>

        {error && (
          <p className="text-[13px] mb-4 px-4 py-3 rounded-lg"
            style={{ color: '#F87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}

        {/* Available Tasks */}
        <section className="mb-7 page-section">
          <div className="flex items-center gap-2.5 mb-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: '#4B5563', fontFamily: 'Inter, sans-serif' }}>
              Available Tasks
            </h2>
            <span className="text-[10.5px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#6B7280',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              {availableTasks.length}
            </span>
          </div>
          <AvailableTasksList tasks={availableTasks} onClaimed={handleRefresh} />
        </section>

        {/* My Tasks */}
        <section className="mb-7 page-section">
          <div className="flex items-center gap-2.5 mb-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: '#4B5563', fontFamily: 'Inter, sans-serif' }}>
              My Tasks
            </h2>
            <span className="text-[10.5px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#6B7280',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              {myTasks.length}
            </span>
          </div>
          <MyTasksList tasks={myTasks} onRefresh={handleRefresh} />
        </section>

        {/* Submission History Timeline */}
        <section className="mb-7 page-section">
          <div className="flex items-center gap-2.5 mb-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: '#4B5563', fontFamily: 'Inter, sans-serif' }}>
              Submission History
            </h2>
            <span className="text-[10.5px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#6B7280',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              {submissions.length}
            </span>
          </div>
          <SubmissionsTimeline submissions={submissions} />
        </section>
      </main>
    </div>
  );
};

export default TalentDashboard;

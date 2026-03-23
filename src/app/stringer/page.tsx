'use client';

import { useCurrentUser } from '@/components/RoleGate';
import { StatusPill } from '@/components/StatusPill';
import { addAlert, clearDemoData, formatJobCode, getShop, listJobsByShop, updateJob, updateShop } from '@/lib/demoData';
import { clearDemoUser } from '@/lib/demoAuth';
import { useEffect, useMemo, useState } from 'react';

const tabs = ['RECEIVED', 'IN_PROGRESS', 'FINISHED'] as const;

export default function StringerDashboard() {
  const { user, loading } = useCurrentUser();
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('RECEIVED');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [frame, setFrame] = useState(true);
  const [grommets, setGrommets] = useState(true);
  const [grip, setGrip] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [message, setMessage] = useState('');

  const effectiveShopId = user?.shop_id || 'demo-shop-1';

  function refreshData() {
    setJobs(listJobsByShop(effectiveShopId).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)));
    const shop = getShop(effectiveShopId);
    setWallet(shop?.wallet_balance || 0);
  }

  useEffect(() => {
    refreshData();
  }, [effectiveShopId]);

  const filtered = useMemo(() => jobs.filter((job) => job.status === activeTab), [jobs, activeTab]);

  async function saveInspection() {
    if (!selectedJob) return;
    setUploading(true);
    const damage = !(frame && grommets && grip);
    updateJob(selectedJob.job_id, {
      inspection_log: {
        frame,
        grommets,
        grip,
        photo_url: file ? file.name : '',
      },
      status: damage ? 'IN_PROGRESS' : 'FINISHED',
      damage_confirmed: !damage,
    });
    if (damage) {
      addAlert({ type: 'damage', job_id: selectedJob.job_id, created_at: new Date().toISOString() });
      setMessage(`Inspection saved for job ${formatJobCode(selectedJob.job_id)}. Damage flagged, job kept in progress.`);
    } else {
      const shop = getShop(effectiveShopId);
      updateShop(effectiveShopId, { wallet_balance: (shop?.wallet_balance || 0) + 29.65 });
      setMessage(`Inspection passed for job ${formatJobCode(selectedJob.job_id)}. Job moved to finished.`);
    }
    setUploading(false);
    setSelectedJob(null);
    setFile(null);
    refreshData();
  }

  async function markInProgress(jobId: string) {
    updateJob(jobId, { status: 'IN_PROGRESS' });
    setMessage(`Job ${formatJobCode(jobId)} moved to in progress.`);
    refreshData();
  }

  async function withdraw() {
    updateShop(effectiveShopId, { wallet_balance: 0 });
    setMessage('Demo withdrawal completed. Wallet reset to $0.00.');
    refreshData();
  }

  function resetDemo() {
    clearDemoUser();
    clearDemoData();
    window.location.href = '/';
  }

  if (loading) return <main className="container"><div className="card">Loading...</div></main>;

  return (
    <main className="container grid">
      <div className="card grid">
        <span className="kicker">Stringer portal</span>
        <div className="row between">
          <div>
            <h1 className="h2">Queue + inspection</h1>
            <p className="p">Demo mode uses local storage for instant client-side testing. Jobs from the demo player appear here automatically.</p>
          </div>
          <div className="badge green">Wallet ${wallet.toFixed(2)}</div>
        </div>
        <div className="row wrap">
          <button className="btn secondary" onClick={withdraw}>Withdraw</button>
          <button className="btn ghost" onClick={resetDemo}>Reset demo data</button>
        </div>
        {message ? <div className="notice success">{message}</div> : null}
      </div>

      <div className="card grid">
        <div className="tabbar">
          {tabs.map((tab) => (
            <div key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab.replace('_', ' ')}</div>
          ))}
        </div>
        <div className="list">
          {filtered.map((job) => (
            <div className="card" key={job.job_id}>
              <div className="row between">
                <strong>Job {formatJobCode(job.job_id)}</strong>
                <StatusPill status={job.status} />
              </div>
              <div className="small">Racquet: {job.racquet_id}</div>
              <div className="small">Owner: {job.owner_name || 'Demo Player'}</div>
              <div className="row wrap">
                {job.status === 'RECEIVED' ? <button className="btn secondary" onClick={() => void markInProgress(job.job_id)}>Start</button> : null}
                {job.status !== 'FINISHED' ? <button className="btn" onClick={() => setSelectedJob(job)}>Inspect</button> : null}
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <div className="small">No jobs in this column.</div> : null}
        </div>
      </div>

      {selectedJob ? (
        <div className="card grid">
          <h2 className="h2">Inspection for job {formatJobCode(selectedJob.job_id)}</h2>
          <label className="row"><input type="checkbox" checked={frame} onChange={(e) => setFrame(e.target.checked)} /> Frame OK</label>
          <label className="row"><input type="checkbox" checked={grommets} onChange={(e) => setGrommets(e.target.checked)} /> Grommets OK</label>
          <label className="row"><input type="checkbox" checked={grip} onChange={(e) => setGrip(e.target.checked)} /> Grip OK</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="btn" onClick={() => void saveInspection()} disabled={uploading}>{uploading ? 'Saving...' : 'Save inspection'}</button>
          <p className="small">If any damage is flagged, the job stays in progress and an alert is logged in demo storage.</p>
        </div>
      ) : null}
    </main>
  );
}

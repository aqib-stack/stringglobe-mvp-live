'use client';

import { useCurrentUser } from '@/components/RoleGate';
import { StatusPill } from '@/components/StatusPill';
import { clearDemoUser, getDemoUser } from '@/lib/demoAuth';
import { clearDemoData, formatJobCode, listJobsByOwner, listRacquetsByOwner } from '@/lib/demoData';
import { getRacquetHealth } from '@/lib/health';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PlayerDashboard() {
  const { user, loading } = useCurrentUser();
  const [racquets, setRacquets] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const currentUid = user?.uid || getDemoUser()?.uid;
    if (!currentUid) return;
    setRacquets(listRacquetsByOwner(currentUid));
    setJobs(listJobsByOwner(currentUid).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)));
  }, [user?.uid]);

  function resetDemo() {
    clearDemoUser();
    clearDemoData();
    window.location.href = '/';
  }

  if (loading) return <main className="container"><div className="card">Loading...</div></main>;
  if (!user) return <main className="container"><div className="card grid"><p>Please log in first.</p><Link className="btn" href="/auth">Go to login</Link></div></main>;

  return (
    <main className="container grid">
      <div className="card grid">
        <span className="kicker">Player</span>
        <h1 className="h2">Welcome, {user.name || 'Player'}</h1>
        <p className="p">Track racquet status and complete payment before pickup.</p>
        <div className="row wrap">
          <a className="btn secondary" href="/stringer">Open stringer demo queue</a>
          <button className="btn ghost" onClick={resetDemo}>Reset demo data</button>
        </div>
      </div>

      <div className="card grid">
        <div className="row between">
          <h2 className="h2">My racquets</h2>
          <span className="small">{racquets.length} total</span>
        </div>
        <div className="list">
          {racquets.map((racquet) => {
            const health = getRacquetHealth(racquet.last_string_date);
            return (
              <div className="card" key={racquet.racquet_id}>
                <div className="row between">
                  <strong>{racquet.tag_id}</strong>
                  <span className={`badge ${health.tone}`}>{health.label}</span>
                </div>
                <div className="small">{racquet.string_type} · {racquet.tension}</div>
                <div className="small">Restrung {racquet.restring_count || 0} times</div>
              </div>
            );
          })}
          {racquets.length === 0 ? <div className="small">No racquets yet. Scan a GlobeTag to add one.</div> : null}
        </div>
      </div>

      <div className="card grid">
        <div className="row between">
          <h2 className="h2">Active jobs</h2>
          <span className="small">{jobs.length} active</span>
        </div>
        <div className="list">
          {jobs.map((job) => (
            <div className="card" key={job.job_id}>
              <div className="row between">
                <strong>Job {formatJobCode(job.job_id)}</strong>
                <StatusPill status={job.status} />
              </div>
              <div className="small">Total: ${job.amount_total || 30}</div>
              {job.status === 'FINISHED' ? (
                <Link className="btn" href={`/player/payment/${job.job_id}`}>Pay now</Link>
              ) : null}
            </div>
          ))}
          {jobs.length === 0 ? <div className="small">No jobs yet. Scan a GlobeTag to create one.</div> : null}
        </div>
      </div>
    </main>
  );
}

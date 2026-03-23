'use client';

import { db } from '@/lib/firebase';
import { getDemoUser } from '@/lib/demoAuth';
import {
  createJob,
  createRacquet,
  ensureDemoShop,
  formatJobCode,
  getRacquetByTagOwner,
  saveRacquet,
} from '@/lib/demoData';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { getRacquetHealth } from '@/lib/health';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const PENDING_SCAN_KEY = 'stringglobe_pending_scan';

export default function ScanTagPage({ params }: { params: Promise<{ tagId: string }> }) {
  const router = useRouter();
  const [tagId, setTagId] = useState('');
  const [name, setName] = useState('');
  const [stringType, setStringType] = useState('Poly');
  const [tension, setTension] = useState('52 lbs');
  const [racquet, setRacquet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const autoSubmittedRef = useRef(false);
  const demoUser = getDemoUser();
  const currentUid = demoUser?.uid;

  useEffect(() => {
    params.then(({ tagId }) => setTagId(tagId));
  }, [params]);

  useEffect(() => {
    if (!tagId || !currentUid) return;
    const existing = getRacquetByTagOwner(tagId, currentUid);
    if (existing) {
      setRacquet(existing);
      return;
    }
    const load = async () => {
      try {
        const q = query(collection(db, 'racquets'), where('tag_id', '==', tagId), where('owner_uid', '==', currentUid));
        const snap = await getDocs(q);
        if (!snap.empty) setRacquet({ racquet_id: snap.docs[0].id, ...snap.docs[0].data() });
      } catch (error) {
        console.warn('Firestore racquet lookup skipped in demo mode:', error);
      }
    };
    void load();
  }, [tagId, currentUid]);

  useEffect(() => {
    if (!tagId || !currentUid || loading || autoSubmittedRef.current) return;
    const raw = window.sessionStorage.getItem(PENDING_SCAN_KEY);
    if (!raw) return;

    try {
      const pending = JSON.parse(raw);
      if (pending.tagId !== tagId) return;

      setName(pending.name || '');
      setStringType(pending.stringType || 'Poly');
      setTension(pending.tension || '52 lbs');
      autoSubmittedRef.current = true;
      window.sessionStorage.removeItem(PENDING_SCAN_KEY);

      void handleCreateOrRequest({
        skipAuthRedirect: true,
        overrideName: pending.name,
        overrideStringType: pending.stringType,
        overrideTension: pending.tension,
      });
    } catch (error) {
      console.error('Failed to resume pending scan:', error);
      window.sessionStorage.removeItem(PENDING_SCAN_KEY);
    }
  }, [tagId, currentUid, loading]);

  async function mirrorToFirestore(localRacquet: any, localJob: any) {
    try {
      await setDoc(
        doc(db, 'racquets', localRacquet.racquet_id),
        { ...localRacquet, created_at_server: serverTimestamp() },
        { merge: true }
      );
      await setDoc(
        doc(db, 'shops', 'demo-shop-1'),
        {
          shop_id: 'demo-shop-1',
          name: 'Demo Tennis Lab',
          labor_rate: 30,
          owner_uid: 'demo-stringer',
          wallet_balance: 0,
        },
        { merge: true }
      );
      await setDoc(
        doc(db, 'jobs', localJob.job_id),
        { ...localJob, created_at_server: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.warn('Firestore mirror skipped:', error);
    }
  }

  async function handleCreateOrRequest(options?: {
    skipAuthRedirect?: boolean;
    overrideName?: string;
    overrideStringType?: string;
    overrideTension?: string;
  }) {
    const nextName = options?.overrideName ?? name;
    const nextStringType = options?.overrideStringType ?? stringType;
    const nextTension = options?.overrideTension ?? tension;

    if (!currentUid) {
      window.sessionStorage.setItem(
        PENDING_SCAN_KEY,
        JSON.stringify({
          tagId,
          name: nextName,
          stringType: nextStringType,
          tension: nextTension,
        })
      );
      if (!options?.skipAuthRedirect) {
        router.push(`/auth?next=${encodeURIComponent(`/scan/${tagId}`)}`);
      }
      return;
    }

    setLoading(true);
    try {
      let nextRacquet = racquet;
      if (!nextRacquet?.racquet_id) {
        nextRacquet = createRacquet({
          owner_uid: currentUid,
          owner_name: nextName || 'Demo Player',
          tag_id: tagId,
          string_type: nextStringType,
          tension: nextTension,
        });
      } else {
        nextRacquet = saveRacquet({
          ...nextRacquet,
          owner_uid: currentUid,
          owner_name: nextName || nextRacquet.owner_name || 'Demo Player',
          tag_id: tagId,
          string_type: nextStringType,
          tension: nextTension,
        });
      }
      setRacquet(nextRacquet);

      ensureDemoShop({
        shop_id: 'demo-shop-1',
        name: 'Demo Tennis Lab',
        labor_rate: 30,
        owner_uid: 'demo-stringer',
        wallet_balance: 0,
      });

      const localJob = createJob({
        racquet_id: nextRacquet.racquet_id,
        owner_uid: currentUid,
        owner_name: nextName || 'Demo Player',
        shop_id: 'demo-shop-1',
        amount_total: 30,
      });

      void mirrorToFirestore(nextRacquet, localJob);
      router.replace('/player');
      router.refresh();
    } catch (error) {
      console.error('Failed to create restring request:', error);
      alert('Could not create restring request. Check console for details.');
      setLoading(false);
    }
  }

  const health = getRacquetHealth(racquet?.last_string_date);

  return (
    <main className="container">
      <div className="card grid">
        <span className="kicker">GlobeTag scan</span>
        <h1 className="h2">Tag ID: {tagId}</h1>
        {!racquet ? (
          <>
            <p className="p">First-time scan. Add player and racquet setup, then create the restring request.</p>
            <div>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">String type</label>
              <input className="input" value={stringType} onChange={(e) => setStringType(e.target.value)} />
            </div>
            <div>
              <label className="label">Tension</label>
              <input className="input" value={tension} onChange={(e) => setTension(e.target.value)} />
            </div>
            <button className="btn" onClick={() => void handleCreateOrRequest()} disabled={loading}>{loading ? 'Creating...' : 'Confirm and request restring'}</button>
          </>
        ) : (
          <>
            <div className="row between">
              <div>
                <div className="small">Racquet health</div>
                <div className={`badge ${health.tone}`}>{health.label}</div>
              </div>
              <div className="small">Restrung {racquet.restring_count || 0} times</div>
            </div>
            <div className="small">String: {racquet.string_type} · Tension: {racquet.tension}</div>
            <div className="notice">Ready to create a new restring job for this racquet.</div>
            <button className="btn" onClick={() => void handleCreateOrRequest()} disabled={loading}>{loading ? 'Submitting...' : 'Request restring'}</button>
          </>
        )}
      </div>
    </main>
  );
}

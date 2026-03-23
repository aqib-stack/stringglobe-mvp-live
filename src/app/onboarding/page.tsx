'use client';

import { auth, db } from '@/lib/firebase';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<'PLAYER' | 'STRINGER'>('PLAYER');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [laborRate, setLaborRate] = useState('30');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const current = auth.currentUser;
    if (!current) {
      router.push('/auth');
      return;
    }
    setLoading(true);
    let shopId: string | null = null;
    if (role === 'STRINGER') {
      const shopRef = await addDoc(collection(db, 'shops'), {
        name: shopName,
        labor_rate: Number(laborRate),
        owner_uid: current.uid,
        wallet_balance: 0,
      });
      shopId = shopRef.id;
      await setDoc(doc(db, 'shops', shopId), {
        shop_id: shopId,
        name: shopName,
        labor_rate: Number(laborRate),
        owner_uid: current.uid,
        wallet_balance: 0,
      });
    }
    await setDoc(doc(db, 'users', current.uid), {
      uid: current.uid,
      user_role: role,
      name,
      phone: current.phoneNumber,
      shop_id: shopId,
    });
    router.push(role === 'STRINGER' ? '/stringer' : '/player');
  }

  return (
    <main className="container">
      <div className="card grid">
        <span className="kicker">Fast onboarding</span>
        <h1 className="h2">Create your StringGlobe profile</h1>
        <div className="tabbar">
          <div className={`tab ${role === 'PLAYER' ? 'active' : ''}`} onClick={() => setRole('PLAYER')}>Player</div>
          <div className={`tab ${role === 'STRINGER' ? 'active' : ''}`} onClick={() => setRole('STRINGER')}>Stringer</div>
          <div className="tab">~2 min</div>
        </div>
        <div>
          <label className="label">Full name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {role === 'STRINGER' ? (
          <>
            <div>
              <label className="label">Shop name</label>
              <input className="input" value={shopName} onChange={(e) => setShopName(e.target.value)} />
            </div>
            <div>
              <label className="label">Labor rate</label>
              <input className="input" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} />
            </div>
          </>
        ) : null}
        <button className="btn" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Continue'}</button>
      </div>
    </main>
  );
}

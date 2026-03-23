'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getDemoUser } from '@/lib/demoAuth';
import { useEffect, useState } from 'react';
import type { AppUser } from '@/types';

export function useCurrentUser() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        const demoUser = getDemoUser();
        setUser(demoUser);
        setLoading(false);
        return;
      }
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      setUser(snap.exists() ? (snap.data() as AppUser) : null);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { loading, user };
}

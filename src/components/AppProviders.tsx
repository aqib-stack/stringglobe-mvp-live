'use client';

import { useEffect } from 'react';
import { ensurePersistence } from '@/lib/firebase';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensurePersistence().catch(() => undefined);
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  return <>{children}</>;
}

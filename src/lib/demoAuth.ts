'use client';

import { useEffect, useState } from 'react';
import type { AppUser } from '@/types';

export const DEMO_USER_KEY = 'stringglobe_user';

export function getDemoUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(DEMO_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function setDemoUser(user: AppUser) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
}

export function clearDemoUser() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEMO_USER_KEY);
}

export function useDemoUser() {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    setUser(getDemoUser());
  }, []);

  return user;
}

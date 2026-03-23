'use client';

import Link from 'next/link';
import { clearDemoData } from '@/lib/demoData';
import { clearDemoUser } from '@/lib/demoAuth';

export default function HomePage() {
  function resetDemo() {
    clearDemoUser();
    clearDemoData();
    window.location.reload();
  }

  return (
    <main className="container">
      <div className="card grid">
        <span className="kicker">Client Demo Ready</span>
        <h1 className="h1">StringGlobe</h1>
        <p className="p">
          Scan tag. Drop racquet. Inspect. Pay. Withdraw. Use the demo flow below for a smooth client presentation.
        </p>
        <div className="grid">
          <Link className="btn" href="/scan/demo-tag-001">Start player scan flow</Link>
          <Link className="btn secondary" href="/stringer">Open stringer dashboard</Link>
          <Link className="btn secondary" href="/auth">Open demo login</Link>
          <button className="btn ghost" onClick={resetDemo}>Reset demo data</button>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <div className="landing-card">
        <div className="brand-mark">♠</div>
        <div className="eyebrow">POKER CLOCK</div>
        <h1>PLATINUM</h1>
        <p className="lead">One tournament. Every screen. Real-time control.</p>
        <div className="landing-actions">
          <Link className="button primary" href="/login">Organizer login</Link>
          <Link className="button" href="/tv">TV display</Link>
        </div>
        <div className="feature-grid">
          <div><b>📺 TV</b><span>Dedicated 16:9 tournament display</span></div>
          <div><b>📱 Mobile</b><span>Organizer control from phone/tablet</span></div>
          <div><b>⚡ Realtime</b><span>Start, pause and control instantly</span></div>
          <div><b>∞ Platinum</b><span>Unlimited saved tournaments</span></div>
        </div>
      </div>
    </main>
  );
}
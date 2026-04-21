import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThreeHero from '../components/ThreeHero.jsx';
import Icon from '../components/Icon.jsx';

export default function Marketing() {
  const [scrolled, setScrolled] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: 'var(--bg-canvas)', color: 'var(--fg-primary)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 32,
        background: 'rgba(12,12,14,0.65)', backdropFilter: 'blur(18px) saturate(140%)',
        borderBottom: scrolled > 8 ? '1px solid var(--border-subtle)' : '1px solid transparent',
        transition: 'border-color 200ms',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <defs><linearGradient id="nl" x1="6" y1="30" x2="34" y2="10"><stop offset="0" stopColor="#8B5CF6" /><stop offset="1" stopColor="#818CF8" /></linearGradient></defs>
            <line x1="14" y1="32" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
            <line x1="14" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
            <path d="M6 30 L14 24 L20 18 L26 14 L34 8" stroke="url(#nl)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="34" cy="8" r="2.5" fill="#8B5CF6" />
          </svg>
          Apex <span style={{ fontFamily: 'var(--font-mono)', color: '#8B5CF6' }}>500</span>
        </div>
        <div style={{ display: 'flex', gap: 28, marginLeft: 24 }}>
          <a href="#product" style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>Product</a>
          <a href="#models" style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>Models</a>
          <a href="#pricing" style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>Pricing</a>
          <a href="#docs" style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>Docs</a>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'transparent', color: 'var(--fg-secondary)', padding: '8px 14px', fontSize: 13, cursor: 'pointer', border: 'none' }}>Sign in</button>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--accent-primary)', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Enter app →</button>
        </div>
      </nav>

      {/* HERO with Three.js */}
      <header style={{ position: 'relative', minHeight: '100vh', padding: '160px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `radial-gradient(1200px 800px at 70% 20%, rgba(139,92,246,0.12), transparent 60%), radial-gradient(600px 400px at 20% 80%, rgba(56,189,248,0.06), transparent 60%), linear-gradient(rgba(139,92,246,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.035) 1px, transparent 1px)`,
          backgroundSize: 'auto, auto, 80px 80px, 80px 80px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.25)', borderRadius: 999,
            fontSize: 12, color: '#C4B5FD', fontWeight: 500, marginBottom: 24,
            animation: 'float-in 800ms var(--ease-out) both',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px rgba(139,92,246,0.8)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            New · Ensemble model powered by PyTorch LSTM
          </div>
          <h1 style={{
            fontSize: 'clamp(48px, 6vw, 84px)', fontWeight: 600,
            letterSpacing: '-0.03em', lineHeight: 1.02, marginBottom: 24,
            animation: 'float-in 800ms 100ms var(--ease-out) both',
          }}>
            Forecast the<br />
            <span style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #8B5CF6 50%, #38BDF8 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', backgroundSize: '200% 100%', animation: 'shimmer 8s linear infinite' }}>
              S&amp;P 500
            </span> with signal, not noise.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--fg-secondary)', lineHeight: 1.55, maxWidth: 520, marginBottom: 40, animation: 'float-in 800ms 200ms var(--ease-out) both' }}>
            Apex 500 runs an ensemble of LSTM and Transformer models over 40 years of market data. Get next-session, next-week, and next-month projections with calibrated confidence bands — and understand <em>why</em> the model called it.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 56, animation: 'float-in 800ms 300ms var(--ease-out) both' }}>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--accent-primary)', color: 'white', padding: '14px 22px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Open dashboard <Icon name="arrowRight" size={14} />
            </button>
            <button onClick={() => navigate('/login')} style={{ background: 'var(--bg-surface)', color: 'var(--fg-primary)', padding: '14px 22px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 500, border: '1px solid var(--border-default)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Icon name="play" size={12} /> Watch 90s demo
            </button>
          </div>
          <div style={{ display: 'flex', gap: 48, animation: 'float-in 800ms 400ms var(--ease-out) both' }}>
            <Stat v="72%" l="5-day directional hit" />
            <Stat v="40+ yrs" l="Training data" />
            <Stat v="12k" l="Analysts on Apex" />
          </div>
        </div>

        {/* Three.js visual */}
        <div style={{ position: 'relative', height: 620, animation: 'float-in 1200ms 200ms var(--ease-out) both' }}>
          <ThreeHero />
        </div>
      </header>

      {/* LOGO STRIP */}
      <div style={{ padding: '40px 32px', maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 48, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>Trusted by analysts at</span>
        {['Lighthouse Capital', 'Meridian Funds', 'Parallax & Co.', 'Keystone Partners', 'North Ridge'].map(co => (
          <span key={co} style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-tertiary)', letterSpacing: '-0.01em' }}>{co}</span>
        ))}
      </div>

      {/* FEATURES */}
      <section id="product" style={{ padding: '120px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 12 }}>The product</div>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16, maxWidth: 720 }}>Analyst-grade forecasting, with the receipts.</h2>
        <p style={{ fontSize: 17, color: 'var(--fg-secondary)', lineHeight: 1.6, maxWidth: 580, marginBottom: 56 }}>Every prediction ships with its model, its confidence, its attention map, and its 95% range. No black boxes, no vibes.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Feat icon="sparkles" title="Ensemble predictions" body="Three horizons, three models. LSTM for short-term, Transformer-L for pattern memory, ensemble for the call you commit to." />
          <Feat icon="activity" title="Plain-English insights" body="An AI narrator summarizes the state of the market in paragraphs you can actually read. Flags anomalies before they become headlines." />
          <Feat icon="dashboard" title="What-if scenarios" body="Rate hike? Inflation surprise? Sector rotation? Move the sliders, watch the projection recompute live." />
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" style={{ padding: '80px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ position: 'relative', padding: '80px 56px', background: 'radial-gradient(600px 300px at 50% 0%, rgba(139,92,246,0.2), transparent 60%), var(--bg-surface)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 'var(--radius-xl)', textAlign: 'center', overflow: 'hidden' }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 16 }}>Start forecasting in 60 seconds.</h2>
          <p style={{ color: 'var(--fg-secondary)', fontSize: 16, maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.55 }}>Free for 14 days. No credit card. Watchlist, one model, three horizons.</p>
          <button onClick={() => navigate('/login')} style={{ background: 'var(--accent-primary)', color: 'white', padding: '14px 26px', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Start free trial <Icon name="arrowRight" size={14} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '48px 32px 64px', maxWidth: 1400, margin: '0 auto', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>
            Apex <span style={{ fontFamily: 'var(--font-mono)', color: '#8B5CF6' }}>500</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.55, maxWidth: 320 }}>AI-powered S&P 500 forecasting for analysts who want the math, not the hype.</p>
          <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 20 }}>© 2026 Apex 500 Inc. · Not investment advice.</div>
        </div>
        {[
          ['Product', ['Dashboard', 'Predictions', 'API', 'Changelog']],
          ['Company', ['About', 'Blog', 'Careers', 'Contact']],
          ['Resources', ['Docs', 'Model cards', 'Security', 'Status']],
        ].map(([h, links]) => (
          <div key={h}>
            <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-tertiary)', fontWeight: 500, margin: '0 0 14px' }}>{h}</h4>
            {links.map(l => <a key={l} style={{ display: 'block', fontSize: 13, color: 'var(--fg-secondary)', marginBottom: 8, cursor: 'pointer' }}>{l}</a>)}
          </div>
        ))}
      </footer>
    </div>
  );
}

function Stat({ v, l }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, color: 'var(--fg-primary)', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--fg-tertiary)', marginTop: 4 }}>{l}</div>
    </div>
  );
}

function Feat({ icon, title, body }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hov ? 'rgba(139,92,246,0.35)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)', padding: 32,
        boxShadow: hov ? '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        transition: 'all 300ms var(--ease-out)', transform: hov ? 'translateY(-4px)' : 'none',
      }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)',
        display: 'grid', placeItems: 'center', color: 'var(--accent-primary)', marginBottom: 20,
        boxShadow: hov ? '0 0 24px rgba(139,92,246,0.4)' : 'none', transition: 'all 300ms',
      }}>
        <Icon name={icon} size={20} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.55, margin: 0 }}>{body}</p>
    </div>
  );
}

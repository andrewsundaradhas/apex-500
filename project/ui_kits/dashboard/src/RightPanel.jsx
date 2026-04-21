/* global React */
const { useState: useStateRP } = React;

function InsightPanel() {
  const items = [
    { tone: 'pos', title: 'Tech sector momentum likely to carry the index higher into next session.', meta: 'XLK +1.4% · 3 megacaps beat · 0.71 conf', time: '2m' },
    { tone: 'warn', title: 'Unusual volume on XLF — 2.4× the 20-day average.', meta: 'Flagged anomaly · watch regional banks', time: '14m' },
    { tone: 'ai', title: 'VIX rising but still below the 30 threshold — no regime shift yet.', meta: 'VIX 24.3 → 24.8 intraday', time: '28m' },
    { tone: 'neg', title: 'Consumer discretionary lagging on weak retail data.', meta: 'XLY −1.1% · vs SPX −1.9% relative', time: '41m' },
  ];
  const colors = { pos: '#22C55E', warn: '#EAB308', ai: '#8B5CF6', neg: '#F43F5E' };
  return (
    <Card padding={20}>
      <CardHead label="Insights · generated 2 min ago" right={
        <button style={{ background: 'transparent', border: 'none', color: 'var(--fg-tertiary)', fontSize: 11, cursor: 'pointer' }}>View all →</button>
      }>
        <Pill tone="ai" dot glow>AI</Pill>
      </CardHead>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < items.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div style={{ width: 3, borderRadius: 2, background: colors[it.tone], boxShadow: `0 0 6px ${colors[it.tone]}55`, flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-primary)', lineHeight: 1.4, fontWeight: 500 }}>{it.title}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>{it.meta}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)' }}>{it.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Watchlist() {
  const rows = [
    { tk: 'SPX', name: 'S&P 500', price: 5218.47, delta: 0.82, up: true, active: true },
    { tk: 'NDX', name: 'Nasdaq 100', price: 18042.10, delta: 1.14, up: true },
    { tk: 'DJI', name: 'Dow Jones', price: 38914.72, delta: -0.18, up: false },
    { tk: 'VIX', name: 'Volatility', price: 24.32, delta: 3.20, up: false, warn: true },
    { tk: 'AAPL', name: 'Apple', price: 184.22, delta: 0.48, up: true },
    { tk: 'NVDA', name: 'Nvidia', price: 912.40, delta: 2.18, up: true },
  ];
  const spark = (up) => up
    ? "M0 14 L8 12 L16 13 L24 9 L32 10 L40 6 L48 7 L56 3 L64 2"
    : "M0 4 L8 6 L16 5 L24 9 L32 8 L40 11 L48 10 L56 13 L64 14";
  return (
    <Card padding={0}>
      <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>Watchlist</span>
        <Icon name="plus" size={14} style={{ color: 'var(--fg-tertiary)', cursor: 'pointer' }} />
      </div>
      <div>
        {rows.map((r, i) => (
          <WatchRow key={r.tk} {...r} spark={spark(r.up)} last={i === rows.length - 1} />
        ))}
      </div>
    </Card>
  );
}

function WatchRow({ tk, name, price, delta, up, warn, active, spark, last }) {
  const [hov, setHov] = useStateRP(false);
  const color = warn ? '#EAB308' : up ? '#22C55E' : '#F43F5E';
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
        background: active || hov ? 'var(--bg-elevated)' : 'transparent',
        cursor: 'pointer', position: 'relative',
      }}>
      {active && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 2, background: 'var(--accent-primary)', borderRadius: 2 }} />}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)', letterSpacing: '0.04em', width: 50 }}>{tk}</span>
      <span style={{ fontSize: 12, color: 'var(--fg-secondary)', flex: 1 }}>{name}</span>
      <svg width="48" height="18" viewBox="0 0 64 16">
        <path d={spark} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums', width: 74, textAlign: 'right' }}>{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, fontVariantNumeric: 'tabular-nums', width: 54, textAlign: 'right' }}>{delta > 0 ? '+' : ''}{delta.toFixed(2)}%</span>
    </div>
  );
}

function SentimentMeter() {
  const val = 62; // 0..100, bullish
  const angle = -90 + (val / 100) * 180;
  return (
    <Card padding={20}>
      <CardHead label="Market sentiment · intraday" />
      <div style={{ position: 'relative', height: 120, display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 200 110" width="100%" height="120">
          <defs>
            <linearGradient id="sentGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F43F5E"/>
              <stop offset="50%" stopColor="#70707A"/>
              <stop offset="100%" stopColor="#22C55E"/>
            </linearGradient>
          </defs>
          <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#sentGrad)" strokeWidth="10" strokeLinecap="round" opacity="0.35"/>
          <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#sentGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(val/100) * 251}, 251`}/>
          <g transform={`translate(100,100) rotate(${angle})`}>
            <line x1="0" y1="0" x2="0" y2="-70" stroke="#EDEDEF" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="0" cy="0" r="6" fill="#141416" stroke="#8B5CF6" strokeWidth="2"/>
          </g>
          <text x="20" y="112" fontSize="9" fontFamily="var(--font-mono)" fill="#70707A">Bearish</text>
          <text x="160" y="112" fontSize="9" fontFamily="var(--font-mono)" fill="#70707A">Bullish</text>
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, color: '#22C55E', fontVariantNumeric: 'tabular-nums' }}>{val}</span>
        <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>Moderately bullish · +4 vs yesterday</span>
      </div>
    </Card>
  );
}

function NewsTicker() {
  const news = [
    { tone: 'pos', txt: 'Nvidia Q1 revenue beat by 8%, ups guidance', time: '14:28' },
    { tone: 'neg', txt: 'Retail sales April softens, consumer sentiment slips', time: '13:50' },
    { tone: 'ai', txt: 'Fed minutes signal patience on rate cuts', time: '12:12' },
  ];
  const color = { pos: '#22C55E', neg: '#F43F5E', ai: '#8B5CF6' };
  return (
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-subtle)' }}>
        <Icon name="bolt" size={12} style={{ color: 'var(--fg-tertiary)' }} />
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>News feed · live</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)' }}>12 new</span>
      </div>
      {news.map((n, i) => (
        <div key={i} style={{ padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, borderBottom: i < news.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color[n.tone], marginTop: 6, flexShrink: 0, boxShadow: `0 0 6px ${color[n.tone]}` }} />
          <span style={{ fontSize: 12, color: 'var(--fg-primary)', flex: 1, lineHeight: 1.4 }}>{n.txt}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)', flexShrink: 0 }}>{n.time}</span>
        </div>
      ))}
    </Card>
  );
}

Object.assign(window, { InsightPanel, Watchlist, SentimentMeter, NewsTicker });

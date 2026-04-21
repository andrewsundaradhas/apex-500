/* global React */
const { useState: useStateWI } = React;

function WhatIfPanel() {
  const [rate, setRate] = useStateWI(0.25);
  const [infl, setInfl] = useStateWI(0);
  // crude model: impact ~ -5.7 * rate_change + -3.1 * inflation_change
  const impact = (-5.7 * rate + -3.1 * infl).toFixed(2);
  const impactNum = parseFloat(impact);
  return (
    <Card padding={20}>
      <CardHead label="What if · scenario simulator" right={
        <Pill tone="ai" dot>Live model</Pill>
      } />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 18 }}>
        <Slider label="Fed rate change" value={rate} onChange={setRate} unit="pp" min={-1} max={1} current="5.50%" proj={`${(5.5 + rate).toFixed(2)}%`} />
        <Slider label="Inflation (CPI)" value={infl} onChange={setInfl} unit="pp" min={-2} max={2} current="3.2%" proj={`${(3.2 + infl).toFixed(2)}%`} />
      </div>
      <div style={{ padding: 14, background: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)' }}>Projected SPX impact · 30d</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, color: impactNum >= 0 ? '#22C55E' : '#F43F5E', fontVariantNumeric: 'tabular-nums' }}>
            {impactNum >= 0 ? '+' : ''}{impact}%
          </span>
        </div>
        <div style={{ flex: 1, height: 40 }}>
          <svg viewBox="0 0 200 40" style={{ width: '100%', height: 40 }}>
            <path d={`M0 20 L40 ${20 - impactNum * 2} L80 ${20 - impactNum * 3} L120 ${20 - impactNum * 4} L160 ${20 - impactNum * 4.5} L200 ${20 - impactNum * 5}`}
              fill="none" stroke={impactNum >= 0 ? '#22C55E' : '#F43F5E'} strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>62% conf</span>
      </div>
    </Card>
  );
}

function Slider({ label, value, onChange, min, max, unit, current, proj }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-primary)' }}>{current} → {proj}</span>
      </div>
      <div style={{ position: 'relative', height: 24 }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 4, transform: 'translateY(-50%)', background: 'var(--border-default)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', height: 4, transform: 'translateY(-50%)', width: `${Math.abs(pct - 50)}%`, marginLeft: pct < 50 ? `${pct - 50}%` : 0, background: 'var(--accent-primary)', borderRadius: 2, boxShadow: '0 0 6px rgba(139, 92, 246,0.4)' }} />
        <input type="range" min={min} max={max} step={0.05} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer' }} />
        <div style={{ position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%, -50%)', width: 14, height: 14, background: 'var(--fg-primary)', border: '2px solid var(--accent-primary)', borderRadius: '50%', boxShadow: '0 0 10px rgba(139, 92, 246,0.5)', pointerEvents: 'none' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)', marginTop: 4 }}>
        <span>{min}{unit}</span><span>0</span><span>+{max}{unit}</span>
      </div>
    </div>
  );
}

function CommandPalette({ onClose }) {
  const items = [
    { kind: 'ticker', label: 'SPX · S&P 500', meta: '5,218.47  +0.82%' },
    { kind: 'ticker', label: 'NDX · Nasdaq 100', meta: '18,042.10  +1.14%' },
    { kind: 'ticker', label: 'AAPL · Apple Inc.', meta: '184.22  +0.48%' },
    { kind: 'action', label: 'Run new prediction', meta: '⌘ N' },
    { kind: 'action', label: 'Switch to Transformer-L', meta: '' },
    { kind: 'page', label: 'Open Insights', meta: 'I' },
    { kind: 'page', label: 'Open Watchlist', meta: 'W' },
  ];
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(7,9,13,0.6)', backdropFilter: 'blur(4px)',
      display: 'grid', placeItems: 'start center', paddingTop: '15vh', zIndex: 200,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 560, background: 'rgba(14,17,24,0.85)', backdropFilter: 'blur(16px) saturate(140%)',
        border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(139, 92, 246,0.15)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Icon name="search" size={16} style={{ color: 'var(--fg-tertiary)' }} />
          <input autoFocus placeholder="Search tickers, actions, pages…" style={{
            background: 'transparent', border: 'none', outline: 'none', flex: 1,
            fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--fg-primary)',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--fg-tertiary)' }}>ESC</span>
        </div>
        <div style={{ padding: 6, maxHeight: 360, overflow: 'auto' }}>
          {['ticker','action','page'].map(group => (
            <div key={group}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-tertiary)', padding: '10px 14px 4px', fontWeight: 500 }}>
                {group === 'ticker' ? 'Tickers' : group === 'action' ? 'Actions' : 'Pages'}
              </div>
              {items.filter(i => i.kind === group).map((it, i) => (
                <CmdItem key={i} first={group === 'ticker' && i === 0} {...it} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)' }}>
          <span>↵ select</span><span>↑↓ navigate</span><span>⌘K toggle</span>
        </div>
      </div>
    </div>
  );
}

function CmdItem({ label, meta, first }) {
  const [hov, setHov] = useStateWI(false);
  const active = first || hov;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      display: 'flex', alignItems: 'center', padding: '9px 14px', borderRadius: 'var(--radius-sm)',
      background: active ? 'var(--bg-elevated)' : 'transparent', cursor: 'pointer',
    }}>
      <span style={{ fontSize: 13, color: 'var(--fg-primary)', flex: 1 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>{meta}</span>
    </div>
  );
}

Object.assign(window, { WhatIfPanel, CommandPalette });

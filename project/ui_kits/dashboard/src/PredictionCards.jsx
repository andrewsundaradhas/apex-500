/* global React */
const { useState: useStatePP } = React;

function PredictionCards() {
  const cards = [
    { horizon: 'Next day', ends: 'Apr 21, close', price: 5234.80, delta: 0.31, conf: 81, dir: 'pos', model: 'LSTM v4.1', range: '5,208 – 5,261' },
    { horizon: 'Next 5 sessions', ends: 'Apr 27', price: 5264.10, delta: 0.87, conf: 72, dir: 'pos', model: 'Ensemble', range: '5,198 – 5,331' },
    { horizon: 'Next 30 sessions', ends: 'May 30', price: 5198.42, delta: -0.38, conf: 54, dir: 'neg', model: 'Transformer-L', range: '5,040 – 5,356' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {cards.map(c => <PCard key={c.horizon} {...c} />)}
    </div>
  );
}

function PCard({ horizon, ends, price, delta, conf, dir, model, range }) {
  const [open, setOpen] = useStatePP(false);
  const deltaColor = dir === 'pos' ? '#22C55E' : '#F43F5E';
  return (
    <Card padding={20}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pill tone="ai" dot glow>AI</Pill>
          <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{horizon}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)' }}>{ends}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 999,
          background: dir === 'pos' ? 'rgba(34, 197, 94,0.12)' : 'rgba(244, 63, 94,0.12)',
          color: deltaColor, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
        }}>{dir === 'pos' ? '▲' : '▼'} {delta > 0 ? '+' : ''}{delta.toFixed(2)}%</span>
      </div>
      <div style={{ display: 'flex', gap: 18, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
        <MetricCell label="Confidence" value={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {conf}%
            <span style={{ width: 36, height: 3, background: 'var(--border-default)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <span style={{ position: 'absolute', inset: 0, width: `${conf}%`, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)', borderRadius: 2, boxShadow: '0 0 6px rgba(139, 92, 246,0.5)' }} />
            </span>
          </span>
        } />
        <MetricCell label="Direction" value={<span style={{ color: deltaColor }}>{dir === 'pos' ? 'Bullish' : 'Bearish'}</span>} />
        <MetricCell label="Model" value={model} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>95% range · {range}</span>
        <button onClick={() => setOpen(!open)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-hover)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          {open ? 'Hide' : 'Why this?'} →
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.6 }}>
          Primary signal: tech sector momentum (XLK +1.4% trailing 5d). Secondary: declining volatility (VIX −2.1%). Counterweight: breadth softening below 50-day average. Model weighted attention to earnings cluster concluding tomorrow.
        </div>
      )}
    </Card>
  );
}

Object.assign(window, { PredictionCards });

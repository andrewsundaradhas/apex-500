import { useState, useMemo } from 'react';
import { Card, CardHead, Pill } from '../primitives.jsx';

export default function WhatIfPanel() {
  const [rate, setRate] = useState(0);
  const [inflation, setInflation] = useState(0);
  const [oil, setOil] = useState(0);

  const impact = useMemo(() => {
    const r = rate * -2.8 + inflation * -1.4 + oil * -0.3;
    return r;
  }, [rate, inflation, oil]);

  const color = impact >= 0 ? '#22C55E' : '#F43F5E';

  return (
    <Card padding={20}>
      <CardHead label="What-if scenarios" right={<Pill tone="ai" dot glow>Live recompute</Pill>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: 20, alignItems: 'center' }}>
        <Slider label="Rate hike" unit="pp" value={rate} onChange={setRate} min={-0.5} max={1} step={0.05} />
        <Slider label="Inflation surprise" unit="pp" value={inflation} onChange={setInflation} min={-1} max={2} step={0.1} />
        <Slider label="Oil shock" unit="%" value={oil} onChange={setOil} min={-30} max={50} step={1} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderLeft: '1px solid var(--border-subtle)', paddingLeft: 20 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>SPX projected</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>
            {impact >= 0 ? '+' : ''}{impact.toFixed(2)}%
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>
            {impact >= 0 ? '+' : ''}{(5218 * (1 + impact / 100) - 5218).toFixed(2)} pts
          </span>
        </div>
      </div>
    </Card>
  );
}

function Slider({ label, unit, value, onChange, min, max, step }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {value >= 0 ? '+' : ''}{value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <div style={{ position: 'relative', height: 4, background: 'var(--bg-elevated)', borderRadius: 2 }}>
        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'var(--accent-primary)', borderRadius: 2, boxShadow: '0 0 8px rgba(139,92,246,0.5)' }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', margin: 0, padding: 0 }} />
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 7px)`, top: -5, width: 14, height: 14,
          borderRadius: '50%', background: 'var(--fg-primary)',
          border: '2px solid var(--accent-primary)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

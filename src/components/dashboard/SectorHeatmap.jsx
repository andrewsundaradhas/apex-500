import { useEffect, useState } from 'react';
import { Card, CardHead, Pill } from '../primitives.jsx';
import api from '../../api/client.js';

const FALLBACK = [
  { symbol: 'XLK', name: 'Technology',      change: 1.4 },
  { symbol: 'XLF', name: 'Financials',      change: 0.8 },
  { symbol: 'XLE', name: 'Energy',          change: 2.1 },
  { symbol: 'XLV', name: 'Healthcare',      change: 0.1 },
  { symbol: 'XLY', name: 'Consumer Disc.',  change: -1.1 },
  { symbol: 'XLI', name: 'Industrials',     change: 0.4 },
  { symbol: 'XLP', name: 'Consumer Staples', change: -0.6 },
  { symbol: 'XLU', name: 'Utilities',       change: 1.8 },
  { symbol: 'XLB', name: 'Materials',       change: 0.3 },
  { symbol: 'XLRE', name: 'Real Estate',    change: -0.2 },
  { symbol: 'XLC', name: 'Communications',  change: -0.9 },
];

function heatColor(pct) {
  if (pct <= -1.5) return '#881337';
  if (pct <= -0.5) return '#BE123C';
  if (pct < 0)     return '#F43F5E';
  if (pct < 0.5)   return '#15803D';
  if (pct < 1.5)   return '#22C55E';
  return '#14532D';
}
function textColor(pct) { return Math.abs(pct) > 0.2 ? '#FFF' : '#A1A1AA'; }

export default function SectorHeatmap() {
  const [data, setData] = useState(FALLBACK);
  useEffect(() => { api.sectors().then(d => setData(d.sectors || d)).catch(() => {}); }, []);

  return (
    <Card padding={20}>
      <CardHead label="Sector heatmap · intraday" right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>11 of 11</span>}>
        <Pill tone="ai" dot>SPDR</Pill>
      </CardHead>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {data.map((s, i) => (
          <div key={i} style={{
            padding: 12, borderRadius: 8,
            background: heatColor(s.change), color: textColor(s.change),
            display: 'flex', flexDirection: 'column', gap: 4,
            minHeight: 70, transition: 'transform 200ms', cursor: 'pointer',
          }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>{s.symbol}</span>
            <span style={{ fontSize: 10, opacity: 0.8 }}>{s.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, marginTop: 'auto' }}>
              {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

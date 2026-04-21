import { useEffect, useState } from 'react';
import { Card, CardHead, Pill } from '../primitives.jsx';
import api from '../../api/client.js';

const FALLBACK = [
  { tone: 'pos', title: 'Tech sector momentum likely to carry the index higher into next session.', meta: 'XLK +1.4% · 3 megacaps beat · 0.71 conf', time: '2m' },
  { tone: 'warn', title: 'Unusual volume on XLF — 2.4× the 20-day average.', meta: 'Flagged anomaly · watch regional banks', time: '14m' },
  { tone: 'ai', title: 'VIX rising but still below the 30 threshold — no regime shift yet.', meta: 'VIX 24.3 → 24.8 intraday', time: '28m' },
  { tone: 'neg', title: 'Consumer discretionary lagging on weak retail data.', meta: 'XLY −1.1% · vs SPX −1.9% relative', time: '41m' },
];

export default function InsightPanel() {
  const [items, setItems] = useState(FALLBACK);
  useEffect(() => { api.insights().then(d => setItems(d.items || FALLBACK)).catch(() => {}); }, []);
  const colors = { pos: '#22C55E', warn: '#EAB308', ai: '#8B5CF6', neg: '#F43F5E' };
  return (
    <Card padding={20}>
      <CardHead label="Insights · live" right={<button style={{ background: 'transparent', border: 'none', color: 'var(--fg-tertiary)', fontSize: 11, cursor: 'pointer' }}>View all →</button>}>
        <Pill tone="ai" dot glow>AI</Pill>
      </CardHead>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.slice(0, 4).map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
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

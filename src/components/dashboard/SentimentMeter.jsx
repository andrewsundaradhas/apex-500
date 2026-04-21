import { useEffect, useState } from 'react';
import { Card, CardHead } from '../primitives.jsx';
import api from '../../api/client.js';

export default function SentimentMeter() {
  const [val, setVal] = useState(62);
  const [label, setLabel] = useState('Moderately bullish');
  const [n, setN] = useState(0);

  useEffect(() => {
    api.sentiment().then(d => {
      if (typeof d?.score === 'number') setVal(d.score);
      if (d?.label) setLabel(d.label);
      if (d?.n) setN(d.n);
    }).catch(() => {});
  }, []);

  const angle = -90 + (val / 100) * 180;
  const color = val > 55 ? '#22C55E' : val < 45 ? '#F43F5E' : '#EAB308';

  return (
    <Card padding={20}>
      <CardHead label="Market sentiment · news-based" />
      <div style={{ position: 'relative', height: 120, display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 200 110" width="100%" height="120">
          <defs>
            <linearGradient id="sentGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="50%" stopColor="#70707A" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>
          </defs>
          <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#sentGrad)" strokeWidth="10" strokeLinecap="round" opacity="0.35" />
          <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#sentGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(val / 100) * 251}, 251`} />
          <g transform={`translate(100,100) rotate(${angle})`}>
            <line x1="0" y1="0" x2="0" y2="-70" stroke="#EDEDEF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="0" cy="0" r="6" fill="#141416" stroke="#8B5CF6" strokeWidth="2" />
          </g>
          <text x="20" y="112" fontSize="9" fontFamily="monospace" fill="#70707A">Bearish</text>
          <text x="160" y="112" fontSize="9" fontFamily="monospace" fill="#70707A">Bullish</text>
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
        <span style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{label}{n ? ` · ${n} headlines` : ''}</span>
      </div>
    </Card>
  );
}

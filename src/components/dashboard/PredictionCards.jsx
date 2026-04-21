import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Pill } from '../primitives.jsx';
import api from '../../api/client.js';

const FALLBACK = [
  { horizon: 'Next session', label: '1D', price: 5226.18, delta: 0.15, confidence: 68, model: 'LSTM v4.1', tone: 'pos', series: [5218, 5220, 5219, 5222, 5225, 5224, 5226] },
  { horizon: 'Next 5 days',  label: '5D', price: 5264.10, delta: 0.87, confidence: 72, model: 'Transformer-L', tone: 'pos', series: [5218, 5225, 5238, 5240, 5252, 5258, 5264] },
  { horizon: 'Next month',   label: '1M', price: 5318.40, delta: 1.92, confidence: 63, model: 'Ensemble',   tone: 'pos', series: [5218, 5230, 5246, 5260, 5278, 5298, 5318] },
];

export default function PredictionCards() {
  const navigate = useNavigate();
  const [cards, setCards] = useState(FALLBACK);

  useEffect(() => {
    Promise.all([
      api.predict('SPX', '1d', 'lstm').catch(() => null),
      api.predict('SPX', '5d', 'transformer').catch(() => null),
      api.predict('SPX', '1m', 'ensemble').catch(() => null),
    ]).then(([a, b, c]) => {
      const out = [];
      if (a) out.push({ horizon: 'Next session', label: '1D', price: a.target, delta: a.delta_pct, confidence: Math.round(a.confidence * 100), model: a.model, tone: a.delta_pct >= 0 ? 'pos' : 'neg', series: a.series });
      if (b) out.push({ horizon: 'Next 5 days', label: '5D', price: b.target, delta: b.delta_pct, confidence: Math.round(b.confidence * 100), model: b.model, tone: b.delta_pct >= 0 ? 'pos' : 'neg', series: b.series });
      if (c) out.push({ horizon: 'Next month', label: '1M', price: c.target, delta: c.delta_pct, confidence: Math.round(c.confidence * 100), model: c.model, tone: c.delta_pct >= 0 ? 'pos' : 'neg', series: c.series });
      if (out.length) setCards(out);
    });
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {cards.map((c, i) => <PredictionCard key={i} {...c} onClick={() => navigate(`/predictions/${c.label.toLowerCase()}`)} />)}
    </div>
  );
}

function PredictionCard({ horizon, label, price, delta, confidence, model, tone, series, onClick }) {
  const color = tone === 'pos' ? '#22C55E' : '#F43F5E';
  const min = Math.min(...series);
  const max = Math.max(...series);
  const path = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (series.length - 1)) * 100},${40 - ((v - min) / (max - min || 1)) * 32 - 4}`).join(' ');

  return (
    <Card padding={16} style={{ cursor: 'pointer', transition: 'all 200ms var(--ease-out)' }}>
      <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>{horizon}</span>
          <Pill tone="ai" dot>{label}</Pill>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {price.toFixed(2)}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, fontVariantNumeric: 'tabular-nums' }}>
            {delta >= 0 ? '▲' : '▼'} {delta >= 0 ? '+' : ''}{delta.toFixed(2)}%
          </span>
        </div>
        <svg viewBox="0 0 100 40" style={{ width: '100%', height: 40 }}>
          <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--fg-tertiary)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{model}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 40, height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${confidence}%`, height: '100%', background: 'var(--accent-primary)' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{confidence}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

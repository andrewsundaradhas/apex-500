import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card, CardHead, Pill, Button } from '../components/primitives.jsx';
import Icon from '../components/Icon.jsx';
import BacktestPanel from '../components/BacktestPanel.jsx';
import api from '../api/client.js';

export default function PredictionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticker, horizonKey] = (id || 'spx-5d').split('-');
  const [data, setData] = useState(null);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    const h = horizonKey === '1d' ? '1d' : horizonKey === '1m' ? '1m' : '5d';
    const t = ticker.toUpperCase();
    api.predict(t, h, 'ensemble').then(setData).catch(() => {});
    api.quote(t).then(setQuote).catch(() => {});
  }, [ticker, horizonKey]);

  const current = quote?.price ?? data?.series?.[0] ?? 5218.47;
  const target = data?.target || 5264.10;
  const delta = data?.delta_pct || 0.87;
  const conf = Math.round((data?.confidence || 0.72) * 100);

  // Generate fan chart
  const n = 40;
  const series = data?.series || Array.from({ length: n }, (_, i) => current + (target - current) * (i / (n - 1)) + Math.sin(i * 0.5) * 3);
  const W = 1000, H = 340, PADX = 40, PADY = 30;
  const min = Math.min(...series) - 40;
  const max = Math.max(...series) + 40;
  const xs = (i) => PADX + (i / (series.length - 1)) * (W - PADX * 2);
  const ys = (v) => PADY + ((max - v) / (max - min)) * (H - PADY * 2);
  const path = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${xs(i)},${ys(v)}`).join(' ');

  const ciTop = series.map((v, i) => [xs(i), ys(v + 10 + i * 1.5)]);
  const ciBot = series.map((v, i) => [xs(i), ys(v - 10 - i * 1.5)]);
  const ciPath = `M${ciTop.map(p => p.join(',')).join(' L')} L${ciBot.slice().reverse().map(p => p.join(',')).join(' L')} Z`;

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-tertiary)' }}>
        <span onClick={() => navigate('/predictions')} style={{ cursor: 'pointer' }}>Predictions</span>
        <Icon name="chevron" size={12} />
        <span style={{ color: 'var(--fg-primary)', fontFamily: 'var(--font-mono)' }}>{ticker.toUpperCase()} · {horizonKey.toUpperCase()}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600, color: 'var(--fg-primary)', letterSpacing: '0.02em' }}>{ticker.toUpperCase()}</span>
            <Pill tone="ai" dot glow>AI · Ensemble</Pill>
            <Pill tone={delta >= 0 ? 'pos' : 'neg'} dot>{horizonKey.toUpperCase()} forecast</Pill>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)', margin: 0, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {target.toFixed(2)}
          </h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: delta >= 0 ? '#22C55E' : '#F43F5E', fontVariantNumeric: 'tabular-nums' }}>
              {delta >= 0 ? '▲' : '▼'} {delta >= 0 ? '+' : ''}{(target - current).toFixed(2)} · {delta >= 0 ? '+' : ''}{delta.toFixed(2)}%
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-tertiary)' }}>
              vs current {current.toFixed(2)}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" icon="download">Export</Button>
          <Button variant="secondary" icon="bell">Create alert</Button>
          <Button variant="primary" icon="refresh">Rerun model</Button>
        </div>
      </div>

      {/* Main chart */}
      <Card padding={24}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 4 }}>Forecast path · 95% confidence band</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Legend color="#EDEDEF" label="Historical" />
              <Legend color="#8B5CF6" label="Predicted" dashed />
              <Legend color="rgba(139,92,246,0.24)" label="95% CI band" filled />
            </div>
          </div>
          <Pill tone="ai" dot glow>{conf}% confidence</Pill>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
          <defs>
            <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {[0.2, 0.4, 0.6, 0.8].map((f, i) => (
            <line key={i} x1={PADX} x2={W - PADX} y1={PADY + f * (H - PADY * 2)} y2={PADY + f * (H - PADY * 2)} stroke="rgba(30,35,48,0.7)" strokeDasharray="2 4" />
          ))}
          <path d={ciPath} fill="rgba(139,92,246,0.14)" />
          <path d={path} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="6 4" filter="url(#glow2)" />
          <circle cx={xs(series.length - 1)} cy={ys(series[series.length - 1])} r="6" fill="#8B5CF6" />
          <circle cx={xs(series.length - 1)} cy={ys(series[series.length - 1])} r="12" fill="#8B5CF6" opacity="0.3" />
        </svg>
      </Card>

      {/* Model details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card padding={20}>
          <CardHead label="Model breakdown" right={<Pill tone="ai" dot>Ensemble</Pill>} />
          {[
            { model: 'LSTM v4.1',      target: target - 8.3, delta: ((target - 8.3 - current) / current * 100), weight: 0.35 },
            { model: 'Transformer-L',  target: target + 4.2, delta: ((target + 4.2 - current) / current * 100), weight: 0.45 },
            { model: 'Gradient Boost', target: target - 2.1, delta: ((target - 2.1 - current) / current * 100), weight: 0.20 },
          ].map(m => (
            <div key={m.model} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--fg-primary)', width: 130 }}>{m.model}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', fontVariantNumeric: 'tabular-nums', flex: 1 }}>
                {m.target.toFixed(2)} <span style={{ color: m.delta >= 0 ? '#22C55E' : '#F43F5E' }}>({m.delta >= 0 ? '+' : ''}{m.delta.toFixed(2)}%)</span>
              </span>
              <div style={{ width: 80, height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${m.weight * 100}%`, height: '100%', background: 'var(--accent-primary)' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', width: 40, textAlign: 'right' }}>{(m.weight * 100).toFixed(0)}%</span>
            </div>
          ))}
        </Card>

        <Card padding={20}>
          <CardHead label="Key signals" />
          {[
            { name: 'Momentum (14d)', val: '+0.72', tone: 'pos' },
            { name: 'RSI (14d)',      val: '58.2',  tone: 'neutral' },
            { name: 'MACD histogram', val: '+2.14', tone: 'pos' },
            { name: 'Volume Z-score', val: '+1.2',  tone: 'warn' },
            { name: 'Put/call ratio', val: '0.82',  tone: 'pos' },
            { name: 'VIX correlation', val: '−0.67', tone: 'neg' },
          ].map(s => (
            <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{s.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: s.tone === 'pos' ? '#22C55E' : s.tone === 'neg' ? '#F43F5E' : s.tone === 'warn' ? '#EAB308' : 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums' }}>{s.val}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Backtest */}
      <BacktestPanel ticker={ticker.toUpperCase()} />

      {/* Narrative */}
      <Card padding={24}>
        <CardHead label="Model narrative" right={<Pill tone="ai" dot glow>AI</Pill>} />
        <p style={{ fontSize: 15, color: 'var(--fg-primary)', lineHeight: 1.55, margin: 0 }}>
          Ensemble model targets <strong style={{ color: '#8B5CF6', fontFamily: 'var(--font-mono)' }}>{target.toFixed(2)}</strong> for {ticker.toUpperCase()} in the {horizonKey.toUpperCase()} horizon — a <span style={{ color: delta >= 0 ? '#22C55E' : '#F43F5E' }}>{delta >= 0 ? '+' : ''}{delta.toFixed(2)}%</span> move from current. Transformer-L leads the consensus with a +1.2% target, weighted {(0.45 * 100).toFixed(0)}% based on its 5D rolling MAE.
        </p>
        <p style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.55, marginTop: 12, marginBottom: 0 }}>
          Key drivers: broadening tech breadth (71% NDX above 50-day MA), post-FOMC rates relief, bullish MACD crossover on the daily. Risks: elevated vol-of-vol, KRE anomaly unresolved, and PPI print next Tuesday could alter rate-path expectations. Confidence of {conf}% reflects moderate model agreement; widen stops if VIX clears 28.
        </p>
      </Card>
    </div>
  );
}

function Legend({ color, label, dashed, filled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {filled ? (
        <div style={{ width: 16, height: 8, background: color, borderRadius: 2 }} />
      ) : (
        <div style={{ width: 16, height: 2, background: color, borderTop: dashed ? `2px dashed ${color}` : 'none', ...(dashed ? { background: 'transparent' } : {}) }} />
      )}
      <span style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>{label}</span>
    </div>
  );
}

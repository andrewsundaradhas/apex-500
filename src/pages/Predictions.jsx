import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Pill, Button } from '../components/primitives.jsx';
import Icon from '../components/Icon.jsx';
import api from '../api/client.js';

const MODEL_PERF_FALLBACK = [
  { label: 'LSTM v4.1',      hit: 71, mae: 0.82, win: 63, series: [0.5, 0.6, 0.55, 0.7, 0.72, 0.69, 0.71] },
  { label: 'Transformer-L',  hit: 74, mae: 0.76, win: 67, series: [0.6, 0.58, 0.65, 0.72, 0.74, 0.73, 0.74] },
  { label: 'Ensemble',       hit: 77, mae: 0.68, win: 72, series: [0.62, 0.65, 0.70, 0.73, 0.76, 0.75, 0.77] },
];

const MOCK_PREDICTIONS = [
  { id: 'spx-1d',  ticker: 'SPX',  horizon: 'Next session', target: 5226.18, delta: 0.15, conf: 68, model: 'LSTM v4.1',    risk: 'Low',    range: '5208 – 5242' },
  { id: 'spx-5d',  ticker: 'SPX',  horizon: 'Next 5 days',  target: 5264.10, delta: 0.87, conf: 72, model: 'Transformer-L', risk: 'Med',    range: '5180 – 5348' },
  { id: 'spx-1m',  ticker: 'SPX',  horizon: 'Next month',   target: 5318.40, delta: 1.92, conf: 63, model: 'Ensemble',     risk: 'Med',    range: '5100 – 5512' },
  { id: 'ndx-5d',  ticker: 'NDX',  horizon: 'Next 5 days',  target: 18240.0, delta: 1.10, conf: 69, model: 'Transformer-L', risk: 'Med',    range: '17980 – 18480' },
  { id: 'aapl-5d', ticker: 'AAPL', horizon: 'Next 5 days',  target: 187.80,  delta: 1.94, conf: 74, model: 'LSTM v4.1',    risk: 'Low',    range: '183.5 – 191.5' },
  { id: 'nvda-1m', ticker: 'NVDA', horizon: 'Next month',   target: 980.20,  delta: 7.43, conf: 58, model: 'Ensemble',     risk: 'High',   range: '842 – 1100' },
  { id: 'tsla-5d', ticker: 'TSLA', horizon: 'Next 5 days',  target: 168.40,  delta: -1.88, conf: 61, model: 'Transformer-L', risk: 'High', range: '160 – 178' },
  { id: 'vix-1d',  ticker: 'VIX',  horizon: 'Next session', target: 23.80,   delta: -2.10, conf: 65, model: 'LSTM v4.1',    risk: 'Low',    range: '22.4 – 25.2' },
];

export default function Predictions() {
  const navigate = useNavigate();
  const [model, setModel] = useState('all');
  const [horizon, setHorizon] = useState('all');
  const [data] = useState(MOCK_PREDICTIONS);

  const filtered = data.filter(d =>
    (model === 'all' || d.model.toLowerCase().includes(model)) &&
    (horizon === 'all' || d.horizon.toLowerCase().includes(horizon))
  );

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero */}
      <div style={{
        position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--purple-deep), var(--purple-midnight))',
        border: '1px solid var(--purple-border)', padding: '32px 32px 28px',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, background: 'radial-gradient(circle, rgba(139,92,246,0.25), transparent 60%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative' }}>
          <Pill tone="ai" dot glow>AI-generated · updated 2m ago</Pill>
          <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', margin: '12px 0 8px', color: '#EDEDEF' }}>Predictions</h1>
          <p style={{ fontSize: 14, color: '#C4B5FD', maxWidth: 600, margin: 0 }}>
            Latest forecasts across all watchlist tickers. Every prediction ships with its model, confidence, and 95% range.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            <HeroStat label="Active models" value="3" />
            <HeroStat label="Predictions today" value="124" />
            <HeroStat label="5D hit rate" value="72%" tone="pos" />
            <HeroStat label="Avg confidence" value="68%" />
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'linear-gradient(90deg, var(--purple-tint-1), var(--bg-surface) 50%)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>Model</span>
        <Seg value={model} onChange={setModel} options={[['all','All'],['lstm','LSTM'],['transformer','Transformer'],['ensemble','Ensemble']]} />
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500, marginLeft: 16 }}>Horizon</span>
        <Seg value={horizon} onChange={setHorizon} options={[['all','All'],['session','1D'],['5 days','5D'],['month','1M']]} />
        <div style={{ flex: 1 }} />
        <Button icon="filter" variant="ghost" size="sm">More filters</Button>
        <Button icon="download" variant="secondary" size="sm">Export</Button>
      </div>

      {/* Prediction table */}
      <Card padding={0}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--purple-tint-1)' }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>{filtered.length} predictions</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Pill tone="ai" dot glow>Live · streaming</Pill>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--purple-tint-1)' }}>
              {['Ticker', 'Horizon', 'Target', 'Δ%', 'Range (95%)', 'Model', 'Risk', 'Confidence', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500, borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <PredictionRow key={p.id} {...p} last={i === filtered.length - 1} onClick={() => navigate(`/predictions/${p.id}`)} />
            ))}
          </tbody>
        </table>
      </Card>

      {/* Performance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <PerfCard label="LSTM v4.1" hit={71} mae={0.82} win={63} series={[0.5,0.6,0.55,0.7,0.72,0.69,0.71]} />
        <PerfCard label="Transformer-L" hit={74} mae={0.76} win={67} series={[0.6,0.58,0.65,0.72,0.74,0.73,0.74]} />
        <PerfCard label="Ensemble" hit={77} mae={0.68} win={72} series={[0.62,0.65,0.70,0.73,0.76,0.75,0.77]} />
      </div>
    </div>
  );
}

function HeroStat({ label, value, tone }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, color: tone === 'pos' ? '#22C55E' : '#EDEDEF', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#A78BFA', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Seg({ value, onChange, options }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
      {options.map(([v, l]) => {
        const on = value === v;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            background: on ? 'var(--purple-deep)' : 'transparent',
            border: on ? '1px solid var(--purple-border)' : '1px solid transparent',
            padding: '4px 12px', fontSize: 12, fontWeight: 500, borderRadius: 6, cursor: 'pointer',
            color: on ? '#E9E4FE' : 'var(--fg-secondary)',
          }}>{l}</button>
        );
      })}
    </div>
  );
}

function PredictionRow({ ticker, horizon, target, delta, range, model, risk, conf, last, onClick }) {
  const [hov, setHov] = useState(false);
  const color = delta >= 0 ? '#22C55E' : '#F43F5E';
  const riskColor = { Low: '#22C55E', Med: '#EAB308', High: '#F43F5E' }[risk];
  return (
    <tr onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ cursor: 'pointer', background: hov ? 'var(--purple-tint-1)' : 'transparent', transition: 'background 100ms' }}>
      <td style={{ padding: '12px 16px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)', letterSpacing: '0.04em' }}>{ticker}</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--fg-secondary)', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{horizon}</td>
      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{target.toFixed(2)}</td>
      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color, fontVariantNumeric: 'tabular-nums', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{delta >= 0 ? '+' : ''}{delta.toFixed(2)}%</td>
      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{range}</td>
      <td style={{ padding: '12px 16px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--purple-deep)', color: '#C4B5FD', border: '1px solid var(--purple-border)' }}>{model}</span>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: riskColor }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: riskColor }} />{risk}
        </span>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 60, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${conf}%`, height: '100%', background: 'var(--accent-primary)' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-secondary)', fontVariantNumeric: 'tabular-nums' }}>{conf}%</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <Icon name="chevron" size={14} style={{ color: 'var(--fg-tertiary)' }} />
      </td>
    </tr>
  );
}

function PerfCard({ label, hit, mae, win, series }) {
  const min = Math.min(...series), max = Math.max(...series);
  const path = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (series.length - 1)) * 100},${40 - ((v - min) / (max - min || 1)) * 32 - 4}`).join(' ');
  return (
    <Card padding={20} style={{ borderTop: '2px solid var(--accent-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)' }}>{label}</span>
        <Pill tone="ai" dot>Model</Pill>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <Metric label="Hit rate" value={`${hit}%`} tone="pos" />
        <Metric label="MAE" value={mae.toFixed(2)} />
        <Metric label="Win %" value={`${win}%`} />
      </div>
      <svg viewBox="0 0 100 40" style={{ width: '100%', height: 40 }}>
        <path d={path} stroke="var(--accent-primary)" strokeWidth="1.5" fill="none" />
      </svg>
    </Card>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: tone === 'pos' ? '#22C55E' : 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { Card, Pill } from '../primitives.jsx';
import api from '../../api/client.js';

function buildSeries(n, start, vol, drift, seed = 1) {
  const rng = mulberry(seed);
  const out = [start];
  for (let i = 1; i < n; i++) {
    const change = (Math.sin(i * 0.3) * 0.3 + (rng() - 0.5)) * vol + drift;
    out.push(out[i - 1] + change);
  }
  return out;
}
function mulberry(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const FALLBACK = {
  '1D': buildSeries(78, 5176, 2.2, 0.55, 1),
  '1W': buildSeries(120, 5120, 4, 0.8, 2),
  '1M': buildSeries(160, 5060, 6, 1.0, 3),
  '1Y': buildSeries(220, 4600, 10, 2.8, 4),
  '5Y': buildSeries(260, 3400, 14, 7, 5),
};

export default function HeroChart({ timeframe, onTimeframe }) {
  const [hoverX, setHoverX] = useState(null);
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.history('SPX', timeframe).then(d => { if (!cancelled) setLiveData(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, [timeframe]);

  const points = liveData?.close || FALLBACK[timeframe];
  const W = 1000, H = 320, PADX = 40, PADY = 20;
  const histEnd = Math.floor(points.length * 0.78);
  const hist = points.slice(0, histEnd);
  const pred = points.slice(histEnd - 1);

  const min = Math.min(...points) - 20;
  const max = Math.max(...points) + 20;
  const xStep = (W - PADX * 2) / (points.length - 1);
  const yScale = (v) => PADY + ((max - v) / (max - min)) * (H - PADY * 2);

  const histPath = hist.map((v, i) => `${i === 0 ? 'M' : 'L'}${PADX + i * xStep},${yScale(v)}`).join(' ');
  const predPath = pred.map((v, i) => `${i === 0 ? 'M' : 'L'}${PADX + (histEnd - 1 + i) * xStep},${yScale(v)}`).join(' ');

  const ciTop = pred.map((v, i) => [PADX + (histEnd - 1 + i) * xStep, yScale(v + 15 + i * 0.8)]);
  const ciBot = pred.map((v, i) => [PADX + (histEnd - 1 + i) * xStep, yScale(v - 15 - i * 0.8)]);
  const ciPath = `M${ciTop.map(p => p.join(',')).join(' L')} L${ciBot.slice().reverse().map(p => p.join(',')).join(' L')} Z`;

  const nowX = PADX + (histEnd - 1) * xStep;
  const lastV = points[points.length - 1];
  const lastX = PADX + (points.length - 1) * xStep;
  const currY = yScale(points[histEnd - 1]);
  const hoverIdx = hoverX != null ? Math.max(0, Math.min(points.length - 1, Math.round((hoverX - PADX) / xStep))) : null;
  const hoverV = hoverIdx != null ? points[hoverIdx] : null;

  const timeframes = ['1D', '1W', '1M', '1Y', '5Y'];
  const startV = points[0];
  const changePct = ((lastV - startV) / startV) * 100;

  return (
    <Card padding={24}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-tertiary)', letterSpacing: '0.04em' }}>SPX · S&amp;P 500</span>
            <Pill tone="ai" dot glow>AI forecast</Pill>
            {liveData && <Pill tone="pos" dot>Live data</Pill>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {lastV.toFixed(2)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: changePct >= 0 ? '#22C55E' : '#F43F5E', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
              {changePct >= 0 ? '▲' : '▼'} {(lastV - startV).toFixed(2)} · {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div style={{ display: 'inline-flex', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 2, height: 'fit-content' }}>
          {timeframes.map(t => (
            <button key={t} onClick={() => onTimeframe(t)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
              background: timeframe === t ? 'var(--bg-elevated)' : 'transparent',
              color: timeframe === t ? 'var(--fg-primary)' : 'var(--fg-secondary)',
              border: 'none', padding: '5px 14px', borderRadius: 4, cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 320, display: 'block', cursor: 'crosshair' }}
        onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setHoverX(((e.clientX - r.left) / r.width) * W); }}
        onMouseLeave={() => setHoverX(null)}>
        <defs>
          <linearGradient id="priceFillHero" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(245,247,250,0.15)" />
            <stop offset="100%" stopColor="rgba(245,247,250,0)" />
          </linearGradient>
          <filter id="glowHero" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {[0.2, 0.4, 0.6, 0.8].map((f, i) => (
          <line key={i} x1={PADX} x2={W - PADX} y1={PADY + f * (H - PADY * 2)} y2={PADY + f * (H - PADY * 2)} stroke="rgba(30,35,48,0.7)" strokeDasharray="2 4" />
        ))}
        <path d={`${histPath} L${nowX},${H - PADY} L${PADX},${H - PADY} Z`} fill="url(#priceFillHero)" />
        <path d={histPath} fill="none" stroke="#EDEDEF" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
        <path d={ciPath} fill="rgba(139,92,246,0.14)" />
        <path d={predPath} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" filter="url(#glowHero)" />
        <line x1={nowX} x2={nowX} y1={PADY} y2={H - PADY} stroke="#46464E" strokeDasharray="3 4" />
        <text x={nowX + 6} y={PADY + 12} fill="#70707A" fontSize="10" fontFamily="monospace">NOW</text>
        <circle cx={nowX} cy={currY} r="4" fill="#EDEDEF" />
        <circle cx={lastX} cy={yScale(lastV)} r="4" fill="#8B5CF6" />
        <circle cx={lastX} cy={yScale(lastV)} r="8" fill="#8B5CF6" opacity="0.3" />
        {hoverIdx != null && (
          <g>
            <line x1={PADX + hoverIdx * xStep} x2={PADX + hoverIdx * xStep} y1={PADY} y2={H - PADY} stroke="#70707A" />
            <circle cx={PADX + hoverIdx * xStep} cy={yScale(hoverV)} r="3.5" fill={hoverIdx >= histEnd - 1 ? '#8B5CF6' : '#EDEDEF'} />
          </g>
        )}
      </svg>

      {hoverIdx != null && (
        <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', display: 'flex', gap: 16 }}>
          <span>@{hoverIdx}</span>
          <span style={{ color: 'var(--fg-primary)' }}>{hoverV.toFixed(2)}</span>
          {hoverIdx >= histEnd - 1 && <Pill tone="ai" dot>Predicted</Pill>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
        <OverlayToggle label="Prediction" on color="#8B5CF6" />
        <OverlayToggle label="CI band" on color="#8B5CF6" />
        <OverlayToggle label="MA-50" color="#38BDF8" />
        <OverlayToggle label="MA-200" color="#EAB308" />
        <OverlayToggle label="RSI" />
        <OverlayToggle label="MACD" />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--fg-tertiary)' }}>
          <Pill tone="ai" dot glow>LSTM v4.1</Pill>
          <span>·</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>72% conf</span>
        </div>
      </div>
    </Card>
  );
}

function OverlayToggle({ label, on, color }) {
  const [state, setState] = useState(!!on);
  return (
    <button onClick={() => setState(!state)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 'var(--radius-sm)',
      background: state ? 'var(--bg-elevated)' : 'transparent',
      border: `1px solid ${state ? 'var(--border-default)' : 'var(--border-subtle)'}`,
      color: state ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
      fontSize: 11, cursor: 'pointer',
    }}>
      <span style={{ width: 8, height: 2, background: state && color ? color : 'var(--fg-quaternary)', borderRadius: 1 }} />
      {label}
    </button>
  );
}

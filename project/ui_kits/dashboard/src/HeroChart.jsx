/* global React */
const { useState: useStateHC, useMemo: useMemoHC } = React;

// Generate plausible price data
function buildSeries(n, start, vol, drift) {
  const out = [start];
  for (let i = 1; i < n; i++) {
    const change = (Math.sin(i * 0.3) * 0.3 + (Math.random() - 0.5)) * vol + drift;
    out.push(out[i-1] + change);
  }
  return out;
}

const SERIES_CACHE = {
  '1D': buildSeries(78, 5176, 2.2, 0.55),
  '1W': buildSeries(120, 5120, 4, 0.8),
  '1M': buildSeries(160, 5060, 6, 1.0),
  '1Y': buildSeries(220, 4600, 10, 2.8),
  '5Y': buildSeries(260, 3400, 14, 7),
};

function HeroChart({ timeframe, onTimeframe }) {
  const [hoverX, setHoverX] = useStateHC(null);
  const points = SERIES_CACHE[timeframe];
  const W = 1000, H = 320;
  const PADX = 40, PADY = 20;
  const histEnd = Math.floor(points.length * 0.78);
  const hist = points.slice(0, histEnd);
  const pred = points.slice(histEnd - 1); // prediction continues

  const min = Math.min(...points) - 20;
  const max = Math.max(...points) + 20;
  const xStep = (W - PADX * 2) / (points.length - 1);
  const yScale = (v) => PADY + ((max - v) / (max - min)) * (H - PADY * 2);

  const histPath = hist.map((v, i) => `${i === 0 ? 'M' : 'L'}${PADX + i * xStep},${yScale(v)}`).join(' ');
  const predPath = pred.map((v, i) => `${i === 0 ? 'M' : 'L'}${PADX + (histEnd - 1 + i) * xStep},${yScale(v)}`).join(' ');

  // Confidence band
  const ciTop = pred.map((v, i) => [PADX + (histEnd - 1 + i) * xStep, yScale(v + 15 + i * 0.8)]);
  const ciBot = pred.map((v, i) => [PADX + (histEnd - 1 + i) * xStep, yScale(v - 15 - i * 0.8)]);
  const ciPath = `M${ciTop.map(p => p.join(',')).join(' L')} L${ciBot.slice().reverse().map(p => p.join(',')).join(' L')} Z`;

  const nowX = PADX + (histEnd - 1) * xStep;
  const lastV = points[points.length - 1];
  const lastX = PADX + (points.length - 1) * xStep;
  const currV = points[histEnd - 1];
  const currY = yScale(currV);

  const hoverIdx = hoverX != null ? Math.max(0, Math.min(points.length - 1, Math.round((hoverX - PADX) / xStep))) : null;
  const hoverV = hoverIdx != null ? points[hoverIdx] : null;

  const timeframes = ['1D','1W','1M','1Y','5Y'];

  return (
    <Card padding={24}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className="ticker" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-tertiary)', letterSpacing: '0.04em' }}>SPX · S&amp;P 500</span>
            <Pill tone="ai" dot glow>AI forecast</Pill>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {lastV.toFixed(2)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: '#22C55E', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
              ▲ +{(lastV - points[0]).toFixed(2)} · +{(((lastV - points[0]) / points[0]) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
        {/* Timeframe */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 2 }}>
          {timeframes.map(t => (
            <button key={t} onClick={() => onTimeframe(t)} style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
              background: timeframe === t ? 'var(--bg-elevated)' : 'transparent',
              color: timeframe === t ? 'var(--fg-primary)' : 'var(--fg-secondary)',
              border: 'none', padding: '5px 14px', borderRadius: 4, cursor: 'pointer',
              boxShadow: timeframe === t ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 320, display: 'block', cursor: 'crosshair' }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          setHoverX(x);
        }}
        onMouseLeave={() => setHoverX(null)}
      >
        <defs>
          <linearGradient id="priceFillHero" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(245,247,250,0.15)"/>
            <stop offset="100%" stopColor="rgba(245,247,250,0)"/>
          </linearGradient>
          <filter id="glowHero" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {[0.2, 0.4, 0.6, 0.8].map((f, i) => (
          <line key={i} x1={PADX} x2={W - PADX} y1={PADY + f * (H - PADY * 2)} y2={PADY + f * (H - PADY * 2)} stroke="rgba(30,35,48,0.7)" strokeWidth="1" strokeDasharray="2 4"/>
        ))}

        {/* Price line + fill */}
        <path d={`${histPath} L${nowX},${H - PADY} L${PADX},${H - PADY} Z`} fill="url(#priceFillHero)"/>
        <path d={histPath} fill="none" stroke="#EDEDEF" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round"/>

        {/* CI band */}
        <path d={ciPath} fill="rgba(139, 92, 246,0.14)"/>

        {/* Prediction line */}
        <path d={predPath} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" filter="url(#glowHero)"/>

        {/* Now marker */}
        <line x1={nowX} x2={nowX} y1={PADY} y2={H - PADY} stroke="#46464E" strokeWidth="1" strokeDasharray="3 4"/>
        <text x={nowX + 6} y={PADY + 12} fill="#70707A" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.04em">NOW</text>
        <circle cx={nowX} cy={currY} r="4" fill="#EDEDEF"/>
        <circle cx={lastX} cy={yScale(lastV)} r="4" fill="#8B5CF6"/>
        <circle cx={lastX} cy={yScale(lastV)} r="8" fill="#8B5CF6" opacity="0.3"/>

        {/* Hover */}
        {hoverIdx != null && (
          <g>
            <line x1={PADX + hoverIdx * xStep} x2={PADX + hoverIdx * xStep} y1={PADY} y2={H - PADY} stroke="#70707A" strokeWidth="1"/>
            <circle cx={PADX + hoverIdx * xStep} cy={yScale(hoverV)} r="3.5" fill={hoverIdx >= histEnd - 1 ? '#8B5CF6' : '#EDEDEF'}/>
          </g>
        )}

        {/* Y labels */}
        {[0.1, 0.5, 0.9].map((f, i) => {
          const v = max - f * (max - min);
          return <text key={i} x={W - PADX + 6} y={PADY + f * (H - PADY*2) + 3} fill="#70707A" fontSize="10" fontFamily="var(--font-mono)">{v.toFixed(0)}</text>;
        })}
      </svg>

      {/* Hover tooltip */}
      {hoverIdx != null && (
        <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-secondary)', display: 'flex', gap: 16 }}>
          <span>@{hoverIdx}</span>
          <span style={{ color: 'var(--fg-primary)' }}>{hoverV.toFixed(2)}</span>
          {hoverIdx >= histEnd - 1 && <Pill tone="ai" dot>Predicted</Pill>}
        </div>
      )}

      {/* Overlay toggles */}
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
  const [state, setState] = useStateHC(!!on);
  return (
    <button onClick={() => setState(!state)} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 'var(--radius-sm)',
      background: state ? 'var(--bg-elevated)' : 'transparent',
      border: `1px solid ${state ? 'var(--border-default)' : 'var(--border-subtle)'}`,
      color: state ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
      fontSize: 11, fontFamily: 'var(--font-sans)', cursor: 'pointer',
    }}>
      <span style={{ width: 8, height: 2, background: state && color ? color : 'var(--fg-quaternary)', borderRadius: 1 }} />
      {label}
    </button>
  );
}

Object.assign(window, { HeroChart });

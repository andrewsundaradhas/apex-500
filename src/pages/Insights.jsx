import { useEffect, useState } from 'react';
import { Card, CardHead, Pill, Button } from '../components/primitives.jsx';
import Icon from '../components/Icon.jsx';
import api from '../api/client.js';

const FALLBACK = [
  { tone: 'pos',  category: 'Momentum',   title: 'Tech sector momentum carries the index higher into next session.', body: 'XLK closed +1.4% with three megacaps (NVDA, MSFT, AAPL) posting earnings beats. Breadth is broadening — 71% of Nasdaq 100 names above their 50-day MA for the first time since Feb.', meta: 'XLK +1.4% · 3 megacaps beat · 0.71 conf', time: '2m', signals: ['XLK breadth', 'Megacap beats', 'Volume flow'] },
  { tone: 'warn', category: 'Anomaly',    title: 'Unusual volume on XLF — 2.4× the 20-day average.', body: 'Regional bank ETF KRE accounts for 34% of the volume spike. Options flow skewed bearish with put/call ratio at 1.8. Model flags this as a watch-list event, not yet a sell signal.', meta: 'Flagged anomaly · 24h cooldown', time: '14m', signals: ['Volume spike', 'Options skew', 'KRE concentration'] },
  { tone: 'ai',   category: 'Regime',     title: 'VIX rising but still below the 30 threshold — no regime shift yet.', body: 'VIX climbed from 24.3 to 24.8 intraday on light catalysts. Model\'s regime classifier remains in "risk-on" with 0.68 probability. A move above 30 would reclassify.', meta: 'VIX 24.3 → 24.8', time: '28m', signals: ['VIX level', 'Regime classifier', 'Term structure'] },
  { tone: 'neg',  category: 'Divergence', title: 'Consumer discretionary lagging on weak retail data.', body: 'April retail sales came in at +0.1% vs +0.4% expected. XLY down -1.1% on the day vs SPX -0.2%, a -1.9% relative underperformance. Model sees 3-day persistence risk.', meta: 'XLY −1.1% · −1.9% rel.', time: '41m', signals: ['Retail miss', 'Relative strength', 'Sector rotation'] },
  { tone: 'pos',  category: 'Technical',  title: 'SPX cleared 5,200 resistance with volume confirmation.', body: 'Index closed at 5,218 above the key 5,200 level that capped rallies in March and April. Closing volume 1.2× 20-day avg. MACD crossed bullish on the daily.', meta: 'Resistance cleared · +0.82%', time: '1h', signals: ['Resistance break', 'Volume confirm', 'MACD cross'] },
  { tone: 'ai',   category: 'Macro',      title: 'Fed minutes signal patience on rate cuts — dovish skew.', body: 'FOMC minutes released at 14:00 show several members comfortable holding rates. Model reads this as incrementally dovish vs Powell\'s hawkish press conference. 10-year yields fell 4bps on release.', meta: 'FOMC · 10yr −4bps', time: '2h', signals: ['Fed minutes', '10yr move', 'Dollar reaction'] },
];

const CATEGORIES = ['All', 'Momentum', 'Anomaly', 'Regime', 'Technical', 'Macro', 'Divergence'];
const COLORS = { pos: '#22C55E', warn: '#EAB308', ai: '#8B5CF6', neg: '#F43F5E' };

export default function Insights() {
  const [items, setItems] = useState(FALLBACK);
  const [cat, setCat] = useState('All');
  const [expanded, setExpanded] = useState(null);
  useEffect(() => { api.insights().then(d => d?.items && setItems(d.items)).catch(() => {}); }, []);
  const filtered = cat === 'All' ? items : items.filter(i => i.category === cat);

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero */}
      <div style={{
        position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--purple-deep), var(--purple-midnight))',
        border: '1px solid var(--purple-border)', padding: '32px',
      }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 280, height: 280, background: 'radial-gradient(circle, rgba(139,92,246,0.25), transparent 60%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 32 }}>
          <div>
            <Pill tone="ai" dot glow>AI-generated · regenerated every 2m</Pill>
            <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', margin: '12px 0 8px', color: '#EDEDEF' }}>Insights</h1>
            <p style={{ fontSize: 14, color: '#C4B5FD', maxWidth: 600, margin: 0 }}>
              Plain-English analysis of the market's state, anomalies, and regime. Models monitor 120+ signals in real time and flag what matters.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <HeroStat value="124" label="Signals monitored" />
            <HeroStat value="14" label="Flagged today" tone="warn" />
            <HeroStat value="2m" label="Refresh cadence" />
          </div>
        </div>
      </div>

      {/* Top row: sentiment + anomaly */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card padding={20}>
          <CardHead label="Today's narrative" right={<Pill tone="ai" dot>AI</Pill>} />
          <p style={{ fontSize: 15, color: 'var(--fg-primary)', lineHeight: 1.55, margin: 0, marginBottom: 16 }}>
            Markets opened bid on <span style={{ color: '#22C55E' }}>strong megacap tech earnings</span> and digested dovish FOMC minutes. Breadth is broadening, with the Russell 2000 outperforming the SPX by +0.8%. <span style={{ color: '#EAB308' }}>Regional banks show anomalous volume</span> but no confirmed signal yet.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill tone="pos" dot>Bullish bias</Pill>
            <Pill tone="info" dot>Breadth improving</Pill>
            <Pill tone="warn" dot>1 anomaly</Pill>
          </div>
        </Card>

        <Card padding={20}>
          <CardHead label="Anomaly scanner" right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>3 flagged</span>} />
          {[
            { ticker: 'KRE', metric: 'Volume', z: 2.4, dir: 'up' },
            { ticker: 'GME', metric: 'Options', z: 3.1, dir: 'up' },
            { ticker: 'JPY', metric: 'Momentum', z: -2.2, dir: 'down' },
          ].map((a, i, arr) => (
            <div key={a.ticker} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)', width: 50 }}>{a.ticker}</span>
              <span style={{ fontSize: 12, color: 'var(--fg-secondary)', flex: 1 }}>{a.metric} anomaly</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: Math.abs(a.z) > 3 ? '#F43F5E' : '#EAB308', fontVariantNumeric: 'tabular-nums' }}>
                {a.z > 0 ? '+' : ''}{a.z.toFixed(1)}σ
              </div>
              <div style={{ width: 60, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(Math.abs(a.z) / 4, 1) * 100}%`, height: '100%', background: Math.abs(a.z) > 3 ? '#F43F5E' : '#EAB308' }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {CATEGORIES.map(c => {
          const on = cat === c;
          return (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: on ? 'var(--purple-deep)' : 'var(--bg-surface)',
              border: `1px solid ${on ? 'var(--purple-border)' : 'var(--border-subtle)'}`,
              color: on ? '#E9E4FE' : 'var(--fg-secondary)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>{c}</button>
          );
        })}
        <div style={{ flex: 1 }} />
        <Button icon="refresh" variant="ghost" size="sm">Regenerate</Button>
      </div>

      {/* Insight feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((it, i) => (
          <Card key={i} padding={0}>
            <div onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ padding: 20, cursor: 'pointer', display: 'flex', gap: 16 }}>
              <div style={{ width: 4, background: COLORS[it.tone], borderRadius: 2, flexShrink: 0, boxShadow: `0 0 8px ${COLORS[it.tone]}55` }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Pill tone={it.tone} dot>{it.category}</Pill>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', marginLeft: 'auto' }}>{it.time} ago</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--fg-primary)', margin: 0, lineHeight: 1.4 }}>{it.title}</h3>
                {expanded === i && (
                  <>
                    <p style={{ fontSize: 14, color: 'var(--fg-secondary)', lineHeight: 1.55, marginTop: 12, marginBottom: 12 }}>{it.body}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {it.signals.map(s => <Pill key={s} tone="neutral">{s}</Pill>)}
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: expanded === i ? 12 : 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>{it.meta}</span>
                </div>
              </div>
              <Icon name={expanded === i ? 'close' : 'chevronDown'} size={16} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HeroStat({ value, label, tone }) {
  const color = tone === 'warn' ? '#EAB308' : tone === 'pos' ? '#22C55E' : '#EDEDEF';
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#A78BFA', marginTop: 2 }}>{label}</div>
    </div>
  );
}

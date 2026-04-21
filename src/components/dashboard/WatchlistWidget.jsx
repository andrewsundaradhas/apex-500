import { useEffect, useState } from 'react';
import { Card } from '../primitives.jsx';
import Icon from '../Icon.jsx';
import api from '../../api/client.js';

const FALLBACK = [
  { tk: 'SPX',  name: 'S&P 500',      price: 5218.47, delta: 0.82, up: true, active: true },
  { tk: 'NDX',  name: 'Nasdaq 100',   price: 18042.10, delta: 1.14, up: true },
  { tk: 'DJI',  name: 'Dow Jones',    price: 38914.72, delta: -0.18, up: false },
  { tk: 'VIX',  name: 'Volatility',   price: 24.32, delta: 3.20, up: false, warn: true },
  { tk: 'AAPL', name: 'Apple',        price: 184.22, delta: 0.48, up: true },
  { tk: 'NVDA', name: 'Nvidia',       price: 912.40, delta: 2.18, up: true },
];

export default function WatchlistWidget() {
  const [rows, setRows] = useState(FALLBACK);
  useEffect(() => { api.watchlist.list().then(d => setRows(d.items || FALLBACK)).catch(() => {}); }, []);
  const spark = (up) => up
    ? 'M0 14 L8 12 L16 13 L24 9 L32 10 L40 6 L48 7 L56 3 L64 2'
    : 'M0 4 L8 6 L16 5 L24 9 L32 8 L40 11 L48 10 L56 13 L64 14';
  return (
    <Card padding={0}>
      <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>Watchlist</span>
        <Icon name="plus" size={14} style={{ color: 'var(--fg-tertiary)', cursor: 'pointer' }} />
      </div>
      <div>
        {rows.slice(0, 6).map((r, i) => <WatchRow key={r.tk} {...r} spark={spark(r.up)} last={i === Math.min(rows.length, 6) - 1} />)}
      </div>
    </Card>
  );
}

function WatchRow({ tk, name, price, delta, up, warn, active, spark, last }) {
  const [hov, setHov] = useState(false);
  const color = warn ? '#EAB308' : up ? '#22C55E' : '#F43F5E';
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
        borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
        background: active || hov ? 'var(--bg-elevated)' : 'transparent',
        cursor: 'pointer', position: 'relative',
      }}>
      {active && <span style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 2, background: 'var(--accent-primary)', borderRadius: 2 }} />}
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)', letterSpacing: '0.04em', width: 50 }}>{tk}</span>
      <span style={{ fontSize: 12, color: 'var(--fg-secondary)', flex: 1 }}>{name}</span>
      <svg width="48" height="18" viewBox="0 0 64 16"><path d={spark} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums', width: 74, textAlign: 'right' }}>{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, fontVariantNumeric: 'tabular-nums', width: 54, textAlign: 'right' }}>{delta > 0 ? '+' : ''}{delta.toFixed(2)}%</span>
    </div>
  );
}

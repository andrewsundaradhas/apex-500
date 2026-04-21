import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHead, Pill, Button } from '../components/primitives.jsx';
import Icon from '../components/Icon.jsx';
import api from '../api/client.js';

const FALLBACK = [
  { tk: 'SPX',  name: 'S&P 500',       price: 5218.47, delta: 0.82,  vol: 3.2, marketCap: 0, pred5d: 0.87, signal: 'Buy',   starred: true },
  { tk: 'NDX',  name: 'Nasdaq 100',    price: 18042.10, delta: 1.14, vol: 2.8, marketCap: 0, pred5d: 1.10, signal: 'Buy',   starred: true },
  { tk: 'DJI',  name: 'Dow Jones',     price: 38914.72, delta: -0.18, vol: 1.9, marketCap: 0, pred5d: 0.22, signal: 'Hold',  starred: true },
  { tk: 'VIX',  name: 'Volatility',    price: 24.32, delta: 3.20, vol: 8.4, marketCap: 0, pred5d: -2.10, signal: 'Watch', starred: true },
  { tk: 'AAPL', name: 'Apple',         price: 184.22, delta: 0.48, vol: 2.1, marketCap: 2840, pred5d: 1.94, signal: 'Buy', starred: true },
  { tk: 'NVDA', name: 'Nvidia',        price: 912.40, delta: 2.18, vol: 4.6, marketCap: 2250, pred5d: 7.43, signal: 'Strong buy', starred: true },
  { tk: 'MSFT', name: 'Microsoft',     price: 416.80, delta: 0.72, vol: 1.8, marketCap: 3090, pred5d: 1.22, signal: 'Buy', starred: true },
  { tk: 'GOOGL',name: 'Alphabet',      price: 168.90, delta: 0.34, vol: 2.3, marketCap: 2130, pred5d: 0.88, signal: 'Hold', starred: true },
  { tk: 'TSLA', name: 'Tesla',         price: 171.80, delta: -1.84, vol: 5.2, marketCap: 546,  pred5d: -1.88, signal: 'Watch', starred: true },
  { tk: 'META', name: 'Meta',          price: 486.40, delta: 1.54, vol: 2.4, marketCap: 1240, pred5d: 2.10, signal: 'Buy', starred: false },
];

const SIG_COLOR = { 'Strong buy': '#14532D', 'Buy': '#22C55E', 'Hold': '#EAB308', 'Watch': '#F43F5E', 'Sell': '#881337' };

export default function Watchlist() {
  const [rows, setRows] = useState(FALLBACK);
  const [sortBy, setSortBy] = useState('pred5d');
  const [sortDir, setSortDir] = useState('desc');
  const [view, setView] = useState('table');
  const navigate = useNavigate();

  useEffect(() => { api.watchlist.list().then(d => d?.items && setRows(d.items)).catch(() => {}); }, []);

  const sorted = [...rows].sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const totalVal = rows.reduce((s, r) => s + r.price, 0);
  const totalDelta = rows.reduce((s, r) => s + r.delta, 0) / rows.length;

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero */}
      <div style={{
        position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--purple-deep), var(--purple-midnight))',
        border: '1px solid var(--purple-border)', padding: 32,
      }}>
        <div style={{ position: 'absolute', top: -100, right: 10, width: 280, height: 280, background: 'radial-gradient(circle, rgba(139,92,246,0.3), transparent 60%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 32 }}>
          <div>
            <Pill tone="ai" dot glow>Watchlist · Main</Pill>
            <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', margin: '12px 0 8px', color: '#EDEDEF' }}>Watchlist</h1>
            <p style={{ fontSize: 14, color: '#C4B5FD', maxWidth: 520, margin: 0 }}>
              Your tracked tickers with AI-generated signals, 5-day predictions, and alerting. Click any row for a deep dive.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            <HeroStat value={rows.length} label="Tickers" />
            <HeroStat value={`${totalDelta >= 0 ? '+' : ''}${totalDelta.toFixed(2)}%`} label="Avg 1D" tone={totalDelta >= 0 ? 'pos' : 'neg'} />
            <HeroStat value={rows.filter(r => r.signal === 'Buy' || r.signal === 'Strong buy').length} label="Buy signals" tone="pos" />
            <HeroStat value={rows.filter(r => r.signal === 'Watch').length} label="Alerts" tone="warn" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'inline-flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
          {['table', 'grid'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 14px', border: 'none', background: view === v ? 'var(--bg-elevated)' : 'transparent',
              color: view === v ? 'var(--fg-primary)' : 'var(--fg-secondary)',
              fontSize: 12, textTransform: 'capitalize', cursor: 'pointer', borderRadius: 4,
            }}>{v}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Button icon="plus" variant="ghost" size="sm">Add ticker</Button>
        <Button icon="bell" variant="secondary" size="sm">Alerts</Button>
        <Button icon="download" variant="secondary" size="sm">Export</Button>
      </div>

      {/* Table view */}
      {view === 'table' && (
        <Card padding={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--purple-tint-1)' }}>
                <Th>★</Th>
                <Th sort="tk" curSort={sortBy} dir={sortDir} onSort={(k) => { setSortBy(k); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Ticker</Th>
                <Th>Name</Th>
                <Th sort="price" curSort={sortBy} dir={sortDir} onSort={(k) => { setSortBy(k); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }} right>Price</Th>
                <Th sort="delta" curSort={sortBy} dir={sortDir} onSort={(k) => { setSortBy(k); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }} right>Δ 1D</Th>
                <Th right>Spark</Th>
                <Th sort="pred5d" curSort={sortBy} dir={sortDir} onSort={(k) => { setSortBy(k); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }} right>Forecast 5D</Th>
                <Th right>AI Signal</Th>
                <Th sort="vol" curSort={sortBy} dir={sortDir} onSort={(k) => { setSortBy(k); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }} right>Vol×</Th>
                <Th right>MCap ($B)</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => <Row key={r.tk} {...r} last={i === sorted.length - 1} onClick={() => navigate(`/predictions/${r.tk.toLowerCase()}-5d`)} />)}
            </tbody>
          </table>
        </Card>
      )}

      {/* Grid view */}
      {view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {sorted.map(r => <GridCard key={r.tk} {...r} onClick={() => navigate(`/predictions/${r.tk.toLowerCase()}-5d`)} />)}
        </div>
      )}
    </div>
  );
}

function Th({ children, right, sort, curSort, dir, onSort }) {
  const active = sort && curSort === sort;
  return (
    <th onClick={() => sort && onSort(sort)} style={{
      padding: '10px 16px', textAlign: right ? 'right' : 'left',
      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em',
      color: active ? 'var(--fg-primary)' : 'var(--fg-tertiary)', fontWeight: 500,
      borderBottom: '1px solid var(--border-subtle)',
      cursor: sort ? 'pointer' : 'default', userSelect: 'none',
    }}>
      {children}{active && (dir === 'asc' ? ' ↑' : ' ↓')}
    </th>
  );
}

function Row({ tk, name, price, delta, vol, marketCap, pred5d, signal, starred, last, onClick }) {
  const [hov, setHov] = useState(false);
  const color = delta >= 0 ? '#22C55E' : '#F43F5E';
  const predColor = pred5d >= 0 ? '#22C55E' : '#F43F5E';
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
      style={{ cursor: 'pointer', background: hov ? 'var(--purple-tint-1)' : 'transparent' }}>
      <td style={{ padding: '12px 16px', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <Icon name="star" size={14} style={{ color: starred ? '#EAB308' : 'var(--fg-quaternary)', fill: starred ? '#EAB308' : 'none' }} />
      </td>
      <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--fg-primary)', letterSpacing: '0.04em', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{tk}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--fg-secondary)', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{name}</td>
      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color, fontVariantNumeric: 'tabular-nums', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{delta >= 0 ? '+' : ''}{delta.toFixed(2)}%</td>
      <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <svg width="56" height="18" viewBox="0 0 64 16" style={{ display: 'inline-block' }}><path d={delta >= 0 ? 'M0 14 L8 12 L16 13 L24 9 L32 10 L40 6 L48 7 L56 3 L64 2' : 'M0 4 L8 6 L16 5 L24 9 L32 8 L40 11 L48 10 L56 13 L64 14'} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: predColor, fontVariantNumeric: 'tabular-nums', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{pred5d >= 0 ? '+' : ''}{pred5d.toFixed(2)}%</td>
      <td style={{ padding: '12px 16px', textAlign: 'right', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: `${SIG_COLOR[signal]}22`, color: SIG_COLOR[signal], border: `1px solid ${SIG_COLOR[signal]}55` }}>{signal}</span>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: vol > 3 ? '#EAB308' : 'var(--fg-tertiary)', fontVariantNumeric: 'tabular-nums', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{vol.toFixed(1)}×</td>
      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', fontVariantNumeric: 'tabular-nums', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>{marketCap ? marketCap.toLocaleString() : '—'}</td>
    </tr>
  );
}

function GridCard({ tk, name, price, delta, pred5d, signal, vol, onClick }) {
  const color = delta >= 0 ? '#22C55E' : '#F43F5E';
  return (
    <Card padding={16} style={{ cursor: 'pointer' }}>
      <div onClick={onClick}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--fg-primary)', letterSpacing: '0.04em' }}>{tk}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{name}</div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${SIG_COLOR[signal]}22`, color: SIG_COLOR[signal], border: `1px solid ${SIG_COLOR[signal]}55` }}>{signal}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums' }}>{price.toFixed(2)}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, fontVariantNumeric: 'tabular-nums' }}>{delta >= 0 ? '+' : ''}{delta.toFixed(2)}%</span>
        </div>
        <svg viewBox="0 0 100 40" style={{ width: '100%', height: 40, marginBottom: 8 }}>
          <path d={delta >= 0 ? 'M0 32 L12 30 L24 28 L36 22 L48 24 L60 18 L72 16 L84 10 L100 6' : 'M0 8 L12 10 L24 12 L36 18 L48 16 L60 22 L72 24 L84 30 L100 34'} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-tertiary)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>5D: <span style={{ color: pred5d >= 0 ? '#22C55E' : '#F43F5E' }}>{pred5d >= 0 ? '+' : ''}{pred5d.toFixed(2)}%</span></span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{vol.toFixed(1)}× vol</span>
        </div>
      </div>
    </Card>
  );
}

function HeroStat({ value, label, tone }) {
  const color = tone === 'pos' ? '#22C55E' : tone === 'neg' ? '#F43F5E' : tone === 'warn' ? '#EAB308' : '#EDEDEF';
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 500, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#A78BFA', marginTop: 2 }}>{label}</div>
    </div>
  );
}

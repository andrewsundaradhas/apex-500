import { useEffect, useState, useRef } from 'react';
import { connectLiveQuotes } from '../api/client.js';

const TICKERS = ['SPX', 'NDX', 'DJI', 'VIX', 'AAPL', 'NVDA', 'MSFT', 'GOOGL', 'TSLA', 'META'];

export default function LiveTape() {
  const [quotes, setQuotes] = useState({});
  const prevRef = useRef({});
  const [flash, setFlash] = useState({});

  useEffect(() => {
    const close = connectLiveQuotes(TICKERS, (ticks) => {
      const next = { ...prevRef.current };
      const nextFlash = {};
      for (const t of ticks) {
        const prev = prevRef.current[t.ticker]?.price;
        next[t.ticker] = t;
        if (prev != null && Math.abs(t.price - prev) > 0.001) {
          nextFlash[t.ticker] = t.price > prev ? 'up' : 'down';
        }
      }
      prevRef.current = next;
      setQuotes(next);
      setFlash(nextFlash);
      setTimeout(() => setFlash({}), 400);
    });
    return close;
  }, []);

  return (
    <div style={{
      display: 'flex', gap: 18, overflowX: 'auto', padding: '6px 12px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(12,12,14,0.85)',
      fontFamily: 'var(--font-mono)', fontSize: 11,
      maskImage: 'linear-gradient(90deg, transparent, black 3%, black 97%, transparent)',
    }}>
      {TICKERS.map(t => {
        const q = quotes[t];
        const price = q?.price ?? '—';
        const delta = q?.delta ?? 0;
        const f = flash[t];
        const color = f === 'up' ? '#22C55E' : f === 'down' ? '#F43F5E' : 'var(--fg-secondary)';
        return (
          <div key={t} style={{
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            padding: '2px 6px', borderRadius: 4,
            background: f ? (f === 'up' ? 'rgba(34,197,94,0.08)' : 'rgba(244,63,94,0.08)') : 'transparent',
            transition: 'background 300ms',
          }}>
            <span style={{ color: 'var(--fg-tertiary)', fontWeight: 600 }}>{t}</span>
            <span style={{ color: 'var(--fg-primary)' }}>{typeof price === 'number' ? price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : price}</span>
            <span style={{ color, fontSize: 10 }}>{delta >= 0 ? '▲' : '▼'}</span>
          </div>
        );
      })}
    </div>
  );
}

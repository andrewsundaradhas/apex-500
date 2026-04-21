import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';

const COMMANDS = [
  { label: 'Go to Dashboard', icon: 'dashboard', path: '/dashboard', kbd: 'D' },
  { label: 'Go to Predictions', icon: 'sparkles', path: '/predictions', kbd: 'P' },
  { label: 'Go to Insights', icon: 'activity', path: '/insights', kbd: 'I' },
  { label: 'Go to Watchlist', icon: 'star', path: '/watchlist', kbd: 'W' },
  { label: 'Settings', icon: 'settings', path: '/settings' },
  { label: 'Search SPX', icon: 'search', path: '/predictions' },
  { label: 'Search AAPL', icon: 'search', path: '/predictions' },
  { label: 'Search NVDA', icon: 'search', path: '/predictions' },
];

export default function CommandPalette({ onClose }) {
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const navigate = useNavigate();

  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setSel(s => Math.min(s + 1, filtered.length - 1));
      if (e.key === 'ArrowUp') setSel(s => Math.max(s - 1, 0));
      if (e.key === 'Enter' && filtered[sel]) { navigate(filtered[sel].path); onClose(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [filtered, sel, navigate, onClose]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '18vh', zIndex: 200,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 560, background: 'var(--bg-overlay)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden', animation: 'float-in 150ms var(--ease-out) both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Icon name="search" size={16} style={{ color: 'var(--fg-tertiary)' }} />
          <input autoFocus value={query} onChange={e => { setQuery(e.target.value); setSel(0); }}
            placeholder="Search commands, tickers…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--fg-primary)', fontFamily: 'var(--font-sans)' }} />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 4, color: 'var(--fg-tertiary)' }}>Esc</kbd>
        </div>
        <div style={{ maxHeight: 320, overflow: 'auto' }}>
          {filtered.map((c, i) => (
            <div key={i} onClick={() => { navigate(c.path); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer',
                background: sel === i ? 'var(--bg-elevated)' : 'transparent',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
              <Icon name={c.icon} size={15} style={{ color: 'var(--fg-tertiary)' }} />
              <span style={{ fontSize: 13, color: 'var(--fg-primary)', flex: 1 }}>{c.label}</span>
              {c.kbd && <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 5px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 3, color: 'var(--fg-tertiary)' }}>{c.kbd}</kbd>}
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 16, fontSize: 11, color: 'var(--fg-tertiary)' }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}

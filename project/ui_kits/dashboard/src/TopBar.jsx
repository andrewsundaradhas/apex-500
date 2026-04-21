/* global React */
const { useState: useStateTB } = React;

function TopBar({ onOpenPalette, riskProfile, onRiskChange }) {
  return (
    <header style={{
      height: 56, flexShrink: 0, background: 'var(--bg-canvas)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
    }}>
      {/* Search (opens palette) */}
      <div
        onClick={onOpenPalette}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)', padding: '7px 12px',
          width: 360, cursor: 'text',
          color: 'var(--fg-tertiary)',
        }}
      >
        <Icon name="search" size={14} />
        <span style={{ fontSize: 13, flex: 1 }}>Search tickers, models, predictions…</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 3 }}>⌘K</span>
      </div>

      {/* Live */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#22C55E',
          boxShadow: '0 0 8px rgba(34, 197, 94,0.6)',
          animation: 'pulse 2s var(--ease-in-out) infinite',
        }} />
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-secondary)', fontFamily: 'var(--font-mono)' }}>Live · NYSE open</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>14:32:08 ET</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Risk profile segmented */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>Risk</span>
        <div style={{ display: 'inline-flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 2 }}>
          {['Cons.', 'Mod.', 'Aggr.'].map((r, i) => {
            const val = ['conservative','moderate','aggressive'][i];
            const on = riskProfile === val;
            return (
              <button key={val} onClick={() => onRiskChange(val)} style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
                background: on ? 'var(--bg-elevated)' : 'transparent',
                color: on ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                boxShadow: on ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none',
              }}>{r}</button>
            );
          })}
        </div>
      </div>

      {/* Icon buttons */}
      <IconButton icon="refresh" />
      <IconButton icon="bell" dot />

      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'linear-gradient(135deg, #8B5CF6, #818CF8)',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11, color: 'white',
        letterSpacing: '0.02em',
      }}>JR</div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </header>
  );
}

function IconButton({ icon, dot }) {
  const [hov, setHov] = useStateTB(false);
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: 32, borderRadius: 'var(--radius-sm)',
        background: hov ? 'var(--bg-elevated)' : 'transparent', border: 'none',
        color: hov ? 'var(--fg-primary)' : 'var(--fg-secondary)',
        display: 'grid', placeItems: 'center', cursor: 'pointer', position: 'relative',
      }}>
      <Icon name={icon} size={16} />
      {dot && <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 6px rgba(139, 92, 246,0.6)' }} />}
    </button>
  );
}

Object.assign(window, { TopBar });

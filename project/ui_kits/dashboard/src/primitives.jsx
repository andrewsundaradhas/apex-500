/* global React */
const { useState } = React;

/* ========== Lucide-style icons (inline SVG) ========== */
const ICONS = {
  dashboard: 'M3 3v18h18 M7 14l4-4 4 4 5-7',
  sparkles: 'M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0Z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  star: 'M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-5-6.5 5 2-7.5L2 9h7z',
  brain: 'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z',
  search: 'M11 4a7 7 0 1 1-4.95 11.95L2 20M21 21l-4.35-4.35',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z',
  chevron: 'M9 18l6-6-6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  plus: 'M12 5v14M5 12h14',
  command: 'M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3Z',
  trendUp: 'M22 7l-8.5 8.5-5-5L2 17 M16 7h6v6',
  trendDown: 'M22 17l-8.5-8.5-5 5L2 7 M16 17h6v-6',
  close: 'M18 6L6 18M6 6l12 12',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  bolt: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  layers: 'M12 2l10 5-10 5L2 7l10-5z M2 12l10 5 10-5 M2 17l10 5 10-5',
  play: 'M5 3l14 9-14 9V3z',
  refresh: 'M3 12a9 9 0 0 1 15-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15 6.7L3 16 M3 21v-5h5',
};

function Icon({ name, size = 16, className = '', style = {} }) {
  const d = ICONS[name] || '';
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {d.split(' M').map((seg, i) => (
        <path key={i} d={i === 0 ? seg : 'M' + seg} />
      ))}
    </svg>
  );
}

/* ========== Button ========== */
function Button({ variant = 'secondary', size = 'md', children, icon, onClick, style }) {
  const base = {
    fontFamily: 'var(--font-sans)',
    fontSize: size === 'sm' ? 12 : 13,
    fontWeight: 500,
    padding: size === 'sm' ? '5px 10px' : '8px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all var(--dur-fast) var(--ease-out)',
    whiteSpace: 'nowrap',
  };
  const variants = {
    primary: { background: 'var(--accent-primary)', color: 'white' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--fg-primary)', borderColor: 'var(--border-default)' },
    ghost: { background: 'transparent', color: 'var(--fg-secondary)' },
    danger: { background: 'var(--bg-elevated)', color: 'var(--neg)', borderColor: 'var(--border-default)' },
  };
  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (variant === 'primary') { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = 'var(--accent-glow)'; }
        else if (variant === 'secondary') { e.currentTarget.style.background = 'var(--bg-overlay)'; }
        else if (variant === 'ghost') { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--fg-primary)'; }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, variants[variant], { boxShadow: 'none' });
      }}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 12 : 14} />}
      {children}
    </button>
  );
}

/* ========== Pill ========== */
function Pill({ tone = 'neutral', children, dot = false, glow = false }) {
  const tones = {
    ai: { bg: 'rgba(139, 92, 246,0.12)', fg: '#A78BFA', dot: '#8B5CF6' },
    pos: { bg: 'rgba(34, 197, 94,0.12)', fg: '#22C55E', dot: '#22C55E' },
    neg: { bg: 'rgba(244, 63, 94,0.12)', fg: '#F43F5E', dot: '#F43F5E' },
    warn: { bg: 'rgba(234, 179, 8,0.12)', fg: '#EAB308', dot: '#EAB308' },
    info: { bg: 'rgba(56, 189, 248,0.12)', fg: '#38BDF8', dot: '#38BDF8' },
    neutral: { bg: 'var(--bg-elevated)', fg: 'var(--fg-secondary)', dot: 'var(--fg-tertiary)' },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px', borderRadius: 999,
      fontSize: 10, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase',
      background: t.bg, color: t.fg,
      border: tone === 'neutral' ? '1px solid var(--border-default)' : 'none',
    }}>
      {dot && <span style={{
        width: 5, height: 5, borderRadius: '50%', background: t.dot,
        boxShadow: glow ? `0 0 6px ${t.dot}` : 'none',
      }} />}
      {children}
    </span>
  );
}

/* ========== Card ========== */
function Card({ children, style, padding = 20 }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      padding,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHead({ label, right, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {label && <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>{label}</span>}
        {children}
      </div>
      {right}
    </div>
  );
}

/* ========== Metric Cell ========== */
function MetricCell({ label, value, delta, deltaColor = 'pos', mono = true }) {
  const colors = { pos: '#22C55E', neg: '#F43F5E', neutral: 'var(--fg-secondary)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>{label}</span>
      <span style={{
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        fontSize: 13, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
      {delta && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: colors[deltaColor], fontVariantNumeric: 'tabular-nums' }}>{delta}</span>}
    </div>
  );
}

Object.assign(window, { Icon, Button, Pill, Card, CardHead, MetricCell });

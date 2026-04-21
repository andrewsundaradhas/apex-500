import { useState } from 'react';
import Icon from './Icon.jsx';

export function Button({ variant = 'secondary', size = 'md', children, icon, onClick, style }) {
  const [hov, setHov] = useState(false);
  const base = {
    fontFamily: 'var(--font-sans)', fontSize: size === 'sm' ? 12 : 13,
    fontWeight: 500, padding: size === 'sm' ? '5px 10px' : '8px 14px',
    borderRadius: 'var(--radius-sm)', border: '1px solid transparent',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'all var(--dur-fast) var(--ease-out)', whiteSpace: 'nowrap',
  };
  const variants = {
    primary: { background: hov ? 'var(--accent-hover)' : 'var(--accent-primary)', color: 'white', boxShadow: hov ? '0 4px 20px rgba(139,92,246,0.35)' : 'none' },
    secondary: { background: hov ? 'var(--bg-overlay)' : 'var(--bg-elevated)', color: 'var(--fg-primary)', borderColor: 'var(--border-default)' },
    ghost: { background: hov ? 'var(--bg-elevated)' : 'transparent', color: hov ? 'var(--fg-primary)' : 'var(--fg-secondary)', borderColor: 'transparent' },
    danger: { background: 'var(--bg-elevated)', color: 'var(--neg)', borderColor: 'var(--border-default)' },
  };
  return (
    <button style={{ ...base, ...variants[variant], ...style }}
      onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {icon && <Icon name={icon} size={size === 'sm' ? 12 : 14} />}
      {children}
    </button>
  );
}

export function Pill({ tone = 'neutral', children, dot = false, glow = false }) {
  const tones = {
    ai:      { bg: 'rgba(139,92,246,0.12)', fg: '#A78BFA', dot: '#8B5CF6' },
    pos:     { bg: 'rgba(34,197,94,0.12)',  fg: '#22C55E', dot: '#22C55E' },
    neg:     { bg: 'rgba(244,63,94,0.12)',  fg: '#F43F5E', dot: '#F43F5E' },
    warn:    { bg: 'rgba(234,179,8,0.12)',  fg: '#EAB308', dot: '#EAB308' },
    info:    { bg: 'rgba(56,189,248,0.12)', fg: '#38BDF8', dot: '#38BDF8' },
    neutral: { bg: 'var(--bg-elevated)',    fg: 'var(--fg-secondary)', dot: 'var(--fg-tertiary)' },
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
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.dot, boxShadow: glow ? `0 0 6px ${t.dot}` : 'none' }} />}
      {children}
    </span>
  );
}

export function Card({ children, style, padding = 20 }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      padding, ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHead({ label, right, children }) {
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

export function MetricCell({ label, value, delta, deltaColor = 'pos', mono = true }) {
  const colors = { pos: '#22C55E', neg: '#F43F5E', neutral: 'var(--fg-secondary)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: 13, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {delta && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: colors[deltaColor], fontVariantNumeric: 'tabular-nums' }}>{delta}</span>}
    </div>
  );
}

export { Icon };

/* global React */
const { useState } = React;

function Sidebar({ collapsed, onToggle, active, onNav }) {
  const w = collapsed ? 64 : 240;
  const items = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', kbd: 'D' },
    { id: 'predictions', icon: 'sparkles', label: 'Predictions', kbd: 'P' },
    { id: 'insights', icon: 'activity', label: 'Insights', kbd: 'I' },
    { id: 'watchlist', icon: 'star', label: 'Watchlist', kbd: 'W' },
  ];
  const models = [
    { id: 'lstm', icon: 'layers', label: 'LSTM v4.1' },
    { id: 'transformer', icon: 'brain', label: 'Transformer-L' },
    { id: 'ensemble', icon: 'grid', label: 'Ensemble' },
  ];
  return (
    <aside style={{
      width: w, flexShrink: 0, background: 'var(--bg-canvas)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column',
      transition: 'width var(--dur-base) var(--ease-out)',
    }}>
      {/* Logo */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: collapsed ? '0' : '0 16px', justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--fg-primary)' }}>
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <defs>
              <linearGradient id="sbLogo" x1="6" y1="30" x2="34" y2="10"><stop offset="0" stopColor="#8B5CF6"/><stop offset="1" stopColor="#818CF8"/></linearGradient>
            </defs>
            <line x1="14" y1="32" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" opacity="0.55"/>
            <line x1="14" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.55"/>
            <path d="M6 30 L14 24 L20 18 L26 14 L34 8" stroke="url(#sbLogo)" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="34" cy="8" r="2.5" fill="#8B5CF6"/>
          </svg>
          {!collapsed && (
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
              Apex <span style={{ fontFamily: 'var(--font-mono)', color: '#8B5CF6' }}>500</span>
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {items.map(it => (
          <NavItem key={it.id} {...it} active={active === it.id} collapsed={collapsed} onClick={() => onNav(it.id)} />
        ))}
        {!collapsed && <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-tertiary)', padding: '14px 10px 4px', fontWeight: 500 }}>Models</div>}
        {collapsed && <div style={{ height: 1, background: 'var(--border-subtle)', margin: '12px 8px' }} />}
        {models.map(it => (
          <NavItem key={it.id} {...it} active={active === it.id} collapsed={collapsed} onClick={() => onNav(it.id)} />
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: 8, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <NavItem id="settings" icon="settings" label="Settings" collapsed={collapsed} onClick={() => onNav('settings')} />
        <button onClick={onToggle} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '8px 10px', borderRadius: 'var(--radius-sm)',
          color: 'var(--fg-tertiary)',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <Icon name={collapsed ? 'chevron' : 'chevronLeft'} size={16} />
          {!collapsed && <span style={{ fontSize: 12 }}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, kbd, active, collapsed, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '9px 0' : '8px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 'var(--radius-sm)',
        fontSize: 13,
        color: active || hover ? 'var(--fg-primary)' : 'var(--fg-secondary)',
        background: active || hover ? 'var(--bg-elevated)' : 'transparent',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all var(--dur-fast) var(--ease-out)',
      }}
    >
      {active && <span style={{ position: 'absolute', left: collapsed ? 6 : -1, top: 7, bottom: 7, width: 2, background: 'var(--accent-primary)', borderRadius: 2, boxShadow: '0 0 6px rgba(139, 92, 246,0.55)' }} />}
      <Icon name={icon} size={16} />
      {!collapsed && (
        <>
          <span>{label}</span>
          {kbd && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)', padding: '1px 5px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 3 }}>{kbd}</span>}
        </>
      )}
    </div>
  );
}

Object.assign(window, { Sidebar });

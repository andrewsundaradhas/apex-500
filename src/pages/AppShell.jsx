import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';
import CommandPalette from '../components/CommandPalette.jsx';
import LiveTape from '../components/LiveTape.jsx';
import Disclaimer from '../components/Disclaimer.jsx';

export default function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [palette, setPalette] = useState(false);
  const [risk, setRisk] = useState('moderate');

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPalette(p => !p); }
      if (e.key === 'Escape') setPalette(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'radial-gradient(800px 600px at 15% -10%, rgba(139,92,246,0.07), transparent 60%), var(--bg-canvas)',
    }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar onOpenPalette={() => setPalette(true)} riskProfile={risk} onRiskChange={setRisk} />
        <LiveTape />
        <main style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {children}
        </main>
        <Disclaimer />
      </div>
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </div>
  );
}

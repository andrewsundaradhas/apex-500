import { useState } from 'react';
import { Card, CardHead, Pill } from '../components/primitives.jsx';
import Icon from '../components/Icon.jsx';
import HeroChart from '../components/dashboard/HeroChart.jsx';
import PredictionCards from '../components/dashboard/PredictionCards.jsx';
import SectorHeatmap from '../components/dashboard/SectorHeatmap.jsx';
import CorrelationMatrix from '../components/dashboard/CorrelationMatrix.jsx';
import WhatIfPanel from '../components/dashboard/WhatIfPanel.jsx';
import InsightPanel from '../components/dashboard/InsightPanel.jsx';
import SentimentMeter from '../components/dashboard/SentimentMeter.jsx';
import WatchlistWidget from '../components/dashboard/WatchlistWidget.jsx';
import NewsTicker from '../components/dashboard/NewsTicker.jsx';

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState('1M');
  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <HeroChart timeframe={timeframe} onTimeframe={setTimeframe} />
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            AI predictions <Pill tone="ai" dot glow>3 active models</Pill>
          </div>
          <PredictionCards />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <SectorHeatmap />
          <CorrelationMatrix />
        </div>
        <WhatIfPanel />
      </div>
      <aside style={{ width: 360, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-canvas)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <InsightPanel />
        <SentimentMeter />
        <WatchlistWidget />
        <NewsTicker />
      </aside>
    </div>
  );
}

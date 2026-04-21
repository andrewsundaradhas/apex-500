import { useEffect, useState } from 'react';
import { Card } from '../primitives.jsx';
import Icon from '../Icon.jsx';
import api from '../../api/client.js';

const FALLBACK = [
  { tone: 'pos', headline: 'Nvidia Q1 revenue beat by 8%, ups guidance', published_at: '14:28' },
  { tone: 'neg', headline: 'Retail sales April softens, consumer sentiment slips', published_at: '13:50' },
  { tone: 'ai',  headline: 'Fed minutes signal patience on rate cuts', published_at: '12:12' },
];
const COLOR = { pos: '#22C55E', neg: '#F43F5E', ai: '#8B5CF6' };

export default function NewsTicker() {
  const [news, setNews] = useState(FALLBACK);
  useEffect(() => {
    api.data.news().then(d => d?.items?.length && setNews(d.items.slice(0, 4))).catch(() => {});
  }, []);
  return (
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-subtle)' }}>
        <Icon name="bolt" size={12} style={{ color: 'var(--fg-tertiary)' }} />
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>News feed · live</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)' }}>{news.length} new</span>
      </div>
      {news.map((n, i) => {
        const timeStr = n.published_at ? String(n.published_at).slice(11, 16) || String(n.published_at).slice(0, 5) : '—';
        return (
          <div key={i} style={{ padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, borderBottom: i < news.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR[n.tone] || COLOR.ai, marginTop: 6, flexShrink: 0, boxShadow: `0 0 6px ${COLOR[n.tone] || COLOR.ai}` }} />
            <span style={{ fontSize: 12, color: 'var(--fg-primary)', flex: 1, lineHeight: 1.4 }}>{n.headline}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)', flexShrink: 0 }}>{timeStr}</span>
          </div>
        );
      })}
    </Card>
  );
}

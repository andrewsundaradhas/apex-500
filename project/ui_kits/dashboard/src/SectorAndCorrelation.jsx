/* global React */

function SectorHeatmap() {
  const sectors = [
    { code: 'XLK', name: 'Tech', w: 28.4, d: 1.42 },
    { code: 'XLF', name: 'Financials', w: 13.2, d: 0.88 },
    { code: 'XLV', name: 'Health', w: 12.8, d: -0.21 },
    { code: 'XLY', name: 'Cons. Disc.', w: 10.6, d: -1.10 },
    { code: 'XLC', name: 'Comms', w: 8.8, d: 0.62 },
    { code: 'XLI', name: 'Industrial', w: 8.2, d: 0.31 },
    { code: 'XLP', name: 'Cons. Stpl', w: 6.1, d: -0.44 },
    { code: 'XLE', name: 'Energy', w: 4.3, d: 1.84 },
    { code: 'XLU', name: 'Utilities', w: 2.6, d: -0.08 },
    { code: 'XLRE', name: 'Real Estate', w: 2.4, d: 0.12 },
    { code: 'XLB', name: 'Materials', w: 2.6, d: 0.72 },
  ];
  const color = (d) => {
    const abs = Math.min(Math.abs(d), 2);
    const intensity = abs / 2;
    if (Math.abs(d) < 0.1) return 'rgba(30,35,48,0.9)';
    if (d > 0) return `rgba(34, 197, 94,${0.15 + intensity * 0.55})`;
    return `rgba(244, 63, 94,${0.15 + intensity * 0.55})`;
  };
  const txt = (d) => Math.abs(d) < 0.4 ? 'var(--fg-secondary)' : '#EDEDEF';
  return (
    <Card padding={20}>
      <CardHead label="Sector heatmap · live" right={
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)' }}>Weighted to SPX</span>
      } />
      <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.2fr 1fr 1fr 1fr', gridAutoRows: '68px', gap: 3 }}>
        {sectors.map((s, i) => {
          const span = i === 0 ? { gridColumn: 'span 2', gridRow: 'span 2' } : i < 3 ? { gridColumn: 'span 1', gridRow: 'span 2' } : {};
          return (
            <div key={s.code} style={{
              ...span,
              background: color(s.d), borderRadius: 4,
              padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'transform var(--dur-fast)',
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: txt(s.d), letterSpacing: '0.04em' }}>{s.code}</span>
                <span style={{ fontSize: 10, color: txt(s.d), opacity: 0.75 }}>{s.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: txt(s.d), fontVariantNumeric: 'tabular-nums' }}>
                  {s.d > 0 ? '+' : ''}{s.d.toFixed(2)}%
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: txt(s.d), opacity: 0.6 }}>{s.w}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CorrelationMatrix() {
  const syms = ['SPX','NDX','DJI','VIX'];
  const matrix = [
    [1.00, 0.92, 0.88, -0.72],
    [0.92, 1.00, 0.78, -0.68],
    [0.88, 0.78, 1.00, -0.61],
    [-0.72, -0.68, -0.61, 1.00],
  ];
  const cellColor = (v) => {
    if (Math.abs(v - 1) < 0.01) return 'var(--bg-elevated)';
    const intensity = Math.abs(v);
    if (v > 0) return `rgba(34, 197, 94,${0.1 + intensity * 0.5})`;
    return `rgba(244, 63, 94,${0.1 + intensity * 0.5})`;
  };
  return (
    <Card padding={20}>
      <CardHead label="Correlation · 30d" right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)' }}>ρ Pearson</span>} />
      <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(4, 1fr)', gap: 3 }}>
        <div />
        {syms.map(s => <div key={s} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--fg-tertiary)', letterSpacing: '0.04em', padding: 4 }}>{s}</div>)}
        {matrix.map((row, i) => (
          <React.Fragment key={i}>
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--fg-tertiary)', padding: '8px 8px 8px 0', letterSpacing: '0.04em' }}>{syms[i]}</div>
            {row.map((v, j) => (
              <div key={j} style={{
                background: cellColor(v), borderRadius: 4, padding: '8px 4px',
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                color: i === j ? 'var(--fg-tertiary)' : 'var(--fg-primary)',
                textAlign: 'center', fontVariantNumeric: 'tabular-nums',
              }}>{v.toFixed(2)}</div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}

Object.assign(window, { SectorHeatmap, CorrelationMatrix });

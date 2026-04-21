import { Card, CardHead } from '../primitives.jsx';

const TICKERS = ['SPX', 'NDX', 'DJI', 'VIX'];
const MATRIX = [
  [1.00,  0.92,  0.88, -0.67],
  [0.92,  1.00,  0.81, -0.71],
  [0.88,  0.81,  1.00, -0.58],
  [-0.67, -0.71, -0.58, 1.00],
];

function corrColor(v) {
  if (v === 1) return '#141416';
  if (v >= 0.8) return '#14532D';
  if (v >= 0.5) return '#15803D';
  if (v >= 0.2) return 'rgba(34,197,94,0.35)';
  if (v >= -0.2) return '#26262C';
  if (v >= -0.5) return 'rgba(244,63,94,0.35)';
  if (v >= -0.8) return '#BE123C';
  return '#881337';
}

export default function CorrelationMatrix() {
  return (
    <Card padding={20}>
      <CardHead label="Correlations · 30-day" />
      <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${TICKERS.length}, 1fr)`, gap: 3 }}>
        <div />
        {TICKERS.map(t => <div key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textAlign: 'center', color: 'var(--fg-tertiary)', fontWeight: 500, letterSpacing: '0.04em' }}>{t}</div>)}
        {MATRIX.map((row, i) => (
          <>
            <div key={`l-${i}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-tertiary)', fontWeight: 500, letterSpacing: '0.04em', display: 'flex', alignItems: 'center' }}>{TICKERS[i]}</div>
            {row.map((v, j) => (
              <div key={`${i}-${j}`} style={{
                height: 40, borderRadius: 4, background: corrColor(v),
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 11, color: Math.abs(v) > 0.5 ? '#FFF' : 'var(--fg-secondary)',
                fontVariantNumeric: 'tabular-nums',
              }}>{v.toFixed(2)}</div>
            ))}
          </>
        ))}
      </div>
    </Card>
  );
}

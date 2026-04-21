import { useState } from 'react';
import { Card, CardHead, Pill, Button } from './primitives.jsx';
import api from '../api/client.js';

export default function BacktestPanel({ ticker = 'SPX' }) {
  const [model, setModel] = useState('arima');
  const [horizon, setHorizon] = useState(5);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function run() {
    setRunning(true); setError(null);
    try {
      const r = await api.backtest(ticker, model, horizon, 15);
      setResult(r);
    } catch (e) { setError(String(e)); }
    setRunning(false);
  }

  const folds = result?.folds || [];
  const hitColor = result ? (result.hit_rate > 0.55 ? '#22C55E' : result.hit_rate < 0.45 ? '#F43F5E' : '#EAB308') : null;

  return (
    <Card padding={24}>
      <CardHead label={`Backtest · ${ticker}`} right={<Pill tone="ai" dot glow>Walk-forward</Pill>} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
          {[['arima', 'ARIMA'], ['lstm', 'LSTM'], ['transformer', 'Transformer'], ['boost', 'Boost']].map(([v, l]) => (
            <button key={v} onClick={() => setModel(v)} style={{
              padding: '5px 12px', border: 'none',
              background: model === v ? 'var(--purple-deep)' : 'transparent',
              color: model === v ? '#E9E4FE' : 'var(--fg-secondary)',
              borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
          {[[1, '1D'], [5, '5D'], [22, '1M']].map(([v, l]) => (
            <button key={v} onClick={() => setHorizon(v)} style={{
              padding: '5px 12px', border: 'none',
              background: horizon === v ? 'var(--bg-surface)' : 'transparent',
              color: horizon === v ? 'var(--fg-primary)' : 'var(--fg-secondary)',
              borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Button variant="primary" size="sm" icon="play" onClick={run} >{running ? 'Running…' : 'Run backtest'}</Button>
      </div>

      {error && <div style={{ fontSize: 12, color: '#F43F5E', marginBottom: 8 }}>{error}</div>}

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
            <Metric label="Folds"       value={result.n_folds} />
            <Metric label="Hit rate"    value={`${(result.hit_rate * 100).toFixed(1)}%`} color={hitColor} />
            <Metric label="MAE"         value={result.mae_mean?.toFixed(2)} />
            <Metric label="MAPE"        value={`${result.mape_mean?.toFixed(2)}%`} />
            <Metric label="Sharpe"      value={result.strategy_sharpe?.toFixed(2)} color={result.strategy_sharpe > 0 ? '#22C55E' : '#F43F5E'} />
          </div>

          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 6 }}>
            Predicted vs actual · {folds.length} folds
          </div>
          <svg viewBox="0 0 400 120" style={{ width: '100%', height: 120, background: 'var(--bg-canvas)', borderRadius: 8, padding: 4 }}>
            {folds.length > 0 && (() => {
              const rets = folds.flatMap(f => [f.predicted_return, f.actual_return]);
              const min = Math.min(...rets), max = Math.max(...rets);
              const range = max - min || 1;
              const xStep = 390 / Math.max(folds.length - 1, 1);
              return (
                <>
                  <line x1="5" x2="395" y1="60" y2="60" stroke="#2A2A30" />
                  <path d={folds.map((f, i) => `${i === 0 ? 'M' : 'L'}${5 + i * xStep},${110 - ((f.predicted_return - min) / range) * 100}`).join(' ')}
                    stroke="#8B5CF6" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
                  <path d={folds.map((f, i) => `${i === 0 ? 'M' : 'L'}${5 + i * xStep},${110 - ((f.actual_return - min) / range) * 100}`).join(' ')}
                    stroke="#EDEDEF" strokeWidth="1.5" fill="none" />
                  {folds.map((f, i) => (
                    <circle key={i} cx={5 + i * xStep} cy={110 - ((f.actual_return - min) / range) * 100}
                      r="2.5" fill={f.hit ? '#22C55E' : '#F43F5E'} />
                  ))}
                </>
              );
            })()}
          </svg>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--fg-tertiary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 2, background: '#EDEDEF' }} /> Actual
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 2, borderTop: '2px dashed #8B5CF6' }} /> Predicted
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} /> Correct direction
            </span>
          </div>
        </>
      )}

      {!result && !running && (
        <div style={{ fontSize: 13, color: 'var(--fg-tertiary)', padding: '24px 0', textAlign: 'center' }}>
          Run a walk-forward backtest on {ticker}. Evaluates this model on {horizon}-step-ahead predictions over {15 * horizon}+ past bars.
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: color || 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500, marginTop: 2 }}>{label}</div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

/** Polls /health and renders a banner when the API is unreachable. */
export default function BackendStatus() {
  const [down, setDown] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        await api.health();
        if (!cancelled) setDown(false);
      } catch {
        if (!cancelled) setDown(true);
      }
    }

    check();
    const id = setInterval(check, 20_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (!down) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(244, 63, 94, 0.95)', color: '#fff',
      padding: '8px 16px', fontSize: 13, fontWeight: 500,
      textAlign: 'center', letterSpacing: '0.01em',
      fontFamily: 'var(--font-sans, system-ui)',
    }}>
      Backend offline — charts and predictions are showing cached fallback data.
      Start the API with: <code style={{ background: 'rgba(0,0,0,0.25)', padding: '1px 6px', borderRadius: 3 }}>python -m uvicorn app.main:app --port 8000</code>
    </div>
  );
}

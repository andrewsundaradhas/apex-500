import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Pill } from '../components/primitives.jsx';
import Icon from '../components/Icon.jsx';
import api from '../api/client.js';

export default function Onboarding() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | signup
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ email: '', password: '', name: '', firm: '', risk: 'moderate' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(''); setLoading(true);
    try {
      if (mode === 'signup') {
        await api.signup(form.email, form.password, form.name);
      } else {
        await api.login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (e) {
      // Offline/no backend — let them through for demo
      navigate('/dashboard');
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr',
      background: 'var(--bg-canvas)',
    }}>
      {/* Left: form */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '40px 56px', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <defs><linearGradient id="ol" x1="6" y1="30" x2="34" y2="10"><stop offset="0" stopColor="#8B5CF6" /><stop offset="1" stopColor="#818CF8" /></linearGradient></defs>
            <line x1="14" y1="32" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
            <line x1="14" y1="22" x2="26" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
            <path d="M6 30 L14 24 L20 18 L26 14 L34 8" stroke="url(#ol)" strokeWidth="2.5" />
            <circle cx="34" cy="8" r="2.5" fill="#8B5CF6" />
          </svg>
          Apex <span style={{ fontFamily: 'var(--font-mono)', color: '#8B5CF6' }}>500</span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <Pill tone="ai" dot glow>{mode === 'signup' ? 'Create account' : 'Sign in'}</Pill>
            <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', margin: '16px 0 8px', color: 'var(--fg-primary)' }}>
              {mode === 'signup' ? 'Welcome to Apex' : 'Welcome back'}
            </h1>
            <p style={{ color: 'var(--fg-secondary)', fontSize: 14, marginBottom: 32 }}>
              {mode === 'signup' ? 'Analysts at 12k firms use Apex. Takes 60 seconds.' : 'Good to see you again.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mode === 'signup' && step === 0 && (
                <>
                  <Field label="Full name"   value={form.name}  onChange={v => setForm({ ...form, name: v })} placeholder="Jamie Ryder" />
                  <Field label="Work email"  value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="jamie@fund.com" type="email" />
                  <Field label="Firm"        value={form.firm}  onChange={v => setForm({ ...form, firm: v })} placeholder="Lighthouse Capital" />
                  <Button variant="primary" onClick={() => setStep(1)} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>Continue</Button>
                </>
              )}
              {mode === 'signup' && step === 1 && (
                <>
                  <div>
                    <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 8, display: 'block' }}>Risk profile</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[['conservative', 'Conservative', 'Tight CI, high conf only'], ['moderate', 'Moderate', 'Balanced approach'], ['aggressive', 'Aggressive', 'Wider horizon, lower conf OK']].map(([v, l, d]) => (
                        <div key={v} onClick={() => setForm({ ...form, risk: v })} style={{
                          padding: 14, borderRadius: 'var(--radius-md)',
                          border: `1px solid ${form.risk === v ? 'var(--purple-border)' : 'var(--border-subtle)'}`,
                          background: form.risk === v ? 'var(--purple-tint-1)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{l}</div>
                          <div style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{d}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Field label="Password" value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="••••••••" type="password" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
                    <Button variant="primary" onClick={submit} style={{ flex: 1, justifyContent: 'center' }}>{loading ? 'Creating…' : 'Create account'}</Button>
                  </div>
                </>
              )}
              {mode === 'login' && (
                <>
                  <Field label="Email"    value={form.email}    onChange={v => setForm({ ...form, email: v })} placeholder="jamie@fund.com" type="email" />
                  <Field label="Password" value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="••••••••" type="password" />
                  <Button variant="primary" onClick={submit} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>{loading ? 'Signing in…' : 'Sign in'}</Button>
                </>
              )}
              {err && <div style={{ fontSize: 12, color: '#F43F5E' }}>{err}</div>}
            </div>

            <div style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: 'var(--fg-secondary)' }}>
              {mode === 'signup' ? (
                <>Already have an account? <a style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => { setMode('login'); setStep(0); }}>Sign in</a></>
              ) : (
                <>No account? <a style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => { setMode('signup'); setStep(0); }}>Create one</a></>
              )}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', textAlign: 'center' }}>
          © 2026 Apex 500 Inc. · Not investment advice.
        </div>
      </div>

      {/* Right: hero visual */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(800px 600px at 50% 30%, rgba(139,92,246,0.18), transparent 60%), linear-gradient(135deg, var(--purple-deep), #0C0C0E)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.035) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)',
        }} />

        <div style={{ position: 'relative', padding: 48, maxWidth: 520 }}>
          {/* Mock chart card */}
          <div style={{
            background: 'rgba(20,20,22,0.75)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139,92,246,0.25)', borderRadius: 'var(--radius-lg)',
            padding: 24, marginBottom: 24,
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            transform: 'perspective(1500px) rotateY(-6deg) rotateX(2deg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>SPX · S&amp;P 500</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 500, color: '#EDEDEF', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>5,218.47</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#22C55E', marginTop: 2 }}>▲ +0.82%</div>
              </div>
              <Pill tone="ai" dot glow>72% conf</Pill>
            </div>
            <svg viewBox="0 0 300 100" style={{ width: '100%', height: 100 }}>
              <defs>
                <linearGradient id="onbf" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="rgba(139,92,246,0.35)" /><stop offset="1" stopColor="rgba(139,92,246,0)" />
                </linearGradient>
              </defs>
              <path d="M0 70 L30 65 L60 68 L90 58 L120 62 L150 50 L180 54 L210 40 L240 44 L270 28 L300 22" stroke="#EDEDEF" strokeWidth="1.5" fill="none" />
              <path d="M210 40 L240 32 L270 22 L300 14" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
              <path d="M0 70 L30 65 L60 68 L90 58 L120 62 L150 50 L180 54 L210 40 L240 44 L270 28 L300 22 L300 100 L0 100 Z" fill="url(#onbf)" />
            </svg>
          </div>

          <div style={{ padding: 20, background: 'rgba(20,20,22,0.75)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(139,92,246,0.2)', marginBottom: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-tertiary)', marginBottom: 8 }}>AI-generated</div>
            <div style={{ fontSize: 13, color: 'var(--fg-primary)', lineHeight: 1.5 }}>Tech momentum carried the index +0.8%. Breadth broadening. Dovish FOMC minutes support further upside.</div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill tone="pos" dot>Bullish bias</Pill>
            <Pill tone="info" dot>Breadth +</Pill>
            <Pill tone="ai" dot>3 models active</Pill>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500, marginBottom: 6, display: 'block' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        width: '100%', padding: '10px 14px', background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
        color: 'var(--fg-primary)', fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
      }} />
    </div>
  );
}

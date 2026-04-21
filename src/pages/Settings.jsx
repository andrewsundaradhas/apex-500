import { useState } from 'react';
import { Card, CardHead, Pill, Button } from '../components/primitives.jsx';
import Icon from '../components/Icon.jsx';

const SECTIONS = [
  { id: 'account',  icon: 'user',       label: 'Account' },
  { id: 'api',      icon: 'key',        label: 'API keys' },
  { id: 'models',   icon: 'brain',      label: 'Models' },
  { id: 'alerts',   icon: 'bell',       label: 'Alerts' },
  { id: 'billing',  icon: 'creditCard', label: 'Billing' },
  { id: 'team',     icon: 'building',   label: 'Team' },
  { id: 'security', icon: 'lock',       label: 'Security' },
  { id: 'appearance', icon: 'sun',      label: 'Appearance' },
];

export default function Settings() {
  const [section, setSection] = useState('account');

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <aside style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', padding: '28px 16px', overflow: 'auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 10px 20px' }}>Settings</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SECTIONS.map(s => {
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 'var(--radius-sm)', fontSize: 13, textAlign: 'left',
                background: active ? 'var(--bg-elevated)' : 'transparent',
                color: active ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                border: 'none', cursor: 'pointer', position: 'relative',
              }}>
                {active && <span style={{ position: 'absolute', left: -1, top: 7, bottom: 7, width: 2, background: 'var(--accent-primary)', borderRadius: 2 }} />}
                <Icon name={s.icon} size={14} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div style={{ flex: 1, padding: 28, overflow: 'auto' }}>
        {section === 'account'    && <AccountSection />}
        {section === 'api'        && <ApiSection />}
        {section === 'models'     && <ModelsSection />}
        {section === 'alerts'     && <AlertsSection />}
        {section === 'billing'    && <BillingSection />}
        {section === 'team'       && <TeamSection />}
        {section === 'security'   && <SecuritySection />}
        {section === 'appearance' && <AppearanceSection />}
      </div>
    </div>
  );
}

function AccountSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>Account</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: 14, margin: 0 }}>Manage your profile and preferences.</p>
      </div>

      <Card padding={24}>
        <CardHead label="Profile" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #818CF8)', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 600, color: 'white' }}>JR</div>
          <div>
            <Button variant="secondary" size="sm">Upload photo</Button>
            <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 6 }}>JPG or PNG, max 2MB.</div>
          </div>
        </div>
        <Field label="Name" value="Jamie Ryder" />
        <Field label="Email" value="jamie@lighthouse.fund" />
        <Field label="Firm" value="Lighthouse Capital" />
        <Field label="Role" value="Senior Analyst" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="primary">Save changes</Button>
        </div>
      </Card>

      <Card padding={24}>
        <CardHead label="Preferences" />
        <Toggle label="Email me daily market summary" desc="Every morning at 8:30 AM ET" on />
        <Toggle label="Push notifications on anomalies" desc="When model flags unusual activity" on />
        <Toggle label="Weekly prediction recap" desc="Sent Fridays at close" />
      </Card>
    </div>
  );
}

function ApiSection() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const key = 'sk_live_apex_9f7d3b2a...8c21';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>API keys</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: 14, margin: 0 }}>Programmatic access to predictions, watchlist, and insights.</p>
      </div>

      <Card padding={24}>
        <CardHead label="Active keys" right={<Button variant="primary" size="sm" icon="plus">New key</Button>} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>Production key</span>
              <Pill tone="pos" dot>Active</Pill>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-secondary)' }}>
              {showKey ? key : key.slice(0, 12) + '•'.repeat(18) + key.slice(-4)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>Created Mar 12 · last used 14m ago · 28k requests this month</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="ghost" size="sm" icon="eye" onClick={() => setShowKey(s => !s)}>{showKey ? 'Hide' : 'Show'}</Button>
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(key); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="danger" size="sm">Revoke</Button>
          </div>
        </div>
      </Card>

      <Card padding={24}>
        <CardHead label="Rate limits" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Metric label="Requests / min" value="1,000" />
          <Metric label="This hour" value="2,847" sub="peak 4,120" />
          <Metric label="Plan" value="Scale" />
        </div>
      </Card>
    </div>
  );
}

function ModelsSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>Models</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: 14, margin: 0 }}>Which AI models power your predictions.</p>
      </div>
      {[
        { name: 'LSTM v4.1', desc: 'Long short-term memory RNN. Best for short-term (1-5 day) forecasts.', hit: 71, active: true },
        { name: 'Transformer-L', desc: 'Attention-based. Excels at pattern memory and multi-horizon forecasting.', hit: 74, active: true },
        { name: 'Ensemble', desc: 'Combines LSTM + Transformer + gradient boosting with learned weights.', hit: 77, active: true },
      ].map(m => (
        <Card key={m.name} padding={20}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</span>
                {m.active && <Pill tone="pos" dot>Enabled</Pill>}
              </div>
              <p style={{ fontSize: 13, color: 'var(--fg-secondary)', margin: 0 }}>{m.desc}</p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 8 }}>5D hit rate: <span style={{ color: '#22C55E' }}>{m.hit}%</span></div>
            </div>
            <Toggle compact on={m.active} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function AlertsSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>Alerts</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: 14, margin: 0 }}>Tell the model when to tap you on the shoulder.</p>
      </div>
      <Card padding={24}>
        <CardHead label="Active alerts" right={<Button variant="primary" size="sm" icon="plus">New alert</Button>} />
        {[
          { t: 'SPX crosses 5,300', when: 'Price alert · intraday' },
          { t: 'VIX > 30',          when: 'Regime alert · realtime' },
          { t: 'XLF volume > 2σ',   when: 'Anomaly · realtime' },
          { t: 'NVDA prediction changes > 5%', when: 'Model alert · daily' },
        ].map((a, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{a.t}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>{a.when}</div>
            </div>
            <Toggle compact on />
          </div>
        ))}
      </Card>
    </div>
  );
}

function BillingSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>Billing</h1>
        <p style={{ color: 'var(--fg-secondary)', fontSize: 14, margin: 0 }}>Your plan, usage, and invoices.</p>
      </div>
      <Card padding={24} style={{ background: 'linear-gradient(135deg, var(--purple-deep), var(--bg-surface))', border: '1px solid var(--purple-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#A78BFA', fontWeight: 500, marginBottom: 8 }}>Current plan</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Scale</div>
            <div style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>$499 / month · billed annually</div>
          </div>
          <Button variant="primary">Upgrade to Enterprise</Button>
        </div>
      </Card>
      <Card padding={24}>
        <CardHead label="Usage this month" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Metric label="API calls" value="28,412" sub="of 100,000" />
          <Metric label="Predictions" value="1,294" sub="of 5,000" />
          <Metric label="Watchlist rows" value="128" sub="of 500" />
        </div>
      </Card>
    </div>
  );
}

function TeamSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>Team</h1>
      <Card padding={24}>
        <CardHead label="Members · 4" right={<Button variant="primary" size="sm" icon="plus">Invite</Button>} />
        {[
          { name: 'Jamie Ryder', role: 'Admin', email: 'jamie@lighthouse.fund' },
          { name: 'Priya Iyer',  role: 'Analyst', email: 'priya@lighthouse.fund' },
          { name: 'Marco Alves', role: 'Analyst', email: 'marco@lighthouse.fund' },
          { name: 'Yuki Tanaka', role: 'Viewer',  email: 'yuki@lighthouse.fund' },
        ].map((m, i, arr) => (
          <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>{m.name.split(' ').map(s => s[0]).join('')}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>{m.email}</div>
            </div>
            <Pill tone={m.role === 'Admin' ? 'ai' : 'neutral'}>{m.role}</Pill>
          </div>
        ))}
      </Card>
    </div>
  );
}

function SecuritySection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>Security</h1>
      <Card padding={24}>
        <CardHead label="Two-factor authentication" right={<Pill tone="pos" dot>Enabled</Pill>} />
        <p style={{ color: 'var(--fg-secondary)', fontSize: 13, marginBottom: 16, marginTop: 0 }}>You're using an authenticator app (Authy).</p>
        <Button variant="secondary">Manage 2FA</Button>
      </Card>
      <Card padding={24}>
        <CardHead label="Active sessions" />
        {[
          { device: 'MacBook Pro · macOS', loc: 'New York, US', time: 'Active now' },
          { device: 'iPhone · iOS 17', loc: 'New York, US', time: '2 hours ago' },
        ].map((s, i, arr) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{s.device}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>{s.loc} · {s.time}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function AppearanceSection() {
  const [theme, setTheme] = useState('dark');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>Appearance</h1>
      <Card padding={24}>
        <CardHead label="Theme" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {['dark', 'light', 'system'].map(t => {
            const on = theme === t;
            return (
              <div key={t} onClick={() => setTheme(t)} style={{
                padding: 16, border: `1px solid ${on ? 'var(--purple-border)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: on ? 'var(--purple-tint-1)' : 'var(--bg-surface)',
              }}>
                <div style={{ height: 60, background: t === 'dark' ? '#0C0C0E' : t === 'light' ? '#FAFAF9' : 'linear-gradient(90deg, #0C0C0E 50%, #FAFAF9 50%)', borderRadius: 6, marginBottom: 10, border: '1px solid var(--border-subtle)' }} />
                <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{t}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--fg-tertiary)', fontWeight: 500 }}>{label}</label>
      <input defaultValue={value} style={{
        padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)', color: 'var(--fg-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none',
      }} />
    </div>
  );
}

function Toggle({ label, desc, on: initOn, compact }) {
  const [on, setOn] = useState(!!initOn);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: compact ? 0 : '12px 0', borderBottom: compact ? 'none' : '1px solid var(--border-subtle)' }}>
      {label && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
          {desc && <div style={{ fontSize: 12, color: 'var(--fg-tertiary)', marginTop: 2 }}>{desc}</div>}
        </div>
      )}
      <button onClick={() => setOn(!on)} style={{
        width: 36, height: 20, borderRadius: 10, background: on ? 'var(--accent-primary)' : 'var(--bg-elevated)',
        border: '1px solid var(--border-default)', position: 'relative', cursor: 'pointer', padding: 0,
        transition: 'background 150ms', flexShrink: 0,
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: '#EDEDEF',
          position: 'absolute', top: 2, left: on ? 19 : 2, transition: 'left 150ms',
        }} />
      </button>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: 'var(--fg-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--fg-quaternary)', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  );
}

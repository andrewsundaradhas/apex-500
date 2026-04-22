const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS = API.replace(/^http/, 'ws');

const TOKEN_KEY = 'apex_token';
const USER_KEY = 'apex_user';

export const auth = {
  getToken: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  getUser: () => {
    try { const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null; } catch { return null; }
  },
  setSession: (token, user) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch {}
  },
  isAuthed: () => {
    try { return Boolean(localStorage.getItem(TOKEN_KEY)); } catch { return false; }
  },
};

async function request(path, opts = {}) {
  const token = auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (res.status === 401) {
    auth.clear();
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ''}`);
  }
  return res.json();
}

export const api = {
  // Market
  quote:    (t)            => request(`/api/market/quote/${t}`),
  history:  (t, tf = '1M') => request(`/api/market/history/${t}?timeframe=${tf}`),
  sectors:  ()             => request('/api/market/sectors'),

  // ML
  predict:  (t, horizon = '5d', model = 'ensemble') =>
    request(`/api/predict/${t}?horizon=${horizon}&model=${model}`),
  backtest: (t, model = 'arima', horizon = 5, max_folds = 20) =>
    request(`/api/backtest/${t}?model=${model}&horizon=${horizon}&max_folds=${max_folds}`),

  // Insights + sentiment
  insights:  () => request('/api/insights'),
  sentiment: (t) => request(`/api/data/sentiment${t ? `?ticker=${t}` : ''}`),

  // Watchlist
  watchlist: {
    list:   () => request('/api/watchlist'),
    add:    (ticker) => request('/api/watchlist', { method: 'POST', body: JSON.stringify({ ticker }) }),
    remove: (ticker) => request(`/api/watchlist/${ticker}`, { method: 'DELETE' }),
  },

  // Alerts
  alerts: {
    list:     ()      => request('/api/alerts'),
    create:   (body)  => request('/api/alerts',             { method: 'POST',  body: JSON.stringify(body) }),
    remove:   (id)    => request(`/api/alerts/${id}`,       { method: 'DELETE' }),
    evaluate: ()      => request('/api/alerts/evaluate',    { method: 'POST' }),
  },

  // Metrics & history
  metrics: {
    summary:    ()        => request('/api/metrics/summary'),
    models:     (ticker)  => request(`/api/metrics/models${ticker ? `?ticker=${ticker}` : ''}`),
    predictions: (ticker, limit = 40) =>
      request(`/api/metrics/predictions?limit=${limit}${ticker ? `&ticker=${ticker}` : ''}`),
  },

  // Reference data
  data: {
    sp500:   (sector) => request(`/api/data/sp500${sector ? `?sector=${encodeURIComponent(sector)}` : ''}`),
    sectors: ()       => request('/api/data/sp500/sectors'),
    macro:   ()       => request('/api/data/macro'),
    news:    (t)      => request(`/api/data/news${t ? `?ticker=${t}` : ''}`),
  },

  // Auth
  login:  async (email, password) => {
    const r = await request('/api/auth/login',  { method: 'POST', body: JSON.stringify({ email, password }) });
    if (r?.token) auth.setSession(r.token, r.user);
    return r;
  },
  signup: async (email, password, name) => {
    const r = await request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) });
    if (r?.token) auth.setSession(r.token, r.user);
    return r;
  },
  logout: () => { auth.clear(); },

  // System
  health: () => request('/health'),
  exportPredictionsUrl: () => `${API}/api/export/predictions.csv`,
  exportWatchlistUrl:   () => `${API}/api/export/watchlist.csv`,
};

// Live quotes WebSocket helper
export function connectLiveQuotes(tickers, onTick) {
  let ws;
  let closed = false;
  function open() {
    if (closed) return;
    ws = new WebSocket(`${WS}/ws/quotes`);
    ws.onopen = () => ws.send(JSON.stringify({ tickers }));
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'tick' && msg.quotes) onTick(msg.quotes);
      } catch {}
    };
    ws.onclose = () => { if (!closed) setTimeout(open, 2000); };
    ws.onerror = () => ws.close();
  }
  open();
  return () => { closed = true; ws && ws.close(); };
}

export default api;

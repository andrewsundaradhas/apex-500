import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Marketing from './pages/Marketing.jsx';
import Onboarding from './pages/Onboarding.jsx';
import AppShell from './pages/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Predictions from './pages/Predictions.jsx';
import Insights from './pages/Insights.jsx';
import Watchlist from './pages/Watchlist.jsx';
import Settings from './pages/Settings.jsx';
import PredictionDetail from './pages/PredictionDetail.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import BackendStatus from './components/BackendStatus.jsx';

function Protected({ page, children }) {
  return (
    <RequireAuth>
      <AppShell page={page}>{children}</AppShell>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BackendStatus />
      <Routes>
        <Route path="/" element={<Marketing />} />
        <Route path="/login" element={<Onboarding />} />
        <Route path="/dashboard" element={<Protected page="dashboard"><Dashboard /></Protected>} />
        <Route path="/predictions" element={<Protected page="predictions"><Predictions /></Protected>} />
        <Route path="/predictions/:id" element={<Protected page="predictions"><PredictionDetail /></Protected>} />
        <Route path="/insights" element={<Protected page="insights"><Insights /></Protected>} />
        <Route path="/watchlist" element={<Protected page="watchlist"><Watchlist /></Protected>} />
        <Route path="/settings" element={<Protected page="settings"><Settings /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { useState } from 'react';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Marketing />} />
        <Route path="/login" element={<Onboarding />} />
        <Route path="/dashboard" element={<AppShell page="dashboard"><Dashboard /></AppShell>} />
        <Route path="/predictions" element={<AppShell page="predictions"><Predictions /></AppShell>} />
        <Route path="/predictions/:id" element={<AppShell page="predictions"><PredictionDetail /></AppShell>} />
        <Route path="/insights" element={<AppShell page="insights"><Insights /></AppShell>} />
        <Route path="/watchlist" element={<AppShell page="watchlist"><Watchlist /></AppShell>} />
        <Route path="/settings" element={<AppShell page="settings"><Settings /></AppShell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

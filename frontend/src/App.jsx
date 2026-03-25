import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { AdminProvider } from './context/AdminContext';

// Pages
import Home from './pages/Home';
import JoinPage from './pages/JoinPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ChallengeEditor from './pages/admin/ChallengeEditor';
import LiveControl from './pages/admin/LiveControl';
import GameRoom from './pages/game/GameRoom';

function RequireAdmin({ children }) {
  const token = localStorage.getItem('qt_admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <GameProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/join/:slug" element={<JoinPage />} />
            <Route path="/play/:slug" element={<GameRoom />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/challenges/:id/edit"
              element={
                <RequireAdmin>
                  <ChallengeEditor />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/challenges/:id/live"
              element={
                <RequireAdmin>
                  <LiveControl />
                </RequireAdmin>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GameProvider>
      </AdminProvider>
    </BrowserRouter>
  );
}

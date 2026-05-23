import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { AdminProvider } from './context/AdminContext';
import { ADMIN_PATH } from './lib/adminPath';

// Pages
import Home from './pages/Home';
import JoinPage from './pages/JoinPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ChallengeEditor from './pages/admin/ChallengeEditor';
import LiveControl from './pages/admin/LiveControl';
import GameRoom from './pages/game/GameRoom';
import RaffleJoin from './pages/RaffleJoin';
import RaffleRoom from './pages/RaffleRoom';
import RaffleControl from './pages/admin/RaffleControl';
import QRScreen from './pages/QRScreen';
import HallOfFame from './pages/HallOfFame';
import ChallengeDisplay from './pages/display/ChallengeDisplay';
import RaffleDisplay from './pages/display/RaffleDisplay';

// Concurso externo "El Gran Upgrade"
import ContestLanding from './pages/contest/ContestLanding';
import ContestForm from './pages/contest/ContestForm';
import ContestVoting from './pages/contest/ContestVoting';
import ContestAdmin from './pages/admin/ContestAdmin';

function RequireAdmin({ children }) {
  const token = localStorage.getItem('qt_admin_token');
  if (!token) return <Navigate to={`${ADMIN_PATH}/login`} replace />;
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
            <Route path="/sorteo/:slug" element={<RaffleJoin />} />
            <Route path="/sorteo/:slug/lobby" element={<RaffleRoom />} />

            {/* Admin routes — path prefix configurable via VITE_ADMIN_PATH */}
            <Route path={`${ADMIN_PATH}/login`} element={<AdminLogin />} />
            <Route
              path={ADMIN_PATH}
              element={
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              }
            />
            <Route
              path={`${ADMIN_PATH}/challenges/:id/edit`}
              element={
                <RequireAdmin>
                  <ChallengeEditor />
                </RequireAdmin>
              }
            />
            <Route
              path={`${ADMIN_PATH}/challenges/:id/live`}
              element={
                <RequireAdmin>
                  <LiveControl />
                </RequireAdmin>
              }
            />
            <Route
              path={`${ADMIN_PATH}/raffles/:id/control`}
              element={
                <RequireAdmin>
                  <RaffleControl />
                </RequireAdmin>
              }
            />

            {/* Concurso externo — rutas públicas */}
            <Route path="/concursos/el-gran-upgrade" element={<ContestLanding />} />
            <Route path="/concursos/el-gran-upgrade/inscripcion" element={<ContestForm />} />
            <Route path="/concursos/el-gran-upgrade/votacion" element={<ContestVoting />} />

            {/* Concurso externo — panel admin */}
            <Route
              path={`${ADMIN_PATH}/concurso`}
              element={
                <RequireAdmin>
                  <ContestAdmin />
                </RequireAdmin>
              }
            />

            <Route path="/qr" element={<QRScreen />} />
            <Route path="/hof/:slug" element={<HallOfFame />} />
            <Route path="/display/challenge/:slug" element={<ChallengeDisplay />} />
            <Route path="/display/raffle/:slug" element={<RaffleDisplay />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GameProvider>
      </AdminProvider>
    </BrowserRouter>
  );
}

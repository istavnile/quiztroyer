import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab]         = useState('login'); // login | forgot | reset
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail]     = useState('');
  const [newPass, setNewPass] = useState('');
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);

  const resetToken = searchParams.get('token');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/admin/login', { username, password });
      localStorage.setItem('qt_admin_token', res.data.token);
      localStorage.setItem('qt_admin_username', res.data.username || username);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally { setLoading(false); }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/admin/auth/forgot-password', { email });
      setInfo('Si el email existe, recibirás un enlace de recuperación.');
    } catch { setInfo('Si el email existe, recibirás un enlace de recuperación.'); }
    finally { setLoading(false); }
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/admin/auth/reset-password', { token: resetToken, newPassword: newPass });
      setInfo('Contraseña restablecida. Puedes iniciar sesión.');
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Token inválido o expirado');
    } finally { setLoading(false); }
  }

  const activeTab = resetToken ? 'reset' : tab;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-2xl font-black text-white">Panel de Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Quiztroyer Control Center</p>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'login' && (
            <motion.form key="login" onSubmit={handleLogin} className="space-y-4"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Usuario</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin" autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading || !username || !password}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
              <p className="text-center">
                <button type="button" onClick={() => { setTab('forgot'); setError(''); setInfo(''); }}
                  className="text-slate-500 hover:text-indigo-400 text-xs transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
            </motion.form>
          )}

          {activeTab === 'forgot' && (
            <motion.form key="forgot" onSubmit={handleForgot} className="space-y-4"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <p className="text-slate-400 text-sm">Ingresa tu email de recuperación y te enviaremos un enlace.</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com" autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {info  && <p className="text-green-400 text-sm">{info}</p>}
              <button type="submit" disabled={loading || !email}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
              <p className="text-center">
                <button type="button" onClick={() => { setTab('login'); setError(''); setInfo(''); }}
                  className="text-slate-500 hover:text-indigo-400 text-xs transition-colors">
                  ← Volver al login
                </button>
              </p>
            </motion.form>
          )}

          {activeTab === 'reset' && (
            <motion.form key="reset" onSubmit={handleReset} className="space-y-4"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <p className="text-slate-400 text-sm">Elige tu nueva contraseña.</p>
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                placeholder="Nueva contraseña" autoFocus minLength={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {info  && <p className="text-green-400 text-sm">{info}</p>}
              <button type="submit" disabled={loading || newPass.length < 6}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">
                {loading ? 'Guardando...' : 'Restablecer contraseña'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center mt-6">
          <a href="/" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">← Volver al inicio</a>
        </p>
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import PageBackground from '../../components/PageBackground';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab]           = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail]       = useState('');
  const [newPass, setNewPass]   = useState('');
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');
  const [loading, setLoading]   = useState(false);

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

  const inputClass = "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/40 focus:bg-white/[0.09] transition-all text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#09090f' }}>
      <PageBackground siteSettings={{ homeBgColor: '#09090f', blob1Color: '#3b82f6', blob2Color: '#06b6d4', blob3Color: '#6366f1', bgEffect: 'blobs' }} color="#3b82f6" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="glass-card rounded-3xl p-8 w-full max-w-sm relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="glass-pill rounded-2xl p-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-blue-300">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Panel de Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Quiztroyer Control Center</p>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'login' && (
            <motion.form key="login" onSubmit={handleLogin} className="space-y-3"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium tracking-wide uppercase">Usuario</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin" autoFocus className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium tracking-wide uppercase">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className={inputClass} />
              </div>
              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div className="pt-1">
                <button type="submit" disabled={loading || !username || !password}
                  className="glass-btn-blue w-full font-bold py-3 rounded-xl disabled:opacity-40 text-sm">
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </div>
              <p className="text-center pt-1">
                <button type="button" onClick={() => { setTab('forgot'); setError(''); setInfo(''); }}
                  className="text-slate-600 hover:text-slate-400 text-xs transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
            </motion.form>
          )}

          {activeTab === 'forgot' && (
            <motion.form key="forgot" onSubmit={handleForgot} className="space-y-3"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <p className="text-slate-500 text-sm">Ingresa tu email y te enviaremos un enlace de recuperación.</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com" autoFocus className={inputClass} />
              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              {info  && <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{info}</p>}
              <div className="pt-1">
                <button type="submit" disabled={loading || !email}
                  className="glass-btn-blue w-full font-bold py-3 rounded-xl disabled:opacity-40 text-sm">
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </div>
              <p className="text-center pt-1">
                <button type="button" onClick={() => { setTab('login'); setError(''); setInfo(''); }}
                  className="text-slate-600 hover:text-slate-400 text-xs transition-colors">
                  ← Volver al login
                </button>
              </p>
            </motion.form>
          )}

          {activeTab === 'reset' && (
            <motion.form key="reset" onSubmit={handleReset} className="space-y-3"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <p className="text-slate-500 text-sm">Elige tu nueva contraseña.</p>
              <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                placeholder="Nueva contraseña" autoFocus minLength={6} className={inputClass} />
              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              {info  && <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{info}</p>}
              <div className="pt-1">
                <button type="submit" disabled={loading || newPass.length < 6}
                  className="glass-btn-blue w-full font-bold py-3 rounded-xl disabled:opacity-40 text-sm">
                  {loading ? 'Guardando...' : 'Restablecer contraseña'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-5 border-t border-white/[0.07] text-center">
          <a href="/" className="text-slate-600 hover:text-slate-400 text-xs transition-colors">← Volver al inicio</a>
        </div>
      </motion.div>
    </div>
  );
}

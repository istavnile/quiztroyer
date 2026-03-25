import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';

const STATUS_BADGE = {
  DRAFT:  { label: 'Borrador',     color: 'text-slate-400 bg-slate-700' },
  LIVE:   { label: '🔴 En vivo',   color: 'text-green-400 bg-green-500/20' },
  ENDED:  { label: 'Finalizado',   color: 'text-purple-400 bg-purple-500/20' },
};

/* ── Modal de confirmación reutilizable ── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="text-3xl mb-3 text-center">⚠️</div>
        <p className="text-white text-center font-medium mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition-all"
          >
            Eliminar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({ name: '', slug: '', pin: '' });
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const [deleting, setDeleting]     = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [siteSettings, setSiteSettings]   = useState({ blob1Color: '#6366f1', blob2Color: '#a855f7', blob3Color: '#ec4899', homeBgColor: '#0f172a', homeButtonColor: '#4f46e5' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showAdmins, setShowAdmins]       = useState(false);
  const [adminList, setAdminList]         = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [newAdmin, setNewAdmin]           = useState({ username: '', email: '', password: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError]       = useState('');
  const [showChangePass, setShowChangePass] = useState(false);
  const [changePassForm, setChangePassForm] = useState({ current: '', next: '' });
  const [changePassError, setChangePassError] = useState('');
  const [changePassOk, setChangePassOk]     = useState(false);
  const [savingPass, setSavingPass]         = useState(false);
  const [resultsChallenge, setResultsChallenge] = useState(null); // { id, name }
  const [results, setResults]               = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const currentUsername = localStorage.getItem('qt_admin_username') || 'admin';

  useEffect(() => { loadChallenges(); }, []);

  useEffect(() => {
    api.get('/settings').then((r) => setSiteSettings(r.data)).catch(() => {});
  }, []);

  async function loadChallenges() {
    try {
      const res = await api.get('/admin/challenges');
      setChallenges(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const res = await api.post('/admin/challenges', form);
      navigate(`/admin/challenges/${res.data.id}/edit`);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Error al crear el desafío');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/challenges/${confirmDelete.id}`);
      setChallenges((prev) => prev.filter((c) => c.id !== confirmDelete.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  function autoSlug(name) {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function handleLogout() {
    localStorage.removeItem('qt_admin_token');
    navigate('/admin/login');
  }

  async function saveSiteSettings() {
    setSavingSettings(true);
    try {
      const res = await api.patch('/admin/settings', siteSettings);
      setSiteSettings(res.data);
      setShowSettings(false);
    } finally {
      setSavingSettings(false);
    }
  }

  async function loadAdmins() {
    setLoadingAdmins(true);
    try { const r = await api.get('/admin/admins'); setAdminList(r.data); }
    finally { setLoadingAdmins(false); }
  }

  async function handleCreateAdmin(e) {
    e.preventDefault();
    setCreatingAdmin(true); setAdminError('');
    try {
      await api.post('/admin/admins', newAdmin);
      setNewAdmin({ username: '', email: '', password: '' });
      loadAdmins();
    } catch (err) { setAdminError(err.response?.data?.error || 'Error'); }
    finally { setCreatingAdmin(false); }
  }

  async function handleDeleteAdmin(id) {
    if (!window.confirm('¿Eliminar este admin?')) return;
    await api.delete(`/admin/admins/${id}`);
    loadAdmins();
  }

  async function loadResults(challengeId) {
    setLoadingResults(true);
    setResults([]);
    try {
      const r = await api.get(`/admin/challenges/${challengeId}/results`);
      setResults(r.data);
    } finally {
      setLoadingResults(false);
    }
  }

  function exportCSV() {
    const rows = [
      ['Puesto', 'Nombre', 'DNI', 'Puntaje', 'Fecha'],
      ...results.map((s, i) => [
        i + 1,
        s.playerName,
        s.playerDni,
        s.totalScore,
        s.completedAt ? new Date(s.completedAt).toLocaleString('es-PE') : '-',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados-${resultsChallenge?.name || 'quiz'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setSavingPass(true); setChangePassError(''); setChangePassOk(false);
    try {
      await api.patch('/admin/admins/me/password', { currentPassword: changePassForm.current, newPassword: changePassForm.next });
      setChangePassOk(true);
      setChangePassForm({ current: '', next: '' });
    } catch (err) { setChangePassError(err.response?.data?.error || 'Error'); }
    finally { setSavingPass(false); }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="blob-anim-1 absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full blur-3xl opacity-20" style={{ background: siteSettings.blob1Color }} />
        <div className="blob-anim-2 absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full blur-3xl opacity-20" style={{ background: siteSettings.blob2Color }} />
      </div>
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmModal
            message={`¿Eliminar "${confirmDelete.name}" permanentemente? Esta acción no se puede deshacer.`}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h2 className="text-lg font-bold text-white mb-5">🎨 Pantalla de inicio</h2>
              <div className="space-y-4">
                {[
                  { key: 'homeBgColor',      label: 'Fondo de la pantalla' },
                  { key: 'homeButtonColor',  label: 'Color del botón' },
                  { key: 'blob1Color',       label: 'Blob 1 (arriba derecha)' },
                  { key: 'blob2Color',       label: 'Blob 2 (abajo izquierda)' },
                  { key: 'blob3Color',       label: 'Blob 3 (centro)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={siteSettings[key] || '#6366f1'}
                      onChange={(e) => setSiteSettings((s) => ({ ...s, [key]: e.target.value }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent shrink-0"
                    />
                    <div className="flex-1">
                      <label className="text-xs text-slate-400">{label}</label>
                      <input
                        type="text"
                        value={siteSettings[key] || '#6366f1'}
                        onChange={(e) => setSiteSettings((s) => ({ ...s, [key]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-0.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveSiteSettings}
                  disabled={savingSettings}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-all text-sm"
                >
                  {savingSettings ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showChangePass && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowChangePass(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h2 className="text-lg font-bold text-white mb-1">🔑 Cambiar contraseña</h2>
              <p className="text-slate-500 text-xs mb-5">Usuario: <span className="text-slate-300">{currentUsername}</span></p>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <input type="password" placeholder="Contraseña actual" value={changePassForm.current}
                  onChange={(e) => setChangePassForm((f) => ({ ...f, current: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
                <input type="password" placeholder="Nueva contraseña (mín. 6 chars)" value={changePassForm.next}
                  onChange={(e) => setChangePassForm((f) => ({ ...f, next: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
                {changePassError && <p className="text-red-400 text-xs">{changePassError}</p>}
                {changePassOk    && <p className="text-green-400 text-xs">✓ Contraseña actualizada</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowChangePass(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingPass || !changePassForm.current || changePassForm.next.length < 6}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-all text-sm">
                    {savingPass ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showAdmins && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowAdmins(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">👥 Administradores</h2>
                <button onClick={() => setShowAdmins(false)} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
              </div>

              {/* Existing admins */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {loadingAdmins ? (
                  <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : adminList.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{a.username}</p>
                      <p className="text-slate-500 text-xs truncate">{a.email || 'Sin email'}</p>
                    </div>
                    {a.username !== currentUsername && (
                      <button onClick={() => handleDeleteAdmin(a.id)}
                        className="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors">
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Create new admin */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Crear nuevo admin</p>
                <form onSubmit={handleCreateAdmin} className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Usuario" value={newAdmin.username}
                      onChange={(e) => setNewAdmin((f) => ({ ...f, username: e.target.value }))}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
                    <input type="email" placeholder="Email (opc.)" value={newAdmin.email}
                      onChange={(e) => setNewAdmin((f) => ({ ...f, email: e.target.value }))}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
                  </div>
                  <input type="password" placeholder="Contraseña" value={newAdmin.password}
                    onChange={(e) => setNewAdmin((f) => ({ ...f, password: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm" />
                  {adminError && <p className="text-red-400 text-xs">{adminError}</p>}
                  <button type="submit" disabled={creatingAdmin || !newAdmin.username || !newAdmin.password}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-xl font-bold transition-all text-sm">
                    {creatingAdmin ? 'Creando...' : '+ Crear admin'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
        {resultsChallenge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setResultsChallenge(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">📊 Resultados</h2>
                  <p className="text-slate-500 text-xs mt-0.5">{resultsChallenge.name}</p>
                </div>
                <div className="flex gap-2">
                  {results.length > 0 && (
                    <button onClick={exportCSV}
                      className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                      ⬇ CSV
                    </button>
                  )}
                  <button onClick={() => setResultsChallenge(null)}
                    className="text-slate-500 hover:text-slate-300 text-xl px-1">×</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingResults ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>Sin participantes aún</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700">
                        <th className="pb-2 pr-3">#</th>
                        <th className="pb-2 pr-3">Nombre</th>
                        <th className="pb-2 pr-3">DNI</th>
                        <th className="pb-2 pr-3 text-right">Puntaje</th>
                        <th className="pb-2 text-right">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {results.map((s, i) => (
                        <tr key={s.id} className={i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-400'}>
                          <td className="py-2.5 pr-3 font-bold">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                          </td>
                          <td className="py-2.5 pr-3 font-semibold text-white">{s.playerName}</td>
                          <td className="py-2.5 pr-3 font-mono">{s.playerDni}</td>
                          <td className="py-2.5 pr-3 text-right font-bold">{s.totalScore.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-xs text-slate-500">
                            {s.completedAt ? new Date(s.completedAt).toLocaleString('es-PE') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">
              <span className="text-gradient">QUIZ</span>TROYER
            </h1>
            <p className="text-slate-400 text-sm mt-1">Panel de Administrador</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowChangePass(true); setChangePassError(''); setChangePassOk(false); }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium px-4 py-2 rounded-xl transition-all text-sm"
              title="Cambiar contraseña"
            >
              🔑
            </button>
            <button
              onClick={() => { setShowAdmins(true); loadAdmins(); setAdminError(''); }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium px-4 py-2 rounded-xl transition-all text-sm"
              title="Gestionar admins"
            >
              👥
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium px-4 py-2 rounded-xl transition-all text-sm"
              title="Personalizar pantalla de inicio"
            >
              🎨
            </button>
            <button
              onClick={() => { setShowCreate(true); setCreateError(''); setForm({ name: '', slug: '', pin: '' }); }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all text-sm"
            >
              + Nuevo Desafío
            </button>
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium px-4 py-2 rounded-xl transition-all text-sm"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                <h2 className="text-xl font-bold text-white mb-6">✨ Nuevo Desafío</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setForm((f) => ({ ...f, name, slug: autoSlug(name) }));
                      }}
                      placeholder="Mi Quiz Épico"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Slug (URL)</label>
                    <div className="flex items-center">
                      <span className="bg-slate-700 border border-r-0 border-slate-600 rounded-l-xl px-3 py-2.5 text-slate-500 text-sm">/</span>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                        placeholder="mi-quiz-epico"
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-r-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">PIN de acceso</label>
                    <input
                      type="text"
                      value={form.pin}
                      onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
                      placeholder="1234"
                      maxLength={8}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 tracking-widest text-center text-xl"
                      required
                    />
                  </div>
                  {createError && (
                    <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-2">
                      <p className="text-red-400 text-sm">{createError}</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !form.name || !form.slug || !form.pin}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-all"
                    >
                      {creating ? 'Creando...' : 'Crear →'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Challenges grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-bold text-white mb-2">Sin desafíos aún</h2>
            <p className="text-slate-400 mb-6">Crea tu primer quiz para comenzar</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              + Crear primer desafío
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((c, i) => {
              const badge = STATUS_BADGE[c.status] || STATUS_BADGE.DRAFT;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-5 flex flex-col gap-4 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-base truncate">{c.name}</h3>
                      <p className="text-slate-500 text-xs mt-0.5">/{c.slug}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>📝 {c._count?.questions || 0} preguntas</span>
                    <span>👥 {c._count?.sessions || 0} jugadores</span>
                    <span>🔑 {c.pin}</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => navigate(`/admin/challenges/${c.id}/edit`)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 rounded-xl transition-all"
                    >
                      Editar
                    </button>
                    {c.status !== 'ENDED' && (
                      <button
                        onClick={() => navigate(`/admin/challenges/${c.id}/live`)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-2 rounded-xl transition-all"
                      >
                        🎮 Live
                      </button>
                    )}
                    {c._count?.sessions > 0 && (
                      <button
                        onClick={() => { setResultsChallenge({ id: c.id, name: c.name }); loadResults(c.id); }}
                        className="bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-sm px-3 py-2 rounded-xl transition-all"
                        title="Ver resultados"
                      >
                        📊
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete({ id: c.id, name: c.name })}
                      className="bg-red-500/15 hover:bg-red-500/30 text-red-400 text-sm px-3 py-2 rounded-xl transition-all"
                      title="Eliminar"
                    >
                      🗑
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

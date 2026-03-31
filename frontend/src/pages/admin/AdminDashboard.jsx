import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../lib/api';
import PageBackground from '../../components/PageBackground';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  UilKeySkeleton, UilUsersAlt, UilPalette, UilSignout,
  UilPlus, UilTicket, UilBullseye, UilPlay,
  UilTrashAlt, UilChartBar, UilFileAlt, UilSave,
  UilUpload, UilExclamationTriangle, UilDashboard, UilLock, UilRefresh, UilArchive,
  UilQrcodeScan, UilExpandAlt, UilTimesCircle, UilFileDownloadAlt,
} from '@iconscout/react-unicons';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function ScrambledLogo() {
  const QUIZ = 'QUIZ';
  const TROYER = 'TROYER';
  const [quizLetters, setQuizLetters]     = useState(QUIZ.split(''));
  const [troyerLetters, setTroyerLetters] = useState(TROYER.split(''));

  function scramble() {
    const full  = QUIZ + TROYER;
    const steps = 16;
    let step    = 0;
    const timer = setInterval(() => {
      step++;
      const resolved = Math.floor((step / steps) * full.length);
      const next = full.split('').map((ch, i) =>
        i < resolved ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
      );
      setQuizLetters(next.slice(0, 4));
      setTroyerLetters(next.slice(4));
      if (step >= steps) {
        clearInterval(timer);
        setQuizLetters(QUIZ.split(''));
        setTroyerLetters(TROYER.split(''));
      }
    }, 45);
  }

  useEffect(() => {
    const t1 = setTimeout(scramble, 600);
    const t2 = setInterval(scramble, 9000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, []);

  return (
    <h1 className="text-2xl sm:text-3xl font-black tracking-tight select-none">
      <span className="text-gradient">{quizLetters.join('')}</span>
      <span className="text-white">{troyerLetters.join('')}</span>
    </h1>
  );
}

const STATUS_BADGE = {
  DRAFT:  { label: 'Borrador',     color: 'text-slate-400 bg-white/5 border border-white/10' },
  LIVE:   { label: '🔴 En vivo',   color: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' },
  ENDED:  { label: 'Finalizado',   color: 'text-sky-400 bg-sky-500/10 border border-sky-500/20' },
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
        <div className="flex justify-center mb-3"><UilExclamationTriangle size={32} className="text-yellow-400" /></div>
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

/* ── QR Modal ── */
function QRModal({ url, title, pin, onClose }) {
  function openFullscreen() {
    const params = new URLSearchParams({ url, title, ...(pin ? { pin } : {}) });
    window.open(`/qr?${params.toString()}`, '_blank', 'noopener');
  }
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl flex flex-col items-center gap-4"
      >
        <div className="w-full flex items-center justify-between">
          <h3 className="text-white font-bold text-sm truncate max-w-[200px]">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <UilTimesCircle size={20} />
          </button>
        </div>
        <div className="bg-white p-3 rounded-xl">
          <QRCodeSVG value={url} size={200} level="H" includeMargin={false} />
        </div>
        <p className="text-slate-500 text-xs text-center break-all">{url}</p>
        {pin && (
          <div className="text-center">
            <p className="text-slate-500 text-xs mb-1">PIN</p>
            <p className="text-white font-black text-2xl tracking-widest">{pin}</p>
          </div>
        )}
        <button
          onClick={openFullscreen}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-xl transition-all"
        >
          <UilExpandAlt size={16} />Proyectar en pantalla
        </button>
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
  const [confirmDelete, setConfirmDelete]   = useState(null); // { id, name }
  const [confirmReset, setConfirmReset]     = useState(null); // { id, name }
  const [deleting, setDeleting]             = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [siteSettings, setSiteSettings]   = useState({ blob1Color: '#3b82f6', blob2Color: '#06b6d4', blob3Color: '#6366f1', homeBgColor: '#09090f', homeButtonColor: '#3b82f6', logoUrl: '', bgEffect: 'blobs' });
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
  const [raffles, setRaffles]               = useState([]);
  const [showCreateRaffle, setShowCreateRaffle] = useState(false);
  const [raffleForm, setRaffleForm]         = useState({ name: '', slug: '', pin: '' });
  const [creatingRaffle, setCreatingRaffle] = useState(false);
  const [raffleError, setRaffleError]       = useState('');
  const [qrModal, setQrModal]               = useState(null); // { url, title }
  const [showArchived, setShowArchived]     = useState(false);
  const [archivedChallenges, setArchivedChallenges] = useState([]);
  const [archivedRaffles, setArchivedRaffles]       = useState([]);
  const [selectedRaffles, setSelectedRaffles]       = useState(new Set());
  const [exportingRaffles, setExportingRaffles]     = useState(false);
  const [showExportModal, setShowExportModal]       = useState(false);
  const [exportSelection, setExportSelection]       = useState(new Set());
  const currentUsername = localStorage.getItem('qt_admin_username') || 'admin';

  useEffect(() => { loadChallenges(); loadRaffles(); }, []);

  useEffect(() => {
    api.get('/settings').then((r) => setSiteSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (showArchived) {
      api.get('/admin/challenges?archived=true').then((r) => setArchivedChallenges(r.data)).catch(() => {});
      api.get('/raffle/admin/list?archived=true').then((r) => setArchivedRaffles(r.data)).catch(() => {});
    }
  }, [showArchived]);

  async function loadChallenges() {
    try {
      const res = await api.get('/admin/challenges');
      setChallenges(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleArchiveChallenge(id, archive) {
    await api.patch(`/admin/challenges/${id}/archive`, { archived: archive });
    if (archive) {
      setChallenges((p) => p.filter((c) => c.id !== id));
      setArchivedChallenges((p) => [...p]); // trigger re-fetch on next open
    } else {
      setArchivedChallenges((p) => p.filter((c) => c.id !== id));
      loadChallenges();
    }
  }

  async function handleArchiveRaffle(id, archive) {
    await api.patch(`/raffle/admin/${id}/archive`, { archived: archive });
    if (archive) {
      setRaffles((p) => p.filter((r) => r.id !== id));
    } else {
      setArchivedRaffles((p) => p.filter((r) => r.id !== id));
      loadRaffles();
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

  async function handleReset() {
    if (!confirmReset) return;
    try {
      await api.post(`/admin/challenges/${confirmReset.id}/reset`);
      setChallenges((prev) => prev.map((c) => c.id === confirmReset.id ? { ...c, status: 'DRAFT' } : c));
    } catch (err) {
      alert(err.response?.data?.error || 'Error al reiniciar');
    } finally {
      setConfirmReset(null);
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

  async function loadRaffles() {
    try { const r = await api.get('/raffle/admin/list'); setRaffles(r.data); } catch {}
  }

  async function handleCreateRaffle(e) {
    e.preventDefault();
    setCreatingRaffle(true); setRaffleError('');
    try {
      const res = await api.post('/raffle/admin/create', raffleForm);
      navigate(`/admin/raffles/${res.data.id}/control`);
    } catch (err) {
      setRaffleError(err.response?.data?.error || 'Error al crear el sorteo');
    } finally { setCreatingRaffle(false); }
  }

  async function handleDeleteRaffle(id, name) {
    if (!window.confirm(`¿Eliminar "${name}"?`)) return;
    await api.delete(`/raffle/admin/${id}`);
    loadRaffles();
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

  function toggleSelectRaffle(id) {
    setSelectedRaffles((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function hexToRgb(hex) {
    const r = parseInt((hex || '#6366f1').slice(1, 3), 16);
    const g = parseInt((hex || '#6366f1').slice(3, 5), 16);
    const b = parseInt((hex || '#6366f1').slice(5, 7), 16);
    return [r, g, b];
  }

  function buildCSVBlob(raffleDataList) {
    const rows = [['Sorteo', 'Nombre', 'Apellido', 'DNI', 'Correo', 'Teléfono', 'Ganador']];
    raffleDataList.forEach(({ data }) => {
      (data.entries || []).forEach((e) => {
        rows.push([data.name, e.nombre, e.apellido, e.dni, e.correo, e.telefono, e.isWinner ? 'Sí' : 'No']);
      });
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    return new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  }

  async function buildPDFDoc(raffleDataList) {
    const bg      = siteSettings.homeBgColor      || '#0f172a';
    const primary = siteSettings.homeButtonColor  || '#6366f1';
    const rawLogo = siteSettings.logoUrl          || '';
    const logoUrl = rawLogo ? (rawLogo.startsWith('/') ? window.location.origin + rawLogo : rawLogo) : null;

    // Pre-load logo once for all pages — also store natural dimensions
    let logoDataUrl = null;
    let logoNatW = 0, logoNatH = 1;
    if (logoUrl) {
      ({ dataUrl: logoDataUrl, w: logoNatW, h: logoNatH } = await new Promise((resolve) => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve({ dataUrl: canvas.toDataURL('image/png'), w: img.width, h: img.height });
          } catch { resolve({ dataUrl: null, w: 0, h: 1 }); }
        };
        img.onerror = () => resolve({ dataUrl: null, w: 0, h: 1 });
        img.src = logoUrl;
      }));
    }

    const doc = new jsPDF();
    let firstPage = true;
    for (const { data } of raffleDataList) {
      if (!firstPage) doc.addPage();
      firstPage = false;

      doc.setFillColor(bg);
      doc.rect(0, 0, 210, 40, 'F');

      if (logoDataUrl && logoNatH > 0) {
        try {
          const logoH = 18;
          const logoW = Math.min((logoNatW / logoNatH) * logoH, 60);
          doc.addImage(logoDataUrl, 'PNG', 196 - logoW, 6, logoW, logoH);
        } catch {}
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text(data.name, 14, 20);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 200);
      doc.text(`Participantes: ${data.entries?.length || 0}  ·  ${new Date().toLocaleDateString('es-PE')}`, 14, 30);
      const [pr, pg, pb] = hexToRgb(primary);
      doc.setDrawColor(pr, pg, pb); doc.setLineWidth(0.8); doc.line(14, 38, 196, 38);
      autoTable(doc, {
        startY: 44,
        head: [['#', 'Nombre', 'Apellido', 'DNI', 'Correo', 'Teléfono', '']],
        body: (data.entries || []).map((e, i) => [i + 1, e.nombre, e.apellido, e.dni, e.correo, e.telefono, e.isWinner ? 'GANADOR' : '']),
        headStyles: { fillColor: hexToRgb(primary), textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 60] },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        columnStyles: { 0: { cellWidth: 8 }, 6: { textColor: hexToRgb(primary), fontStyle: 'bold' } },
        margin: { left: 14, right: 14 },
      });
    }
    return doc;
  }

  async function exportRaffleCSV(id, name) {
    const { data } = await api.get(`/raffle/admin/${id}`);
    const blob = buildCSVBlob([{ data }]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function exportRafflePDF(id, name) {
    const { data } = await api.get(`/raffle/admin/${id}`);
    const doc = await buildPDFDoc([{ data }]);
    doc.save(`${name}.pdf`);
  }

  async function exportSelectedCSV() {
    if (!selectedRaffles.size) return;
    setExportingRaffles(true);
    try {
      const list = [];
      for (const id of selectedRaffles) { const r = await api.get(`/raffle/admin/${id}`); list.push(r); }
      const blob = buildCSVBlob(list);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const label = selectedRaffles.size === 1 ? raffles.find((r) => selectedRaffles.has(r.id))?.name || 'sorteo' : `sorteos-${selectedRaffles.size}`;
      a.href = url; a.download = `${label}.csv`; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingRaffles(false);
    }
  }

  async function exportSelectedPDF() {
    if (!selectedRaffles.size) return;
    setExportingRaffles(true);
    try {
      const list = [];
      for (const id of selectedRaffles) { const r = await api.get(`/raffle/admin/${id}`); list.push(r); }
      const doc = await buildPDFDoc(list);
      const label = selectedRaffles.size === 1 ? raffles.find((r) => selectedRaffles.has(r.id))?.name || 'sorteo' : `sorteos-${selectedRaffles.size}`;
      doc.save(`${label}.pdf`);
    } finally {
      setExportingRaffles(false);
    }
  }

  const accent = siteSettings.homeButtonColor || '#6366f1';

  return (
    <div className="min-h-screen p-4 sm:p-6 relative overflow-hidden" style={{ background: siteSettings.homeBgColor || '#0f172a' }}>
      <PageBackground siteSettings={siteSettings} color={accent} />
      <AnimatePresence>
        {qrModal && <QRModal url={qrModal.url} title={qrModal.title} pin={qrModal.pin} onClose={() => setQrModal(null)} />}
        {confirmReset && (
          <ConfirmModal
            message={`¿Reiniciar "${confirmReset.name}"? El historial de jugadores se conserva y el desafío vuelve a Borrador listo para jugar de nuevo.`}
            onConfirm={handleReset}
            onCancel={() => setConfirmReset(null)}
          />
        )}
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
              <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2"><UilPalette size={20} />Pantalla de inicio</h2>
              <div className="space-y-4">

                {/* Background effect selector */}
                <div>
                  <p className="text-xs text-slate-400 mb-2">Efecto de fondo</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'blobs',     label: 'Blobs'      },
                      { key: 'nodes',     label: 'Nodos'      },
                      { key: 'particles', label: 'Partículas' },
                      { key: 'waves',     label: 'Ondas'      },
                      { key: 'polygons',  label: 'Polígonos'  },
                      { key: 'pattern',   label: 'Patrón'     },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSiteSettings((s) => ({ ...s, bgEffect: key }))}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                          (siteSettings.bgEffect || 'blobs') === key
                            ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <p className="text-xs text-slate-400 mb-1">Logo (opcional)</p>
                  <div className="flex items-center gap-3">
                    {siteSettings.logoUrl && (
                      <img src={siteSettings.logoUrl} alt="logo" className="h-10 object-contain rounded bg-slate-800 p-1 shrink-0" />
                    )}
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1.5">
                      <UilUpload size={13} />Subir logo
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('image', file);
                        const res = await api.post('/admin/upload-image', fd);
                        setSiteSettings((s) => ({ ...s, logoUrl: res.data.url }));
                      }} />
                    </label>
                    {siteSettings.logoUrl && (
                      <button onClick={() => setSiteSettings((s) => ({ ...s, logoUrl: '' }))}
                        className="text-red-400 text-xs hover:text-red-300">✕ Quitar</button>
                    )}
                  </div>
                </div>

                {/* Color fields */}
                {[
                  { key: 'homeBgColor',      label: 'Fondo de la pantalla' },
                  { key: 'homeButtonColor',  label: 'Color del botón / acento' },
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
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 mt-0.5"
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
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-all text-sm"
                >
                  {savingSettings ? 'Guardando...' : <span className="flex items-center justify-center gap-1.5"><UilSave size={16} />Guardar</span>}
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
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><UilKeySkeleton size={20} />Cambiar contraseña</h2>
              <p className="text-slate-500 text-xs mb-5">Usuario: <span className="text-slate-300">{currentUsername}</span></p>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <input type="password" placeholder="Contraseña actual" value={changePassForm.current}
                  onChange={(e) => setChangePassForm((f) => ({ ...f, current: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                <input type="password" placeholder="Nueva contraseña (mín. 6 chars)" value={changePassForm.next}
                  onChange={(e) => setChangePassForm((f) => ({ ...f, next: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                {changePassError && <p className="text-red-400 text-xs">{changePassError}</p>}
                {changePassOk    && <p className="text-green-400 text-xs">✓ Contraseña actualizada</p>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowChangePass(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingPass || !changePassForm.current || changePassForm.next.length < 6}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-all text-sm">
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
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><UilUsersAlt size={20} />Administradores</h2>
                <button onClick={() => setShowAdmins(false)} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
              </div>

              {/* Existing admins */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {loadingAdmins ? (
                  <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
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
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                    <input type="email" placeholder="Email (opc.)" value={newAdmin.email}
                      onChange={(e) => setNewAdmin((f) => ({ ...f, email: e.target.value }))}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                  </div>
                  <input type="password" placeholder="Contraseña" value={newAdmin.password}
                    onChange={(e) => setNewAdmin((f) => ({ ...f, password: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                  {adminError && <p className="text-red-400 text-xs">{adminError}</p>}
                  <button type="submit" disabled={creatingAdmin || !newAdmin.username || !newAdmin.password}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-xl font-bold transition-all text-sm">
                    {creatingAdmin ? 'Creando...' : '+ Crear admin'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showExportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowExportModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UilFileDownloadAlt size={20} />Exportar sorteos
                </h2>
                <button onClick={() => setShowExportModal(false)} className="text-slate-500 hover:text-slate-300 text-xl">×</button>
              </div>

              <p className="text-slate-500 text-xs mb-4">Selecciona los sorteos que quieres exportar:</p>

              {/* Select all */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
                <input type="checkbox"
                  checked={exportSelection.size === raffles.filter(r => r._count?.entries > 0).length && exportSelection.size > 0}
                  onChange={() => {
                    const eligible = raffles.filter(r => r._count?.entries > 0).map(r => r.id);
                    setExportSelection(exportSelection.size === eligible.length ? new Set() : new Set(eligible));
                  }}
                  className="accent-amber-500 w-4 h-4 cursor-pointer" />
                <span className="text-slate-400 text-sm">Seleccionar todos</span>
              </div>

              {/* Raffle list */}
              <div className="space-y-2 max-h-64 overflow-y-auto mb-5">
                {raffles.map((r) => (
                  <label key={r.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    exportSelection.has(r.id) ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-800/50 border border-transparent hover:bg-slate-800'
                  } ${!r._count?.entries ? 'opacity-40 pointer-events-none' : ''}`}>
                    <input type="checkbox" checked={exportSelection.has(r.id)}
                      disabled={!r._count?.entries}
                      onChange={() => {
                        setExportSelection(prev => {
                          const next = new Set(prev);
                          next.has(r.id) ? next.delete(r.id) : next.add(r.id);
                          return next;
                        });
                      }}
                      className="accent-amber-500 w-4 h-4 cursor-pointer shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{r.name}</p>
                      <p className="text-slate-500 text-xs">{r._count?.entries || 0} inscritos · {r.status === 'DONE' ? 'Finalizado' : r.status === 'OPEN' ? 'Abierto' : 'Borrador'}</p>
                    </div>
                  </label>
                ))}
              </div>

              {exportSelection.size === 0 && (
                <p className="text-amber-400 text-xs text-center mb-3">Selecciona al menos un sorteo</p>
              )}

              <div className="flex gap-3">
                <button
                  disabled={exportSelection.size === 0 || exportingRaffles}
                  onClick={async () => {
                    setExportingRaffles(true);
                    try {
                      const list = [];
                      for (const id of exportSelection) { const r = await api.get(`/raffle/admin/${id}`); list.push(r); }
                      const blob = buildCSVBlob(list);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = exportSelection.size === 1
                        ? `${raffles.find(r => exportSelection.has(r.id))?.name || 'sorteo'}.csv`
                        : `sorteos-${exportSelection.size}.csv`;
                      a.click(); URL.revokeObjectURL(url);
                      setShowExportModal(false);
                    } finally { setExportingRaffles(false); }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/40 disabled:opacity-40 text-emerald-400 font-bold py-2.5 rounded-xl transition-all text-sm">
                  <UilFileAlt size={16} />CSV
                </button>
                <button
                  disabled={exportSelection.size === 0 || exportingRaffles}
                  onClick={async () => {
                    setExportingRaffles(true);
                    try {
                      const list = [];
                      for (const id of exportSelection) { const r = await api.get(`/raffle/admin/${id}`); list.push(r); }
                      const doc = await buildPDFDoc(list);
                      const label = exportSelection.size === 1
                        ? raffles.find(r => exportSelection.has(r.id))?.name || 'sorteo'
                        : `sorteos-${exportSelection.size}`;
                      doc.save(`${label}.pdf`);
                      setShowExportModal(false);
                    } finally { setExportingRaffles(false); }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-40 text-red-400 font-bold py-2.5 rounded-xl transition-all text-sm">
                  <UilFileDownloadAlt size={16} />{exportingRaffles ? 'Exportando...' : 'PDF'}
                </button>
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
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><UilChartBar size={20} />Resultados</h2>
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
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-10 text-slate-600">
                    <UilBullseye size={40} className="mx-auto mb-2 opacity-40" />
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
                            {i + 1}
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
        <div className="mb-8 space-y-3">
          {/* Row 1: Logo + utility pill */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <ScrambledLogo />
              <p className="text-slate-500 text-sm mt-0.5 tracking-wide">Panel de Administrador</p>
            </div>
            <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1 shrink-0">
              <button onClick={() => { setShowChangePass(true); setChangePassError(''); setChangePassOk(false); }}
                className="text-slate-500 hover:text-slate-200 hover:bg-white/10 p-2 rounded-xl transition-all" title="Cambiar contraseña">
                <UilKeySkeleton size={17} />
              </button>
              <button onClick={() => { setShowAdmins(true); loadAdmins(); setAdminError(''); }}
                className="text-slate-500 hover:text-slate-200 hover:bg-white/10 p-2 rounded-xl transition-all" title="Gestionar admins">
                <UilUsersAlt size={17} />
              </button>
              <button onClick={() => setShowSettings(true)}
                className="text-slate-500 hover:text-slate-200 hover:bg-white/10 p-2 rounded-xl transition-all" title="Personalizar">
                <UilPalette size={17} />
              </button>
              <div className="w-px h-4 bg-white/10 mx-0.5" />
              <button onClick={handleLogout}
                className="text-slate-500 hover:text-slate-200 hover:bg-white/10 px-3 py-2 rounded-xl transition-all text-sm flex items-center gap-1.5">
                <UilSignout size={15} />Salir
              </button>
            </div>
          </div>
          {/* Row 2: Action pill */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1 w-fit">
            <button onClick={() => setShowArchived((v) => !v)}
              className={`px-3 py-2 rounded-xl transition-all text-sm flex items-center gap-1.5 ${showArchived ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-white/10'}`}
              title="Mostrar archivados">
              <UilArchive size={15} />Archivados
            </button>
            <button onClick={() => { setShowExportModal(true); setExportSelection(new Set()); }}
              className="text-slate-500 hover:text-slate-200 hover:bg-white/10 px-3 py-2 rounded-xl transition-all text-sm flex items-center gap-1.5">
              <UilFileDownloadAlt size={15} />Exportar
            </button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <button onClick={() => { setShowCreate(true); setCreateError(''); setForm({ name: '', slug: '', pin: '' }); }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-2 rounded-xl transition-all text-sm flex items-center gap-1.5">
              <UilPlus size={15} />Desafío
            </button>
            <button onClick={() => { setShowCreateRaffle(true); setRaffleError(''); setRaffleForm({ name: '', slug: '', pin: '' }); }}
              className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-3 py-2 rounded-xl transition-all text-sm flex items-center gap-1.5">
              <UilTicket size={15} />Sorteo
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
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><UilPlus size={22} />Nuevo Desafío</h2>
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-r-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-xl"
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
                      className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-all"
                    >
                      {creating ? 'Creando...' : 'Crear →'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Raffle Modal */}
        <AnimatePresence>
          {showCreateRaffle && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={(e) => e.target === e.currentTarget && setShowCreateRaffle(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><UilTicket size={22} />Nuevo Sorteo</h2>
                <form onSubmit={handleCreateRaffle} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Nombre del sorteo</label>
                    <input type="text" value={raffleForm.name}
                      onChange={(e) => { const name = e.target.value; setRaffleForm((f) => ({ ...f, name, slug: autoSlug(name) })); }}
                      placeholder="Gran Sorteo NVIDIA" required autoFocus
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Slug (URL)</label>
                    <div className="flex items-center">
                      <span className="bg-slate-700 border border-r-0 border-slate-600 rounded-l-xl px-3 py-2.5 text-slate-500 text-sm">/sorteo/</span>
                      <input type="text" value={raffleForm.slug}
                        onChange={(e) => setRaffleForm((f) => ({ ...f, slug: e.target.value }))}
                        placeholder="gran-sorteo" required
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-r-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">PIN de acceso</label>
                    <input type="text" value={raffleForm.pin}
                      onChange={(e) => setRaffleForm((f) => ({ ...f, pin: e.target.value }))}
                      placeholder="1234" maxLength={8} required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 tracking-widest text-center text-xl" />
                  </div>
                  {raffleError && <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-2"><p className="text-red-400 text-sm">{raffleError}</p></div>}
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowCreateRaffle(false)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-medium transition-all">Cancelar</button>
                    <button type="submit" disabled={creatingRaffle || !raffleForm.name || !raffleForm.slug || !raffleForm.pin}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-all">
                      {creatingRaffle ? 'Creando...' : 'Crear →'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Raffles section */}
        {raffles.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><UilTicket size={14} />Sorteos</h2>
              {selectedRaffles.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">{selectedRaffles.size} seleccionado{selectedRaffles.size > 1 ? 's' : ''}</span>
                  <button onClick={exportSelectedCSV} disabled={exportingRaffles}
                    className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50">
                    <UilFileAlt size={13} />CSV
                  </button>
                  <button onClick={exportSelectedPDF} disabled={exportingRaffles}
                    className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50">
                    <UilFileDownloadAlt size={13} />{exportingRaffles ? '...' : 'PDF'}
                  </button>
                  <button onClick={() => setSelectedRaffles(new Set())}
                    className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1.5 rounded-lg transition-all">
                    Limpiar
                  </button>
                </div>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {raffles.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`glass rounded-2xl p-5 flex flex-col gap-4 border transition-all ${selectedRaffles.has(r.id) ? 'border-amber-400/60 ring-1 ring-amber-400/30' : 'border-amber-500/20'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <input type="checkbox" checked={selectedRaffles.has(r.id)}
                        onChange={() => toggleSelectRaffle(r.id)}
                        className="mt-1 accent-amber-500 shrink-0 cursor-pointer w-3.5 h-3.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-base truncate">{r.name}</h3>
                        <p className="text-slate-500 text-xs mt-0.5">/sorteo/{r.slug}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                      r.status === 'OPEN' ? 'text-green-400 bg-green-500/20' :
                      r.status === 'DONE' ? 'text-purple-400 bg-purple-500/20' :
                      'text-slate-400 bg-slate-700'}`}>
                      {r.status === 'OPEN' ? <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Abierto</span> : r.status === 'DONE' ? 'Finalizado' : 'Borrador'}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><UilUsersAlt size={13} />{r._count?.entries || 0} inscritos</span>
                    <span className="flex items-center gap-1"><UilLock size={13} />{r.pin}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {/* Primary row */}
                    <div className="flex gap-1.5">
                      <button onClick={() => navigate(`/admin/raffles/${r.id}/control`)}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5">
                        <UilDashboard size={15} />Control
                      </button>
                      <button
                        onClick={() => setQrModal({ url: `${window.location.origin}/sorteo/${r.slug}`, title: r.name, pin: r.pin })}
                        className="bg-white/5 hover:bg-white/10 text-slate-400 p-2.5 rounded-xl transition-all border border-white/8" title="Ver QR">
                        <UilQrcodeScan size={15} />
                      </button>
                      <button onClick={() => handleArchiveRaffle(r.id, true)}
                        className="bg-white/5 hover:bg-white/10 text-slate-500 p-2.5 rounded-xl transition-all border border-white/8" title="Archivar">
                        <UilArchive size={15} />
                      </button>
                      <button onClick={() => handleDeleteRaffle(r.id, r.name)}
                        className="bg-red-500/8 hover:bg-red-500/20 text-red-500 p-2.5 rounded-xl transition-all border border-red-500/10" title="Eliminar">
                        <UilTrashAlt size={15} />
                      </button>
                    </div>
                    {/* Export row */}
                    {r._count?.entries > 0 && (
                      <div className="flex gap-1.5">
                        <button onClick={() => exportRaffleCSV(r.id, r.name)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium py-2 rounded-xl transition-all border border-emerald-500/10">
                          <UilFileAlt size={13} />CSV
                        </button>
                        <button onClick={() => exportRafflePDF(r.id, r.name)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium py-2 rounded-xl transition-all border border-sky-500/10">
                          <UilFileDownloadAlt size={13} />PDF
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Archived section */}
        {showArchived && (archivedRaffles.length > 0 || archivedChallenges.length > 0) && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <UilArchive size={14} />Archivados
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[...archivedRaffles.map((r) => ({ ...r, _type: 'raffle' })), ...archivedChallenges.map((c) => ({ ...c, _type: 'challenge' }))].map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-2xl p-4 flex items-center justify-between gap-3 border border-slate-700/50"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="min-w-0">
                    <p className="text-slate-400 font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-slate-600 text-xs">{item._type === 'raffle' ? '🎟 Sorteo' : '🎯 Desafío'} · {item._type === 'raffle' ? `/sorteo/${item.slug}` : `/${item.slug}`}</p>
                  </div>
                  <button
                    onClick={() => item._type === 'raffle' ? handleArchiveRaffle(item.id, false) : handleArchiveChallenge(item.id, false)}
                    className="shrink-0 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap"
                  >
                    Restaurar
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {raffles.length > 0 && <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><UilBullseye size={14} />Desafíos</h2>}

        {/* Challenges grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="flex justify-center mb-4"><UilBullseye size={56} className="text-slate-700" /></div>
            <h2 className="text-xl font-bold text-white mb-2">Sin desafíos aún</h2>
            <p className="text-slate-400 mb-6">Crea tu primer quiz para comenzar</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all"
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
                    <span className="flex items-center gap-1"><UilFileAlt size={13} />{c._count?.questions || 0} preguntas</span>
                    <span className="flex items-center gap-1"><UilUsersAlt size={13} />{c._count?.sessions || 0} jugadores</span>
                    <span className="flex items-center gap-1"><UilLock size={13} />{c.pin}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    {/* Primary actions */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/challenges/${c.id}/edit`)}
                        className="flex-1 bg-white/8 hover:bg-white/14 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-all border border-white/8"
                      >
                        Editar
                      </button>
                      {c.status !== 'ENDED' && (
                        <button
                          onClick={() => navigate(`/admin/challenges/${c.id}/live`)}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <UilPlay size={14} />Live
                        </button>
                      )}
                      {c.status === 'ENDED' && (
                        <button
                          onClick={() => setConfirmReset({ id: c.id, name: c.name })}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                          title="Reiniciar para jugar de nuevo"
                        >
                          <UilRefresh size={14} />Reiniciar
                        </button>
                      )}
                    </div>
                    {/* Secondary icon actions */}
                    <div className="flex gap-1.5">
                      {c._count?.sessions > 0 && (
                        <button
                          onClick={() => { setResultsChallenge({ id: c.id, name: c.name }); loadResults(c.id); }}
                          className="flex-1 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2 rounded-xl transition-all border border-emerald-500/10"
                          title="Ver resultados"
                        >
                          <UilChartBar size={15} />
                        </button>
                      )}
                      {c._count?.sessions > 0 && (
                        <button
                          onClick={() => window.open(`/hof/${c.slug}`, '_blank', 'noopener')}
                          className="flex-1 flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 py-2 rounded-xl transition-all border border-amber-500/10"
                          title="Hall of Fame"
                        >
                          🏆
                        </button>
                      )}
                      <button
                        onClick={() => setQrModal({ url: `${window.location.origin}/join/${c.slug}`, title: c.name, pin: c.pin })}
                        className="flex-1 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 py-2 rounded-xl transition-all border border-white/8" title="Ver QR">
                        <UilQrcodeScan size={15} />
                      </button>
                      <button
                        onClick={() => handleArchiveChallenge(c.id, true)}
                        className="flex-1 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-500 py-2 rounded-xl transition-all border border-white/8"
                        title="Archivar"
                      >
                        <UilArchive size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: c.id, name: c.name })}
                        className="flex-1 flex items-center justify-center bg-red-500/8 hover:bg-red-500/20 text-red-500 py-2 rounded-xl transition-all border border-red-500/10"
                        title="Eliminar"
                      >
                        <UilTrashAlt size={15} />
                      </button>
                    </div>
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

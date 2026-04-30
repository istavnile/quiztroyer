import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import PageBackground from '../components/PageBackground';

const glowTransition = { duration: 1.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' };
const glowAnim = (color) => ({
  animate: { boxShadow: [`0 0 10px 2px ${color}50`, `0 0 28px 8px ${color}bb`] },
  transition: glowTransition,
});

export default function RaffleJoin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState(null);
  const [siteSettings, setSiteSettings] = useState({ homeBgColor: '#0f172a', homeButtonColor: '#6366f1', bgEffect: 'blobs' });
  const [pin, setPin] = useState('');
  const [pinOk, setPinOk] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', correo: '', telefono: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    api.get('/settings').then((r) => setSiteSettings((p) => ({ ...p, ...r.data }))).catch(() => {});
    api.get(`/raffle/${slug}`)
      .then((r) => setRaffle(r.data))
      .catch(() => setRaffle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  function validate() {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'Requerido';
    if (!form.apellido.trim()) e.apellido = 'Requerido';
    if (!form.dni.trim()) e.dni = 'Requerido';
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(form.correo)) e.correo = 'Correo inválido';
    const phoneRx = /^\+?[\d\s\-().]{7,20}$/;
    if (!phoneRx.test(form.telefono)) e.telefono = 'Teléfono inválido';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await api.post(`/raffle/${slug}/enter`, { ...form, pin });
      navigate(`/sorteo/${slug}/lobby`, { state: { entryId: res.data.entryId, nombre: res.data.nombre, slug, branding: raffle.branding } });
    } catch (err) {
      setServerError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando...</div>;
  if (!raffle) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Sorteo no encontrado</div>;

  const bg      = raffle.branding?.bgColor      || siteSettings.homeBgColor    || '#0f172a';
  const primary = raffle.branding?.primaryColor || siteSettings.homeButtonColor || '#6366f1';
  const glow    = glowAnim(primary);

  if (!pinOk) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: bg }}>
        <PageBackground siteSettings={siteSettings} color={primary} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-8 w-full max-w-sm relative z-10 text-center">
          {raffle.branding?.logoUrl
            ? <img src={raffle.branding.logoUrl} alt="logo" className="h-14 object-contain mx-auto mb-4" />
            : <div className="text-5xl mb-4">🎟️</div>
          }
          <h1 className="text-2xl font-black text-white mb-1">{raffle.name}</h1>
          <p className="text-white/40 text-sm mb-6">Ingresa el PIN para participar</p>
          <input
            type="text" inputMode="numeric" maxLength={8}
            value={pin} onChange={(e) => setPin(e.target.value)}
            placeholder="PIN del sorteo"
            className="w-full rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-white/20 mb-4 focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${primary}60`, backdropFilter: 'blur(8px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
          />
          <motion.button
            onClick={() => { if (pin.trim()) setPinOk(true); }}
            className="w-full text-white font-bold py-3 rounded-xl relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${primary}dd, ${primary}99)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20)' }}
            {...glow}
          >
            Continuar →
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: bg }}>
      <PageBackground siteSettings={siteSettings} color={primary} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          {raffle.branding?.logoUrl
            ? <img src={raffle.branding.logoUrl} alt="logo" className="h-12 object-contain mx-auto mb-2" />
            : <div className="text-4xl mb-2">🎟️</div>
          }
          <h1 className="text-xl font-black text-white">{raffle.name}</h1>
          <p className="text-white/40 text-sm">Completa tus datos para participar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Tu nombre' },
            { key: 'apellido', label: 'Apellido', type: 'text', placeholder: 'Tu apellido' },
            { key: 'dni', label: 'DNI / Documento', type: 'text', placeholder: 'Número de documento' },
            { key: 'correo', label: 'Correo electrónico', type: 'email', placeholder: 'tu@correo.com' },
            { key: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '+51 999 999 999' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-white/40 mb-1 uppercase tracking-wide">{label}</label>
              <input
                type={type} value={form[key]} placeholder={placeholder}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none text-sm transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: errors[key] ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              />
              {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
            </div>
          ))}

          {serverError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
              {serverError}
            </div>
          )}

          <motion.button
            type="submit" disabled={submitting}
            className="w-full text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-2 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${primary}dd, ${primary}99)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20)' }}
            {...glow}
          >
            {submitting ? 'Registrando...' : '¡Participar en el sorteo!'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

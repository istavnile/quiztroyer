import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function RaffleJoin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState(null);
  const [pin, setPin] = useState('');
  const [pinOk, setPinOk] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', correo: '', telefono: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
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

  const bg = raffle.branding?.bgColor || '#0f172a';
  const primary = raffle.branding?.primaryColor || '#6366f1';

  if (!pinOk) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: bg }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="blob-anim-1 absolute -top-20 -right-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full blur-3xl opacity-25" style={{ background: primary }} />
          <div className="blob-anim-2 absolute -bottom-20 -left-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full blur-3xl opacity-20" style={{ background: primary }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 w-full max-w-sm relative z-10 text-center">
          {raffle.branding?.logoUrl
            ? <img src={raffle.branding.logoUrl} alt="logo" className="h-14 object-contain mx-auto mb-4" />
            : <div className="text-5xl mb-4">🎟️</div>
          }
          <h1 className="text-2xl font-black text-white mb-1">{raffle.name}</h1>
          <p className="text-slate-400 text-sm mb-6">Ingresa el PIN para participar</p>
          <input
            type="text" inputMode="numeric" maxLength={8}
            value={pin} onChange={(e) => setPin(e.target.value)}
            placeholder="PIN del sorteo"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest mb-4 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': primary }}
          />
          <button onClick={() => { if (pin.trim()) setPinOk(true); }}
            className="w-full text-white font-bold py-3 rounded-xl glow-pulse"
            style={{ background: primary }}>
            Continuar →
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: bg }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob-anim-1 absolute -top-20 -right-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full blur-3xl opacity-25" style={{ background: primary }} />
        <div className="blob-anim-2 absolute -bottom-20 -left-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full blur-3xl opacity-20" style={{ background: primary }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          {raffle.branding?.logoUrl
            ? <img src={raffle.branding.logoUrl} alt="logo" className="h-12 object-contain mx-auto mb-2" />
            : <div className="text-4xl mb-2">🎟️</div>
          }
          <h1 className="text-xl font-black text-white">{raffle.name}</h1>
          <p className="text-slate-400 text-sm">Completa tus datos para participar</p>
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
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input
                type={type} value={form[key]} placeholder={placeholder}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 text-sm ${errors[key] ? 'border-red-500' : 'border-slate-700'}`}
              />
              {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
            </div>
          ))}

          {serverError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
              {serverError}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-2"
            style={{ background: primary }}>
            {submitting ? 'Registrando...' : '¡Participar en el sorteo!'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

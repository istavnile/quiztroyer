import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import PageBackground from '../components/PageBackground';

const glowTransition = { duration: 1.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' };
const glowAnim = (color) => ({
  animate: { boxShadow: [`0 0 10px 2px ${color}50`, `0 0 28px 8px ${color}bb`] },
  transition: glowTransition,
});

export default function JoinPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [challenge, setChallenge]   = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const [step, setStep]             = useState('pin'); // pin | info
  const [pin, setPin]               = useState('');
  const [name, setName]             = useState('');
  const [dni, setDni]               = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [pinError, setPinError]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [siteSettings, setSiteSettings] = useState({ homeBgColor: '#0f172a', homeButtonColor: '#6366f1', bgEffect: 'blobs', logoUrl: '' });

  useEffect(() => {
    Promise.all([
      api.get('/settings').then((r) => { setSiteSettings((p) => ({ ...p, ...r.data })); setSettingsReady(true); }).catch(() => setSettingsReady(true)),
      api.get(`/challenges/${slug}`).then((r) => setChallenge(r.data)).catch(() => setNotFound(true)),
    ]);
  }, [slug]);

  async function handlePin(e) {
    e.preventDefault();
    setLoading(true);
    setPinError('');
    try {
      await api.post(`/challenges/${slug}/validate-pin`, { pin });
      setStep('info');
    } catch (err) {
      setPinError(err.response?.data?.error || 'PIN incorrecto');
    } finally {
      setLoading(false);
    }
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim() || !dni.trim()) return;
    sessionStorage.setItem('qt_name',  name.trim());
    sessionStorage.setItem('qt_dni',   dni.trim());
    sessionStorage.setItem('qt_email', email.trim());
    sessionStorage.setItem('qt_phone', phone.trim());
    navigate(`/play/${slug}`);
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">Desafío no encontrado</h1>
          <p className="text-slate-400 mb-6">El código "{slug}" no existe.</p>
          <a href="/" className="text-indigo-400 hover:text-indigo-300">← Volver al inicio</a>
        </div>
      </div>
    );
  }

  if (!challenge || !settingsReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const branding = challenge.branding || {};
  const accent  = siteSettings.homeButtonColor || '#6366f1';
  const bgColor = siteSettings.homeBgColor     || '#0f172a';
  const glow    = glowAnim(accent);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: bgColor }}
    >
      <PageBackground siteSettings={siteSettings} color={accent} />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative z-10"
      >
        {branding.logoUrl && (
          <img src={branding.logoUrl} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
        )}
        <h1 className="text-4xl font-black text-white mb-1">{challenge.name}</h1>
        {branding.headerText && (
          <p className="text-slate-400">{branding.headerText}</p>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'pin' && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="glass-card rounded-3xl p-8 w-full max-w-sm relative z-10"
          >
            <h2 className="text-xl font-bold text-center mb-6">🔐 Ingresar PIN</h2>
            <form onSubmit={handlePin} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN del desafío"
                maxLength={8}
                className="w-full rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-white/20 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${accent}60`, backdropFilter: 'blur(8px)', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)` }}
                autoFocus
              />
              {pinError && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{pinError}</p>
              )}
              <motion.button
                type="submit"
                disabled={loading || !pin}
                className="w-full disabled:opacity-50 text-white font-bold py-3 rounded-xl relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${accent}dd, ${accent}99)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.20)` }}
                {...glow}
              >
                {loading ? 'Verificando...' : 'Verificar PIN'}
              </motion.button>
            </form>
          </motion.div>
        )}

        {step === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="glass-card rounded-3xl p-8 w-full max-w-sm relative z-10"
          >
            <h2 className="text-xl font-bold text-center mb-6">👤 Tus datos</h2>
            <form onSubmit={handleJoin} className="space-y-3">
              {[
                { val: name, set: setName, label: 'Nombre', ph: 'Tu nombre', type: 'text', maxLen: 30, auto: true },
                { val: dni,  set: setDni,  label: 'DNI / ID', ph: 'Número de documento', type: 'text', maxLen: 20 },
                { val: email, set: setEmail, label: 'Correo electrónico', ph: 'tu@correo.com', type: 'email', optional: true },
                { val: phone, set: setPhone, label: 'Teléfono', ph: '+51 999 999 999', type: 'tel', optional: true },
              ].map(({ val, set, label, ph, type, maxLen, auto, optional }) => (
                <div key={label}>
                  <label className="block text-xs text-white/40 mb-1 uppercase tracking-wide">
                    {label}{optional && <span className="ml-1 normal-case text-white/20">(opcional)</span>}
                  </label>
                  <input
                    type={type} value={val} placeholder={ph} maxLength={maxLen}
                    autoFocus={auto}
                    onChange={(e) => set(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none transition-all text-sm"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
                  />
                </div>
              ))}
              <motion.button
                type="submit"
                disabled={!name.trim() || !dni.trim()}
                className="w-full font-bold py-3 rounded-xl text-white disabled:opacity-50 mt-1 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${accent}dd, ${accent}99)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.20)` }}
                {...glow}
              >
                ¡Entrar al desafío!
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {branding.footerText && (
        <p className="mt-8 text-slate-600 text-xs relative z-10">{branding.footerText}</p>
      )}
    </div>
  );
}

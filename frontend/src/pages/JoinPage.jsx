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

  const [challenge, setChallenge] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState('pin'); // pin | info
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ homeBgColor: '#0f172a', homeButtonColor: '#6366f1', bgEffect: 'blobs' });

  useEffect(() => {
    api.get('/settings').then((r) => setSiteSettings((p) => ({ ...p, ...r.data }))).catch(() => {});
    api.get(`/challenges/${slug}`)
      .then((r) => setChallenge(r.data))
      .catch(() => setNotFound(true));
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
    sessionStorage.setItem('qt_name', name.trim());
    sessionStorage.setItem('qt_dni', dni.trim());
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

  if (!challenge) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const branding = challenge.branding || {};
  const accent  = branding.primaryColor || siteSettings.homeButtonColor || '#6366f1';
  const bgColor = branding.bgColor      || siteSettings.homeBgColor     || '#0f172a';
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
            className="glass rounded-2xl p-8 w-full max-w-sm relative z-10"
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
                className="w-full bg-slate-800 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-slate-600 focus:outline-none"
                style={{ border: `2px solid ${accent}` }}
                autoFocus
              />
              {pinError && (
                <p className="text-red-400 text-sm text-center">{pinError}</p>
              )}
              <motion.button
                type="submit"
                disabled={loading || !pin}
                className="w-full disabled:opacity-50 text-white font-bold py-3 rounded-xl"
                style={{ background: accent }}
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
            className="glass rounded-2xl p-8 w-full max-w-sm relative z-10"
          >
            <h2 className="text-xl font-bold text-center mb-6">👤 Tus datos</h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  maxLength={30}
                  className="w-full bg-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none"
                  style={{ border: `2px solid rgb(51 65 85)` }}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">DNI / ID</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Tu número de documento"
                  maxLength={20}
                  className="w-full bg-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none"
                  style={{ border: `2px solid rgb(51 65 85)` }}
                />
              </div>
              <motion.button
                type="submit"
                disabled={!name.trim() || !dni.trim()}
                className="w-full font-bold py-3 rounded-xl text-white disabled:opacity-50"
                style={{ background: accent }}
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

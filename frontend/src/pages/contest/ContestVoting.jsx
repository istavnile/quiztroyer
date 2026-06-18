import React, { useEffect, useState, useCallback } from 'react';
import UilTrophy from '@iconscout/react-unicons/icons/uil-trophy';
import { motion, AnimatePresence } from 'framer-motion';
import ContestLayout from './ContestLayout';
import { PROCESADOR_LABELS, GRAFICA_LABELS } from '../../lib/contestConstants';

const API = import.meta.env.VITE_API_URL || '';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCookieVote() {
  const match = document.cookie.match(/(?:^|;\s*)contest_voted=([^;]*)/);
  return match ? match[1] : null;
}

function setCookieVote(entryId) {
  const expires = new Date('2026-06-13T00:00:00Z').toUTCString();
  document.cookie = `contest_voted=${entryId}; expires=${expires}; path=/; SameSite=Lax`;
}

// ─── Componente de card de finalista ─────────────────────────────────────────
function FinalistCard({ finalist, votedFor, onVote, voting }) {
  const [showFull, setShowFull] = useState(false);
  const [imgView, setImgView] = useState('exterior');
  const isMyVote = votedFor === finalist.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      style={{
        background: isMyVote
          ? 'linear-gradient(135deg, rgba(118,185,0,0.12), rgba(118,185,0,0.04))'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isMyVote ? '#76B900' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '14px', overflow: 'hidden',
        boxShadow: isMyVote ? '0 0 30px rgba(118,185,0,0.2)' : 'none',
        position: 'relative',
      }}
    >
      {/* Badge "Mi voto" */}
      {isMyVote && (
        <div style={{
          position: 'absolute', top: '12px', right: '12px', zIndex: 10,
          background: '#76B900', color: '#000', fontSize: '0.7rem', fontWeight: 800,
          padding: '3px 10px', borderRadius: '999px', letterSpacing: '0.06em',
        }}>
          MI VOTO
        </div>
      )}

      {/* Imagen */}
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: '#111' }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={imgView}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            src={imgView === 'exterior' ? finalist.fotoExteriorUrl : finalist.fotoInteriorUrl}
            alt={`PC de ${finalist.nombre}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </AnimatePresence>

        {/* Toggle exterior/interior */}
        <div style={{
          position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '4px',
        }}>
          {['exterior', 'interior'].map((v) => (
            <button
              key={v}
              onClick={() => setImgView(v)}
              style={{
                background: imgView === v ? '#76B900' : 'rgba(0,0,0,0.6)',
                color: imgView === v ? '#000' : '#fff',
                border: 'none', borderRadius: '999px',
                fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px',
                cursor: 'pointer', backdropFilter: 'blur(4px)',
                textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '6px' }}>{finalist.nombre}</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Tag>{PROCESADOR_LABELS[finalist.procesador] ?? finalist.procesador}</Tag>
          <Tag>{GRAFICA_LABELS[finalist.graficaActual] ?? finalist.graficaActual}</Tag>
        </div>

        {/* Historia */}
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6 }}>
          {showFull ? finalist.historia : `${finalist.historia.slice(0, 160)}${finalist.historia.length > 160 ? '…' : ''}`}
        </p>
        {finalist.historia.length > 160 && (
          <button
            onClick={() => setShowFull((s) => !s)}
            style={{ background: 'none', border: 'none', color: '#76B900', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 0', marginTop: '2px' }}
          >
            {showFull ? 'Leer menos' : 'Leer más'}
          </button>
        )}

        {/* Votos + botón */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
          <VoteCounter count={finalist.voteCount} />

          <button
            onClick={() => onVote(finalist.id)}
            disabled={voting}
            style={{
              background: isMyVote ? 'rgba(118,185,0,0.3)' : '#76B900',
              color: isMyVote ? '#76B900' : '#000',
              fontWeight: 800,
              padding: '9px 22px',
              borderRadius: '6px',
              border: isMyVote ? '1px solid #76B900' : 'none',
              cursor: voting ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem',
              opacity: voting ? 0.7 : 1,
              transition: 'transform .15s',
            }}
            onMouseEnter={(e) => { if (!voting) e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {isMyVote ? '✓ Votaste' : 'Votar'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function VoteCounter({ count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: '#e61f30', fontSize: '1.1rem' }}>▲</span>
      <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{count}</span>
      <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{count === 1 ? 'voto' : 'votos'}</span>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      background: 'rgba(255,255,255,0.06)', color: '#9ca3af',
      borderRadius: '4px', padding: '3px 8px', fontSize: '0.72rem', fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ContestVoting() {
  const [finalists, setFinalists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedFor, setVotedFor] = useState(null); // entryId | null
  const [voting, setVoting] = useState(false);
  const [winner, setWinner] = useState(null);
  const [toast, setToast] = useState(null); // { msg, type }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchFinalists = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/contest/finalists`);
      const data = await res.json();
      setFinalists(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(`${API}/api/contest/settings`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.titulo) {
          const prev = document.title;
          document.title = data.titulo;
          return () => { document.title = prev; };
        }
      })
      .catch(() => {});
  }, []);

  // Load winner
  useEffect(() => {
    fetch(`${API}/api/contest/finalists`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((finalists) => {
        const w = finalists.find((f) => f.isWinner);
        setWinner(w || null);
      })
      .catch(() => {});
  }, []);

  // Verificar estado de voto: primero cookie, luego backend
  useEffect(() => {
    const cookieVote = getCookieVote();
    if (cookieVote) {
      setVotedFor(cookieVote);
    } else {
      fetch(`${API}/api/contest/vote-status`)
        .then((r) => r.json())
        .then((d) => { if (d.hasVoted) setVotedFor(d.votedFor); })
        .catch(() => {});
    }
    fetchFinalists();
  }, [fetchFinalists]);

  const handleVote = async (entryId) => {
    if (voting) return;
    setVoting(true);
    try {
      const res = await fetch(`${API}/api/contest/vote/${entryId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.votedFor) {
          setVotedFor(data.votedFor);
          setCookieVote(data.votedFor);
        }
        showToast(data.error || 'Error al votar', 'error');
        return;
      }
      setVotedFor(entryId);
      setCookieVote(entryId);
      setFinalists((prev) =>
        prev.map((f) => f.id === entryId ? { ...f, voteCount: data.voteCount } : f)
      );
      showToast('¡Voto registrado!', 'success');
    } catch {
      showToast('Error de conexión. Intenta de nuevo.', 'error');
    } finally {
      setVoting(false);
    }
  };

  return (
    <ContestLayout>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
              background: toast.type === 'success' ? '#76B900' : '#e61f30',
              color: toast.type === 'success' ? '#000' : '#fff',
              padding: '12px 28px', borderRadius: '8px', fontWeight: 700,
              zIndex: 100, boxShadow: '0 8px 30px rgba(0,0,0,0.4)', fontSize: '0.9rem',
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encabezado */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
          Vota por tu favorito
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1rem', marginBottom: '8px' }}>
          Un voto por persona. Los finalistas con más votos pasarán a la Gran Final del{' '}
          <strong style={{ color: '#fff' }}>12 de junio</strong>.
        </p>
        {votedFor && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(118,185,0,0.1)', border: '1px solid rgba(118,185,0,0.3)',
            color: '#76B900', padding: '6px 16px', borderRadius: '999px',
            fontSize: '0.82rem', fontWeight: 600, marginTop: '8px',
          }}>
            ✓ Ya emitiste tu voto
          </div>
        )}
      </motion.div>

      {/* Contenido */}
      <div className="mt-10">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#4b5563' }}>
            <Spinner />
            <p style={{ marginTop: '16px', fontSize: '0.9rem' }}>Cargando finalistas...</p>
          </div>
        ) : finalists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              textAlign: 'center', padding: '80px 24px',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ marginBottom: '16px', opacity: 0.35 }}><UilTrophy size="52" color="#facc15" /></div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
              Los finalistas se anunciarán pronto
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Nuestro equipo está revisando todas las participaciones. Vuelve a partir del 8 de junio.
            </p>
          </motion.div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                {finalists.length} finalista{finalists.length !== 1 ? 's' : ''}
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>
                Ordenados por votos
              </p>
            </div>

            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {finalists.map((f, i) => (
                  <motion.div key={f.id} layout transition={{ delay: i * 0.05 }}>
                    <FinalistCard
                      finalist={f}
                      votedFor={votedFor}
                      onVote={handleVote}
                      voting={voting}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>

      {/* Winner Overlay */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                textAlign: 'center',
                maxWidth: '600px',
              }}
            >
              <motion.div
                animate={{ rotateZ: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  fontSize: '4rem',
                  marginBottom: '24px',
                }}
              >
                👑
              </motion.div>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                color: '#76B900',
                marginBottom: '8px',
              }}>
                ¡{winner.nombre}!
              </h2>
              <p style={{
                fontSize: '1.2rem',
                color: '#facc15',
                marginBottom: '24px',
                fontWeight: 700,
              }}>
                Es el ganador
              </p>
              <div style={{
                fontSize: '1rem',
                color: '#9ca3af',
                marginBottom: '16px',
              }}>
                <p style={{ marginBottom: '8px' }}>{winner.historia}</p>
                <p style={{ marginTop: '16px', color: '#6b7280' }}>
                  Total de votos: <strong style={{ color: '#76B900', fontSize: '1.2rem' }}>{winner.voteCount}</strong>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ContestLayout>
  );
}

function Spinner() {
  return (
    <div style={{
      width: '40px', height: '40px', border: '3px solid rgba(118,185,0,0.2)',
      borderTop: '3px solid #76B900', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite', margin: '0 auto',
    }} />
  );
}

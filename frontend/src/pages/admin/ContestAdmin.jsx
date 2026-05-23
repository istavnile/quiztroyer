import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import {
  PROCESADOR_LABELS, GRAFICA_LABELS, FUENTE_LABELS,
} from '../../lib/contestConstants';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const PROCESADOR_OPTIONS = [['', 'Todos los procesadores'], ...Object.entries(PROCESADOR_LABELS)];
const GRAFICA_OPTIONS    = [['', 'Todas las gráficas'],    ...Object.entries(GRAFICA_LABELS)];
const FUENTE_OPTIONS     = [['', 'Todas las fuentes'],     ...Object.entries(FUENTE_LABELS)];

// ─── Modal de detalle ─────────────────────────────────────────────────────────
function LeadModal({ lead, onClose, onToggleFinalist }) {
  if (!lead) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#111', border: '1px solid #1f2937', borderRadius: '14px',
            width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto',
          }}
        >
          {/* Header del modal */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', marginBottom: '2px' }}>{lead.nombre}</h2>
              <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>{lead.email} · {lead.telefono}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => onToggleFinalist(lead)}
                style={{
                  background: lead.isFinalist ? 'rgba(118,185,0,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${lead.isFinalist ? '#76B900' : '#374151'}`,
                  color: lead.isFinalist ? '#76B900' : '#9ca3af',
                  padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                }}
              >
                {lead.isFinalist ? '★ Finalista' : '☆ Marcar finalista'}
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Specs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <Badge label="CPU"   value={PROCESADOR_LABELS[lead.procesador]   ?? lead.procesador} />
              <Badge label="GPU"   value={GRAFICA_LABELS[lead.graficaActual]   ?? lead.graficaActual} />
              <Badge label="PSU"   value={FUENTE_LABELS[lead.fuentePoderWatts] ?? lead.fuentePoderWatts} />
              {lead.isFinalist && <Badge label="Votos" value={lead.voteCount} color="#76B900" />}
            </div>

            {/* Fotos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <PhotoThumb src={lead.fotoExteriorUrl} label="Exterior" />
              <PhotoThumb src={lead.fotoInteriorUrl} label="Interior" />
            </div>

            {/* Historia */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Historia</p>
              <p style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{lead.historia}</p>
            </div>

            {/* Meta */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', color: '#4b5563', fontSize: '0.78rem' }}>
              <span>
                Marketing: <strong style={{ color: lead.aceptaMarketing ? '#76B900' : '#6b7280' }}>
                  {lead.aceptaMarketing ? 'Sí' : 'No'}
                </strong>
              </span>
              <span>Registrado: {fmtDate(lead.createdAt)}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Badge({ label, value, color }) {
  return (
    <span style={{
      background: 'rgba(255,255,255,0.06)', borderRadius: '4px',
      padding: '4px 10px', fontSize: '0.75rem', color: color || '#9ca3af',
    }}>
      <span style={{ color: '#4b5563', marginRight: '4px' }}>{label}:</span>{value}
    </span>
  );
}

function PhotoThumb({ src, label }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div onClick={() => setOpen(true)} style={{ cursor: 'zoom-in', position: 'relative' }}>
        <img src={src} alt={label} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #1f2937' }} />
        <div style={{ position: 'absolute', bottom: '6px', left: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px' }}>{label}</div>
      </div>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={src} alt={label} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }} />
        </div>
      )}
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ContestAdmin() {
  const [leads, setLeads]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [fullLead, setFullLead]   = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Filtros
  const [search, setSearch]             = useState('');
  const [procesador, setProcesador]     = useState('');
  const [graficaActual, setGrafica]     = useState('');
  const [fuentePoderWatts, setFuente]   = useState('');
  const [isFinalist, setIsFinalist]     = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)           params.set('search', search);
      if (procesador)       params.set('procesador', procesador);
      if (graficaActual)    params.set('graficaActual', graficaActual);
      if (fuentePoderWatts) params.set('fuentePoderWatts', fuentePoderWatts);
      if (isFinalist !== '') params.set('isFinalist', isFinalist);

      const res = await api.get(`/admin/concurso?${params}`);
      setLeads(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, procesador, graficaActual, fuentePoderWatts, isFinalist]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const openModal = async (lead) => {
    setSelectedLead(lead);
    setModalLoading(true);
    try {
      const res = await api.get(`/admin/concurso/${lead.id}`);
      setFullLead(res.data);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => { setSelectedLead(null); setFullLead(null); };

  const toggleFinalist = async (lead) => {
    try {
      const res = await api.patch(`/admin/concurso/${lead.id}/finalist`);
      const { isFinalist: newVal } = res.data;
      setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, isFinalist: newVal } : l));
      if (fullLead?.id === lead.id) setFullLead((prev) => ({ ...prev, isFinalist: newVal }));
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  const finalistCount = leads.filter((l) => l.isFinalist).length;

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <LeadModal
        lead={modalLoading ? selectedLead : fullLead}
        onClose={closeModal}
        onToggleFinalist={toggleFinalist}
      />

      {/* Header */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1f2937', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/admin" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.85rem' }}>← Admin</Link>
          <h1 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
            Concurso · El Gran Upgrade
          </h1>
          <span style={{
            background: 'rgba(118,185,0,0.1)', border: '1px solid rgba(118,185,0,0.3)',
            color: '#76B900', padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
          }}>
            {leads.length} registros · {finalistCount} finalistas
          </span>
        </div>
        <a
          href="/concursos/el-gran-upgrade"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#76B900', fontSize: '0.82rem', textDecoration: 'none' }}
        >
          Ver página pública ↗
        </a>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Filtros */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid #1f2937',
          borderRadius: '10px', padding: '16px 20px', marginBottom: '20px',
          display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end',
        }}>
          {/* Búsqueda */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={labelStyle}>Buscar</label>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre o email..."
              style={filterInputStyle}
            />
          </div>

          <FilterSelect label="Procesador" value={procesador} onChange={setProcesador} options={PROCESADOR_OPTIONS} />
          <FilterSelect label="Gráfica" value={graficaActual} onChange={setGrafica} options={GRAFICA_OPTIONS} />
          <FilterSelect label="Fuente" value={fuentePoderWatts} onChange={setFuente} options={FUENTE_OPTIONS} />
          <FilterSelect
            label="Finalista"
            value={isFinalist}
            onChange={setIsFinalist}
            options={[['', 'Todos'], ['true', 'Sí'], ['false', 'No']]}
          />

          <button
            onClick={() => { setSearch(''); setProcesador(''); setGrafica(''); setFuente(''); setIsFinalist(''); }}
            style={{ background: 'none', border: '1px solid #374151', color: '#6b7280', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', alignSelf: 'flex-end' }}
          >
            Limpiar
          </button>
        </div>

        {/* Tabla */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#4b5563' }}>Cargando...</div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#4b5563', border: '1px solid #1f2937', borderRadius: '10px' }}>
            No hay registros con los filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['Nombre', 'Email', 'CPU', 'GPU', 'Fuente', 'Votos', 'Finalista', 'Fecha', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => openModal(lead)}
                    style={{ borderBottom: '1px solid #111827', cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: '#e5e7eb' }}>{lead.nombre}</span></td>
                    <td style={{ ...tdStyle, color: '#6b7280', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</td>
                    <td style={tdStyle}><span style={chipStyle}>{cpuShort(lead.procesador)}</span></td>
                    <td style={tdStyle}><span style={chipStyle}>{gpuShort(lead.graficaActual)}</span></td>
                    <td style={tdStyle}><span style={chipStyle}>{FUENTE_LABELS[lead.fuentePoderWatts] ?? lead.fuentePoderWatts}</span></td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#76B900' }}>{lead.isFinalist ? lead.voteCount ?? 0 : '—'}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFinalist(lead); }}
                        style={{
                          background: lead.isFinalist ? 'rgba(118,185,0,0.15)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${lead.isFinalist ? '#76B900' : '#374151'}`,
                          color: lead.isFinalist ? '#76B900' : '#6b7280',
                          padding: '4px 12px', borderRadius: '999px', cursor: 'pointer',
                          fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap',
                        }}
                      >
                        {lead.isFinalist ? '★ Finalista' : '☆ Nominado'}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, color: '#4b5563', whiteSpace: 'nowrap' }}>{fmtDate(lead.createdAt)}</td>
                    <td style={tdStyle}>
                      <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Ver →</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const tdStyle = { padding: '12px', verticalAlign: 'middle' };
const chipStyle = { background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', color: '#9ca3af' };
const labelStyle = { color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '5px' };
const filterInputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #374151',
  borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem',
  outline: 'none', boxSizing: 'border-box',
};

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div style={{ flex: '1 1 160px' }}>
      <label style={labelStyle}>{label}</label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...filterInputStyle, cursor: 'pointer' }}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v} style={{ background: '#111' }}>{l}</option>
        ))}
      </select>
    </div>
  );
}

// Etiquetas cortas para la tabla
function cpuShort(val) {
  if (!val) return '—';
  const label = PROCESADOR_LABELS[val] ?? val;
  return label.replace('Intel Core ', '').replace(' (10ª–14ª Gen)', '').replace(' (Serie 3000–9000)', '');
}

function gpuShort(val) {
  if (!val) return '—';
  return (GRAFICA_LABELS[val] ?? val)
    .replace('NVIDIA GeForce ', '')
    .replace('AMD Radeon ', '')
    .replace(' Series', '')
    .replace(' (sin tarjeta dedicada)', '');
}

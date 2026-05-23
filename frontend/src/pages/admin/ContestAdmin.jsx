import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import {
  PROCESADOR_LABELS, GRAFICA_LABELS, FUENTE_LABELS,
} from '../../lib/contestConstants';
import ContestFormBuilder from './ContestFormBuilder';
import { ADMIN_PATH } from '../../lib/adminPath';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
const PROCESADOR_OPTIONS = [['', 'Todos los procesadores'], ...Object.entries(PROCESADOR_LABELS)];
const GRAFICA_OPTIONS    = [['', 'Todas las gráficas'],    ...Object.entries(GRAFICA_LABELS)];
const FUENTE_OPTIONS     = [['', 'Todas las fuentes'],     ...Object.entries(FUENTE_LABELS)];

const tdStyle   = { padding: '12px', verticalAlign: 'middle' };
const chipStyle = { background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', color: '#9ca3af' };
const labelSt   = { color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '5px' };
const inputSt   = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' };

function cpuShort(val) { return (PROCESADOR_LABELS[val] ?? val).replace('Intel Core ', '').replace(' (10ª–14ª Gen)', '').replace(' (Serie 3000–9000)', ''); }
function gpuShort(val) { return (GRAFICA_LABELS[val] ?? val).replace('NVIDIA GeForce ', '').replace('AMD Radeon ', '').replace(' Series', '').replace(' (sin tarjeta dedicada)', ''); }

// ─── Upload de imagen (reutiliza /api/admin/upload-image) ─────────────────────
function ImageUploader({ label, value, onChange }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/admin/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(`${API_BASE}${res.data.url}`);
    } catch (e) {
      alert('Error al subir imagen: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label style={labelSt}>{label}</label>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {value && (
          <div style={{ position: 'relative' }}>
            <img src={value} alt="preview" style={{ height: '72px', width: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #374151' }} />
            <button onClick={() => onChange('')} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e61f30', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... o sube una imagen"
            style={{ ...inputSt, marginBottom: '6px' }}
          />
          <button
            onClick={() => ref.current?.click()}
            disabled={uploading}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid #374151', color: '#9ca3af', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
          >
            {uploading ? 'Subiendo...' : '📁 Subir imagen'}
          </button>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      </div>
    </div>
  );
}

// ─── Sección colapsable ───────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #1f2937', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: 'none', color: '#d1d5db', padding: '14px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        {title}
        <span style={{ color: '#6b7280', fontSize: '1rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: '18px', borderTop: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>}
    </div>
  );
}

// ─── Campo de texto simple ────────────────────────────────────────────────────
function TextField({ label, value, onChange, multiline, placeholder }) {
  return (
    <div>
      <label style={labelSt}>{label}</label>
      {multiline
        ? <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5 }} />
        : <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputSt} />
      }
    </div>
  );
}

// ─── Modal de detalle de lead ─────────────────────────────────────────────────
function LeadModal({ lead, onClose, onToggleFinalist }) {
  if (!lead) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#111', border: '1px solid #1f2937', borderRadius: '14px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', marginBottom: '2px' }}>{lead.nombre}</h2>
              <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>{lead.email} · {lead.telefono}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => onToggleFinalist(lead)}
                style={{ background: lead.isFinalist ? 'rgba(118,185,0,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${lead.isFinalist ? '#76B900' : '#374151'}`, color: lead.isFinalist ? '#76B900' : '#9ca3af', padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
              >
                {lead.isFinalist ? '★ Finalista' : '☆ Marcar finalista'}
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
            </div>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <Bdg label="CPU"   value={PROCESADOR_LABELS[lead.procesador]   ?? lead.procesador} />
              <Bdg label="GPU"   value={GRAFICA_LABELS[lead.graficaActual]   ?? lead.graficaActual} />
              <Bdg label="PSU"   value={FUENTE_LABELS[lead.fuentePoderWatts] ?? lead.fuentePoderWatts} />
              {lead.isFinalist && <Bdg label="Votos" value={lead.voteCount} color="#76B900" />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <Photo src={lead.fotoExteriorUrl} label="Exterior" />
              <Photo src={lead.fotoInteriorUrl} label="Interior" />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Historia</p>
              <p style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{lead.historia}</p>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', color: '#4b5563', fontSize: '0.78rem' }}>
              <span>Marketing: <strong style={{ color: lead.aceptaMarketing ? '#76B900' : '#6b7280' }}>{lead.aceptaMarketing ? 'Sí' : 'No'}</strong></span>
              <span>Registrado: {fmtDate(lead.createdAt)}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Bdg({ label, value, color }) {
  return <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', color: color || '#9ca3af' }}><span style={{ color: '#4b5563', marginRight: '4px' }}>{label}:</span>{value}</span>;
}

function Photo({ src, label }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div onClick={() => setOpen(true)} style={{ cursor: 'zoom-in', position: 'relative' }}>
        <img src={src} alt={label} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #1f2937' }} />
        <div style={{ position: 'absolute', bottom: '6px', left: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px' }}>{label}</div>
      </div>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}><img src={src} alt={label} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }} /></div>}
    </>
  );
}

// ─── Tab: Registros ────────────────────────────────────────────────────────────
function TabRegistros() {
  const [leads, setLeads]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [fullLead, setFullLead]         = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch]             = useState('');
  const [procesador, setProcesador]     = useState('');
  const [graficaActual, setGrafica]     = useState('');
  const [fuentePoderWatts, setFuente]   = useState('');
  const [isFinalist, setIsFinalist]     = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)            params.set('search', search);
      if (procesador)        params.set('procesador', procesador);
      if (graficaActual)     params.set('graficaActual', graficaActual);
      if (fuentePoderWatts)  params.set('fuentePoderWatts', fuentePoderWatts);
      if (isFinalist !== '') params.set('isFinalist', isFinalist);
      const res = await api.get(`/admin/concurso?${params}`);
      setLeads(res.data);
    } finally { setLoading(false); }
  }, [search, procesador, graficaActual, fuentePoderWatts, isFinalist]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const openModal = async (lead) => {
    setSelectedLead(lead); setModalLoading(true);
    try { const res = await api.get(`/admin/concurso/${lead.id}`); setFullLead(res.data); }
    finally { setModalLoading(false); }
  };

  const toggleFinalist = async (lead) => {
    try {
      const res = await api.patch(`/admin/concurso/${lead.id}/finalist`);
      const { isFinalist: v } = res.data;
      setLeads((p) => p.map((l) => l.id === lead.id ? { ...l, isFinalist: v } : l));
      if (fullLead?.id === lead.id) setFullLead((p) => ({ ...p, isFinalist: v }));
    } catch (e) { alert('Error: ' + e.message); }
  };

  return (
    <>
      <LeadModal lead={modalLoading ? selectedLead : fullLead} onClose={() => { setSelectedLead(null); setFullLead(null); }} onToggleFinalist={toggleFinalist} />

      {/* Filtros */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1f2937', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={labelSt}>Buscar</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre o email..." style={inputSt} />
        </div>
        <FSel label="Procesador" value={procesador} onChange={setProcesador} options={PROCESADOR_OPTIONS} />
        <FSel label="Gráfica"    value={graficaActual} onChange={setGrafica} options={GRAFICA_OPTIONS} />
        <FSel label="Fuente"     value={fuentePoderWatts} onChange={setFuente} options={FUENTE_OPTIONS} />
        <FSel label="Finalista"  value={isFinalist} onChange={setIsFinalist} options={[['', 'Todos'], ['true', 'Sí'], ['false', 'No']]} />
        <button onClick={() => { setSearch(''); setProcesador(''); setGrafica(''); setFuente(''); setIsFinalist(''); }} style={{ background: 'none', border: '1px solid #374151', color: '#6b7280', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', alignSelf: 'flex-end' }}>Limpiar</button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#4b5563' }}>Cargando...</div>
      ) : leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#4b5563', border: '1px solid #1f2937', borderRadius: '10px' }}>No hay registros con los filtros seleccionados.</div>
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
                <motion.tr key={lead.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => openModal(lead)} style={{ borderBottom: '1px solid #111827', cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={tdStyle}><span style={{ fontWeight: 600, color: '#e5e7eb' }}>{lead.nombre}</span></td>
                  <td style={{ ...tdStyle, color: '#6b7280', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</td>
                  <td style={tdStyle}><span style={chipStyle}>{cpuShort(lead.procesador)}</span></td>
                  <td style={tdStyle}><span style={chipStyle}>{gpuShort(lead.graficaActual)}</span></td>
                  <td style={tdStyle}><span style={chipStyle}>{FUENTE_LABELS[lead.fuentePoderWatts] ?? lead.fuentePoderWatts}</span></td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#76B900' }}>{lead.isFinalist ? (lead.voteCount ?? 0) : '—'}</td>
                  <td style={tdStyle}>
                    <button onClick={(e) => { e.stopPropagation(); toggleFinalist(lead); }} style={{ background: lead.isFinalist ? 'rgba(118,185,0,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${lead.isFinalist ? '#76B900' : '#374151'}`, color: lead.isFinalist ? '#76B900' : '#6b7280', padding: '4px 12px', borderRadius: '999px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {lead.isFinalist ? '★ Finalista' : '☆ Nominado'}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, color: '#4b5563', whiteSpace: 'nowrap' }}>{fmtDate(lead.createdAt)}</td>
                  <td style={tdStyle}><span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Ver →</span></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FSel({ label, value, onChange, options }) {
  return (
    <div style={{ flex: '1 1 160px' }}>
      <label style={labelSt}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
        {options.map(([v, l]) => <option key={v} value={v} style={{ background: '#111' }}>{l}</option>)}
      </select>
    </div>
  );
}

// ─── Tab: Configuración ────────────────────────────────────────────────────────
const DEFAULTS = {
  titulo: 'El Gran Upgrade', subtitulo: '', badge: '', imagenHero: '',
  campos: [],
  textoFechaApertura: '1 de junio, 2026', textoFechaCierre: '7 de junio, 23:59', textoFechaFinal: '12 de junio, 2026',
  patrocinadores: [
    { nombre: 'NVIDIA', logoUrl: '', color: '#76B900' },
    { nombre: 'ASUS ROG', logoUrl: '', color: '#e61f30' },
    { nombre: 'ComputerShop', logoUrl: '', color: '#ffffff' },
  ],
  pasos: [
    { numero: '01', titulo: 'Inscríbete', descripcion: '' },
    { numero: '02', titulo: 'Espera los finalistas', descripcion: '' },
    { numero: '03', titulo: 'Vota y comparte', descripcion: '' },
  ],
  premios: [
    { posicion: '1er lugar', descripcion: '', color: '#facc15', imagenUrl: '' },
    { posicion: '2do lugar', descripcion: '', color: '#9ca3af', imagenUrl: '' },
    { posicion: '3er lugar', descripcion: '', color: '#cd7c3e', imagenUrl: '' },
  ],
  tituloFormulario: 'Formulario de inscripción', instruccionesFormulario: '',
  labelHistoria: '¿Por qué mereces el Gran Upgrade?', placeholderHistoria: '',
  maxPalabrasHistoria: 150, textoTyC: 'Acepto los Términos y Condiciones del concurso',
  urlTyC: '#tyc', textoMarketing: '',
};

function TabConfiguracion() {
  const [cfg, setCfg]       = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    api.get('/admin/concurso/settings').then((r) => setCfg({ ...DEFAULTS, ...r.data })).catch(() => {});
  }, []);

  const set = (key, val) => setCfg((c) => ({ ...c, [key]: val }));

  const setNested = (key, index, field, val) =>
    setCfg((c) => ({ ...c, [key]: c[key].map((item, i) => i === index ? { ...item, [field]: val } : item) }));

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await api.patch('/admin/concurso/settings', cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert('Error al guardar: ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: '760px' }}>
      {/* ── LANDING PAGE ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1, height: '1px', background: '#1f2937' }} />
        <span style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Página de inicio</span>
        <div style={{ flex: 1, height: '1px', background: '#1f2937' }} />
      </div>

      <Accordion title="Hero principal" defaultOpen>
        <TextField label="Título de la campaña" value={cfg.titulo} onChange={(v) => set('titulo', v)} placeholder="El Gran Upgrade" />
        <TextField label="Subtítulo / descripción" value={cfg.subtitulo} onChange={(v) => set('subtitulo', v)} multiline placeholder="Muéstranos tu PC..." />
        <TextField label="Texto del badge superior" value={cfg.badge} onChange={(v) => set('badge', v)} placeholder="CONCURSO PATROCINADO POR..." />
        <ImageUploader label="Imagen de fondo del hero (opcional)" value={cfg.imagenHero} onChange={(v) => set('imagenHero', v)} />
      </Accordion>

      <Accordion title="Fechas clave (texto display)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <TextField label="Apertura" value={cfg.textoFechaApertura} onChange={(v) => set('textoFechaApertura', v)} placeholder="1 de junio, 2026" />
          <TextField label="Cierre"   value={cfg.textoFechaCierre}   onChange={(v) => set('textoFechaCierre', v)}   placeholder="7 de junio, 23:59" />
          <TextField label="Gran Final" value={cfg.textoFechaFinal}  onChange={(v) => set('textoFechaFinal', v)}    placeholder="12 de junio, 2026" />
        </div>
      </Accordion>

      <Accordion title="Patrocinadores / logos">
        {cfg.patrocinadores.map((p, i) => (
          <div key={i} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px' }}>
              <TextField label={`Patrocinador ${i + 1} — nombre`} value={p.nombre} onChange={(v) => setNested('patrocinadores', i, 'nombre', v)} />
              <div>
                <label style={labelSt}>Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={p.color || '#ffffff'} onChange={(e) => setNested('patrocinadores', i, 'color', e.target.value)} style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid #374151', background: 'none', cursor: 'pointer' }} />
                  <input value={p.color || ''} onChange={(e) => setNested('patrocinadores', i, 'color', e.target.value)} style={{ ...inputSt, flex: 1 }} />
                </div>
              </div>
            </div>
            <ImageUploader label="Logo" value={p.logoUrl} onChange={(v) => setNested('patrocinadores', i, 'logoUrl', v)} />
          </div>
        ))}
      </Accordion>

      <Accordion title="Pasos (¿Cómo participar?)">
        {cfg.pasos.map((paso, i) => (
          <div key={i} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '10px' }}>
              <TextField label="Número" value={paso.numero} onChange={(v) => setNested('pasos', i, 'numero', v)} placeholder="01" />
              <TextField label="Título" value={paso.titulo} onChange={(v) => setNested('pasos', i, 'titulo', v)} placeholder="Inscríbete" />
            </div>
            <TextField label="Descripción" value={paso.descripcion} onChange={(v) => setNested('pasos', i, 'descripcion', v)} multiline />
          </div>
        ))}
      </Accordion>

      <Accordion title="Premios">
        {cfg.premios.map((premio, i) => (
          <div key={i} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '10px' }}>
              <TextField label="Posición" value={premio.posicion} onChange={(v) => setNested('premios', i, 'posicion', v)} placeholder="1er lugar" />
              <TextField label="Descripción" value={premio.descripcion} onChange={(v) => setNested('premios', i, 'descripcion', v)} placeholder="NVIDIA RTX 4080 + ..." />
              <div>
                <label style={labelSt}>Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={premio.color || '#facc15'} onChange={(e) => setNested('premios', i, 'color', e.target.value)} style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid #374151', background: 'none', cursor: 'pointer' }} />
                </div>
              </div>
            </div>
            <ImageUploader label="Imagen del premio (opcional)" value={premio.imagenUrl} onChange={(v) => setNested('premios', i, 'imagenUrl', v)} />
          </div>
        ))}
      </Accordion>

      {/* ── FORMULARIO ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 16px' }}>
        <div style={{ flex: 1, height: '1px', background: '#1f2937' }} />
        <span style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Formulario de inscripción</span>
        <div style={{ flex: 1, height: '1px', background: '#1f2937' }} />
      </div>

      <Accordion title="Textos del formulario" defaultOpen>
        <TextField label="Título del formulario" value={cfg.tituloFormulario} onChange={(v) => set('tituloFormulario', v)} placeholder="Formulario de inscripción" />
        <TextField label="Instrucciones / subtítulo" value={cfg.instruccionesFormulario} onChange={(v) => set('instruccionesFormulario', v)} multiline placeholder="Completa todos los campos..." />
      </Accordion>

      <Accordion title="Campo de historia">
        <TextField label="Label del campo" value={cfg.labelHistoria} onChange={(v) => set('labelHistoria', v)} placeholder="¿Por qué mereces el Gran Upgrade?" />
        <TextField label="Placeholder" value={cfg.placeholderHistoria} onChange={(v) => set('placeholderHistoria', v)} multiline placeholder="Comparte tu historia..." />
        <div>
          <label style={labelSt}>Máximo de palabras</label>
          <input type="number" min={10} max={500} value={cfg.maxPalabrasHistoria} onChange={(e) => set('maxPalabrasHistoria', Number(e.target.value))} style={{ ...inputSt, width: '120px' }} />
        </div>
      </Accordion>

      <Accordion title="Términos y marketing">
        <TextField label="Texto del checkbox de TyC" value={cfg.textoTyC} onChange={(v) => set('textoTyC', v)} placeholder="Acepto los Términos y Condiciones..." />
        <TextField label="URL de los TyC" value={cfg.urlTyC} onChange={(v) => set('urlTyC', v)} placeholder="#tyc o https://..." />
        <TextField label="Texto del checkbox de marketing" value={cfg.textoMarketing} onChange={(v) => set('textoMarketing', v)} multiline placeholder="Acepto recibir comunicaciones..." />
      </Accordion>

      {/* ── CAMPOS DEL FORMULARIO ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 16px' }}>
        <div style={{ flex: 1, height: '1px', background: '#1f2937' }} />
        <span style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Campos del formulario</span>
        <div style={{ flex: 1, height: '1px', background: '#1f2937' }} />
      </div>

      <Accordion title="Constructor de campos" defaultOpen={false}>
        <p style={{ color: '#6b7280', fontSize: '0.82rem', marginTop: 0, marginBottom: '12px' }}>
          Arrastra los campos para reordenarlos. Los campos <span style={{ color: '#9ca3af' }}>SISTEMA</span> son obligatorios y no pueden eliminarse.
        </p>
        <ContestFormBuilder
          campos={cfg.campos || []}
          onChange={(campos) => set('campos', campos)}
        />
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #1f2937' }}>
          <a
            href="/concursos/el-gran-upgrade/inscripcion?preview=1"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(250,204,21,0.08)', border: '1px solid #ca8a04',
              color: '#fbbf24', padding: '7px 16px', borderRadius: '6px',
              textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700,
            }}
          >
            Vista previa del formulario ↗
          </a>
          <span style={{ color: '#4b5563', fontSize: '0.75rem', marginLeft: '10px' }}>
            (se abre en pestaña nueva con datos ficticios)
          </span>
        </div>
      </Accordion>

      {/* Guardar */}
      <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={save} disabled={saving}
          style={{ background: saving ? '#4a7400' : '#76B900', color: '#000', fontWeight: 800, padding: '12px 32px', borderRadius: '6px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.95rem', transition: 'background .2s' }}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && <span style={{ color: '#76B900', fontSize: '0.85rem', fontWeight: 600 }}>✓ Cambios guardados</span>}
        <a href="/concursos/el-gran-upgrade" target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', fontSize: '0.82rem', textDecoration: 'none', marginLeft: 'auto' }}>
          Ver página pública ↗
        </a>
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function ContestAdmin() {
  const [tab, setTab] = useState('registros');

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1f2937', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to={ADMIN_PATH} style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.85rem' }}>← Admin</Link>
          <h1 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>Concurso · El Gran Upgrade</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #1f2937', padding: '0 24px', display: 'flex', gap: '2px' }}>
        {[['registros', 'Registros'], ['config', 'Configuración de página']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #76B900' : '2px solid transparent', color: tab === key ? '#76B900' : '#6b7280', padding: '12px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', transition: 'color .15s', marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px' }}>
        {tab === 'registros' && <TabRegistros />}
        {tab === 'config'    && <TabConfiguracion />}
      </div>
    </div>
  );
}

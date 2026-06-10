import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../lib/api';
import {
  PROCESADOR_LABELS, GRAFICA_LABELS, FUENTE_LABELS,
} from '../../lib/contestConstants';
import ContestFormBuilder from './ContestFormBuilder';
import { ADMIN_PATH } from '../../lib/adminPath';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
      const res = await api.post('/admin/upload-image', fd);
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
            <img src={value} alt="preview" style={{ height: '72px', width: '120px', objectFit: 'contain', background: '#111', borderRadius: '6px', border: '1px solid #374151' }} />
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

function AudioUploader({ label, value, onChange }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('audio', file);
      const res = await api.post('/admin/upload-audio', fd);
      onChange(`${API_BASE}${res.data.url}`);
    } catch (e) {
      alert('Error al subir audio: ' + e.message);
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
            <audio src={value} controls style={{ height: '40px', borderRadius: '6px', border: '1px solid #374151' }} />
            <button onClick={() => onChange('')} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e61f30', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... o sube un archivo MP3"
            style={{ ...inputSt, marginBottom: '6px' }}
          />
          <button
            onClick={() => ref.current?.click()}
            disabled={uploading}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid #374151', color: '#9ca3af', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
          >
            {uploading ? 'Subiendo...' : '🎵 Subir MP3'}
          </button>
          <input ref={ref} type="file" accept="audio/mpeg,audio/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
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

// ─── Rich-text editor (Tiptap) ────────────────────────────────────────────────
const TIPTAP_CSS = `
  .ProseMirror { padding: 10px 14px; min-height: 90px; outline: none; color: #e5e7eb; font-size: 0.85rem; line-height: 1.65; }
  .ProseMirror p { margin: 0 0 6px; }
  .ProseMirror ul, .ProseMirror ol { padding-left: 20px; margin: 0 0 6px; }
  .ProseMirror li { margin-bottom: 2px; }
  .ProseMirror strong { color: #fff; font-weight: 700; }
  .ProseMirror em { color: #d1d5db; }
  .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #4b5563; pointer-events: none; float: left; height: 0; }
`;

function RichTextEditor({ label, value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { 'data-placeholder': placeholder || '' } },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || '', false);
  }, [value, editor]);

  if (!editor) return null;

  const Btn = ({ active, onClick, children, title }) => (
    <button type="button" title={title} onClick={onClick} style={{
      background: active ? 'rgba(118,185,0,0.18)' : 'transparent',
      border: 'none', color: active ? '#76B900' : '#6b7280',
      padding: '3px 9px', borderRadius: '4px', cursor: 'pointer',
      fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.4,
    }}>{children}</button>
  );

  return (
    <div>
      <style>{TIPTAP_CSS}</style>
      {label && <label style={labelSt}>{label}</label>}
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #374151', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '2px', padding: '5px 8px', borderBottom: '1px solid #1f2937', background: 'rgba(0,0,0,0.25)', flexWrap: 'wrap' }}>
          <Btn active={editor.isActive('bold')}       onClick={() => editor.chain().focus().toggleBold().run()}       title="Negrita">B</Btn>
          <Btn active={editor.isActive('italic')}     onClick={() => editor.chain().focus().toggleItalic().run()}     title="Cursiva"><em>I</em></Btn>
          <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista">• Lista</Btn>
          <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">1. Lista</Btn>
          <div style={{ width: 1, background: '#1f2937', margin: '2px 4px', alignSelf: 'stretch' }} />
          <Btn active={false} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpiar formato">✕</Btn>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────
const SISTEMA_IDS = new Set([
  'nombre', 'email', 'telefono', 'procesador', 'graficaActual',
  'fuentePoderWatts', 'historia', 'aceptaTyC', 'aceptaMarketing',
]);

function shortenLabel(id, label) {
  if (id === 'email') return 'Email';
  if (id === 'telefono') return 'Teléfono';
  if (id === 'procesador') return 'CPU';
  if (id === 'graficaActual') return 'GPU';
  if (id === 'fuentePoderWatts') return 'PSU';
  if (id === 'aceptaTyC') return 'T&C';
  if (id === 'aceptaMarketing') return 'Marketing';
  if (id === 'historia') return 'Historia';
  if (typeof label === 'string' && label.length > 15) {
    return label.substring(0, 13) + '...';
  }
  return label;
}

function buildColDefs(campos) {
  const cols = [];
  for (const c of campos) {
    if (c.tipo === 'file') continue;

    let getValue, renderCell;
    if (c.id === 'procesador') {
      getValue   = (l) => PROCESADOR_LABELS[l.procesador] ?? l.procesador;
      renderCell = (l) => <span style={chipStyle}>{cpuShort(l.procesador)}</span>;
    } else if (c.id === 'graficaActual') {
      getValue   = (l) => GRAFICA_LABELS[l.graficaActual] ?? l.graficaActual;
      renderCell = (l) => <span style={chipStyle}>{gpuShort(l.graficaActual)}</span>;
    } else if (c.id === 'fuentePoderWatts') {
      getValue   = (l) => FUENTE_LABELS[l.fuentePoderWatts] ?? l.fuentePoderWatts;
      renderCell = (l) => <span style={chipStyle}>{FUENTE_LABELS[l.fuentePoderWatts] ?? l.fuentePoderWatts}</span>;
    } else if (c.id === 'nombre') {
      getValue   = (l) => l.nombre ?? '';
      renderCell = (l) => <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{l.nombre}</span>;
    } else if (c.id === 'email') {
      getValue   = (l) => l.email ?? '';
      renderCell = (l) => <span style={{ color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '180px' }}>{l.email}</span>;
    } else if (c.id === 'historia') {
      getValue   = (l) => l.historia ?? '';
      renderCell = (l) => <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '200px', color: '#9ca3af', fontSize: '0.8rem' }}>{l.historia ?? '(sin historia)'}</span>;
    } else if (c.id === 'aceptaTyC' || c.id === 'aceptaMarketing') {
      getValue   = (l) => (l[c.id] ? 'Sí' : 'No');
      renderCell = (l) => <span style={{ color: l[c.id] ? '#76B900' : '#6b7280' }}>{l[c.id] ? 'Sí' : 'No'}</span>;
    } else if (SISTEMA_IDS.has(c.id)) {
      getValue   = (l) => l[c.id] ?? '';
      renderCell = (l) => {
        const str = String(l[c.id] ?? '');
        return <span style={{ display: 'block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={str}>{str}</span>;
      };
    } else {
      getValue = (l) => {
        const v = l.camposExtra?.[c.id];
        return Array.isArray(v) ? v.join(', ') : (v ?? '');
      };
      renderCell = (l) => {
        const v = l.camposExtra?.[c.id];
        const str = Array.isArray(v) ? v.join(', ') : String(v ?? '');
        return <span style={{ display: 'block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={str}>{str}</span>;
      };
    }
    cols.push({ id: c.id, label: c.label, getValue, renderCell });
  }

  cols.push({
    id: '_votos', label: 'Votos',
    getValue:   (l) => (l.isFinalist ? (l.voteCount ?? 0) : '—'),
    renderCell: (l) => <span style={{ fontWeight: 700, color: '#76B900' }}>{l.isFinalist ? (l.voteCount ?? 0) : '—'}</span>,
  });
  cols.push({
    id: '_fecha', label: 'Fecha',
    getValue:   (l) => new Date(l.createdAt).toLocaleString('es-GT'),
    renderCell: (l) => <span style={{ color: '#4b5563', whiteSpace: 'nowrap' }}>{fmtDate(l.createdAt)}</span>,
  });
  return cols;
}

// ─── CSV / PDF export helpers ─────────────────────────────────────────────────
function exportCSV(leads, cols) {
  const headers = cols.map((c) => c.label);
  const rows = leads.map((l) =>
    cols.map((c) => `"${String(c.getValue(l) ?? '').replace(/"/g, '""')}"`)
  );
  const csv = [headers.map((h) => `"${h}"`), ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'registros-el-gran-upgrade.csv'; a.click();
  URL.revokeObjectURL(url);
}

const getAbsoluteUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const apiBase = import.meta.env.VITE_API_URL || '';
  return apiBase + url;
};

async function exportPDF(leads, cols) {
  const doc = new jsPDF({ orientation: 'portrait' });
  const GREEN = [118, 185, 0];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    let yPos = margin;

    // Header
    doc.setFillColor(10, 10, 10); doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(...GREEN); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(`${lead.nombre} — ${lead.email}`, margin, 12);
    doc.setTextColor(150, 150, 150); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`Registro ${i + 1} de ${leads.length}`, margin, 22);
    doc.setDrawColor(...GREEN); doc.setLineWidth(0.5); doc.line(margin, 27, pageWidth - margin, 27);

    yPos = 35;

    // Info básica
    doc.setTextColor(0, 0, 0); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', margin, yPos); doc.setFont('helvetica', 'normal'); doc.text(lead.telefono, margin + 25, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'bold'); doc.text('Procesador:', margin, yPos); doc.setFont('helvetica', 'normal');
    doc.text(PROCESADOR_LABELS[lead.procesador] ?? lead.procesador, margin + 25, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'bold'); doc.text('GPU Actual:', margin, yPos); doc.setFont('helvetica', 'normal');
    doc.text(GRAFICA_LABELS[lead.graficaActual] ?? lead.graficaActual, margin + 25, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'bold'); doc.text('PSU:', margin, yPos); doc.setFont('helvetica', 'normal');
    doc.text(FUENTE_LABELS[lead.fuentePoderWatts] ?? lead.fuentePoderWatts, margin + 25, yPos);
    yPos += 12;

    // Fotos
    if (lead.fotoExteriorUrl) {
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN);
      doc.text('Foto Exterior:', margin, yPos);
      yPos += 2;
      try {
        const externalImg = getAbsoluteUrl(lead.fotoExteriorUrl);
        doc.addImage(externalImg, 'JPEG', margin, yPos, 80, 60);
        yPos += 65;
      } catch (e) {
        doc.setTextColor(200, 0, 0); doc.setFontSize(7);
        doc.text('Error al cargar imagen exterior', margin, yPos);
        yPos += 6;
      }
    }

    if (lead.fotoInteriorUrl) {
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN);
      doc.text('Foto Interior:', margin, yPos);
      yPos += 2;
      try {
        const interiorImg = getAbsoluteUrl(lead.fotoInteriorUrl);
        doc.addImage(interiorImg, 'JPEG', margin, yPos, 80, 60);
        yPos += 65;
      } catch (e) {
        doc.setTextColor(200, 0, 0); doc.setFontSize(7);
        doc.text('Error al cargar imagen interior', margin, yPos);
        yPos += 6;
      }
    }

    // Historia
    if (lead.historia) {
      if (yPos > pageHeight - 40) doc.addPage();
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN);
      doc.text('Historia:', margin, yPos);
      yPos += 5;
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      const historiaLines = doc.splitTextToSize(lead.historia, pageWidth - margin * 2);
      doc.text(historiaLines, margin, yPos);

      if (i < leads.length - 1) doc.addPage();
    } else if (i < leads.length - 1) {
      doc.addPage();
    }
  }

  doc.save('registros-el-gran-upgrade-completo.pdf');
}

// ─── Modal de detalle de lead ─────────────────────────────────────────────────
// ─── Modal de detalle de lead ─────────────────────────────────────────────────
function LeadModal({ lead, campos = [], onClose, onToggleFinalist }) {
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
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Bdg label="CPU"   value={PROCESADOR_LABELS[lead.procesador]   ?? lead.procesador} />
              <Bdg label="GPU"   value={GRAFICA_LABELS[lead.graficaActual]   ?? lead.graficaActual} />
              <Bdg label="PSU"   value={FUENTE_LABELS[lead.fuentePoderWatts] ?? lead.fuentePoderWatts} />
              {lead.isFinalist && <Bdg label="Votos" value={lead.voteCount} color="#76B900" />}
            </div>

            {/* Fotos por defecto */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Photo src={lead.fotoExteriorUrl} label="Exterior" />
              <Photo src={lead.fotoInteriorUrl} label="Interior" />
            </div>

            {/* Detalle dinámico de todos los campos del formulario */}
            {campos.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937', borderRadius: '10px', padding: '18px' }}>
                <p style={{ color: '#76B900', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px', borderBottom: '1px solid #1f2937', paddingBottom: '6px' }}>
                  Datos del Formulario
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
                  {campos.map((c) => {
                    // Skip history (shown separately) and standard photos (shown separately)
                    if (c.id === 'historia' || c.id === 'fotoExterior' || c.id === 'fotoInterior') return null;

                    let val = '';
                    if (c.tipo === 'file') {
                      const url = lead.camposExtra?.[c.id];
                      if (!url) return null;
                      return (
                        <div key={c.id} style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                          <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>{c.label}</span>
                          <Photo src={url} label={c.label} />
                        </div>
                      );
                    }

                    if (c.id === 'nombre') val = lead.nombre;
                    else if (c.id === 'email') val = lead.email;
                    else if (c.id === 'telefono') val = lead.telefono;
                    else if (c.id === 'procesador') val = PROCESADOR_LABELS[lead.procesador] ?? lead.procesador;
                    else if (c.id === 'graficaActual') val = GRAFICA_LABELS[lead.graficaActual] ?? lead.graficaActual;
                    else if (c.id === 'fuentePoderWatts') val = FUENTE_LABELS[lead.fuentePoderWatts] ?? lead.fuentePoderWatts;
                    else if (c.id === 'aceptaTyC') val = lead.aceptaTyC ? 'Sí' : 'No';
                    else if (c.id === 'aceptaMarketing') val = lead.aceptaMarketing ? 'Sí' : 'No';
                    else {
                      // Custom fields (like apellidos, dni_ce, etc.)
                      const rawVal = lead.camposExtra?.[c.id];
                      val = Array.isArray(rawVal) ? rawVal.join(', ') : (rawVal ?? '');
                    }

                    if (val === undefined || val === null || val === '') return null;

                    return (
                      <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 600 }}>{c.label}</span>
                        <span style={{ color: '#e5e7eb', fontSize: '0.85rem', wordBreak: 'break-word' }}>{String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Historia */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1f2937', borderRadius: '8px', padding: '16px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>Historia</p>
              <p style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{lead.historia}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', fontSize: '0.78rem' }}>
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

// ─── Modal de Exportación ─────────────────────────────────────────────────────
function ExportModal({ allCols, isOpen, onClose, onExportCSV, onExportPDF }) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Initialize with all columns when modal opens
  useEffect(() => {
    if (isOpen && allCols.length > 0) {
      setSelectedIds(new Set(allCols.map((c) => c.id)));
    }
  }, [isOpen, allCols]);

  if (!isOpen) return null;

  const toggleId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(allCols.map((c) => c.id)));
  const selectNone = () => setSelectedIds(new Set());

  const getFilteredCols = () => allCols.filter((c) => selectedIds.has(c.id));

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
          style={{ background: '#111', border: '1px solid #1f2937', borderRadius: '14px', width: '100%', maxWidth: '540px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Exportar Registros</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
          </div>

          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
            Selecciona los campos que deseas incluir en la exportación de archivos.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <button onClick={selectAll} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #374151', color: '#76B900', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Seleccionar todos</button>
            <button onClick={selectNone} style={{ background: 'none', border: '1px solid #374151', color: '#6b7280', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Deseleccionar todos</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', maxHeight: '280px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid #1f2937', borderRadius: '8px', marginBottom: '24px' }}>
            {allCols.map((col) => (
              <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 0', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(col.id)}
                  onChange={() => toggleId(col.id)}
                  style={{ accentColor: '#76B900', width: '15px', height: '15px', flexShrink: 0 }}
                />
                <span style={{ color: '#d1d5db', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.label}</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid #374151', color: '#6b7280', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
              Cancelar
            </button>
            <button
              onClick={() => { onExportCSV(getFilteredCols()); onClose(); }}
              disabled={selectedIds.size === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid #374151', color: selectedIds.size === 0 ? '#374151' : '#9ca3af', padding: '10px 20px', borderRadius: '6px', cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
            >
              ↓ CSV
            </button>
            <button
              onClick={() => { onExportPDF(getFilteredCols()); onClose(); }}
              disabled={selectedIds.size === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#76B900', border: 'none', color: '#000', padding: '10px 20px', borderRadius: '6px', cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: 800 }}
            >
              ↓ PDF
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [allCols, setAllCols]           = useState([]);
  const [visibleIds, setVisibleIds]     = useState(null); // null = all
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const colPickerRef = useRef(null);
  const [campos, setCampos]             = useState([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Load campos from settings to build column definitions
  useEffect(() => {
    api.get('/admin/concurso/settings')
      .then((r) => {
        const rawCampos = r.data.campos || [];
        setCampos(rawCampos);
        const cols = buildColDefs(rawCampos);
        setAllCols(cols);
        setVisibleIds(new Set(cols.map((c) => c.id)));
      })
      .catch(() => {});
  }, []);

  // Close column picker on outside click
  useEffect(() => {
    if (!colPickerOpen) return;
    const handler = (e) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target)) {
        setColPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [colPickerOpen]);

  const visibleCols = visibleIds
    ? allCols.filter((c) => visibleIds.has(c.id))
    : allCols;

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

  const deleteLead = (lead) => setConfirmDelete(lead);

  const confirmDeleteLead = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/admin/concurso/${confirmDelete.id}`);
      setLeads((p) => p.filter((l) => l.id !== confirmDelete.id));
      if (fullLead?.id === confirmDelete.id) { setSelectedLead(null); setFullLead(null); }
      setConfirmDelete(null);
    } catch (e) {
      alert('Error al eliminar: ' + e.message);
      setConfirmDelete(null);
    }
  };

  const toggleCol = (id, checked) => {
    setVisibleIds((prev) => {
      const next = new Set(prev ?? allCols.map((c) => c.id));
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  return (
    <>
      <LeadModal lead={modalLoading ? selectedLead : fullLead} campos={campos} onClose={() => { setSelectedLead(null); setFullLead(null); }} onToggleFinalist={toggleFinalist} />

      <ExportModal
        allCols={allCols}
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExportCSV={(cols) => exportCSV(leads, cols)}
        onExportPDF={(cols) => exportPDF(leads, cols)}
      />

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            <h3 style={{ color: '#f1f5f9', marginBottom: '8px', fontWeight: 700, fontSize: '1.1rem' }}>Eliminar registro</h3>
            <p style={{ color: '#cbd5e1', marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.5 }}>
              ¿Eliminar a <strong>{confirmDelete.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #374151', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                Cancelar
              </button>
              <button onClick={confirmDeleteLead} style={{ background: '#dc2626', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Barra de acciones: columnas + export */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', justifyContent: 'flex-end', alignItems: 'center' }}>
        {/* Column picker */}
        {allCols.length > 0 && (
          <div style={{ position: 'relative' }} ref={colPickerRef}>
            <button
              onClick={() => setColPickerOpen((o) => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: colPickerOpen ? 'rgba(118,185,0,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${colPickerOpen ? '#76B900' : '#374151'}`, color: colPickerOpen ? '#76B900' : '#9ca3af', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              ≡ Columnas {visibleIds && visibleIds.size < allCols.length ? `(${visibleIds.size}/${allCols.length})` : ''}
            </button>
            {colPickerOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 200, background: '#0d1117', border: '1px solid #374151', borderRadius: '8px', padding: '12px 14px', minWidth: '220px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Columnas visibles</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setVisibleIds(new Set(allCols.map((c) => c.id)))} style={{ background: 'none', border: 'none', color: '#76B900', cursor: 'pointer', fontSize: '0.72rem', padding: '2px 4px' }}>Todas</button>
                    <span style={{ color: '#374151' }}>|</span>
                    <button onClick={() => setVisibleIds(new Set())} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.72rem', padding: '2px 4px' }}>Ninguna</button>
                  </div>
                </div>
                {allCols.map((col) => (
                  <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={!visibleIds || visibleIds.has(col.id)}
                      onChange={(e) => toggleCol(col.id, e.target.checked)}
                      style={{ accentColor: '#76B900', width: '14px', height: '14px', flexShrink: 0 }}
                    />
                    <span style={{ color: '#d1d5db', fontSize: '0.85rem' }}>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setExportModalOpen(true)}
          disabled={leads.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(118,185,0,0.08)', border: `1px solid ${leads.length === 0 ? '#374151' : '#4a7400'}`, color: leads.length === 0 ? '#374151' : '#76B900', padding: '7px 14px', borderRadius: '6px', cursor: leads.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 700, opacity: leads.length === 0 ? 0.4 : 1 }}
        >
          ↓ Exportar
        </button>
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
                {visibleCols.map((col) => (
                  <th
                    key={col.id}
                    title={col.label}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      color: '#6b7280',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      maxWidth: '140px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shortenLabel(col.id, col.label)}
                  </th>
                ))}
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Finalista</th>
                <th style={{ padding: '10px 12px' }} />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => (
                <motion.tr key={lead.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  onClick={() => openModal(lead)} style={{ borderBottom: '1px solid #111827', cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {visibleCols.map((col) => (
                    <td key={col.id} style={tdStyle}>{col.renderCell(lead)}</td>
                  ))}
                  <td style={tdStyle}>
                    <button onClick={(e) => { e.stopPropagation(); toggleFinalist(lead); }} style={{ background: lead.isFinalist ? 'rgba(118,185,0,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${lead.isFinalist ? '#76B900' : '#374151'}`, color: lead.isFinalist ? '#76B900' : '#6b7280', padding: '4px 12px', borderRadius: '999px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {lead.isFinalist ? '★ Finalista' : '☆ Nominado'}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={(e) => { e.stopPropagation(); deleteLead(lead); }} style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                      ✕
                    </button>
                  </td>
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
const DEFAULT_TECH_TERMS = [
  'DLSS 3', 'REFLEX', 'RAY TRACING', 'RTX ON', 'TENSOR CORES',
  'CUDA', 'G-SYNC', 'NVENC', 'FRAME GENERATION', 'ACE', 'BROADCAST',
  'ADA LOVELACE', 'AMPERE', 'NVLINK', 'AI DENOISING', 'OVERDRIVE',
  'DEEP LEARNING', 'BLACKWELL', 'GDDR7', 'DLSS 4', 'MULTI FRAME GEN',
];

const DEFAULTS = {
  registrationOpen: false,
  titulo: 'El Gran Upgrade', subtitulo: '', badge: '', imagenHero: '',
  techBgEnabled: true, techBgOpacity: 1.0, techBgTerms: DEFAULT_TECH_TERMS,
  campos: [],
  textoFechaApertura: '1 de junio, 2026', textoFechaCierre: '7 de junio, 23:59', textoFechaFinal: '12 de junio, 2026',
  patrocinadores: [
    { nombre: 'NVIDIA', logoUrl: '', color: '#76B900', logoAltura: 52 },
    { nombre: 'ASUS ROG', logoUrl: '', color: '#e61f30', logoAltura: 40 },
    { nombre: 'ComputerShop', logoUrl: '', color: '#ffffff', logoAltura: 36 },
  ],
  pasos: [
    { numero: '01', titulo: 'Inscríbete', descripcion: '' },
    { numero: '02', titulo: 'Espera los finalistas', descripcion: '' },
    { numero: '03', titulo: 'Vota y comparte', descripcion: '' },
  ],
  premios: [
    { posicion: '1er lugar', descripcion: 'ASUS NVIDIA GeForce RTX 5060 Ti', color: '#76B900', imagenUrl: '' },
  ],
  ambientAudioUrl: '',
  tituloFormulario: 'Formulario de inscripción', instruccionesFormulario: '',
  labelHistoria: '¿Por qué mereces el Gran Upgrade?', placeholderHistoria: '',
  maxPalabrasHistoria: 150, textoTyC: 'Acepto los Términos y Condiciones del concurso',
  urlTyC: '#tyc', textoMarketing: '',
  contenidoTyC: '',
};

const CONFIG_SECTIONS = [
  { id: 'hero',   label: 'Hero',           icon: '▶' },
  { id: 'fechas', label: 'Fechas',         icon: '◷' },
  { id: 'pats',   label: 'Patrocinadores', icon: '★' },
  { id: 'pasos',  label: 'Pasos',          icon: '✓' },
  { id: 'premios',label: 'Premios',        icon: '▲' },
  { id: 'audio',  label: 'Música',         icon: '🎵' },
  { id: 'techbg', label: 'Fondo NVIDIA',   icon: '◈' },
  { id: 'form',   label: 'Formulario',     icon: '≡' },
];

function TabConfiguracion() {
  const [cfg, setCfg]         = useState(DEFAULTS);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [section, setSection] = useState('hero');
  const loadedRef             = useRef(false);
  const autoSaveTimer         = useRef(null);

  useEffect(() => {
    api.get('/admin/concurso/settings')
      .then((r) => { setCfg({ ...DEFAULTS, ...r.data }); loadedRef.current = true; })
      .catch(() => { loadedRef.current = true; });
  }, []);

  // Auto-save 1.5s after last change
  useEffect(() => {
    if (!loadedRef.current) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setSaving(true); setSaved(false);
      api.patch('/admin/concurso/settings', cfg)
        .then(() => { setSaved(true); setTimeout(() => setSaved(false), 2500); })
        .catch((e) => alert('Error al guardar: ' + e.message))
        .finally(() => setSaving(false));
    }, 1500);
    return () => clearTimeout(autoSaveTimer.current);
  }, [cfg]);

  const set = (key, val) => setCfg((c) => ({ ...c, [key]: val }));
  const setNested = (key, index, field, val) =>
    setCfg((c) => ({ ...c, [key]: c[key].map((item, i) => i === index ? { ...item, [field]: val } : item) }));

  const save = async () => {
    clearTimeout(autoSaveTimer.current);
    setSaving(true); setSaved(false);
    try {
      await api.patch('/admin/concurso/settings', cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert('Error al guardar: ' + e.message); }
    finally { setSaving(false); }
  };

  const sidebarBtnSt = (active) => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    width: '100%', padding: '11px 18px', border: 'none',
    borderLeft: active ? '2px solid #76B900' : '2px solid transparent',
    background: active ? 'rgba(118,185,0,0.07)' : 'transparent',
    color: active ? '#76B900' : '#6b7280',
    cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600,
    transition: 'color .15s, background .15s',
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', border: '1px solid #1f2937', borderRadius: '10px', overflow: 'hidden', height: 'calc(100vh - 148px)', minHeight: '520px' }}>

      {/* ── Sidebar ── */}
      <div style={{ background: '#060a10', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Registration toggle — always visible */}
        <div style={{
          margin: '12px 12px 4px',
          padding: '12px 14px',
          borderRadius: '8px',
          border: `1px solid ${cfg.registrationOpen ? '#76B900' : '#374151'}`,
          background: cfg.registrationOpen ? 'rgba(118,185,0,0.08)' : 'rgba(255,255,255,0.02)',
          transition: 'border-color .2s, background .2s',
        }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', margin: '0 0 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Formulario
          </p>
          <button
            onClick={() => set('registrationOpen', !cfg.registrationOpen)}
            style={{
              width: '100%', padding: '8px 12px',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.06em',
              background: cfg.registrationOpen ? '#76B900' : '#1f2937',
              color: cfg.registrationOpen ? '#000' : '#6b7280',
              transition: 'background .2s, color .2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>{cfg.registrationOpen ? '🟢' : '🔴'}</span>
            {cfg.registrationOpen ? 'ABIERTO' : 'CERRADO'}
          </button>
        </div>

        <div style={{ flex: 1, paddingTop: '4px' }}>
          {CONFIG_SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)} style={sidebarBtnSt(section === s.id)}>
              <span style={{ fontSize: '0.9rem', width: '16px', textAlign: 'center' }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid #1f2937' }}>
          <button onClick={save} disabled={saving} style={{
            width: '100%', background: saving ? '#4a7400' : '#76B900',
            color: '#000', fontWeight: 800, padding: '10px',
            borderRadius: '6px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.88rem', transition: 'background .2s',
          }}>
            {saving ? 'Guardando...' : 'Guardar ahora'}
          </button>
          <p style={{ fontSize: '0.72rem', textAlign: 'center', margin: '6px 0 0', color: saved ? '#76B900' : '#374151', fontWeight: saved ? 600 : 400 }}>
            {saved ? '✓ Guardado' : 'Auto-guarda al editar'}
          </p>
          <a href="/concursos/el-gran-upgrade" target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', color: '#374151', fontSize: '0.76rem', textAlign: 'center', textDecoration: 'none', marginTop: '10px' }}>
            Ver página pública ↗
          </a>
        </div>
      </div>

      {/* ── Content panel ── */}
      <div style={{ padding: '28px 32px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* HERO */}
        {section === 'hero' && (<>
          <SectionTitle>Hero principal</SectionTitle>
          <TextField label="Título de la campaña" value={cfg.titulo} onChange={(v) => set('titulo', v)} placeholder="El Gran Upgrade" />

          {/* Font size slider */}
          <div>
            <label style={labelSt}>Tamaño del título</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="range" min="0.5" max="12" step="0.25"
                value={cfg.tituloVw ?? 7}
                onChange={(e) => set('tituloVw', parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#6366f1' }}
              />
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', minWidth: '48px', textAlign: 'right' }}>
                {cfg.tituloVw ?? 7}vw
              </span>
            </div>
            <p style={{ color: '#4b5563', fontSize: '0.72rem', margin: '4px 0 0' }}>
              Rango 0.5–12vw · actual: clamp(0.5rem, {cfg.tituloVw ?? 7}vw, 9rem)
            </p>
          </div>

          <RichTextEditor label="Subtítulo / descripción" value={cfg.subtitulo} onChange={(v) => set('subtitulo', v)} placeholder="Muéstranos tu PC y cuéntanos tu historia..." />
          <TextField label="Texto del badge superior" value={cfg.badge} onChange={(v) => set('badge', v)} placeholder="CONCURSO PATROCINADO POR..." />
          <ImageUploader label="Imagen de fondo del hero (opcional)" value={cfg.imagenHero} onChange={(v) => set('imagenHero', v)} />
        </>)}

        {/* FECHAS */}
        {section === 'fechas' && (<>
          <SectionTitle>Fechas clave</SectionTitle>
          <p style={{ color: '#6b7280', fontSize: '0.82rem', margin: 0 }}>Texto display — no afectan la lógica de apertura/cierre del formulario.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <TextField label="Apertura"    value={cfg.textoFechaApertura} onChange={(v) => set('textoFechaApertura', v)} placeholder="1 de junio, 2026" />
            <TextField label="Cierre"      value={cfg.textoFechaCierre}   onChange={(v) => set('textoFechaCierre', v)}   placeholder="7 de junio, 23:59" />
            <TextField label="Gran Final"  value={cfg.textoFechaFinal}    onChange={(v) => set('textoFechaFinal', v)}    placeholder="12 de junio, 2026" />
          </div>
          <SectionTitle>Texto del footer</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <TextField label='Prefijo "organizado por"' value={cfg.textoOrganizador} onChange={(v) => set('textoOrganizador', v)} placeholder="Concurso organizado por" />
            <TextField label='Etiqueta "Gran Final"'    value={cfg.textoGranFinal}   onChange={(v) => set('textoGranFinal', v)}   placeholder="Gran Final en vivo:" />
          </div>
        </>)}

        {/* PATROCINADORES */}
        {section === 'pats' && (<>
          <SectionTitle>Patrocinadores</SectionTitle>
          {cfg.patrocinadores.map((p, i) => (
            <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Patrocinador {i + 1}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 130px', gap: '12px' }}>
                <TextField label="Nombre" value={p.nombre} onChange={(v) => setNested('patrocinadores', i, 'nombre', v)} />
                <div>
                  <label style={labelSt}>Color de acento</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={p.color || '#ffffff'} onChange={(e) => setNested('patrocinadores', i, 'color', e.target.value)} style={{ width: '38px', height: '36px', borderRadius: '6px', border: '1px solid #374151', background: 'none', cursor: 'pointer', flexShrink: 0 }} />
                    <input value={p.color || ''} onChange={(e) => setNested('patrocinadores', i, 'color', e.target.value)} style={{ ...inputSt, flex: 1 }} />
                  </div>
                </div>
                <div>
                  <label style={labelSt}>Tamaño del logo</label>
                  <select
                    value={p.logoAltura || 52}
                    onChange={(e) => setNested('patrocinadores', i, 'logoAltura', Number(e.target.value))}
                    style={{ ...inputSt, cursor: 'pointer' }}
                  >
                    <option value={28} style={{ background: '#111' }}>Pequeño (28px)</option>
                    <option value={40} style={{ background: '#111' }}>Mediano (40px)</option>
                    <option value={52} style={{ background: '#111' }}>Grande (52px)</option>
                    <option value={68} style={{ background: '#111' }}>Extra grande (68px)</option>
                  </select>
                </div>
              </div>
              <ImageUploader label="Logo (PNG/SVG recomendado)" value={p.logoUrl} onChange={(v) => setNested('patrocinadores', i, 'logoUrl', v)} />
            </div>
          ))}
        </>)}

        {/* PASOS */}
        {section === 'pasos' && (<>
          <SectionTitle>Pasos — ¿Cómo participar?</SectionTitle>
          {cfg.pasos.map((paso, i) => (
            <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
                <TextField label="Número" value={paso.numero} onChange={(v) => setNested('pasos', i, 'numero', v)} placeholder="01" />
                <TextField label="Título del paso" value={paso.titulo} onChange={(v) => setNested('pasos', i, 'titulo', v)} placeholder="Inscríbete" />
              </div>
              <RichTextEditor label="Descripción" value={paso.descripcion} onChange={(v) => setNested('pasos', i, 'descripcion', v)} placeholder="Describe este paso..." />
            </div>
          ))}
        </>)}

        {/* PREMIOS */}
        {section === 'premios' && (<>
          <SectionTitle>Premios</SectionTitle>

          {/* Ancho del bloque */}
          <div>
            <label style={labelSt}>Ancho del bloque del premio (HUD)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="range" min="300" max="1400" step="20"
                value={cfg.premioCardWidth ?? 1080}
                onChange={(e) => set('premioCardWidth', parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#6366f1' }}
              />
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', minWidth: '52px', textAlign: 'right' }}>
                {cfg.premioCardWidth ?? 1080}px
              </span>
            </div>
          </div>

          {/* Posición horizontal */}
          <div>
            <label style={labelSt}>Posición horizontal del bloque</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="range" min="-40" max="40" step="2"
                value={cfg.premioCardOffset ?? 0}
                onChange={(e) => set('premioCardOffset', parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#6366f1' }}
              />
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', minWidth: '52px', textAlign: 'right' }}>
                {cfg.premioCardOffset ?? 0}%
              </span>
            </div>
            <p style={{ color: '#4b5563', fontSize: '0.72rem', margin: '4px 0 0' }}>0 = centrado · negativo = izquierda · positivo = derecha</p>
          </div>

          {/* Altura del bloque */}
          <div>
            <label style={labelSt}>Altura del bloque del premio</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="range" min="100" max="1200" step="20"
                value={cfg.premioCardHeight ?? 400}
                onChange={(e) => set('premioCardHeight', parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#6366f1' }}
              />
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', minWidth: '52px', textAlign: 'right' }}>
                {cfg.premioCardHeight ?? 400}px
              </span>
            </div>
          </div>

          {/* Tamaño de imagen */}
          <div>
            <label style={labelSt}>Escala de la imagen del premio</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="range" min="0.5" max="16" step="0.5"
                value={cfg.premioImgScale ?? 2}
                onChange={(e) => set('premioImgScale', parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#6366f1' }}
              />
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', minWidth: '40px', textAlign: 'right' }}>
                ×{(cfg.premioImgScale ?? 2).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Ancho del HUD */}
          <div>
            <label style={labelSt}>Ancho del HUD (crosshairs)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="range" min="200" max="1600" step="20"
                value={cfg.premioHudWidth ?? 1080}
                onChange={(e) => set('premioHudWidth', parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#6366f1' }}
              />
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', minWidth: '52px', textAlign: 'right' }}>
                {cfg.premioHudWidth ?? 1080}px
              </span>
            </div>
          </div>

          {/* Altura del HUD */}
          <div>
            <label style={labelSt}>Altura del HUD (crosshairs)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="range" min="100" max="1400" step="20"
                value={cfg.premioHudHeight ?? 600}
                onChange={(e) => set('premioHudHeight', parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#6366f1' }}
              />
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', minWidth: '52px', textAlign: 'right' }}>
                {cfg.premioHudHeight ?? 600}px
              </span>
            </div>
          </div>

          {/* Tamaño de brazos HUD */}
          <div>
            <label style={labelSt}>Tamaño de brazos del HUD (crosshairs)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <input
                type="range" min="6" max="40" step="1"
                value={cfg.premioHudSize ?? 16}
                onChange={(e) => set('premioHudSize', parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#6366f1' }}
              />
              <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', minWidth: '40px', textAlign: 'right' }}>
                {cfg.premioHudSize ?? 16}px
              </span>
            </div>
          </div>

          {/* Posición HUD */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelSt}>Posición HUD — horizontal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="range" min="-300" max="300" step="10"
                  value={cfg.premioHudOffsetX ?? 0}
                  onChange={(e) => set('premioHudOffsetX', parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: '#6366f1' }} />
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', minWidth: '52px', textAlign: 'right' }}>
                  {cfg.premioHudOffsetX ?? 0}px
                </span>
              </div>
            </div>
            <div>
              <label style={labelSt}>Posición HUD — vertical</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="range" min="-300" max="300" step="10"
                  value={cfg.premioHudOffsetY ?? 0}
                  onChange={(e) => set('premioHudOffsetY', parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: '#6366f1' }} />
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', minWidth: '52px', textAlign: 'right' }}>
                  {cfg.premioHudOffsetY ?? 0}px
                </span>
              </div>
            </div>
          </div>

          {cfg.premios.map((premio, i) => (
            <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px', gap: '12px' }}>
                <TextField label="Posición" value={premio.posicion} onChange={(v) => setNested('premios', i, 'posicion', v)} placeholder="1er lugar" />
                <TextField label="Descripción" value={premio.descripcion} onChange={(v) => setNested('premios', i, 'descripcion', v)} placeholder="NVIDIA RTX..." />
                <div>
                  <label style={labelSt}>Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={premio.color || '#76B900'} onChange={(e) => setNested('premios', i, 'color', e.target.value)} style={{ width: '38px', height: '36px', borderRadius: '6px', border: '1px solid #374151', background: 'none', cursor: 'pointer' }} />
                    <input value={premio.color || ''} onChange={(e) => setNested('premios', i, 'color', e.target.value)} style={{ ...inputSt, flex: 1 }} />
                  </div>
                </div>
              </div>
              {/* Multi-image slideshow */}
              <div>
                <label style={labelSt}>Imágenes del producto — slideshow si hay más de 1</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => {
                    const imgs = premio.imagenesUrl?.length ? premio.imagenesUrl : premio.imagenUrl ? [premio.imagenUrl] : [''];
                    return imgs.map((url, j) => (
                      <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <ImageUploader
                            label={`Imagen ${j + 1}`}
                            value={url}
                            onChange={(v) => {
                              const next = [...imgs]; next[j] = v;
                              setNested('premios', i, 'imagenesUrl', next);
                              if (j === 0) setNested('premios', i, 'imagenUrl', v);
                            }}
                          />
                        </div>
                        {imgs.length > 1 && (
                          <button
                            onClick={() => setNested('premios', i, 'imagenesUrl', imgs.filter((_, k) => k !== j))}
                            style={{ flexShrink: 0, marginTop: '22px', background: '#7f1d1d', border: 'none', color: '#fff', borderRadius: '6px', padding: '7px 11px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                          >✕</button>
                        )}
                      </div>
                    ));
                  })()}
                  <button
                    onClick={() => {
                      const imgs = premio.imagenesUrl?.length ? premio.imagenesUrl : premio.imagenUrl ? [premio.imagenUrl] : [];
                      setNested('premios', i, 'imagenesUrl', [...imgs, '']);
                    }}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #374151', color: '#9ca3af', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, alignSelf: 'flex-start' }}
                  >+ Agregar imagen</button>
                </div>
              </div>
            </div>
          ))}
        </>)}

        {/* MÚSICA AMBIENTE */}
        {section === 'audio' && (<>
          <SectionTitle>Música de ambiente</SectionTitle>
          <AudioUploader
            label="Archivo MP3 (autoplay, volumen bajito)"
            value={cfg.ambientAudioUrl || ''}
            onChange={(v) => set('ambientAudioUrl', v)}
          />
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '10px' }}>
            La música se reproducirá automáticamente al cargar la página, en loop infinito, con volumen reducido.
          </p>
        </>)}

        {/* FONDO NVIDIA */}
        {section === 'techbg' && (<>
          <SectionTitle>Fondo de texto técnico NVIDIA</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #1f2937' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e5e7eb' }}>Mostrar fondo de términos</div>
              <div style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: '2px' }}>Palabras DLSS, RTX, CUDA… en el fondo de la página</div>
            </div>
            <button
              onClick={() => set('techBgEnabled', !(cfg.techBgEnabled !== false))}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: cfg.techBgEnabled !== false ? '#76B900' : '#374151',
                position: 'relative', flexShrink: 0, transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                left: cfg.techBgEnabled !== false ? '23px' : '3px',
              }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e5e7eb' }}>Opacidad global</span>
              <span style={{ fontSize: '0.82rem', color: '#76B900', fontWeight: 700, fontFamily: 'monospace' }}>
                {Math.round((cfg.techBgOpacity ?? 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range" min="0" max="1" step="0.05"
              value={cfg.techBgOpacity ?? 1.0}
              onChange={(e) => set('techBgOpacity', parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#76B900' }}
            />
            <div style={{ fontSize: '0.74rem', color: '#4b5563' }}>
              0% = invisible · 100% = máxima intensidad (recomendado 60–80%)
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e5e7eb' }}>Términos mostrados</span>
              <span style={{ fontSize: '0.72rem', color: '#4b5563' }}>{(cfg.techBgTerms || DEFAULT_TECH_TERMS).length} términos</span>
            </div>
            <textarea
              value={(cfg.techBgTerms || DEFAULT_TECH_TERMS).join('\n')}
              onChange={(e) => set('techBgTerms', e.target.value.split('\n').map((t) => t.trim()).filter(Boolean))}
              rows={10}
              style={{ width: '100%', background: '#0d1117', color: '#e5e7eb', border: '1px solid #374151', borderRadius: '6px', padding: '10px', fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Un término por línea..."
            />
            <div style={{ fontSize: '0.74rem', color: '#4b5563' }}>Un término por línea. Puedes usar mayúsculas, espacios y números.</div>
          </div>
        </>)}

        {/* FORMULARIO + CAMPOS */}
        {section === 'form' && (<>
          <SectionTitle>Textos del formulario</SectionTitle>
          <TextField label="Título del formulario" value={cfg.tituloFormulario} onChange={(v) => set('tituloFormulario', v)} placeholder="Formulario de inscripción" />
          <RichTextEditor label="Instrucciones / subtítulo" value={cfg.instruccionesFormulario} onChange={(v) => set('instruccionesFormulario', v)} placeholder="Completa todos los campos..." />
          <SectionTitle style={{ marginTop: 8 }}>Campo de historia</SectionTitle>
          <TextField label="Label del campo" value={cfg.labelHistoria} onChange={(v) => set('labelHistoria', v)} placeholder="¿Por qué mereces el Gran Upgrade?" />
          <TextField label="Placeholder del textarea" value={cfg.placeholderHistoria} onChange={(v) => set('placeholderHistoria', v)} multiline placeholder="Comparte tu historia..." />
          <div>
            <label style={labelSt}>Máximo de palabras</label>
            <input type="number" min={10} max={500} value={cfg.maxPalabrasHistoria} onChange={(e) => set('maxPalabrasHistoria', Number(e.target.value))} style={{ ...inputSt, width: '120px' }} />
          </div>
          <SectionTitle style={{ marginTop: 8 }}>Términos y marketing</SectionTitle>
          <TextField label="Texto del checkbox de TyC" value={cfg.textoTyC} onChange={(v) => set('textoTyC', v)} placeholder="Acepto los Términos y Condiciones..." />
          <RichTextEditor
            label="Contenido del modal de TyC (se abre al hacer clic en el enlace)"
            value={cfg.contenidoTyC}
            onChange={(v) => set('contenidoTyC', v)}
            placeholder="Escribe aquí los Términos y Condiciones del concurso..."
          />
          <TextField label="Texto del checkbox de marketing" value={cfg.textoMarketing} onChange={(v) => set('textoMarketing', v)} multiline placeholder="Acepto recibir comunicaciones..." />

          {/* ── Campos del formulario ── */}
          <div style={{ borderTop: '2px solid #1f2937', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <SectionTitle>Campos del formulario</SectionTitle>
            <p style={{ color: '#6b7280', fontSize: '0.82rem', margin: 0 }}>
              Los campos <strong style={{ color: '#9ca3af' }}>SISTEMA</strong> son fijos y no pueden eliminarse.
            </p>
            <ContestFormBuilder campos={cfg.campos || []} onChange={(campos) => set('campos', campos)} />
            <div style={{ paddingTop: '12px', borderTop: '1px solid #1f2937' }}>
              <a href="/concursos/el-gran-upgrade/inscripcion?preview=1" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(250,204,21,0.08)', border: '1px solid #ca8a04', color: '#fbbf24', padding: '7px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700 }}>
                Vista previa del formulario ↗
              </a>
            </div>
          </div>
        </>)}

      </div>
    </div>
  );
}

function SectionTitle({ children, style }) {
  return <h3 style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '0.95rem', margin: 0, paddingBottom: '10px', borderBottom: '1px solid #1f2937', ...style }}>{children}</h3>;
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function ContestAdmin() {
  const [tab, setTab] = useState('config');

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
        {[['config', 'Configuración'], ['registros', 'Registros']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #76B900' : '2px solid transparent', color: tab === key ? '#76B900' : '#6b7280', padding: '12px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', transition: 'color .15s', marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: tab === 'config' ? '20px' : '24px' }}>
        {tab === 'config'    && <TabConfiguracion />}
        {tab === 'registros' && <TabRegistros />}
      </div>
    </div>
  );
}

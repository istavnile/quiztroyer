import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../lib/api';
import QuestionForm from '../../components/admin/QuestionForm';
import SlidePreview from '../../components/admin/SlidePreview';

const TYPE_LABELS = {
  QUIZ:      { label: 'Quiz',   icon: '🔘', color: 'bg-blue-500/20 text-blue-400' },
  TRUEFALSE: { label: 'V/F',    icon: '✅', color: 'bg-green-500/20 text-green-400' },
  PUZZLE:    { label: 'Puzzle', icon: '🧩', color: 'bg-yellow-500/20 text-yellow-400' },
  PINIMAGE:  { label: 'Pin',    icon: '📍', color: 'bg-red-500/20 text-red-400' },
};

/* ── Compact slide item for sidebar ── */
function SortableQuestion({ q, onEdit, onDelete, isEditing }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto' };
  const meta = TYPE_LABELS[q.type] || TYPE_LABELS.QUIZ;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit(q)}
      className={`glass rounded-lg p-2.5 flex items-start gap-2 group cursor-pointer transition-all
        ${isDragging ? 'shadow-xl ring-2 ring-indigo-500' : ''}
        ${isEditing ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : 'hover:bg-white/5'}
      `}
    >
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing pt-0.5 shrink-0"
        title="Arrastrar para reordenar"
      >
        ⠿
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-slate-500 text-xs font-bold shrink-0">{q.order + 1}</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${meta.color}`}>
            {meta.icon}
          </span>
          <span className="text-slate-500 text-xs ml-auto shrink-0">{q.timeLimit}s</span>
        </div>
        <p className="text-white text-xs leading-snug line-clamp-2">
          {q.prompt || <em className="text-slate-500 not-italic">Sin enunciado</em>}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(q.id); }}
        className="text-slate-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5"
      >
        ✕
      </button>
    </div>
  );
}

/* ── Branding preview miniature ── */
function BrandingPreview({ branding }) {
  const hh = Math.max(24, Math.min((branding.headerHeight || 80) * 0.35, 56));
  const fh = Math.max(18, Math.min((branding.footerHeight || 56) * 0.35, 40));

  const HeaderContent = () => {
    if (branding.headerImage) {
      return <img src={branding.headerImage} referrerPolicy="no-referrer" alt=""
        className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />;
    }
    const logoImg = branding.logoUrl && (
      <img src={branding.logoUrl} referrerPolicy="no-referrer" alt=""
        style={{ height: `${hh * 0.65}px` }} className="object-contain shrink-0"
        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
    );
    const logoRight = branding.logoPosition === 'right';
    return (
      <div className="flex items-center gap-2 px-3 h-full" style={{ background: branding.primaryColor || '#6366f1' }}>
        {!logoRight && logoImg}
        <span className="text-white font-black text-xs uppercase tracking-wide truncate flex-1">
          {branding.headerText || <span className="text-white/30 italic font-normal">Banner vacío</span>}
        </span>
        {logoRight && logoImg}
      </div>
    );
  };

  const FooterContent = () => {
    const fc = branding.footerColor || branding.primaryColor || '#6366f1';
    if (branding.footerImage) {
      return <img src={branding.footerImage} referrerPolicy="no-referrer" alt=""
        className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />;
    }
    return (
      <div className="flex items-center justify-center px-3 w-full h-full" style={{ background: fc }}>
        <span className="text-white/80 text-xs truncate">
          {branding.footerText || <span className="text-white/30 italic">Banner inferior vacío</span>}
        </span>
      </div>
    );
  };

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Preview en vivo</p>
      <div className="rounded-xl overflow-hidden border border-slate-700">
        <div style={{ height: `${hh}px` }} className="w-full overflow-hidden"><HeaderContent /></div>
        <div className="flex items-center justify-center py-3" style={{ background: branding.bgColor || '#0f172a' }}>
          <span className="text-white/20 text-xs">contenido del juego</span>
        </div>
        <div style={{ height: `${fh}px` }} className="w-full overflow-hidden"><FooterContent /></div>
      </div>
    </div>
  );
}

function PosSlider({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-20 shrink-0">{label} <span className="text-slate-400">{value}%</span></span>
      <input type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 accent-indigo-500" />
    </div>
  );
}

/* ── Banner config section ── */
function BannerSection({ title, prefix, branding, setBranding, defaultHeight }) {
  const [uploading, setUploading] = useState(false);
  const imageKey  = `${prefix}Image`;
  const textKey   = `${prefix}Text`;
  const heightKey = `${prefix}Height`;
  const mode = branding[imageKey] ? 'image' : 'text';

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/admin/upload-image', fd);
      const url = (import.meta.env.VITE_API_URL || '') + res.data.url;
      setBranding((b) => ({ ...b, [imageKey]: url }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border border-slate-700 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{title}</p>
        <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
          <button type="button"
            onClick={() => setBranding((b) => ({ ...b, [imageKey]: '' }))}
            className={`px-3 py-1 transition-all ${mode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >Texto</button>
          <button type="button"
            onClick={() => setBranding((b) => ({ ...b, [imageKey]: b[imageKey] || ' ' }))}
            className={`px-3 py-1 transition-all ${mode === 'image' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >Imagen</button>
        </div>
      </div>

      {mode === 'text' ? (
        <div className="space-y-2">
          <input type="text" value={branding[textKey] || ''}
            onChange={(e) => setBranding((b) => ({ ...b, [textKey]: e.target.value }))}
            placeholder={prefix === 'header' ? 'Nombre del evento' : 'Powered by Quiztroyer'}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          {prefix === 'header' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" value={branding.logoUrl || ''}
                  onChange={(e) => setBranding((b) => ({ ...b, logoUrl: e.target.value }))}
                  placeholder="URL del logo (opcional)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <label className="shrink-0 cursor-pointer bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-2 py-1.5 rounded-lg transition-all flex items-center gap-1">
                  📁 Subir
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files[0]; if (!file) return;
                    setUploading(true);
                    try {
                      const fd = new FormData(); fd.append('image', file);
                      const res = await api.post('/admin/upload-image', fd);
                      const url = (import.meta.env.VITE_API_URL || '') + res.data.url;
                      setBranding((b) => ({ ...b, logoUrl: url }));
                    } finally { setUploading(false); }
                  }} />
                </label>
              </div>
              {branding.logoUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 shrink-0">Posición logo</span>
                  <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
                    <button type="button"
                      onClick={() => setBranding((b) => ({ ...b, logoPosition: 'left' }))}
                      className={`px-3 py-1 transition-all ${(branding.logoPosition || 'left') === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                      ← Izquierda
                    </button>
                    <button type="button"
                      onClick={() => setBranding((b) => ({ ...b, logoPosition: 'right' }))}
                      className={`px-3 py-1 transition-all ${branding.logoPosition === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                      Derecha →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <ColorField
            label="Color del banner"
            value={prefix === 'header' ? (branding.primaryColor || '#6366f1') : (branding.footerColor || branding.primaryColor || '#6366f1')}
            onChange={(v) => setBranding((b) => ({ ...b, [prefix === 'header' ? 'primaryColor' : 'footerColor']: v }))}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <input type="text" value={branding[imageKey]?.trim() || ''}
            onChange={(e) => setBranding((b) => ({ ...b, [imageKey]: e.target.value }))}
            placeholder={`URL — 1920×${prefix === 'header' ? '160' : '100'}px recomendado`}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          <label className="flex items-center gap-2 cursor-pointer text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            📁 {uploading ? 'Subiendo...' : 'Subir imagen'}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          {branding[imageKey]?.trim() && (
            <div className="space-y-1.5 pt-1">
              <PosSlider label="Horizontal" value={branding[`${prefix}ImagePosX`] ?? 50}
                onChange={(v) => setBranding((b) => ({ ...b, [`${prefix}ImagePosX`]: v }))} />
              <PosSlider label="Vertical"   value={branding[`${prefix}ImagePosY`] ?? 50}
                onChange={(v) => setBranding((b) => ({ ...b, [`${prefix}ImagePosY`]: v }))} />
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs text-slate-500 mb-1">
          Altura — <span className="text-white">{branding[heightKey] || defaultHeight}px</span>
        </label>
        <input type="range" min={32} max={200} step={4}
          value={branding[heightKey] || defaultHeight}
          onChange={(e) => setBranding((b) => ({ ...b, [heightKey]: parseInt(e.target.value) }))}
          className="w-full accent-indigo-500" />
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 shrink-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
    </div>
  );
}

export default function ChallengeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [challenge, setChallenge]       = useState(null);
  const [questions, setQuestions]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [livePreviewForm, setLivePreviewForm] = useState(null);
  const [showAddType, setShowAddType]   = useState(false);
  const [saving, setSaving]             = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [branding, setBranding]         = useState({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [generalForm, setGeneralForm]   = useState({ name: '', slug: '', pin: '' });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    api.get(`/admin/challenges/${id}`).then((res) => {
      setChallenge(res.data);
      const qs = (res.data.questions || []).map((q) => ({
        ...q,
        slideImage:       q.config?._slideImage       || '',
        slideBackground:  q.config?._slideBackground  || null,
      }));
      setQuestions(qs);
      setBranding(res.data.branding || {});
      setGeneralForm({ name: res.data.name, slug: res.data.slug, pin: res.data.pin });
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { setLivePreviewForm(editingQuestion); }, [editingQuestion]);

  async function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    const newOrder = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({ ...q, order: i }));
    setQuestions(newOrder);
    await api.put(`/admin/challenges/${id}/questions/reorder`, {
      order: newOrder.map((q) => ({ id: q.id, order: q.order })),
    });
  }

  async function handleAddQuestion(type) {
    setShowAddType(false);
    const defaultConfig = {
      QUIZ:      { options: [{ id: 'a', text: '', isCorrect: true }, { id: 'b', text: '', isCorrect: false }] },
      TRUEFALSE: { correctAnswer: true },
      PUZZLE:    { items: ['Primero', 'Segundo', 'Tercero'] },
      PINIMAGE:  { imageUrl: '', correctX: 50, correctY: 50, radius: 8 },
    };
    const res = await api.post(`/admin/challenges/${id}/questions`, {
      type, prompt: '', timeLimit: 30, config: defaultConfig[type],
    });
    const q = res.data;
    setQuestions((prev) => [...prev, q]);
    setEditingQuestion(q);
  }

  async function handleSaveQuestion(updated) {
    setSaving(true);
    try {
      const payload = {
        ...updated,
        slideImage:       updated.slideImage      ?? updated.config?._slideImage      ?? '',
        slideBackground:  updated.slideBackground ?? updated.config?._slideBackground ?? null,
      };
      const res = await api.put(`/admin/questions/${updated.id}`, payload);
      const merged = {
        ...res.data,
        slideImage:      res.data.config?._slideImage      || '',
        slideBackground: res.data.config?._slideBackground || null,
      };
      setQuestions((prev) => prev.map((q) => (q.id === merged.id ? merged : q)));
      setEditingQuestion(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuestion(qid) {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    await api.delete(`/admin/questions/${qid}`);
    setQuestions((prev) => prev.filter((q) => q.id !== qid));
    if (editingQuestion?.id === qid) setEditingQuestion(null);
  }

  async function handleSaveGeneral(e) {
    e.preventDefault();
    setSaving(true);
    try { await api.put(`/admin/challenges/${id}`, { ...generalForm, branding }); }
    finally { setSaving(false); }
  }

  async function handleSaveBranding() {
    setSaving(true);
    try {
      await api.put(`/admin/challenges/${id}`, { ...generalForm, branding });
      setBrandingOpen(false);
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">

      {/* ── Top bar ── */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-white transition-colors">
            ← Admin
          </button>
          <span className="text-slate-600">|</span>
          <h1 className="text-white font-bold truncate max-w-xs">{challenge?.name}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/challenges/${id}/live`)}
            className="bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
          >
            🎮 Control Live
          </button>
          <a href={`/join/${challenge?.slug}`} target="_blank" rel="noreferrer"
            className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
          >
            👁 Preview
          </a>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">

        {/* ── SLIDES SIDEBAR (desktop: left column, mobile: full row at top) ── */}
        <div className="w-full lg:w-52 lg:shrink-0 lg:sticky lg:top-24 flex flex-col gap-3 lg:max-h-[calc(100vh-7rem)] z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-sm">📋 Slides <span className="text-slate-500 font-normal">({questions.length})</span></h2>
            <div className="relative">
              <button
                onClick={() => setShowAddType(!showAddType)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all"
              >
                + Agregar
              </button>
              <AnimatePresence>
                {showAddType && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute left-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-1.5 flex flex-col gap-0.5 w-44 z-50 shadow-xl"
                  >
                    {Object.entries(TYPE_LABELS).map(([type, meta]) => (
                      <button key={type} onClick={() => handleAddQuestion(type)}
                        className="text-left px-3 py-2 rounded-lg hover:bg-slate-700 text-white text-sm transition-all"
                      >
                        {meta.icon} {meta.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Slides list — scrollable */}
          <div className="flex-1 overflow-y-auto space-y-1.5 px-0.5 pt-0.5 pb-2">
            {questions.length === 0 ? (
              <div className="text-center py-6 text-slate-600 text-xs">
                <p className="text-2xl mb-1">📝</p>
                <p>Sin slides aún</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                  {questions.map((q) => (
                    <SortableQuestion
                      key={q.id}
                      q={q}
                      onEdit={setEditingQuestion}
                      onDelete={handleDeleteQuestion}
                      isEditing={editingQuestion?.id === q.id}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* ── CENTER + RIGHT: Config / Preview / Form ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* General settings — compact single row */}
          <section className="glass rounded-2xl p-4">
            <form onSubmit={handleSaveGeneral}>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs text-slate-400 mb-1">Nombre</label>
                  <input type="text" value={generalForm.name}
                    onChange={(e) => setGeneralForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-slate-400 mb-1">Slug</label>
                  <input type="text" value={generalForm.slug}
                    onChange={(e) => setGeneralForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-slate-400 mb-1">PIN</label>
                  <input type="text" value={generalForm.pin}
                    onChange={(e) => setGeneralForm((f) => ({ ...f, pin: e.target.value }))}
                    maxLength={8}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setBrandingOpen(true)}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-3 py-2 rounded-xl transition-all whitespace-nowrap"
                  >
                    🎨 Branding
                  </button>
                  <button type="submit" disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold px-3 py-2 rounded-xl transition-all whitespace-nowrap"
                  >
                    {saving ? '…' : '💾 Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Preview + Form
              Desktop: [preview 280px sticky] | [form flex-1]
              Mobile:  preview compact on top, form below           */}
          <AnimatePresence mode="wait">
            {editingQuestion ? (
              <motion.div
                key={editingQuestion.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {/* Preview — full width, capped so it doesn't grow too tall */}
                <div className="w-full">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">👁 Preview</p>
                  <SlidePreview question={livePreviewForm || editingQuestion} branding={branding} compact maxScale={1.8} />
                </div>

                {/* Form */}
                <div className="w-full">
                  <QuestionForm
                    question={editingQuestion}
                    onSave={handleSaveQuestion}
                    onCancel={() => setEditingQuestion(null)}
                    saving={saving}
                    challengeId={id}
                    onFormChange={setLivePreviewForm}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-8 text-center text-slate-500"
              >
                <p className="text-4xl mb-3">✏️</p>
                <p>Selecciona un slide de la izquierda para editarlo</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Branding drawer ── */}
      <AnimatePresence>
        {brandingOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setBrandingOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
                <h2 className="text-white font-bold">🎨 Branding</h2>
                <button onClick={() => setBrandingOpen(false)} className="text-slate-400 hover:text-white text-lg leading-none">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <BrandingPreview branding={branding} />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Fondo del juego</p>
                  <ColorField label="Color de fondo" value={branding.bgColor || '#0f172a'}
                    onChange={(v) => setBranding((b) => ({ ...b, bgColor: v }))} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Logo</p>
                  <div className="flex items-center gap-2">
                    {branding.logoUrl && (
                      <img src={branding.logoUrl} referrerPolicy="no-referrer" alt="logo"
                        className="h-10 object-contain rounded border border-slate-700 bg-slate-800 px-1 shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                    <input type="text" value={branding.logoUrl || ''}
                      onChange={(e) => setBranding((b) => ({ ...b, logoUrl: e.target.value }))}
                      placeholder="https://tu-logo.com/logo.png"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <label className="shrink-0 cursor-pointer bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap">
                      {uploadingLogo ? '...' : '📁 Subir'}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo} onChange={async (e) => {
                        const file = e.target.files[0]; if (!file) return;
                        setUploadingLogo(true);
                        try {
                          const fd = new FormData(); fd.append('image', file);
                          const res = await api.post('/admin/upload-image', fd);
                          const url = (import.meta.env.VITE_API_URL || '') + res.data.url;
                          setBranding((b) => ({ ...b, logoUrl: url }));
                        } finally { setUploadingLogo(false); }
                      }} />
                    </label>
                  </div>
                </div>
                <BannerSection title="Banner Superior" prefix="header" branding={branding} setBranding={setBranding} defaultHeight={80} />
                <BannerSection title="Banner Inferior" prefix="footer" branding={branding} setBranding={setBranding} defaultHeight={56} />
              </div>

              <div className="shrink-0 px-5 py-4 border-t border-slate-700">
                <button onClick={handleSaveBranding} disabled={saving}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-all"
                >
                  {saving ? 'Guardando...' : '💾 Guardar branding'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { GRADIENT_PRESETS } from '../../lib/slideThemes';
import { UilCircle, UilCheck, UilApps, UilMapPin, UilImage, UilUpload, UilPalette, UilSave } from '@iconscout/react-unicons';

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

const TYPE_LABELS = {
  QUIZ:      <span className="flex items-center gap-1.5"><UilCircle size={14} />Quiz (Opción Múltiple)</span>,
  TRUEFALSE: <span className="flex items-center gap-1.5"><UilCheck size={14} />Verdadero / Falso</span>,
  PUZZLE:    <span className="flex items-center gap-1.5"><UilApps size={14} />Puzzle (Orden)</span>,
  PINIMAGE:  <span className="flex items-center gap-1.5"><UilMapPin size={14} />Pin on Image</span>,
};

export default function QuestionForm({ question, onSave, onCancel, saving, onFormChange }) {
  const [form, setForm] = useState({ ...question });
  const [uploading, setUploading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [showSlideImage, setShowSlideImage] = useState(false);
  const [showSlideBg, setShowSlideBg] = useState(false);
  const [bgTab, setBgTab] = useState(() => {
    const sb = question.slideBackground;
    if (!sb) return 'color';
    return sb.type || 'color';
  });

  useEffect(() => {
    setForm({ ...question });
    const sb = question.slideBackground;
    setBgTab(sb?.type || 'color');
  }, [question.id]);

  useEffect(() => { onFormChange?.(form); }, [form]); // eslint-disable-line

  /* ── helpers ── */
  function updateConfig(key, value) {
    setForm((f) => ({ ...f, config: { ...f.config, [key]: value } }));
  }
  function updateBg(patch) {
    setForm((f) => ({ ...f, slideBackground: { ...(f.slideBackground || {}), ...patch } }));
  }

  /* ── QUIZ options ── */
  function addOption() {
    const opts = form.config.options || [];
    const ids = 'abcdefghij';
    setForm((f) => ({
      ...f,
      config: { ...f.config, options: [...opts, { id: ids[opts.length] || `o${opts.length}`, text: '', isCorrect: false }] },
    }));
  }
  function removeOption(idx) {
    const opts = [...(form.config.options || [])];
    opts.splice(idx, 1);
    setForm((f) => ({ ...f, config: { ...f.config, options: opts } }));
  }
  function updateOption(idx, key, value) {
    const opts = [...(form.config.options || [])];
    opts[idx] = { ...opts[idx], [key]: value };
    if (key === 'isCorrect' && value) opts.forEach((o, i) => { if (i !== idx) o.isCorrect = false; });
    setForm((f) => ({ ...f, config: { ...f.config, options: opts } }));
  }

  /* ── PUZZLE items ── */
  function addItem() { updateConfig('items', [...(form.config.items || []), '']); }
  function removeItem(idx) { const it = [...(form.config.items || [])]; it.splice(idx, 1); updateConfig('items', it); }
  function updateItem(idx, v) { const it = [...(form.config.items || [])]; it[idx] = v; updateConfig('items', it); }

  /* ── uploads ── */
  async function handleImageUpload(e, target) {
    const file = e.target.files[0];
    if (!file) return;
    const setter = target === 'bg' ? setUploadingBg : setUploading;
    setter(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/admin/upload-image', fd);
      const url = (import.meta.env.VITE_API_URL || '') + res.data.url;
      if (target === 'slideImage') setForm((f) => ({ ...f, slideImage: url }));
      else if (target === 'bg')    updateBg({ imageUrl: url });
      else updateConfig('imageUrl', url); // PIN on Image
    } finally {
      setter(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...form, slideBackground: form.slideBackground });
  }

  const bg = form.slideBackground || {};
  const slideImageUrl = form.slideImage || '';

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <span className="text-xs font-bold text-indigo-400">{TYPE_LABELS[form.type]}</span>
        <button onClick={onCancel} className="text-slate-500 hover:text-white text-sm leading-none">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 space-y-4">

        {/* ── Enunciado ── */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Enunciado <span className="text-slate-600">({form.prompt?.length || 0}/{form.maxChars || 200})</span>
          </label>
          <textarea
            value={form.prompt}
            onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
            maxLength={form.maxChars || 200}
            rows={3}
            className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/40 focus:bg-white/[0.09] transition-all placeholder-slate-500"
            placeholder="¿Cuál es la pregunta?"
          />
        </div>

        {/* ── Tiempo / Chars ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tiempo (seg)</label>
            <input type="number" min={5} max={120} value={form.timeLimit}
              onChange={(e) => setForm((f) => ({ ...f, timeLimit: parseInt(e.target.value) || 30 }))}
              className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/40 focus:bg-white/[0.09] transition-all" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Máx. chars</label>
            <input type="number" min={50} max={500} value={form.maxChars || 200}
              onChange={(e) => setForm((f) => ({ ...f, maxChars: parseInt(e.target.value) || 200 }))}
              className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/40 focus:bg-white/[0.09] transition-all" />
          </div>
        </div>

        {/* ── Imagen central del slide ── */}
        <div className="border border-white/[0.10] rounded-xl overflow-hidden bg-white/[0.03]">
          <button type="button"
            onClick={() => setShowSlideImage((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
          >
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center gap-1.5"><UilImage size={13} />Imagen del slide</span>
              {slideImageUrl && <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />}
            </span>
            <span className="text-slate-600 text-xs">{showSlideImage ? '▲' : '▼'}</span>
          </button>
          {showSlideImage && (
            <div className="px-3 pb-3 space-y-2 border-t border-white/[0.08]">
              <div className="pt-2">
                <input
                  type="text"
                  value={slideImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, slideImage: e.target.value }))}
                  placeholder="https://... (aparece sobre el enunciado)"
                  className="w-full bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:bg-white/[0.09] transition-all placeholder-slate-500"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">
                <span className="flex items-center gap-1.5"><UilUpload size={13} />{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'slideImage')} disabled={uploading} />
              </label>
              {slideImageUrl && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, slideImage: '' }))}
                  className="text-red-400 hover:text-red-300 text-xs">✕ Quitar imagen</button>
              )}
            </div>
          )}
        </div>

        {/* ── Fondo del slide ── */}
        <div className="border border-white/[0.10] rounded-xl overflow-hidden bg-white/[0.03]">
          <button type="button"
            onClick={() => setShowSlideBg((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
          >
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="flex items-center gap-1.5"><UilPalette size={13} />Fondo del slide</span>
              {bg.type && bg.type !== 'color' && <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />}
              {bg.type === 'color' && bg.color && bg.color !== '#0f172a' && <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />}
            </span>
            <span className="text-slate-600 text-xs">{showSlideBg ? '▲' : '▼'}</span>
          </button>
          {showSlideBg && (
          <div className="px-3 pb-3 pt-2 space-y-3 border-t border-white/[0.08]">
          {/* Tab selector */}
          <div className="flex rounded-lg overflow-hidden border border-white/[0.10] text-xs">
            {['color', 'gradient', 'image'].map((tab) => (
              <button key={tab} type="button"
                onClick={() => { setBgTab(tab); updateBg({ type: tab }); }}
                className={`flex-1 py-1.5 capitalize transition-all ${bgTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {tab === 'color' ? 'Color' : tab === 'gradient' ? 'Gradiente' : 'Imagen'}
              </button>
            ))}
          </div>

          {bgTab === 'color' && (
            <div className="flex items-center gap-2">
              <input type="color" value={bg.color || '#0f172a'}
                onChange={(e) => updateBg({ color: e.target.value, type: 'color' })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 shrink-0" />
              <input type="text" value={bg.color || '#0f172a'}
                onChange={(e) => updateBg({ color: e.target.value, type: 'color' })}
                className="flex-1 bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:bg-white/[0.09] transition-all" />
            </div>
          )}

          {bgTab === 'gradient' && (
            <div className="grid grid-cols-2 gap-1.5">
              {GRADIENT_PRESETS.map((g) => (
                <button key={g.id} type="button"
                  onClick={() => updateBg({ gradientId: g.id, type: 'gradient' })}
                  className={`rounded-lg px-2 py-2 text-left text-xs font-medium border transition-all flex items-center gap-2
                    ${bg.gradientId === g.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-700 hover:border-slate-500'}`}
                >
                  <div className="w-5 h-5 rounded shrink-0" style={{ background: g.value || '#334155' }} />
                  <span className="text-white truncate">{g.label}</span>
                </button>
              ))}
            </div>
          )}

          {bgTab === 'image' && (
            <div className="space-y-2">
              <input type="text" value={bg.imageUrl || ''}
                onChange={(e) => updateBg({ imageUrl: e.target.value, type: 'image' })}
                placeholder="https://... — recomendado: 1920×1080"
                className="w-full bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:bg-white/[0.09] transition-all placeholder-slate-500" />
              <label className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">
                <span className="flex items-center gap-1.5"><UilUpload size={13} />{uploadingBg ? 'Subiendo...' : 'Subir imagen de fondo'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bg')} disabled={uploadingBg} />
              </label>
              {bg.imageUrl && (
                <div className="space-y-1.5 pt-1">
                  <PosSlider label="Horizontal" value={bg.posX ?? 50} onChange={(v) => updateBg({ posX: v })} />
                  <PosSlider label="Vertical"   value={bg.posY ?? 50} onChange={(v) => updateBg({ posY: v })} />
                </div>
              )}
            </div>
          )}
          </div>
          )}
        </div>

        {/* ── Configuración específica por tipo ── */}

        {/* QUIZ */}
        {form.type === 'QUIZ' && (
          <div className="border border-white/[0.10] rounded-xl p-3 space-y-2 bg-white/[0.03]">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Opciones <span className="text-slate-600 font-normal">(selecciona la correcta)</span></p>
            {(form.config.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" checked={opt.isCorrect} onChange={() => updateOption(i, 'isCorrect', true)}
                  className="accent-green-400 w-4 h-4 cursor-pointer shrink-0" />
                <input type="text" value={opt.text} onChange={(e) => updateOption(i, 'text', e.target.value)}
                  placeholder={`Opción ${i + 1}`}
                  className="flex-1 bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:bg-white/[0.09] transition-all placeholder-slate-500" />
                {form.config.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                )}
              </div>
            ))}
            {(form.config.options || []).length < 4 && (
              <button type="button" onClick={addOption} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">+ Agregar opción</button>
            )}
          </div>
        )}

        {/* TRUE/FALSE */}
        {form.type === 'TRUEFALSE' && (
          <div className="border border-white/[0.10] rounded-xl p-3 bg-white/[0.03]">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Respuesta correcta</p>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button key={String(val)} type="button" onClick={() => updateConfig('correctAnswer', val)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all
                    ${form.config.correctAnswer === val
                      ? val ? 'bg-green-500/30 border-green-500 text-green-400' : 'bg-red-500/30 border-red-500 text-red-400'
                      : 'bg-white/[0.04] border-white/[0.10] text-slate-400 hover:border-white/[0.20]'}`}
                >
                  {val ? '✅ Verdadero' : '❌ Falso'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PUZZLE */}
        {form.type === 'PUZZLE' && (
          <div className="border border-white/[0.10] rounded-xl p-3 space-y-2 bg-white/[0.03]">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ítems en orden correcto</p>
            {(form.config.items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-600 text-xs font-bold w-4 shrink-0">{i + 1}</span>
                <input type="text" value={item} onChange={(e) => updateItem(i, e.target.value)}
                  placeholder={`Ítem ${i + 1}`}
                  className="flex-1 bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:bg-white/[0.09] transition-all placeholder-slate-500" />
                {form.config.items.length > 2 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-red-400 text-xs">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">+ Agregar ítem</button>
          </div>
        )}

        {/* PIN ON IMAGE */}
        {form.type === 'PINIMAGE' && (
          <div className="border border-white/[0.10] rounded-xl p-3 space-y-3 bg-white/[0.03]">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Imagen y zona correcta</p>
            <div className="flex gap-2">
              <input type="text" value={form.config.imageUrl || ''} onChange={(e) => updateConfig('imageUrl', e.target.value)}
                placeholder="https://... o subir" className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm" />
              <label className="shrink-0 text-xs text-indigo-400 cursor-pointer hover:text-indigo-300 flex items-center">
                <span className="flex items-center gap-1"><UilUpload size={13} />{uploading ? '...' : 'Subir'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'pinimage')} disabled={uploading} />
              </label>
            </div>
            {form.config.imageUrl ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Haz clic en la imagen para marcar la zona correcta</p>
                <div
                  className="relative rounded-lg overflow-hidden border border-white/[0.10] cursor-crosshair select-none"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    updateConfig('correctX', parseFloat(x.toFixed(1)));
                    updateConfig('correctY', parseFloat(y.toFixed(1)));
                  }}
                >
                  <img src={form.config.imageUrl} referrerPolicy="no-referrer" alt="map"
                    className="w-full object-contain pointer-events-none" draggable={false} />
                  {(form.config.correctX != null) && (
                    <div
                      className="absolute border-4 border-green-400 rounded-full pointer-events-none"
                      style={{
                        left: `${form.config.correctX}%`,
                        top: `${form.config.correctY}%`,
                        width: `${(form.config.radius || 8) * 2}%`,
                        height: `${(form.config.radius || 8) * 2}%`,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 0 2px rgba(0,0,0,0.5)',
                      }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-500 shrink-0">Radio zona: {form.config.radius || 8}%</label>
                  <input type="range" min={3} max={30} step={1}
                    value={form.config.radius || 8}
                    onChange={(e) => updateConfig('radius', parseInt(e.target.value))}
                    className="flex-1 accent-green-400" />
                </div>
                {form.config.correctX != null && (
                  <p className="text-xs text-slate-600">
                    Posición: X {form.config.correctX}% — Y {form.config.correctY}%
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-600 text-xs border border-dashed border-white/[0.10] rounded-lg">
                Sube una imagen para marcar la zona correcta
              </div>
            )}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-2 px-1 pt-3 pb-3 border-t border-white/[0.08] sticky bottom-0 bg-slate-950/80 backdrop-blur-xl">
          <button type="button" onClick={onCancel}
            className="flex-1 glass-btn text-white/70 hover:text-white text-sm font-medium py-2.5 rounded-xl border border-white/[0.10]">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 glass-btn-blue disabled:opacity-50 text-sm font-bold py-2.5 rounded-xl">
            {saving ? 'Guardando...' : <span className="flex items-center justify-center gap-1.5"><UilSave size={15} />Guardar</span>}
          </button>
        </div>
      </form>
    </div>
  );
}

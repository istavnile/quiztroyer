import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ContestLayout from './ContestLayout';
import {
  PROCESADOR_LABELS, GRAFICA_LABELS, FUENTE_LABELS,
  isRegistrationOpen,
} from '../../lib/contestConstants';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const FORM_DEFAULTS = {
  tituloFormulario: 'Formulario de inscripción',
  instruccionesFormulario: 'Completa todos los campos. Las inscripciones cierran el 7 de junio a las 23:59.',
  labelHistoria: '¿Por qué mereces el Gran Upgrade?',
  placeholderHistoria: 'Comparte tu historia, tu pasión por la tecnología y por qué tu setup necesita un upgrade...',
  maxPalabrasHistoria: 150,
  textoTyC: 'Acepto los Términos y Condiciones del concurso',
  urlTyC: '#tyc',
  textoMarketing: 'Acepto recibir comunicaciones comerciales de NVIDIA, ASUS y ComputerShop',
};

// ─── Zod schema ───────────────────────────────────────────────────────────────
function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const schema = z.object({
  nombre:           z.string().min(2, 'Nombre requerido'),
  email:            z.string().email('Email inválido'),
  telefono:         z.string().min(8, 'Teléfono inválido'),
  procesador:       z.string().min(1, 'Selecciona un procesador'),
  graficaActual:    z.string().min(1, 'Selecciona una gráfica'),
  fuentePoderWatts: z.string().min(1, 'Selecciona la fuente de poder'),
  historia: z.string()
    .min(20, 'La historia debe tener al menos 20 palabras')
    .refine((v) => countWords(v) <= (fs_.maxPalabrasHistoria || 150), { message: `Máximo ${fs_.maxPalabrasHistoria || 150} palabras` }),
  aceptaTyC:       z.boolean().refine((v) => v === true, { message: 'Debes aceptar los Términos y Condiciones' }),
  aceptaMarketing: z.boolean().optional(),
});

// ─── Componente de imagen drag-and-drop ───────────────────────────────────────
function ImageDropzone({ label, hint, file, onFile, error }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) onFile(f);
  }, [onFile]);

  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div>
      <label style={{ color: '#d1d5db', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`file-${label.replace(/\s/g, '')}`).click()}
        style={{
          border: `2px dashed ${error ? '#e61f30' : dragging ? '#76B900' : '#374151'}`,
          borderRadius: '8px', padding: '24px', textAlign: 'center',
          cursor: 'pointer', transition: 'border-color .2s',
          background: dragging ? 'rgba(118,185,0,0.05)' : 'rgba(255,255,255,0.02)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'cover', borderRadius: '4px' }} />
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.4 }}>📷</div>
            <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>
              Arrastra una imagen aquí o <span style={{ color: '#76B900' }}>haz clic para seleccionar</span>
            </p>
            {hint && <p style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '4px' }}>{hint}</p>}
          </>
        )}
        <input
          id={`file-${label.replace(/\s/g, '')}`}
          type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
        />
      </div>
      {error && <p style={{ color: '#e61f30', fontSize: '0.78rem', marginTop: '4px' }}>{error}</p>}
      {file && (
        <p style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '4px' }}>
          {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
        </p>
      )}
    </div>
  );
}

// ─── Componentes de campo reutilizables ───────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ color: '#d1d5db', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: '#e61f30', fontSize: '0.78rem', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #374151',
  borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
};

const focusStyle = { border: '1px solid #76B900' };

function Input({ register, name, placeholder, type = 'text', error }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...register(name)}
      type={type}
      placeholder={placeholder}
      style={{ ...inputStyle, ...(focused ? focusStyle : {}), ...(error ? { border: '1px solid #e61f30' } : {}) }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Select({ register, name, options, placeholder, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...register(name)}
      style={{ ...inputStyle, ...(focused ? focusStyle : {}), ...(error ? { border: '1px solid #e61f30' } : {}), cursor: 'pointer' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <option value="" style={{ background: '#1a1a1a' }}>{placeholder}</option>
      {Object.entries(options).map(([value, label]) => (
        <option key={value} value={value} style={{ background: '#1a1a1a' }}>{label}</option>
      ))}
    </select>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ContestForm() {
  const [fotoExterior, setFotoExterior] = useState(null);
  const [fotoInterior, setFotoInterior] = useState(null);
  const [fileErrors, setFileErrors] = useState({});
  const [submitState, setSubmitState] = useState('idle'); // idle | loading | success | error
  const [submitError, setSubmitError] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [fs_, setFs] = useState(FORM_DEFAULTS);

  const open = isRegistrationOpen();

  useEffect(() => {
    fetch(`${API}/api/contest/settings`)
      .then((r) => r.json())
      .then((data) => setFs({ ...FORM_DEFAULTS, ...data }))
      .catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { aceptaTyC: false, aceptaMarketing: false },
  });

  const historiaValue = watch('historia', '');
  React.useEffect(() => {
    setWordCount(historiaValue ? countWords(historiaValue) : 0);
  }, [historiaValue]);

  const validateFiles = () => {
    const errs = {};
    if (!fotoExterior) errs.fotoExterior = 'Requerida';
    if (!fotoInterior) errs.fotoInterior = 'Requerida';
    if (fotoExterior && fotoExterior.size > 5 * 1024 * 1024) errs.fotoExterior = 'Máximo 5 MB';
    if (fotoInterior && fotoInterior.size > 5 * 1024 * 1024) errs.fotoInterior = 'Máximo 5 MB';
    setFileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (data) => {
    if (!validateFiles()) return;
    setSubmitState('loading');
    setSubmitError('');

    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)));
    formData.append('fotoExterior', fotoExterior);
    formData.append('fotoInterior', fotoInterior);

    try {
      const res = await fetch(`${API}/api/contest/register`, { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al enviar');
      setSubmitState('success');
    } catch (err) {
      setSubmitState('error');
      setSubmitError(err.message);
    }
  };

  // ─── Estado cerrado ─────────────────────────────────────────────────────────
  if (!open) {
    return (
      <ContestLayout>
        <div style={{ textAlign: 'center', padding: '80px 16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>
            Inscripciones cerradas
          </h1>
          <p style={{ color: '#9ca3af' }}>
            El período de inscripción fue del 1 al 7 de junio de 2026.<br />
            Visita la página de <Link to="/concursos/el-gran-upgrade/votacion" style={{ color: '#76B900' }}>votación</Link> para apoyar a los finalistas.
          </p>
        </div>
      </ContestLayout>
    );
  }

  // ─── Estado éxito ───────────────────────────────────────────────────────────
  if (submitState === 'success') {
    return (
      <ContestLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '80px 16px', maxWidth: '520px', margin: '0 auto' }}
        >
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(118,185,0,0.15)', border: '2px solid #76B900',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.2rem', margin: '0 auto 24px',
          }}>✓</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#76B900', marginBottom: '12px' }}>
            ¡Inscripción recibida!
          </h1>
          <p style={{ color: '#9ca3af', lineHeight: 1.7 }}>
            Tu participación fue registrada exitosamente. Nuestro equipo revisará tu historia y setup.
            Si eres seleccionado finalista, tu perfil aparecerá en la galería de votación.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '16px' }}>
            Anuncio de finalistas: <strong style={{ color: '#fff' }}>8 de junio de 2026</strong>
          </p>
          <Link to="/concursos/el-gran-upgrade">
            <button style={{
              marginTop: '32px', background: '#76B900', color: '#000',
              fontWeight: 800, padding: '12px 32px', borderRadius: '6px',
              border: 'none', cursor: 'pointer', fontSize: '0.95rem',
            }}>
              Volver al inicio
            </button>
          </Link>
        </motion.div>
      </ContestLayout>
    );
  }

  // ─── Formulario ─────────────────────────────────────────────────────────────
  return (
    <ContestLayout>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '6px' }}>
            {fs_.tituloFormulario}
          </h1>
          <p style={{ color: '#9ca3af', marginBottom: '40px', fontSize: '0.95rem' }}>
            {fs_.instruccionesFormulario}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Sección: Datos personales */}
          <SectionTitle>Datos personales</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <Field label="Nombre completo *" error={errors.nombre?.message}>
              <Input register={register} name="nombre" placeholder="Tu nombre" error={errors.nombre} />
            </Field>
            <Field label="Correo electrónico *" error={errors.email?.message}>
              <Input register={register} name="email" type="email" placeholder="correo@ejemplo.com" error={errors.email} />
            </Field>
            <Field label="Teléfono *" error={errors.telefono?.message}>
              <Input register={register} name="telefono" placeholder="+502 0000-0000" error={errors.telefono} />
            </Field>
          </div>

          {/* Sección: Specs del PC */}
          <SectionTitle>Especificaciones de tu PC</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <Field label="Procesador *" error={errors.procesador?.message}>
              <Select register={register} name="procesador" options={PROCESADOR_LABELS} placeholder="Selecciona..." error={errors.procesador} />
            </Field>
            <Field label="Gráfica actual *" error={errors.graficaActual?.message}>
              <Select register={register} name="graficaActual" options={GRAFICA_LABELS} placeholder="Selecciona..." error={errors.graficaActual} />
            </Field>
            <Field label="Fuente de poder *" error={errors.fuentePoderWatts?.message}>
              <Select register={register} name="fuentePoderWatts" options={FUENTE_LABELS} placeholder="Selecciona..." error={errors.fuentePoderWatts} />
            </Field>
          </div>

          {/* Sección: Fotos */}
          <SectionTitle>Fotos de tu PC</SectionTitle>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '16px' }}>
            JPG, PNG o WEBP · Máximo 5 MB por foto
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <ImageDropzone
              label="Foto exterior (gabinete / setup) *"
              hint="Vista frontal o general de tu setup"
              file={fotoExterior}
              onFile={setFotoExterior}
              error={fileErrors.fotoExterior}
            />
            <ImageDropzone
              label="Foto interior (componentes) *"
              hint="Interior del gabinete con componentes visibles"
              file={fotoInterior}
              onFile={setFotoInterior}
              error={fileErrors.fotoInterior}
            />
          </div>

          {/* Sección: Historia */}
          <SectionTitle>Tu historia</SectionTitle>
          <Field
            label={`${fs_.labelHistoria} *`}
            error={errors.historia?.message}
          >
            <div style={{ position: 'relative' }}>
              <textarea
                {...register('historia')}
                placeholder={fs_.placeholderHistoria}
                rows={7}
                style={{
                  ...inputStyle,
                  resize: 'vertical', lineHeight: 1.6,
                  ...(errors.historia ? { border: '1px solid #e61f30' } : {}),
                }}
              />
              <span style={{
                position: 'absolute', bottom: '10px', right: '12px',
                color: wordCount > 140 ? (wordCount > 150 ? '#e61f30' : '#facc15') : '#4b5563',
                fontSize: '0.75rem',
              }}>
                {wordCount}/{fs_.maxPalabrasHistoria || 150} palabras
              </span>
            </div>
          </Field>

          {/* Checkboxes */}
          <div className="mt-6 space-y-3">
            <CheckboxField register={register} name="aceptaTyC" error={errors.aceptaTyC?.message}>
              <a href={fs_.urlTyC || '#tyc'} style={{ color: '#76B900' }}>{fs_.textoTyC}</a>{' '}*
            </CheckboxField>
            <CheckboxField register={register} name="aceptaMarketing">
              {fs_.textoMarketing}
            </CheckboxField>
          </div>

          {/* Error global */}
          {submitState === 'error' && (
            <div style={{
              background: 'rgba(230,31,48,0.1)', border: '1px solid #e61f30',
              borderRadius: '8px', padding: '12px 16px', marginTop: '20px', color: '#fca5a5',
            }}>
              {submitError}
            </div>
          )}

          {/* Submit */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={submitState === 'loading'}
              style={{
                width: '100%', background: submitState === 'loading' ? '#4a7400' : '#76B900',
                color: '#000', fontWeight: 800, padding: '16px',
                borderRadius: '6px', fontSize: '1.05rem', border: 'none',
                cursor: submitState === 'loading' ? 'not-allowed' : 'pointer',
                transition: 'background .2s',
              }}
            >
              {submitState === 'loading' ? 'Enviando...' : 'Enviar inscripción'}
            </button>
          </div>
        </form>
      </div>
    </ContestLayout>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0 16px' }}>
      <div style={{ flex: 1, height: '1px', background: '#1f2937' }} />
      <h2 style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {children}
      </h2>
      <div style={{ flex: 1, height: '1px', background: '#1f2937' }} />
    </div>
  );
}

function CheckboxField({ register, name, error, children }) {
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
        <input
          {...register(name)}
          type="checkbox"
          style={{ marginTop: '3px', accentColor: '#76B900', width: '16px', height: '16px', flexShrink: 0 }}
        />
        <span style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.5 }}>{children}</span>
      </label>
      {error && <p style={{ color: '#e61f30', fontSize: '0.78rem', marginTop: '4px', paddingLeft: '26px' }}>{error}</p>}
    </div>
  );
}

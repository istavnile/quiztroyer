import React, { useState, useMemo, useCallback, useEffect } from 'react';
import UilLockAlt from '@iconscout/react-unicons/icons/uil-lock-alt';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import ContestLayout from './ContestLayout';

const API = import.meta.env.VITE_API_URL || '';

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Schema y defaults dinámicos ──────────────────────────────────────────────
function buildSchema(campos) {
  const shape = {};
  for (const c of campos) {
    if (c.tipo === 'file') continue;
    if (c.tipo === 'checkbox') {
      shape[c.id] = c.requerido
        ? z.boolean().refine((v) => v === true, { message: 'Este campo es requerido' })
        : z.boolean().optional();
    } else if (c.tipo === 'checkboxGroup') {
      shape[c.id] = c.requerido
        ? z.array(z.string()).min(1, 'Selecciona al menos una opción')
        : z.array(z.string()).optional();
    } else if (c.tipo === 'email') {
      shape[c.id] = c.requerido
        ? z.string().email('Email inválido')
        : z.union([z.string().email(), z.literal('')]).optional();
    } else {
      shape[c.id] = c.requerido
        ? z.string().min(1, `${c.label} es requerido`)
        : z.string().optional();
    }
  }
  return z.object(shape);
}

function buildDefaultValues(campos) {
  const vals = {};
  for (const c of campos) {
    if (c.tipo === 'file') continue;
    if (c.tipo === 'checkbox') vals[c.id] = false;
    else if (c.tipo === 'checkboxGroup') vals[c.id] = [];
    else vals[c.id] = '';
  }
  return vals;
}

function getGridSpan(ancho) {
  if (ancho === 'half') return 'span 3';
  if (ancho === 'third') return 'span 2';
  return '1 / -1';
}

// ─── Estilos base ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #374151',
  borderRadius: '6px', padding: '10px 14px', color: '#fff', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  color: '#d1d5db', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px',
};
const errStyle = { color: '#e61f30', fontSize: '0.78rem', marginTop: '4px' };

// ─── Dropzone de imagen ───────────────────────────────────────────────────────
function ImageDropzone({ campoId, hint, file, onFile, error }) {
  const [dragging, setDragging] = useState(false);
  const preview = file ? URL.createObjectURL(file) : null;

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) onFile(f);
  }, [onFile]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`drop-${campoId}`).click()}
        style={{
          border: `2px dashed ${error ? '#e61f30' : dragging ? '#76B900' : '#374151'}`,
          borderRadius: '8px', padding: '24px', textAlign: 'center',
          cursor: 'pointer', transition: 'border-color .2s',
          background: dragging ? 'rgba(118,185,0,0.05)' : 'rgba(255,255,255,0.02)',
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
          id={`drop-${campoId}`}
          type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
        />
      </div>
      {error && <p style={errStyle}>{error}</p>}
      {file && <p style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '4px' }}>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
    </div>
  );
}

// ─── Campo dinámico individual ────────────────────────────────────────────────
function DynamicField({ campo, register, control, errors, fotoFiles, setFotoFiles, fileErrors, isPreview, watchValues }) {
  const error = errors[campo.id]?.message;
  const span  = getGridSpan(campo.ancho);

  const wrapField = (content) => (
    <div style={{ gridColumn: span }}>
      {campo.tipo !== 'checkbox' && (
        <label style={labelStyle}>{campo.label}{campo.requerido && ' *'}</label>
      )}
      {content}
      {error && <p style={errStyle}>{error}</p>}
    </div>
  );

  switch (campo.tipo) {
    case 'text':
    case 'email':
    case 'tel':
      return wrapField(
        <input
          {...register(campo.id)}
          type={campo.tipo}
          placeholder={campo.placeholder || ''}
          style={{ ...inputStyle, ...(error ? { border: '1px solid #e61f30' } : {}) }}
        />
      );

    case 'number':
      return wrapField(
        <input
          {...register(campo.id)}
          type="number"
          placeholder={campo.placeholder || ''}
          style={{ ...inputStyle, ...(error ? { border: '1px solid #e61f30' } : {}) }}
        />
      );

    case 'textarea': {
      const maxPalabras = campo.maxPalabras || 0;
      const val = watchValues[campo.id] || '';
      const words = countWords(String(val));
      const overLimit = maxPalabras > 0 && words > maxPalabras;
      return wrapField(
        <div style={{ position: 'relative' }}>
          <textarea
            {...register(campo.id)}
            placeholder={campo.placeholder || ''}
            rows={6}
            style={{
              ...inputStyle, resize: 'vertical', lineHeight: 1.6,
              paddingBottom: maxPalabras > 0 ? '32px' : '10px',
              ...(error ? { border: '1px solid #e61f30' } : {}),
            }}
          />
          {maxPalabras > 0 && (
            <span style={{
              position: 'absolute', bottom: '10px', right: '12px', fontSize: '0.75rem',
              color: overLimit ? '#e61f30' : words > maxPalabras * 0.9 ? '#facc15' : '#4b5563',
            }}>
              {words}/{maxPalabras} palabras
            </span>
          )}
        </div>
      );
    }

    case 'select':
      return wrapField(
        <select
          {...register(campo.id)}
          style={{ ...inputStyle, cursor: 'pointer', ...(error ? { border: '1px solid #e61f30' } : {}) }}
        >
          <option value="" style={{ background: '#1a1a1a' }}>{campo.placeholder || 'Selecciona...'}</option>
          {(campo.opciones || []).map((op) => (
            <option key={op.valor} value={op.valor} style={{ background: '#1a1a1a' }}>{op.etiqueta || op.valor}</option>
          ))}
        </select>
      );

    case 'radio':
      return wrapField(
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {(campo.opciones || []).map((op) => (
            <label key={op.valor} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input {...register(campo.id)} type="radio" value={op.valor} style={{ accentColor: '#76B900', flexShrink: 0 }} />
              <span style={{ color: '#d1d5db', fontSize: '0.88rem' }}>{op.etiqueta || op.valor}</span>
            </label>
          ))}
        </div>
      );

    case 'checkboxGroup':
      return wrapField(
        <Controller
          name={campo.id}
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {(campo.opciones || []).map((op) => {
                const checked = Array.isArray(field.value) && field.value.includes(op.valor);
                return (
                  <label key={op.valor} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? (field.value || []).filter((v) => v !== op.valor)
                          : [...(field.value || []), op.valor];
                        field.onChange(next);
                      }}
                      style={{ accentColor: '#76B900', width: '16px', height: '16px', flexShrink: 0 }}
                    />
                    <span style={{ color: '#d1d5db', fontSize: '0.88rem' }}>{op.etiqueta || op.valor}</span>
                  </label>
                );
              })}
            </div>
          )}
        />
      );

    case 'checkbox':
      return (
        <div style={{ gridColumn: span }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              {...register(campo.id)}
              type="checkbox"
              style={{ marginTop: '3px', accentColor: '#76B900', width: '16px', height: '16px', flexShrink: 0 }}
            />
            <span style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.5 }}>
              {campo.url
                ? <a href={campo.url} style={{ color: '#76B900' }}>{campo.label}</a>
                : campo.label
              }
              {campo.requerido && ' *'}
            </span>
          </label>
          {error && <p style={{ ...errStyle, paddingLeft: '26px' }}>{error}</p>}
        </div>
      );

    case 'file':
      if (isPreview) {
        return wrapField(
          <div style={{
            border: '2px dashed #374151', borderRadius: '8px', padding: '24px',
            textAlign: 'center', opacity: 0.5,
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📷</div>
            <p style={{ color: '#4b5563', fontSize: '0.82rem' }}>Vista previa — subida deshabilitada</p>
          </div>
        );
      }
      return wrapField(
        <ImageDropzone
          campoId={campo.id}
          hint={campo.hint}
          file={fotoFiles[campo.id]}
          onFile={(f) => setFotoFiles((prev) => ({ ...prev, [campo.id]: f }))}
          error={fileErrors[campo.id]}
        />
      );

    default:
      return null;
  }
}

// ─── Contenido del formulario (solo se monta con campos cargados) ──────────────
function FormContent({ campos, settings, isPreview }) {
  const schema        = useMemo(() => buildSchema(campos), []); // eslint-disable-line react-hooks/exhaustive-deps
  const defaultValues = useMemo(() => buildDefaultValues(campos), []); // eslint-disable-line react-hooks/exhaustive-deps

  const { register, handleSubmit, formState: { errors }, control, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchValues = watch();

  const [fotoFiles, setFotoFiles]   = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [submitState, setSubmitState] = useState('idle');
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted]   = useState(false);

  const fileCampos = campos.filter((c) => c.tipo === 'file');

  const validateFiles = () => {
    const errs = {};
    for (const c of fileCampos) {
      if (c.requerido && !fotoFiles[c.id]) errs[c.id] = 'Requerida';
      else if (fotoFiles[c.id]?.size > 5 * 1024 * 1024) errs[c.id] = 'Máximo 5 MB';
    }
    setFileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (data) => {
    if (isPreview) return;

    for (const c of campos) {
      if (c.tipo === 'textarea' && c.maxPalabras > 0) {
        if (countWords(String(data[c.id] || '')) > c.maxPalabras) {
          setSubmitState('error');
          setSubmitError(`El campo "${c.label}" no puede superar ${c.maxPalabras} palabras.`);
          return;
        }
      }
    }

    if (!validateFiles()) return;

    setSubmitState('loading');
    setSubmitError('');

    const formData = new FormData();
    for (const [k, v] of Object.entries(data)) {
      formData.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v));
    }
    for (const c of fileCampos) {
      if (fotoFiles[c.id]) formData.append(c.id, fotoFiles[c.id]);
    }

    try {
      const res  = await fetch(`${API}/api/contest/register`, { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al enviar');
      setSubmitted(true);
    } catch (err) {
      setSubmitState('error');
      setSubmitError(err.message);
    }
  };

  if (submitted) {
    return (
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
    );
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      {isPreview && (
        <div style={{
          background: 'rgba(250,204,21,0.1)', border: '1px solid #ca8a04',
          borderRadius: '8px', padding: '10px 18px', marginBottom: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
            VISTA PREVIA — Este formulario no enviará datos reales
          </span>
          <button
            onClick={() => window.close()}
            style={{ background: 'none', border: '1px solid #ca8a04', color: '#fbbf24', padding: '4px 14px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0 }}
          >
            Cerrar
          </button>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '6px' }}>
          {settings?.tituloFormulario || 'Formulario de inscripción'}
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '40px', fontSize: '0.95rem' }}
          dangerouslySetInnerHTML={{ __html: settings?.instruccionesFormulario || 'Completa todos los campos.' }}
        />
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '20px 24px' }}>
          {campos.map((campo) => (
            <DynamicField
              key={campo.id}
              campo={campo}
              register={register}
              control={control}
              errors={errors}
              fotoFiles={fotoFiles}
              setFotoFiles={setFotoFiles}
              fileErrors={fileErrors}
              isPreview={isPreview}
              watchValues={watchValues}
            />
          ))}
        </div>

        {submitState === 'error' && (
          <div style={{
            background: 'rgba(230,31,48,0.1)', border: '1px solid #e61f30',
            borderRadius: '8px', padding: '12px 16px', marginTop: '24px', color: '#fca5a5',
          }}>
            {submitError}
          </div>
        )}

        <div style={{ marginTop: '32px' }}>
          {isPreview ? (
            <button
              type="button"
              onClick={() => window.close()}
              style={{
                width: '100%', background: '#ca8a04', color: '#000',
                fontWeight: 800, padding: '16px', borderRadius: '6px',
                fontSize: '1.05rem', border: 'none', cursor: 'pointer',
              }}
            >
              Cerrar vista previa
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitState === 'loading'}
              style={{
                width: '100%',
                background: submitState === 'loading' ? '#4a7400' : '#76B900',
                color: '#000', fontWeight: 800, padding: '16px', borderRadius: '6px',
                fontSize: '1.05rem', border: 'none',
                cursor: submitState === 'loading' ? 'not-allowed' : 'pointer',
                transition: 'background .2s',
              }}
            >
              {submitState === 'loading' ? 'Enviando...' : 'Enviar inscripción'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ContestForm() {
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  const [campos,   setCampos]   = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/contest/settings`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setCampos(data.campos || []);
        setSettings(data);
      })
      .catch((err) => { console.warn('[contest-form-settings]', err); setCampos([]); setSettings({}); });
  }, []);

  // Wait for settings before deciding open/closed
  if (!settings) {
    return (
      <ContestLayout>
        <div style={{ textAlign: 'center', padding: '80px 16px', color: '#4b5563' }}>
          Cargando formulario...
        </div>
      </ContestLayout>
    );
  }

  const open = settings.registrationOpen ?? false;

  if (!open && !isPreview) {
    return (
      <ContestLayout>
        <div style={{ textAlign: 'center', padding: '80px 16px' }}>
          <div style={{ marginBottom: '16px', opacity: 0.5 }}><UilLockAlt size="52" color="#e61f30" /></div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Inscripciones cerradas</h1>
          <p style={{ color: '#9ca3af' }}>
            Visita la página de{' '}
            <Link to="/concursos/el-gran-upgrade/votacion" style={{ color: '#76B900' }}>votación</Link>{' '}
            para apoyar a los finalistas.
          </p>
        </div>
      </ContestLayout>
    );
  }

  return (
    <ContestLayout settings={settings}>
      <FormContent campos={campos} settings={settings} isPreview={isPreview} />
    </ContestLayout>
  );
}

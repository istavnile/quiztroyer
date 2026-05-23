import React, { useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Tipos de campo disponibles ───────────────────────────────────────────────
const TIPOS = [
  { tipo: 'text',          icono: '✏️',  label: 'Texto corto' },
  { tipo: 'textarea',      icono: '📝',  label: 'Texto largo' },
  { tipo: 'email',         icono: '📧',  label: 'Email' },
  { tipo: 'tel',           icono: '📞',  label: 'Teléfono' },
  { tipo: 'number',        icono: '🔢',  label: 'Número' },
  { tipo: 'select',        icono: '▼',   label: 'Menú desplegable' },
  { tipo: 'radio',         icono: '🔘',  label: 'Opción única (radio)' },
  { tipo: 'checkboxGroup', icono: '☑️',  label: 'Opciones múltiples' },
  { tipo: 'checkbox',      icono: '✅',  label: 'Checkbox único' },
  { tipo: 'file',          icono: '📷',  label: 'Subida de imagen' },
];

const ANCHOS = [
  { valor: 'full',  label: '100% (ancho completo)' },
  { valor: 'half',  label: '50% (mitad)' },
  { valor: 'third', label: '33% (un tercio)' },
];

const st = {
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #374151', borderRadius: '6px', padding: '7px 11px', color: '#fff', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' },
  label: { color: '#9ca3af', fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
};

function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── Editor de opciones para select / radio / checkboxGroup ──────────────────
function OpcionesEditor({ opciones = [], onChange, locked }) {
  const add = () => onChange([...opciones, { valor: uid(), etiqueta: '' }]);
  const remove = (i) => onChange(opciones.filter((_, idx) => idx !== i));
  const update = (i, field, val) => onChange(opciones.map((o, idx) => idx === i ? { ...o, [field]: val } : o));

  return (
    <div>
      <label style={st.label}>Opciones</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
        {opciones.map((op, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              value={op.valor}
              onChange={(e) => update(i, 'valor', e.target.value)}
              placeholder="valor (ID)"
              readOnly={locked}
              style={{ ...st.input, flex: '0 0 38%', opacity: locked ? 0.5 : 1, cursor: locked ? 'not-allowed' : 'text' }}
              title={locked ? 'Valor bloqueado — campo del sistema' : ''}
            />
            <input
              value={op.etiqueta}
              onChange={(e) => update(i, 'etiqueta', e.target.value)}
              placeholder="etiqueta (texto visible)"
              style={{ ...st.input, flex: 1 }}
            />
            {!locked && (
              <button onClick={() => remove(i)} style={{ background: 'rgba(230,31,48,0.15)', border: '1px solid #e61f30', color: '#e61f30', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
            )}
          </div>
        ))}
      </div>
      {!locked && (
        <button onClick={add} style={{ background: 'rgba(118,185,0,0.1)', border: '1px solid rgba(118,185,0,0.3)', color: '#76B900', borderRadius: '5px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
          + Agregar opción
        </button>
      )}
    </div>
  );
}

// ─── Card de campo individual (sortable) ─────────────────────────────────────
function SortableFieldCard({ campo, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: campo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const tipoInfo = TIPOS.find((t) => t.tipo === campo.tipo) || { icono: '📋', label: campo.tipo };
  const hasOpciones = ['select', 'radio', 'checkboxGroup'].includes(campo.tipo);

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        background: campo.sistema ? 'rgba(255,255,255,0.02)' : 'rgba(118,185,0,0.03)',
        border: `1px solid ${campo.sistema ? '#1f2937' : 'rgba(118,185,0,0.15)'}`,
        borderRadius: '8px', overflow: 'hidden',
      }}>
        {/* Cabecera de la card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px' }}>
          {/* Drag handle */}
          <span
            {...listeners} {...attributes}
            style={{ cursor: 'grab', color: '#374151', fontSize: '1.1rem', lineHeight: 1, userSelect: 'none', flexShrink: 0 }}
            title="Arrastra para reordenar"
          >⠿</span>

          <span style={{ fontSize: '1rem', flexShrink: 0 }}>{tipoInfo.icono}</span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#e5e7eb', fontSize: '0.85rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {campo.label || '(sin etiqueta)'}
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.72rem', margin: 0 }}>{tipoInfo.label}</p>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
            {campo.sistema && (
              <span style={{ background: 'rgba(255,255,255,0.06)', color: '#6b7280', fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', fontWeight: 600 }}>SISTEMA</span>
            )}
            {campo.requerido && (
              <span style={{ background: 'rgba(230,31,48,0.12)', color: '#f87171', fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', fontWeight: 600 }}>REQUERIDO</span>
            )}
            <button onClick={() => setExpanded((e) => !e)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #374151', color: '#9ca3af', borderRadius: '5px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
              {expanded ? 'Cerrar' : 'Editar'}
            </button>
            {!campo.sistema && (
              <button onClick={() => onDelete(campo.id)} style={{ background: 'rgba(230,31,48,0.1)', border: '1px solid #e61f30', color: '#e61f30', borderRadius: '5px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
            )}
          </div>
        </div>

        {/* Panel de edición */}
        {expanded && (
          <div style={{ borderTop: '1px solid #1f2937', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '10px' }}>
              <div>
                <label style={st.label}>Etiqueta (label)</label>
                <input value={campo.label} onChange={(e) => onUpdate(campo.id, 'label', e.target.value)} style={st.input} />
              </div>
              <div>
                <label style={st.label}>Ancho</label>
                <select value={campo.ancho || 'full'} onChange={(e) => onUpdate(campo.id, 'ancho', e.target.value)} style={{ ...st.input, cursor: 'pointer' }}>
                  {ANCHOS.map((a) => <option key={a.valor} value={a.valor} style={{ background: '#111' }}>{a.label}</option>)}
                </select>
              </div>
            </div>

            {['text', 'email', 'tel', 'number', 'textarea', 'select', 'radio'].includes(campo.tipo) && (
              <div>
                <label style={st.label}>Placeholder</label>
                <input value={campo.placeholder || ''} onChange={(e) => onUpdate(campo.id, 'placeholder', e.target.value)} style={st.input} />
              </div>
            )}

            {campo.tipo === 'file' && (
              <div>
                <label style={st.label}>Hint (texto de ayuda)</label>
                <input value={campo.hint || ''} onChange={(e) => onUpdate(campo.id, 'hint', e.target.value)} style={st.input} />
              </div>
            )}

            {campo.tipo === 'textarea' && (
              <div>
                <label style={st.label}>Máximo de palabras (0 = sin límite)</label>
                <input type="number" min={0} value={campo.maxPalabras || 0} onChange={(e) => onUpdate(campo.id, 'maxPalabras', Number(e.target.value))} style={{ ...st.input, width: '120px' }} />
              </div>
            )}

            {campo.tipo === 'checkbox' && (
              <div>
                <label style={st.label}>URL del enlace (opcional)</label>
                <input value={campo.url || ''} onChange={(e) => onUpdate(campo.id, 'url', e.target.value)} placeholder="#tyc o https://..." style={st.input} />
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={!!campo.requerido} onChange={(e) => onUpdate(campo.id, 'requerido', e.target.checked)} style={{ accentColor: '#76B900', width: '15px', height: '15px' }} />
              <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Campo requerido</span>
            </label>

            {hasOpciones && (
              <OpcionesEditor
                opciones={campo.opciones || []}
                onChange={(opciones) => onUpdate(campo.id, 'opciones', opciones)}
                locked={campo.sistema}
              />
            )}

            {campo.sistema && (
              <p style={{ color: '#4b5563', fontSize: '0.72rem', margin: 0 }}>
                ⚠️ Campo del sistema — el valor (ID) y tipo no son editables para mantener la integridad con la base de datos.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal para agregar campo nuevo ──────────────────────────────────────────
function AddFieldModal({ onAdd, onClose }) {
  const [tipo, setTipo] = useState('text');

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#111', border: '1px solid #1f2937', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px' }}>
        <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', marginBottom: '20px' }}>Agregar campo</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          {TIPOS.map((t) => (
            <button key={t.tipo} onClick={() => setTipo(t.tipo)} style={{
              background: tipo === t.tipo ? 'rgba(118,185,0,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${tipo === t.tipo ? '#76B900' : '#1f2937'}`,
              color: tipo === t.tipo ? '#76B900' : '#9ca3af',
              borderRadius: '8px', padding: '10px 12px', cursor: 'pointer',
              textAlign: 'left', fontSize: '0.82rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>{t.icono}</span> {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #374151', color: '#6b7280', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
          <button onClick={() => { onAdd(tipo); onClose(); }} style={{ background: '#76B900', color: '#000', border: 'none', padding: '8px 22px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800 }}>Agregar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal exportado ──────────────────────────────────────────
export default function ContestFormBuilder({ campos, onChange }) {
  const [showModal, setShowModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = campos.findIndex((c) => c.id === active.id);
      const newIndex = campos.findIndex((c) => c.id === over.id);
      onChange(arrayMove(campos, oldIndex, newIndex));
    }
  };

  const handleUpdate = (id, field, val) =>
    onChange(campos.map((c) => c.id === id ? { ...c, [field]: val } : c));

  const handleDelete = (id) => {
    if (!window.confirm('¿Eliminar este campo?')) return;
    onChange(campos.filter((c) => c.id !== id));
  };

  const handleAdd = (tipo) => {
    const tipoInfo = TIPOS.find((t) => t.tipo === tipo);
    const newCampo = {
      id: uid(),
      tipo,
      label: tipoInfo?.label || tipo,
      placeholder: '',
      requerido: false,
      ancho: 'full',
      sistema: false,
      opciones: ['select', 'radio', 'checkboxGroup'].includes(tipo)
        ? [{ valor: uid(), etiqueta: 'Opción 1' }]
        : undefined,
    };
    onChange([...campos, newCampo]);
  };

  return (
    <div>
      {showModal && <AddFieldModal onAdd={handleAdd} onClose={() => setShowModal(false)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>
          Arrastra los campos para reordenarlos. Los campos <span style={{ color: '#9ca3af' }}>SISTEMA</span> son obligatorios.
        </p>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'rgba(118,185,0,0.1)', border: '1px solid rgba(118,185,0,0.3)', color: '#76B900', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
        >
          + Agregar campo
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={campos.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {campos.map((campo) => (
              <SortableFieldCard
                key={campo.id}
                campo={campo}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

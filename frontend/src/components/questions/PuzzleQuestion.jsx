import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, label, index, blocked }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(blocked ? {} : listeners)}
      className={`
        flex items-center gap-3 bg-slate-800 border rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing select-none
        transition-all duration-150
        ${isDragging ? 'border-indigo-500 shadow-xl shadow-indigo-500/20 scale-105' : 'border-slate-700 hover:border-slate-500'}
        ${blocked ? 'cursor-not-allowed opacity-70' : ''}
      `}
    >
      <span className="text-slate-500 text-sm font-bold w-6 text-center">{index + 1}</span>
      <span className="text-slate-400 text-lg">☰</span>
      <span className="text-white font-medium flex-1">{label}</span>
    </div>
  );
}

export default function PuzzleQuestion({ question, onAnswer, blocked, accentColor }) {
  const [items, setItems] = useState(() => question.config.items || []);
  const [submitted, setSubmitted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    setItems(arrayMove(items, oldIndex, newIndex));
  }

  function handleSubmit() {
    if (blocked || submitted) return;
    setSubmitted(true);
    onAnswer({ order: items });
  }

  return (
    <div className="max-w-md mx-auto">
      <p className="text-slate-400 text-sm text-center mb-4">
        Arrastra para ordenar los elementos de arriba a abajo
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-6">
            {items.map((item, i) => (
              <SortableItem key={item} id={item} label={item} index={i} blocked={blocked || submitted} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSubmit}
        disabled={blocked || submitted}
        className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: blocked || submitted ? '#334155' : accentColor || '#6366f1' }}
      >
        {submitted ? '✓ Respuesta enviada' : 'Confirmar orden'}
      </motion.button>
    </div>
  );
}

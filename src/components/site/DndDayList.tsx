'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  deleteProgramSessionAction,
  reorderProgramSessionsAction,
} from '@/lib/program-builder-actions';
import type { ProgramSession } from '@/lib/data/types';

type Props = {
  programId: string;
  dayIndex: number;
  items: ProgramSession[];
};

function refKindLabel(kind: ProgramSession['ref_kind']): string {
  switch (kind) {
    case 'routine': return 'AI STUDIO';
    case 'class_kind': return 'GYM CLASS';
    case 'trainer_1on1': return '1-ON-1';
    default: return 'CUSTOM';
  }
}

function refSummary(s: ProgramSession): string {
  if (s.ref_kind === 'routine' && s.routine_slug) return `Routine: ${s.routine_slug}`;
  if (s.ref_kind === 'class_kind' && s.class_slug) return `Class: ${s.class_slug}`;
  if (s.ref_kind === 'trainer_1on1' && s.trainer_id_for_1on1) return `Trainer: ${s.trainer_id_for_1on1.slice(0, 8)}…`;
  return s.description ?? '';
}

export function DndDayList({ programId, dayIndex: _dayIndex, items }: Props) {
  const [order, setOrder] = useState<ProgramSession[]>(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  // Keep local order in sync if server-provided items change (e.g. after add/delete revalidation).
  useEffect(() => {
    setOrder(items);
    // We intentionally compare by ids+order via JSON.stringify of ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map(i => i.id).join('|')]);

  function commit(newOrder: ProgramSession[]) {
    setOrder(newOrder);
    // Submit the hidden form on the next tick so React re-renders the hidden inputs first.
    startTransition(() => {
      // Defer to allow inputs to re-render with the new order.
      requestAnimationFrame(() => {
        formRef.current?.requestSubmit();
      });
    });
  }

  function moveBy(id: string, delta: number) {
    const idx = order.findIndex(o => o.id === id);
    if (idx < 0) return;
    const target = idx + delta;
    if (target < 0 || target >= order.length) return;
    const next = order.slice();
    const [row] = next.splice(idx, 1);
    next.splice(target, 0, row);
    commit(next);
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', id); } catch {}
  }

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overId !== dragOverId) setDragOverId(overId);
  }

  function handleDrop(e: React.DragEvent, dropId: string) {
    e.preventDefault();
    const dragId = draggingId ?? (() => { try { return e.dataTransfer.getData('text/plain'); } catch { return null; } })();
    setDraggingId(null);
    setDragOverId(null);
    if (!dragId || dragId === dropId) return;
    const fromIdx = order.findIndex(o => o.id === dragId);
    const toIdx = order.findIndex(o => o.id === dropId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = order.slice();
    const [row] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, row);
    commit(next);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  if (order.length === 0) return null;

  return (
    <>
      {/* Hidden reorder form — submits the canonical session_ids order. */}
      <form ref={formRef} action={reorderProgramSessionsAction} style={{ display: 'none' }}>
        <input type="hidden" name="program_id" value={programId} />
        {order.map(s => (
          <input key={s.id} type="hidden" name="session_ids" value={s.id} />
        ))}
      </form>

      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {order.map((s, i) => {
          const isDragging = draggingId === s.id;
          const isOver = dragOverId === s.id && draggingId !== s.id;
          return (
            <div
              key={s.id}
              draggable
              onDragStart={e => handleDragStart(e, s.id)}
              onDragOver={e => handleDragOver(e, s.id)}
              onDrop={e => handleDrop(e, s.id)}
              onDragEnd={handleDragEnd}
              onDragLeave={() => { if (dragOverId === s.id) setDragOverId(null); }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 10,
                borderRadius: 10,
                background: isOver ? 'rgba(143,184,214,0.18)' : 'rgba(143,184,214,0.06)',
                border: isOver
                  ? '1px dashed var(--sky)'
                  : '1px solid rgba(143,184,214,0.14)',
                gap: 10,
                flexWrap: 'wrap',
                opacity: isDragging ? 0.45 : 1,
                cursor: 'grab',
                transition: 'background 0.12s ease, border-color 0.12s ease, opacity 0.12s ease',
              }}
            >
              <div
                aria-hidden
                className="e-mono"
                title="Drag to reorder"
                style={{
                  color: 'rgba(242,238,232,0.4)',
                  fontSize: 14,
                  letterSpacing: '0.05em',
                  cursor: 'grab',
                  userSelect: 'none',
                  padding: '0 4px',
                }}
              >
                ⋮⋮
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="e-mono" style={{ color: 'var(--sky)', fontSize: 9, letterSpacing: '0.18em' }}>
                  {refKindLabel(s.ref_kind)} · {s.duration_min}M
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginTop: 4 }}>{s.name}</div>
                <div className="e-mono" style={{ color: 'rgba(242,238,232,0.5)', fontSize: 9, letterSpacing: '0.14em', marginTop: 4 }}>
                  {refSummary(s)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="e-mono"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => moveBy(s.id, -1)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    background: 'transparent',
                    color: i === 0 ? 'rgba(242,238,232,0.25)' : 'var(--bone)',
                    border: '1px solid rgba(143,184,214,0.25)',
                    borderRadius: 6,
                    cursor: i === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="e-mono"
                  aria-label="Move down"
                  disabled={i === order.length - 1}
                  onClick={() => moveBy(s.id, 1)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    background: 'transparent',
                    color: i === order.length - 1 ? 'rgba(242,238,232,0.25)' : 'var(--bone)',
                    border: '1px solid rgba(143,184,214,0.25)',
                    borderRadius: 6,
                    cursor: i === order.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ▼
                </button>

                <form action={deleteProgramSessionAction}>
                  <input type="hidden" name="program_id" value={programId} />
                  <input type="hidden" name="session_id" value={s.id} />
                  <button
                    type="submit"
                    className="btn"
                    style={{
                      padding: '6px 10px',
                      fontSize: 10,
                      background: 'transparent',
                      color: 'var(--rose)',
                      border: '1px solid rgba(232,181,168,0.35)',
                    }}
                  >
                    REMOVE
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default DndDayList;

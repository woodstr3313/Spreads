'use client';

import { useMemo, useState, useTransition } from 'react';
import { resolveReviewTask, updateCell } from '../lib/review-actions';

type ReviewActionItem = {
  id: string;
  status?: string;
  reason?: string;
};

type Props = {
  spreadId: string;
  spreadVersionId: string;
  defaultRowId?: string;
  defaultPeriodId?: string;
  items: ReviewActionItem[];
};

export function ReviewActionPanel({ spreadId, spreadVersionId, defaultRowId = 'ACCOUNTS_PAYABLE', defaultPeriodId = '2025A', items }: Props) {
  const [selectedTaskId, setSelectedTaskId] = useState(items[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [cellValue, setCellValue] = useState('100000');
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [isPending, startTransition] = useTransition();

  const selectedTask = useMemo(() => items.find((item) => item.id === selectedTaskId), [items, selectedTaskId]);

  const handleResolve = (approved: boolean) => {
    if (!selectedTaskId) {
      setStatusMessage('Select a review task first.');
      return;
    }

    startTransition(async () => {
      try {
        await resolveReviewTask({
          spreadId,
          reviewTaskId: selectedTaskId,
          approved,
          notes
        });
        setStatusMessage(approved ? 'Review task approved.' : 'Review task rejected.');
      } catch {
        setStatusMessage(`Unable to ${approved ? 'approve' : 'reject'} review task yet. Check AppSync config.`);
      }
    });
  };

  const handleOverwrite = () => {
    startTransition(async () => {
      try {
        await updateCell({
          spreadId,
          spreadVersionId,
          rowId: defaultRowId,
          periodId: defaultPeriodId,
          normalizedValue: cellValue,
          displayValue: cellValue
        });
        setStatusMessage('Cell overwrite submitted.');
      } catch {
        setStatusMessage('Unable to overwrite cell yet. Check AppSync config.');
      }
    });
  };

  return (
    <section className="panel">
      <h2>Interactive review actions</h2>
      <div className="listItem">
        <strong>Selected task</strong>
        <p className="muted">{selectedTask?.reason || 'No task selected'}</p>
        <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)} style={{ width: '100%', padding: 10, marginTop: 10, background: '#0b1020', color: '#eef3ff', border: '1px solid #2b3759', borderRadius: 10 }}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.id}</option>
          ))}
        </select>
      </div>

      <div className="listItem">
        <strong>Reviewer notes</strong>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} style={{ width: '100%', marginTop: 10, padding: 10, background: '#0b1020', color: '#eef3ff', border: '1px solid #2b3759', borderRadius: 10 }} placeholder="Explain the decision or note the override rationale" />
      </div>

      <div className="listItem">
        <strong>Low-confidence overwrite</strong>
        <p className="muted">Default target: {defaultRowId} / {defaultPeriodId}</p>
        <input value={cellValue} onChange={(e) => setCellValue(e.target.value)} style={{ width: '100%', marginTop: 10, padding: 10, background: '#0b1020', color: '#eef3ff', border: '1px solid #2b3759', borderRadius: 10 }} />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => handleResolve(true)} disabled={isPending} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2b3759', background: '#17213c', color: '#6ee7b7', cursor: 'pointer' }}>Approve task</button>
        <button onClick={() => handleResolve(false)} disabled={isPending} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2b3759', background: '#17213c', color: '#fca5a5', cursor: 'pointer' }}>Reject task</button>
        <button onClick={handleOverwrite} disabled={isPending} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2b3759', background: '#17213c', color: '#fbbf24', cursor: 'pointer' }}>Overwrite cell</button>
      </div>

      <div className="listItem" style={{ marginTop: 12 }}>
        <strong>Status</strong>
        <p className="muted">{isPending ? 'Submitting action...' : statusMessage}</p>
      </div>
    </section>
  );
}

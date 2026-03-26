'use client';

import { useMemo, useState, useTransition } from 'react';
import { updateCell } from '../lib/review-actions';

type GridRow = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: string;
  confidence: string;
};

type Props = {
  spreadId: string;
  spreadVersionId: string;
  rows: GridRow[];
  formulaTrace: string[];
};

export function EditableSpreadGrid({ spreadId, spreadVersionId, rows, formulaTrace }: Props) {
  const [selectedRowId, setSelectedRowId] = useState(rows[0]?.rowId || '');
  const [editedValues, setEditedValues] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((row) => [row.rowId, row.fy2025.replace(/[^0-9.-]/g, '') || '0']))
  );
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [isPending, startTransition] = useTransition();

  const selectedRow = useMemo(
    () => rows.find((row) => row.rowId === selectedRowId) || rows[0],
    [rows, selectedRowId]
  );

  const relatedFormulas = useMemo(
    () => formulaTrace.filter((item) => item.includes(selectedRow?.rowId || '') || item.includes(selectedRow?.label || '')),
    [formulaTrace, selectedRow]
  );

  const saveRow = (rowId: string) => {
    startTransition(async () => {
      try {
        await updateCell({
          spreadId,
          spreadVersionId,
          rowId,
          periodId: '2025A',
          normalizedValue: editedValues[rowId] || '0',
          displayValue: editedValues[rowId] || '0'
        });
        setStatusMessage(`Saved ${rowId}.`);
      } catch {
        setStatusMessage(`Unable to save ${rowId} yet. Check AppSync config.`);
      }
    });
  };

  return (
    <section className="twoCol">
      <div className="panel">
        <h2>Editable spread grid</h2>
        <div style={{ overflowX: 'auto', border: '1px solid #2b3759', borderRadius: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 220px 180px 160px 140px 120px', minWidth: 1040 }}>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Row ID</div>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Label</div>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>FY2025</div>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Origin</div>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Confidence</div>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Action</div>

            {rows.map((row, index) => {
              const active = row.rowId === selectedRow?.rowId;
              const bg = active ? '#17213c' : index % 2 === 0 ? '#121a30' : '#0f1528';
              const border = active ? '#8ab4ff' : '#2b3759';
              return [
                <button key={`${row.rowId}-id-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.rowId}</button>,
                <button key={`${row.rowId}-label-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.label}</button>,
                <div key={`${row.rowId}-value-${index}`} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg }}>
                  <input
                    value={editedValues[row.rowId] || ''}
                    onChange={(e) => setEditedValues((current) => ({ ...current, [row.rowId]: e.target.value }))}
                    onFocus={() => setSelectedRowId(row.rowId)}
                    style={{ width: '100%', padding: 8, background: '#0b1020', color: '#eef3ff', border: '1px solid #2b3759', borderRadius: 8 }}
                  />
                </div>,
                <button key={`${row.rowId}-origin-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.origin}</button>,
                <button key={`${row.rowId}-confidence-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.confidence}</button>,
                <div key={`${row.rowId}-action-${index}`} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg }}>
                  <button onClick={() => saveRow(row.rowId)} disabled={isPending} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #2b3759', background: '#17213c', color: '#8ab4ff', cursor: 'pointer' }}>Save</button>
                </div>
              ];
            }).flat()}
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Selected row drill-in</h2>
        {selectedRow ? (
          <>
            <div className="listItem">
              <strong>{selectedRow.label}</strong>
              <p className="muted">Row ID: {selectedRow.rowId}</p>
              <p className="muted">Origin: {selectedRow.origin} · Confidence: {selectedRow.confidence}</p>
              <div className="badge accent">Edited value: {editedValues[selectedRow.rowId] || '0'}</div>
            </div>
            <div className="listItem">
              <strong>Formula context</strong>
              {relatedFormulas.length ? relatedFormulas.map((item) => (
                <div key={item} style={{ marginTop: 8 }}>{item}</div>
              )) : <p className="muted">No direct formula strings matched this row yet.</p>}
            </div>
            <div className="listItem">
              <strong>Status</strong>
              <p className="muted">{isPending ? 'Saving...' : statusMessage}</p>
            </div>
          </>
        ) : <div className="listItem">No row selected.</div>}
      </div>
    </section>
  );
}

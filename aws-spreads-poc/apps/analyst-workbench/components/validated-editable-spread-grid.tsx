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

function sanitizeNumericInput(value: string) {
  return value.replace(/[^0-9.-]/g, '');
}

function isValidNumericInput(value: string) {
  return /^-?\d*(\.\d+)?$/.test(value) && value !== '-' && value !== '.' && value !== '-.';
}

function formatNumericDisplay(value: string) {
  if (!isValidNumericInput(value)) return value;
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString();
}

export function ValidatedEditableSpreadGrid({ spreadId, spreadVersionId, rows, formulaTrace }: Props) {
  const initialValues = Object.fromEntries(rows.map((row) => [row.rowId, sanitizeNumericInput(row.fy2025) || '0']));
  const [selectedRowId, setSelectedRowId] = useState(rows[0]?.rowId || '');
  const [editedValues, setEditedValues] = useState<Record<string, string>>(initialValues);
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

  const dirtyRows = useMemo(() => {
    return new Set(
      Object.entries(editedValues)
        .filter(([rowId, value]) => value !== (initialValues[rowId] || '0'))
        .map(([rowId]) => rowId)
    );
  }, [editedValues]);

  const saveRow = (rowId: string) => {
    const value = editedValues[rowId] || '0';
    if (!isValidNumericInput(value)) {
      setStatusMessage(`Invalid numeric value for ${rowId}.`);
      return;
    }

    startTransition(async () => {
      try {
        await updateCell({
          spreadId,
          spreadVersionId,
          rowId,
          periodId: '2025A',
          normalizedValue: value,
          displayValue: formatNumericDisplay(value)
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
        <h2>Validated editable grid</h2>
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
              const dirty = dirtyRows.has(row.rowId);
              const rawValue = editedValues[row.rowId] || '0';
              const valid = isValidNumericInput(rawValue);
              const bg = active ? '#17213c' : index % 2 === 0 ? '#121a30' : '#0f1528';
              const border = !valid ? '#fca5a5' : active ? '#8ab4ff' : '#2b3759';
              return [
                <button key={`${row.rowId}-id-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.rowId}{dirty ? ' *' : ''}</button>,
                <button key={`${row.rowId}-label-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.label}</button>,
                <div key={`${row.rowId}-value-${index}`} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg }}>
                  <input
                    value={rawValue}
                    onChange={(e) => setEditedValues((current) => ({ ...current, [row.rowId]: sanitizeNumericInput(e.target.value) }))}
                    onFocus={() => setSelectedRowId(row.rowId)}
                    style={{ width: '100%', padding: 8, background: '#0b1020', color: '#eef3ff', border: `1px solid ${valid ? '#2b3759' : '#fca5a5'}`, borderRadius: 8 }}
                  />
                  <div style={{ marginTop: 6, color: valid ? '#a7b4d6' : '#fca5a5', fontSize: 12 }}>
                    {valid ? `Display: ${formatNumericDisplay(rawValue)}` : 'Enter a valid number'}
                  </div>
                </div>,
                <button key={`${row.rowId}-origin-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.origin}</button>,
                <button key={`${row.rowId}-confidence-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.confidence}</button>,
                <div key={`${row.rowId}-action-${index}`} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg }}>
                  <button onClick={() => saveRow(row.rowId)} disabled={isPending || !valid} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #2b3759', background: '#17213c', color: valid ? '#8ab4ff' : '#a7b4d6', cursor: valid ? 'pointer' : 'not-allowed' }}>Save</button>
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
              <div className="badge accent">Edited value: {formatNumericDisplay(editedValues[selectedRow.rowId] || '0')}</div>
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

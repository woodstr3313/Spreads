'use client';

import { KeyboardEvent, useMemo, useRef, useState, useTransition } from 'react';
import { updateCell } from '../lib/review-actions';

type GridRow = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: string;
  confidence: string;
};

type ProvenanceItem = {
  rowId: string;
  documentId: string;
  page: number | null;
  excerpt: string;
  origin: string;
  confidence: string;
  value: string;
};

type Props = {
  spreadId: string;
  spreadVersionId: string;
  rows: GridRow[];
  formulaTrace: string[];
  provenance: ProvenanceItem[];
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

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

export function SpreadsheetGridV3({ spreadId, spreadVersionId, rows, formulaTrace, provenance }: Props) {
  const initialValues = Object.fromEntries(rows.map((row) => [row.rowId, sanitizeNumericInput(row.fy2025) || '0']));
  const [selectedRowId, setSelectedRowId] = useState(rows[0]?.rowId || '');
  const [editedValues, setEditedValues] = useState<Record<string, string>>(initialValues);
  const [selectedRows, setSelectedRows] = useState<string[]>(rows[0] ? [rows[0].rowId] : []);
  const [bulkValue, setBulkValue] = useState('');
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedRow = useMemo(
    () => rows.find((row) => row.rowId === selectedRowId) || rows[0],
    [rows, selectedRowId]
  );

  const relatedFormulas = useMemo(
    () => formulaTrace.filter((item) => item.includes(selectedRow?.rowId || '') || item.includes(selectedRow?.label || '')),
    [formulaTrace, selectedRow]
  );

  const relatedProvenance = useMemo(
    () => provenance.filter((item) => item.rowId === selectedRow?.rowId),
    [provenance, selectedRow]
  );

  const dirtyRows = useMemo(() => {
    return new Set(
      Object.entries(editedValues)
        .filter(([rowId, value]) => value !== (initialValues[rowId] || '0'))
        .map(([rowId]) => rowId)
    );
  }, [editedValues]);

  const setRowSaveState = (rowId: string, state: SaveState) => {
    setSaveStates((current) => ({ ...current, [rowId]: state }));
  };

  const saveRow = (rowId: string) => {
    const value = editedValues[rowId] || '0';
    if (!isValidNumericInput(value)) {
      setStatusMessage(`Invalid numeric value for ${rowId}.`);
      setRowSaveState(rowId, 'error');
      return;
    }

    setRowSaveState(rowId, 'saving');
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
        setRowSaveState(rowId, 'saved');
        setStatusMessage(`Saved ${rowId}.`);
      } catch {
        setRowSaveState(rowId, 'error');
        setStatusMessage(`Unable to save ${rowId} yet. Check AppSync config.`);
      }
    });
  };

  const saveAllDirty = () => {
    const rowIds = Array.from(dirtyRows).filter((rowId) => isValidNumericInput(editedValues[rowId] || '0'));
    if (!rowIds.length) {
      setStatusMessage('No valid dirty rows to save.');
      return;
    }

    rowIds.forEach((rowId) => setRowSaveState(rowId, 'saving'));
    startTransition(async () => {
      try {
        await Promise.all(
          rowIds.map((rowId) =>
            updateCell({
              spreadId,
              spreadVersionId,
              rowId,
              periodId: '2025A',
              normalizedValue: editedValues[rowId] || '0',
              displayValue: formatNumericDisplay(editedValues[rowId] || '0')
            })
          )
        );
        rowIds.forEach((rowId) => setRowSaveState(rowId, 'saved'));
        setStatusMessage(`Saved ${rowIds.length} row(s).`);
      } catch {
        rowIds.forEach((rowId) => setRowSaveState(rowId, 'error'));
        setStatusMessage('Unable to save all dirty rows yet. Check AppSync config.');
      }
    });
  };

  const moveSelection = (currentRowId: string, direction: 1 | -1) => {
    const index = rows.findIndex((row) => row.rowId === currentRowId);
    const next = rows[index + direction];
    if (next) {
      setSelectedRowId(next.rowId);
      setSelectedRows([next.rowId]);
      inputRefs.current[next.rowId]?.focus();
      inputRefs.current[next.rowId]?.select();
    }
  };

  const onValueKeyDown = (event: KeyboardEvent<HTMLInputElement>, rowId: string) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveRow(rowId);
      moveSelection(rowId, 1);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(rowId, 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(rowId, -1);
      return;
    }
  };

  const toggleRowSelection = (rowId: string) => {
    setSelectedRowId(rowId);
    setSelectedRows((current) =>
      current.includes(rowId) ? current.filter((item) => item !== rowId) : [...current, rowId]
    );
  };

  const applyBulkValue = () => {
    const sanitized = sanitizeNumericInput(bulkValue);
    if (!isValidNumericInput(sanitized)) {
      setStatusMessage('Bulk value must be a valid number.');
      return;
    }
    if (!selectedRows.length) {
      setStatusMessage('Select at least one row for bulk fill.');
      return;
    }
    setEditedValues((current) => {
      const next = { ...current };
      selectedRows.forEach((rowId) => {
        next[rowId] = sanitized;
      });
      return next;
    });
    setStatusMessage(`Applied bulk value to ${selectedRows.length} row(s).`);
  };

  const dirtyCount = dirtyRows.size;

  const saveBadge = (state: SaveState | undefined) => {
    switch (state) {
      case 'saving':
        return <span className="badge warn">Saving</span>;
      case 'saved':
        return <span className="badge good">Saved</span>;
      case 'error':
        return <span className="badge bad">Error</span>;
      default:
        return <span className="badge accent">Idle</span>;
    }
  };

  return (
    <section className="grid" style={{ gap: 16 }}>
      <div className="panel" style={{ paddingBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Spreadsheet grid v3</h2>
            <div className="muted">Bulk fill, clearer save states, and stronger spreadsheet workflows.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge warn">Dirty rows: {dirtyCount}</span>
            <span className="badge accent">Selected rows: {selectedRows.length}</span>
            <button onClick={saveAllDirty} disabled={isPending || !dirtyCount} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2b3759', background: '#17213c', color: dirtyCount ? '#8ab4ff' : '#a7b4d6', cursor: dirtyCount ? 'pointer' : 'not-allowed' }}>Save all dirty</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="Bulk fill value" style={{ padding: 10, background: '#0b1020', color: '#eef3ff', border: '1px solid #2b3759', borderRadius: 8, minWidth: 180 }} />
          <button onClick={applyBulkValue} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2b3759', background: '#17213c', color: '#fbbf24', cursor: 'pointer' }}>Apply to selected rows</button>
        </div>
      </div>

      <section className="twoCol">
        <div className="panel">
          <div style={{ overflow: 'auto', border: '1px solid #2b3759', borderRadius: 14, maxHeight: 560 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 200px 220px 180px 140px 120px 120px', minWidth: 1040 }}>
              <div style={{ position: 'sticky', top: 0, left: 0, zIndex: 5, padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Sel</div>
              <div style={{ position: 'sticky', top: 0, left: 60, zIndex: 4, padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Row ID</div>
              <div style={{ position: 'sticky', top: 0, left: 260, zIndex: 4, padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Label</div>
              <div style={{ position: 'sticky', top: 0, zIndex: 3, padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>FY2025</div>
              <div style={{ position: 'sticky', top: 0, zIndex: 3, padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Origin</div>
              <div style={{ position: 'sticky', top: 0, zIndex: 3, padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Confidence</div>
              <div style={{ position: 'sticky', top: 0, zIndex: 3, padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>State</div>

              {rows.map((row, index) => {
                const active = row.rowId === selectedRow?.rowId;
                const chosen = selectedRows.includes(row.rowId);
                const dirty = dirtyRows.has(row.rowId);
                const rawValue = editedValues[row.rowId] || '0';
                const valid = isValidNumericInput(rawValue);
                const bg = active ? '#17213c' : index % 2 === 0 ? '#121a30' : '#0f1528';
                const border = !valid ? '#fca5a5' : active ? '#8ab4ff' : '#2b3759';
                return [
                  <div key={`${row.rowId}-sel-${index}`} style={{ position: 'sticky', left: 0, zIndex: 2, padding: 12, borderBottom: `1px solid ${border}`, background: bg }}><input type="checkbox" checked={chosen} onChange={() => toggleRowSelection(row.rowId)} /></div>,
                  <button key={`${row.rowId}-id-${index}`} onClick={() => { setSelectedRowId(row.rowId); setSelectedRows([row.rowId]); }} style={{ position: 'sticky', left: 60, zIndex: 2, padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.rowId}{dirty ? ' *' : ''}</button>,
                  <button key={`${row.rowId}-label-${index}`} onClick={() => { setSelectedRowId(row.rowId); setSelectedRows([row.rowId]); }} style={{ position: 'sticky', left: 260, zIndex: 2, padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer', fontWeight: 600 }}>{row.label}</button>,
                  <div key={`${row.rowId}-value-${index}`} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg }}>
                    <input
                      ref={(el) => { inputRefs.current[row.rowId] = el; }}
                      value={rawValue}
                      onChange={(e) => setEditedValues((current) => ({ ...current, [row.rowId]: sanitizeNumericInput(e.target.value) }))}
                      onFocus={() => { setSelectedRowId(row.rowId); setSelectedRows([row.rowId]); }}
                      onKeyDown={(e) => onValueKeyDown(e, row.rowId)}
                      style={{ width: '100%', padding: 8, background: '#0b1020', color: '#eef3ff', border: `1px solid ${valid ? '#2b3759' : '#fca5a5'}`, borderRadius: 8 }}
                    />
                    <div style={{ marginTop: 6, color: valid ? '#a7b4d6' : '#fca5a5', fontSize: 12 }}>
                      {valid ? `Display: ${formatNumericDisplay(rawValue)}` : 'Enter a valid number'}
                    </div>
                  </div>,
                  <div key={`${row.rowId}-origin-${index}`} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg }}><span className="badge accent">{row.origin}</span></div>,
                  <div key={`${row.rowId}-confidence-${index}`} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg }}><span className="badge good">{row.confidence}</span></div>,
                  <div key={`${row.rowId}-state-${index}`} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg }}>{saveBadge(saveStates[row.rowId])}</div>
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
                <strong>Live provenance</strong>
                {relatedProvenance.length ? relatedProvenance.map((item, index) => (
                  <div key={`${item.rowId}-${index}`} style={{ marginTop: 8 }}>
                    <div>{item.documentId} · Page {item.page ?? 'Unknown'}</div>
                    <div className="muted">{item.excerpt}</div>
                  </div>
                )) : <p className="muted">No live provenance found for this row yet.</p>}
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
    </section>
  );
}

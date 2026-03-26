'use client';

import { useMemo, useState } from 'react';
import { ReviewActionPanelV3 } from './review-action-panel-v3';

type ReviewTask = {
  id: string;
  status?: string;
  reason?: string;
};

type RowItem = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: string;
  confidence: string;
};

type Props = {
  spreadId: string;
  spreadVersionId: string;
  rows: RowItem[];
  tasks: ReviewTask[];
  formulaTrace: string[];
};

export function ActionContextWorkspace({ spreadId, spreadVersionId, rows, tasks, formulaTrace }: Props) {
  const [selectedRowId, setSelectedRowId] = useState(rows[0]?.rowId || '');

  const selectedRow = useMemo(
    () => rows.find((row) => row.rowId === selectedRowId) || rows[0],
    [rows, selectedRowId]
  );

  const targets = useMemo(() => {
    if (!selectedRow) return [];
    return [{
      rowId: selectedRow.rowId,
      label: selectedRow.label,
      periodId: '2025A',
      value: selectedRow.fy2025.replace(/[^0-9.-]/g, '') || '0'
    }];
  }, [selectedRow]);

  const relatedFormulas = useMemo(
    () => formulaTrace.filter((item) => item.includes(selectedRow?.rowId || '') || item.includes(selectedRow?.label || '')),
    [formulaTrace, selectedRow]
  );

  return (
    <section className="twoCol">
      <div className="panel">
        <h2>Selectable spread rows</h2>
        {rows.map((row) => {
          const active = row.rowId === selectedRow?.rowId;
          return (
            <button
              key={`${row.rowId}-${row.label}`}
              onClick={() => setSelectedRowId(row.rowId)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 12,
                marginBottom: 10,
                borderRadius: 14,
                border: `1px solid ${active ? '#8ab4ff' : '#2b3759'}`,
                background: active ? '#17213c' : '#121a30',
                color: '#eef3ff',
                cursor: 'pointer'
              }}
            >
              <strong>{row.label}</strong>
              <div style={{ marginTop: 6, color: '#a7b4d6', fontSize: 13 }}>
                {row.rowId} · {row.fy2025} · {row.origin}
              </div>
            </button>
          );
        })}
      </div>

      <div className="panel">
        <h2>Selected row context</h2>
        {selectedRow ? (
          <>
            <div className="listItem">
              <strong>{selectedRow.label}</strong>
              <p className="muted">Row ID: {selectedRow.rowId}</p>
              <p className="muted">Origin: {selectedRow.origin} · Confidence: {selectedRow.confidence}</p>
              <div className="badge accent">Current value: {selectedRow.fy2025}</div>
            </div>

            <div className="listItem">
              <strong>Sample provenance</strong>
              <p className="muted">Document: borrower-package.pdf</p>
              <p className="muted">Page: 2</p>
              <p className="muted">Extracted line label: {selectedRow.label}</p>
            </div>

            <div className="listItem">
              <strong>Formula follow-up</strong>
              {relatedFormulas.length ? relatedFormulas.map((item) => (
                <div key={item} style={{ marginTop: 8 }}>{item}</div>
              )) : <p className="muted">No direct formula strings matched this row yet.</p>}
            </div>
          </>
        ) : (
          <div className="listItem">No row selected.</div>
        )}
      </div>

      <ReviewActionPanelV3 spreadId={spreadId} spreadVersionId={spreadVersionId} items={tasks} targets={targets} />
    </section>
  );
}

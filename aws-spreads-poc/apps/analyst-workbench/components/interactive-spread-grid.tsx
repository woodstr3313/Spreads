'use client';

import { useMemo, useState } from 'react';

type GridRow = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: string;
  confidence: string;
};

type Props = {
  rows: GridRow[];
  formulaTrace: string[];
};

export function InteractiveSpreadGrid({ rows, formulaTrace }: Props) {
  const [selectedRowId, setSelectedRowId] = useState(rows[0]?.rowId || '');

  const selectedRow = useMemo(
    () => rows.find((row) => row.rowId === selectedRowId) || rows[0],
    [rows, selectedRowId]
  );

  const relatedFormulas = useMemo(
    () => formulaTrace.filter((item) => item.includes(selectedRow?.rowId || '') || item.includes(selectedRow?.label || '')),
    [formulaTrace, selectedRow]
  );

  return (
    <section className="twoCol">
      <div className="panel">
        <h2>Interactive spread grid</h2>
        <div style={{ overflowX: 'auto', border: '1px solid #2b3759', borderRadius: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 220px 160px 160px 140px', minWidth: 900 }}>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Row ID</div>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Label</div>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>FY2025</div>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Origin</div>
            <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Confidence</div>

            {rows.map((row, index) => {
              const active = row.rowId === selectedRow?.rowId;
              const bg = active ? '#17213c' : index % 2 === 0 ? '#121a30' : '#0f1528';
              const border = active ? '#8ab4ff' : '#2b3759';
              return [
                <button key={`${row.rowId}-id-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.rowId}</button>,
                <button key={`${row.rowId}-label-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.label}</button>,
                <button key={`${row.rowId}-value-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.fy2025}</button>,
                <button key={`${row.rowId}-origin-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.origin}</button>,
                <button key={`${row.rowId}-confidence-${index}`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, borderBottom: `1px solid ${border}`, background: bg, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{row.confidence}</button>
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
              <div className="badge accent">Value: {selectedRow.fy2025}</div>
            </div>
            <div className="listItem">
              <strong>Formula context</strong>
              {relatedFormulas.length ? relatedFormulas.map((item) => (
                <div key={item} style={{ marginTop: 8 }}>{item}</div>
              )) : <p className="muted">No direct formula strings matched this row yet.</p>}
            </div>
          </>
        ) : <div className="listItem">No row selected.</div>}
      </div>
    </section>
  );
}

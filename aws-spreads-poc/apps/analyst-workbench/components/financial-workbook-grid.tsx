'use client';

import { useMemo, useState } from 'react';
import { structureRows, StructuredRow } from '../lib/statement-layout';

type RowItem = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: string;
  confidence: string;
};

type Props = {
  rows: RowItem[];
};

function alphaColumn(index: number) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[index] || `C${index + 1}`;
}

export function FinancialWorkbookGrid({ rows }: Props) {
  const structured = useMemo(() => structureRows(rows), [rows]);
  const [selectedRowId, setSelectedRowId] = useState(structured[0]?.rowId || '');
  const selectedRow = structured.find((row) => row.rowId === selectedRowId) || structured[0];

  const statementBreaks = new Set<string>();
  const groupBreaks = new Set<string>();
  structured.forEach((row, index) => {
    const prev = structured[index - 1];
    if (!prev || prev.statementId !== row.statementId) statementBreaks.add(row.rowId);
    if (!prev || prev.groupId !== row.groupId || prev.statementId !== row.statementId) groupBreaks.add(row.rowId);
  });

  return (
    <section className="grid" style={{ gap: 16 }}>
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginBottom: 6 }}>Financial workbook</h2>
            <div className="muted">Excel-like sheet with statements, groups, and totals.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span className="badge accent">Statements: {new Set(structured.map((row) => row.statementId)).size}</span>
            <span className="badge good">Groups: {new Set(structured.map((row) => `${row.statementId}:${row.groupId}`)).size}</span>
            <span className="badge warn">Rows: {structured.length}</span>
          </div>
        </div>
      </div>

      <section className="twoCol">
        <div className="panel">
          <div style={{ display: 'grid', gridTemplateColumns: '60px 80px 260px 180px 140px 120px', overflow: 'auto', border: '1px solid #2b3759', borderRadius: 14, maxHeight: 620 }}>
            <div style={{ position: 'sticky', top: 0, left: 0, zIndex: 5, padding: 12, background: '#17213c', borderBottom: '1px solid #2b3759', fontWeight: 700 }}></div>
            <div style={{ position: 'sticky', top: 0, zIndex: 4, padding: 12, background: '#17213c', borderBottom: '1px solid #2b3759', fontWeight: 700 }}>{alphaColumn(0)}</div>
            <div style={{ position: 'sticky', top: 0, zIndex: 4, padding: 12, background: '#17213c', borderBottom: '1px solid #2b3759', fontWeight: 700 }}>{alphaColumn(1)}</div>
            <div style={{ position: 'sticky', top: 0, zIndex: 4, padding: 12, background: '#17213c', borderBottom: '1px solid #2b3759', fontWeight: 700 }}>{alphaColumn(2)}</div>
            <div style={{ position: 'sticky', top: 0, zIndex: 4, padding: 12, background: '#17213c', borderBottom: '1px solid #2b3759', fontWeight: 700 }}>{alphaColumn(3)}</div>
            <div style={{ position: 'sticky', top: 0, zIndex: 4, padding: 12, background: '#17213c', borderBottom: '1px solid #2b3759', fontWeight: 700 }}>{alphaColumn(4)}</div>

            {structured.map((row, index) => {
              const active = row.rowId === selectedRow?.rowId;
              const baseBg = active ? '#17213c' : row.rowKind === 'statement_total' ? '#13233b' : row.rowKind === 'group_total' ? '#101d34' : index % 2 === 0 ? '#121a30' : '#0f1528';
              const border = active ? '#8ab4ff' : '#2b3759';
              const isStatementStart = statementBreaks.has(row.rowId);
              const isGroupStart = groupBreaks.has(row.rowId);
              const labelWeight = row.rowKind === 'statement_total' ? 700 : row.rowKind === 'group_total' ? 600 : 500;
              return [
                <div key={`${row.rowId}-n`} style={{ position: 'sticky', left: 0, zIndex: 2, padding: 12, background: baseBg, borderBottom: `1px solid ${border}`, color: '#a7b4d6' }}>{index + 1}</div>,
                <button key={`${row.rowId}-statement`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, background: baseBg, borderBottom: `1px solid ${border}`, color: '#eef3ff', textAlign: 'left', cursor: 'pointer' }}>{isStatementStart ? row.statementLabel : ''}</button>,
                <button key={`${row.rowId}-label`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, background: baseBg, borderBottom: `1px solid ${border}`, color: '#eef3ff', textAlign: 'left', cursor: 'pointer', fontWeight: labelWeight, paddingLeft: 12 + row.indent * 18 }}>
                  {isGroupStart && row.rowKind === 'detail' ? `${row.groupLabel} · ` : ''}{row.label}
                </button>,
                <button key={`${row.rowId}-value`} onClick={() => setSelectedRowId(row.rowId)} style={{ padding: 12, background: baseBg, borderBottom: `1px solid ${border}`, color: '#eef3ff', textAlign: 'right', cursor: 'pointer', fontWeight: row.rowKind !== 'detail' ? 700 : 500 }}>{row.fy2025}</button>,
                <div key={`${row.rowId}-origin`} style={{ padding: 12, background: baseBg, borderBottom: `1px solid ${border}` }}><span className="badge accent">{row.origin}</span></div>,
                <div key={`${row.rowId}-kind`} style={{ padding: 12, background: baseBg, borderBottom: `1px solid ${border}` }}><span className={`badge ${row.rowKind === 'statement_total' ? 'good' : row.rowKind === 'group_total' ? 'warn' : 'accent'}`}>{row.rowKind.replace('_', ' ')}</span></div>
              ];
            }).flat()}
          </div>
          <div className="muted" style={{ marginTop: 10 }}>Excel-like cues included: row numbers, column letters, statement breaks, group breaks, and total row emphasis.</div>
        </div>

        <div className="panel">
          <h2>Formula bar</h2>
          {selectedRow ? (
            <>
              <div className="listItem">
                <strong>Name box</strong>
                <div className="badge accent" style={{ marginTop: 8 }}>{selectedRow.rowId}</div>
              </div>
              <div className="listItem">
                <strong>Formula / value bar</strong>
                <div style={{ marginTop: 8, padding: 10, border: '1px solid #2b3759', borderRadius: 8, background: '#0b1020', fontFamily: 'monospace' }}>
                  {selectedRow.rowKind === 'detail' ? selectedRow.fy2025 : `=${selectedRow.rowId}`}
                </div>
              </div>
              <div className="listItem">
                <strong>Selected row context</strong>
                <div className="muted" style={{ marginTop: 8 }}>Statement: {selectedRow.statementLabel}</div>
                <div className="muted">Group: {selectedRow.groupLabel}</div>
                <div className="muted">Kind: {selectedRow.rowKind}</div>
                <div className="muted">Origin: {selectedRow.origin} · Confidence: {selectedRow.confidence}</div>
              </div>
            </>
          ) : <div className="listItem">No row selected.</div>}
        </div>
      </section>
    </section>
  );
}

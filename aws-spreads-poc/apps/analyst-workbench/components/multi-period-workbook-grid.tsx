'use client';

import { KeyboardEvent, useMemo, useRef, useState } from 'react';
import { buildWorkbookOutline, buildWorkbookPeriods, buildWorkbookRows, recalculateWorkbook, WorkbookRow } from '../lib/multi-period-workbook';
import { StatementPanel } from './statement-panel';

function colLetter(index: number) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[index] || `C${index + 1}`;
}

export function MultiPeriodWorkbookGrid() {
  const periods = useMemo(() => buildWorkbookPeriods(), []);
  const [rows, setRows] = useState<WorkbookRow[]>(() => buildWorkbookRows());
  const [selectedCell, setSelectedCell] = useState<{ rowId: string; periodId: string }>({ rowId: rows[0]?.rowId || 'NET_SALES', periodId: periods[0]?.id || 'fy2023' });
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const outline = useMemo(() => buildWorkbookOutline(rows), [rows]);
  const selectedRow = rows.find((row) => row.rowId === selectedCell.rowId) || rows[0];

  const statementBreaks = new Set<string>();
  const groupBreaks = new Set<string>();
  rows.forEach((row, index) => {
    const prev = rows[index - 1];
    if (!prev || prev.statementId !== row.statementId) statementBreaks.add(row.rowId);
    if (!prev || prev.groupId !== row.groupId || prev.statementId !== row.statementId) groupBreaks.add(row.rowId);
  });

  const editable = (row: WorkbookRow) => row.rowKind === 'detail';

  const moveCell = (rowId: string, periodId: string, rowDelta: number, colDelta: number) => {
    const rowIndex = rows.findIndex((r) => r.rowId === rowId);
    const colIndex = periods.findIndex((p) => p.id === periodId);
    const nextRow = rows[rowIndex + rowDelta] || rows[rowIndex];
    const nextCol = periods[colIndex + colDelta] || periods[colIndex];
    const nextKey = `${nextRow.rowId}:${nextCol.id}`;
    setSelectedCell({ rowId: nextRow.rowId, periodId: nextCol.id });
    inputRefs.current[nextKey]?.focus();
    inputRefs.current[nextKey]?.select();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, row: WorkbookRow, periodId: string) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); moveCell(row.rowId, periodId, 0, 1); return; }
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveCell(row.rowId, periodId, 0, -1); return; }
    if (event.key === 'ArrowDown' || event.key === 'Enter') { event.preventDefault(); moveCell(row.rowId, periodId, 1, 0); return; }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveCell(row.rowId, periodId, -1, 0); }
  };

  const updateValue = (rowId: string, periodId: string, value: string) => {
    setRows((current) => recalculateWorkbook(current.map((row) => row.rowId === rowId ? { ...row, values: { ...row.values, [periodId]: value.replace(/[^0-9.-]/g, '') } } : row)));
  };

  return (
    <section className="grid" style={{ gap: 16 }}>
      <section className="twoCol">
        <StatementPanel items={outline} />
        <section className="panel">
          <h2>Formula bar</h2>
          {selectedRow ? (
            <>
              <div className="listItem">
                <strong>Name box</strong>
                <div className="badge accent" style={{ marginTop: 8 }}>{selectedCell.rowId}:{selectedCell.periodId}</div>
              </div>
              <div className="listItem">
                <strong>Value / formula</strong>
                <div style={{ marginTop: 8, padding: 10, border: '1px solid #2b3759', borderRadius: 8, background: '#0b1020', fontFamily: 'monospace' }}>
                  {editable(selectedRow) ? selectedRow.values[selectedCell.periodId] : `=${selectedRow.rowId}`}
                </div>
              </div>
              <div className="listItem">
                <strong>Selected row context</strong>
                <div className="muted" style={{ marginTop: 8 }}>Statement: {selectedRow.statementLabel}</div>
                <div className="muted">Group: {selectedRow.groupLabel}</div>
                <div className="muted">Kind: {selectedRow.rowKind}</div>
              </div>
            </>
          ) : <div className="listItem">No cell selected.</div>}
        </section>
      </section>

      <section className="panel">
        <div style={{ overflow: 'auto', border: '1px solid #2b3759', borderRadius: 14, maxHeight: 680 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `60px 100px 280px repeat(${periods.length}, 160px)`, minWidth: 60 + 100 + 280 + periods.length * 160 }}>
            <div style={{ position: 'sticky', top: 0, left: 0, zIndex: 6, padding: 12, background: '#17213c', borderBottom: '1px solid #2b3759' }}></div>
            <div style={{ position: 'sticky', top: 0, zIndex: 5, padding: 12, background: '#17213c', borderBottom: '1px solid #2b3759', fontWeight: 700 }}>{colLetter(0)}</div>
            <div style={{ position: 'sticky', top: 0, zIndex: 5, padding: 12, background: '#17213c', borderBottom: '1px solid #2b3759', fontWeight: 700 }}>{colLetter(1)}</div>
            {periods.map((period, i) => <div key={period.id} style={{ position: 'sticky', top: 0, zIndex: 5, padding: 12, background: '#17213c', borderBottom: '1px solid #2b3759', fontWeight: 700 }}>{colLetter(i + 2)} · {period.label}</div>)}

            {rows.map((row, rowIndex) => {
              const baseBg = row.rowKind === 'statement_total' ? '#13233b' : row.rowKind === 'group_total' ? '#101d34' : rowIndex % 2 === 0 ? '#121a30' : '#0f1528';
              const statementStart = statementBreaks.has(row.rowId);
              const groupStart = groupBreaks.has(row.rowId);
              return [
                <div key={`${row.rowId}-n`} style={{ position: 'sticky', left: 0, zIndex: 2, padding: 12, background: baseBg, borderBottom: '1px solid #2b3759', color: '#a7b4d6' }}>{rowIndex + 1}</div>,
                <div key={`${row.rowId}-statement`} style={{ padding: 12, background: baseBg, borderBottom: '1px solid #2b3759', color: '#eef3ff' }}>{statementStart ? row.statementLabel : ''}</div>,
                <div key={`${row.rowId}-label`} style={{ padding: 12, background: baseBg, borderBottom: '1px solid #2b3759', color: '#eef3ff', fontWeight: row.rowKind === 'detail' ? 500 : 700, paddingLeft: 12 + row.indent * 18 }}>{groupStart && row.rowKind === 'detail' ? `${row.groupLabel} · ` : ''}{row.label}</div>,
                ...periods.map((period) => {
                  const key = `${row.rowId}:${period.id}`;
                  const active = selectedCell.rowId === row.rowId && selectedCell.periodId === period.id;
                  return editable(row)
                    ? <div key={key} style={{ padding: 12, background: active ? '#17213c' : baseBg, borderBottom: '1px solid #2b3759' }}>
                        <input
                          ref={(el) => { inputRefs.current[key] = el; }}
                          value={row.values[period.id]}
                          onChange={(e) => updateValue(row.rowId, period.id, e.target.value)}
                          onFocus={() => setSelectedCell({ rowId: row.rowId, periodId: period.id })}
                          onKeyDown={(e) => onKeyDown(e, row, period.id)}
                          style={{ width: '100%', padding: 8, textAlign: 'right', background: '#0b1020', color: '#eef3ff', border: `1px solid ${active ? '#8ab4ff' : '#2b3759'}`, borderRadius: 8 }}
                        />
                      </div>
                    : <button key={key} onClick={() => setSelectedCell({ rowId: row.rowId, periodId: period.id })} style={{ padding: 12, background: active ? '#17213c' : baseBg, borderBottom: '1px solid #2b3759', color: '#eef3ff', textAlign: 'right', cursor: 'pointer', fontWeight: 700 }}>{row.values[period.id]}</button>;
                })
              ];
            }).flat()}
          </div>
        </div>
        <div className="muted" style={{ marginTop: 10 }}>Excel-like workbook cues included: multiple periods, in-grid editing, row numbers, column letters, formula bar, keyboard navigation, statement/group breaks, and computed totals.</div>
      </section>
    </section>
  );
}

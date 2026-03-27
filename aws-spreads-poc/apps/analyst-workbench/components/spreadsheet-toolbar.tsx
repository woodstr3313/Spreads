'use client';

import { useMemo, useState } from 'react';

type RowItem = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: string;
  confidence: string;
};

type Props = {
  rows: RowItem[];
  onFilterChange?: (value: string) => void;
};

export function SpreadsheetToolbar({ rows, onFilterChange }: Props) {
  const [query, setQuery] = useState('');

  const summary = useMemo(() => {
    const aiRows = rows.filter((row) => row.origin === 'AI_SUGGESTED').length;
    const formulaRows = rows.filter((row) => row.origin === 'FORMULA').length;
    return { aiRows, formulaRows };
  }, [rows]);

  return (
    <section className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: 6 }}>Spreadsheet toolbar</h2>
          <div className="muted">Search rows, review derived counts, and prep for future export/actions.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="badge accent">AI rows: {summary.aiRows}</span>
          <span className="badge good">Formula rows: {summary.formulaRows}</span>
          <span className="badge warn">Total rows: {rows.length}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onFilterChange?.(e.target.value);
          }}
          placeholder="Filter by row ID or label"
          style={{ padding: 10, background: '#0b1020', color: '#eef3ff', border: '1px solid #2b3759', borderRadius: 8, minWidth: 280 }}
        />
        <button style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2b3759', background: '#17213c', color: '#8ab4ff', cursor: 'pointer' }}>Export shell</button>
        <button style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #2b3759', background: '#17213c', color: '#fbbf24', cursor: 'pointer' }}>Lock period shell</button>
      </div>
    </section>
  );
}

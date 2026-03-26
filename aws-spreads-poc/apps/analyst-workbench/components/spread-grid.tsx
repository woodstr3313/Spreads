'use client';

type GridRow = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: string;
  confidence: string;
};

type Props = {
  rows: GridRow[];
};

export function SpreadGrid({ rows }: Props) {
  return (
    <section className="panel">
      <h2>Grid-style spread view</h2>
      <div style={{ overflowX: 'auto', border: '1px solid #2b3759', borderRadius: 14 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 220px 160px 160px 140px',
            minWidth: 900
          }}
        >
          <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Row ID</div>
          <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Label</div>
          <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>FY2025</div>
          <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Origin</div>
          <div style={{ padding: 12, borderBottom: '1px solid #2b3759', background: '#17213c', fontWeight: 700 }}>Confidence</div>

          {rows.map((row, index) => (
            <>
              <div key={`${row.rowId}-id-${index}`} style={{ padding: 12, borderBottom: '1px solid #2b3759', background: index % 2 === 0 ? '#121a30' : '#0f1528' }}>{row.rowId}</div>
              <div key={`${row.rowId}-label-${index}`} style={{ padding: 12, borderBottom: '1px solid #2b3759', background: index % 2 === 0 ? '#121a30' : '#0f1528' }}>{row.label}</div>
              <div key={`${row.rowId}-value-${index}`} style={{ padding: 12, borderBottom: '1px solid #2b3759', background: index % 2 === 0 ? '#121a30' : '#0f1528' }}>{row.fy2025}</div>
              <div key={`${row.rowId}-origin-${index}`} style={{ padding: 12, borderBottom: '1px solid #2b3759', background: index % 2 === 0 ? '#121a30' : '#0f1528' }}>{row.origin}</div>
              <div key={`${row.rowId}-confidence-${index}`} style={{ padding: 12, borderBottom: '1px solid #2b3759', background: index % 2 === 0 ? '#121a30' : '#0f1528' }}>{row.confidence}</div>
            </>
          ))}
        </div>
      </div>
    </section>
  );
}

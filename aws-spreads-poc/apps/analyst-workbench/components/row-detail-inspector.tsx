type RowItem = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: string;
  confidence: string;
};

type Props = {
  row?: RowItem;
};

export function RowDetailInspector({ row }: Props) {
  return (
    <section className="panel">
      <h2>Row detail inspector</h2>
      {row ? (
        <div className="listItem">
          <strong>{row.label}</strong>
          <div className="muted" style={{ marginTop: 8 }}>Row ID: {row.rowId}</div>
          <div className="muted">Origin: {row.origin}</div>
          <div className="muted">Confidence: {row.confidence}</div>
          <div className="badge accent" style={{ marginTop: 10 }}>Current value: {row.fy2025}</div>
        </div>
      ) : <div className="listItem">No row selected.</div>}
    </section>
  );
}

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
  items: ProvenanceItem[];
};

export function ProvenanceTimelinePanel({ items }: Props) {
  return (
    <section className="panel">
      <h2>Provenance timeline</h2>
      {items.length ? items.slice(0, 8).map((item, index) => (
        <div className="listItem" key={`${item.rowId}-${index}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <strong>{item.rowId}</strong>
            <span className="badge accent">{item.documentId}</span>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>Page {item.page ?? 'Unknown'} · {item.excerpt}</div>
          <div className="muted">Origin: {item.origin} · Confidence: {item.confidence}</div>
        </div>
      )) : <div className="listItem">No provenance items available.</div>}
    </section>
  );
}

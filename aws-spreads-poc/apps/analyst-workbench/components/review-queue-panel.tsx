type ReviewItem = {
  title: string;
  detail: string;
  status: string;
};

type Props = {
  items: ReviewItem[];
};

export function ReviewQueuePanel({ items }: Props) {
  return (
    <section className="panel">
      <h2>Review queue</h2>
      {items.length ? items.map((item, index) => (
        <div className="listItem" key={`${item.title}-${index}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong>{item.title}</strong>
            <span className="badge warn">{item.status}</span>
          </div>
          <p className="muted">{item.detail}</p>
        </div>
      )) : <div className="listItem">No open review items.</div>}
    </section>
  );
}

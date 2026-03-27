type ValidationItem = {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
};

type Props = {
  items: ValidationItem[];
};

export function ValidationSummaryPanel({ items }: Props) {
  return (
    <section className="panel">
      <h2>Validation summary</h2>
      {items.map((item, index) => {
        const badgeClass = item.severity === 'high' ? 'bad' : item.severity === 'medium' ? 'warn' : 'good';
        return (
          <div className="listItem" key={`${item.title}-${index}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{item.title}</strong>
              <span className={`badge ${badgeClass}`}>{item.severity.toUpperCase()}</span>
            </div>
            <p className="muted">{item.detail}</p>
          </div>
        );
      })}
    </section>
  );
}

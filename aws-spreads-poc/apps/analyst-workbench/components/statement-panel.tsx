type OutlineGroup = { id: string; label: string; count: number };
type OutlineStatement = { id: string; label: string; groups: OutlineGroup[] };

type Props = {
  items: OutlineStatement[];
};

export function StatementPanel({ items }: Props) {
  return (
    <section className="panel">
      <h2>Statement outline</h2>
      {items.map((statement) => (
        <div className="listItem" key={statement.id}>
          <strong>{statement.label}</strong>
          <div className="muted" style={{ marginTop: 8 }}>Groups: {statement.groups.length}</div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {statement.groups.map((group) => (
              <div key={group.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{group.label}</span>
                <span className="badge accent">{group.count}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

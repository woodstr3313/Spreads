type FormulaHighlight = {
  id: string;
  title: string;
  formula: string;
  explanation: string;
};

type Props = {
  items: FormulaHighlight[];
};

export function FormulaInspectorPanel({ items }: Props) {
  return (
    <section className="panel">
      <h2>Formula inspector</h2>
      {items.map((item) => (
        <div className="listItem" key={item.id}>
          <strong>{item.title}</strong>
          <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 13 }}>{item.formula}</div>
          <p className="muted">{item.explanation}</p>
        </div>
      ))}
    </section>
  );
}

'use client';

type ToastItem = {
  id: string;
  tone: 'info' | 'success' | 'warning';
  title: string;
  detail: string;
};

type Props = {
  items: ToastItem[];
};

export function ToastCenter({ items }: Props) {
  if (!items.length) return null;

  return (
    <section className="grid" style={{ gap: 10 }}>
      {items.map((item) => {
        const badgeClass = item.tone === 'success' ? 'good' : item.tone === 'warning' ? 'warn' : 'accent';
        return (
          <div key={item.id} className="panel" style={{ paddingTop: 12, paddingBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{item.title}</strong>
              <span className={`badge ${badgeClass}`}>{item.tone.toUpperCase()}</span>
            </div>
            <div className="muted" style={{ marginTop: 6 }}>{item.detail}</div>
          </div>
        );
      })}
    </section>
  );
}

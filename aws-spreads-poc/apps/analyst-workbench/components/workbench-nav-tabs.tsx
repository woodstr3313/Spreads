type TabItem = {
  label: string;
  href: string;
  active?: boolean;
};

type Props = {
  items: TabItem[];
};

export function WorkbenchNavTabs({ items }: Props) {
  return (
    <section className="panel" style={{ paddingTop: 12, paddingBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`badge ${item.active ? 'accent' : ''}`}
            style={{ padding: '8px 12px' }}
          >
            {item.label}
          </a>
        ))}
      </div>
    </section>
  );
}

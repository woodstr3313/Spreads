'use client';

type Props = {
  reviewCount: number;
  highValidationCount: number;
};

export function ReviewActionDock({ reviewCount, highValidationCount }: Props) {
  return (
    <section className="panel">
      <h2>Review action dock</h2>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a href="#review-queue" className="badge warn" style={{ padding: '8px 12px' }}>Open queue: {reviewCount}</a>
        <a href="#validation-summary" className="badge bad" style={{ padding: '8px 12px' }}>High findings: {highValidationCount}</a>
        <a href="#formula-inspector" className="badge accent" style={{ padding: '8px 12px' }}>Inspect formulas</a>
        <a href="#spreadsheet-surface" className="badge good" style={{ padding: '8px 12px' }}>Jump to grid</a>
      </div>
    </section>
  );
}

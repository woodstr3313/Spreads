import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../../lib/workbench-mappers';
import { extractProvenanceSummaries } from '../../../../../../lib/live-provenance';

type PageProps = {
  params: Promise<{
    spreadId: string;
    spreadVersionId: string;
  }>;
};

async function loadData(spreadId: string, spreadVersionId: string) {
  try {
    const [spread, reviewTasks] = await Promise.all([
      fetchSpreadVersion(spreadId, spreadVersionId),
      fetchReviewTasks(spreadId)
    ]);

    return {
      mode: 'live' as const,
      spread,
      mapped: mapLiveResponsesToWorkbench(spreadId, spreadVersionId, spread as never, reviewTasks as never),
      provenance: extractProvenanceSummaries(spread as never)
    };
  } catch {
    const fallback = buildFallbackSpread(spreadId, spreadVersionId);
    return {
      mode: 'mock' as const,
      spread: null,
      mapped: fallback,
      provenance: fallback.rows.slice(0, 6).map((row) => ({
        rowId: row.rowId,
        documentId: 'borrower-package.pdf',
        page: 2,
        excerpt: row.label,
        origin: row.origin,
        confidence: row.confidence,
        value: row.fy2025
      }))
    };
  }
}

export default async function LiveProvenancePage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, mapped, provenance } = await loadData(spreadId, spreadVersionId);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Live provenance route</div>
        <h1>Provenance summaries for {spreadId}</h1>
        <p className="muted">
          This route starts reading provenance directly from live spread cells when available. When live cell provenance is not there yet, it falls back to mock summaries so the UI path still works.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Rows</div><div className="kpi">{mapped.rows.length}</div></div>
          <div className="cardStat"><div className="muted">Provenance items</div><div className="kpi">{provenance.length}</div></div>
          <div className="cardStat"><div className="muted">Version</div><div className="kpi">{spreadVersionId}</div></div>
        </div>
      </section>

      <section className="panel">
        <h2>Cell provenance summaries</h2>
        {provenance.length ? provenance.map((item, index) => (
          <div className="listItem" key={`${item.rowId}-${index}`}>
            <strong>{item.rowId}</strong>
            <p className="muted">Document: {item.documentId}</p>
            <p className="muted">Page: {item.page ?? 'Unknown'}</p>
            <p className="muted">Excerpt: {item.excerpt}</p>
            <p className="muted">Origin: {item.origin} · Confidence: {item.confidence}</p>
            <div className="badge accent">Value: {item.value}</div>
          </div>
        )) : <div className="listItem">No provenance references were returned.</div>}
      </section>
    </main>
  );
}

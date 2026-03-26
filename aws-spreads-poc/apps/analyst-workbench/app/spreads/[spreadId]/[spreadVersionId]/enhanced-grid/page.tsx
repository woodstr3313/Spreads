import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../lib/workbench-mappers';
import { extractProvenanceSummaries } from '../../../../../lib/live-provenance';
import { EnhancedValidatedSpreadGrid } from '../../../../../components/enhanced-validated-spread-grid';

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
      spread: mapLiveResponsesToWorkbench(spreadId, spreadVersionId, spread as never, reviewTasks as never),
      provenance: extractProvenanceSummaries(spread as never)
    };
  } catch {
    const fallback = buildFallbackSpread(spreadId, spreadVersionId);
    return {
      mode: 'mock' as const,
      spread: fallback,
      provenance: fallback.rows.map((row) => ({
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

export default async function EnhancedGridPage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, spread, provenance } = await loadData(spreadId, spreadVersionId);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Enhanced grid route</div>
        <h1>Enhanced validated spread grid for {spreadId}</h1>
        <p className="muted">
          This route brings together richer provenance, tighter save flow behavior, and more spreadsheet-like interactions on top of the validated grid foundation.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Rows</div><div className="kpi">{spread.rows.length}</div></div>
          <div className="cardStat"><div className="muted">Formula items</div><div className="kpi">{spread.formulaTrace.length}</div></div>
          <div className="cardStat"><div className="muted">Provenance items</div><div className="kpi">{provenance.length}</div></div>
        </div>
      </section>

      <EnhancedValidatedSpreadGrid
        spreadId={spreadId}
        spreadVersionId={spreadVersionId}
        rows={spread.rows}
        formulaTrace={spread.formulaTrace}
        provenance={provenance}
      />
    </main>
  );
}

import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../lib/workbench-mappers';
import { extractProvenanceSummaries } from '../../../../../lib/live-provenance';
import { SpreadsheetGridV2 } from '../../../../../components/spreadsheet-grid-v2';

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

export default async function SpreadsheetV2Page({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, spread, provenance } = await loadData(spreadId, spreadVersionId);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Spreadsheet v2 route</div>
        <h1>Spreadsheet-like grid v2 for {spreadId}</h1>
        <p className="muted">
          This route pushes the grid closer to a true spreadsheet with sticky first columns, stronger keyboard navigation, and better unsaved-change visibility.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Rows</div><div className="kpi">{spread.rows.length}</div></div>
          <div className="cardStat"><div className="muted">Formula items</div><div className="kpi">{spread.formulaTrace.length}</div></div>
          <div className="cardStat"><div className="muted">Provenance items</div><div className="kpi">{provenance.length}</div></div>
        </div>
      </section>

      <SpreadsheetGridV2
        spreadId={spreadId}
        spreadVersionId={spreadVersionId}
        rows={spread.rows}
        formulaTrace={spread.formulaTrace}
        provenance={provenance}
      />
    </main>
  );
}

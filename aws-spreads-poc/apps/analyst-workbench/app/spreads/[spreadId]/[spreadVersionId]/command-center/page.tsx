import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../lib/workbench-mappers';
import { extractProvenanceSummaries } from '../../../../../lib/live-provenance';
import { buildFormulaHighlights, buildValidationSummary } from '../../../../../lib/workbench-insights';
import { SpreadsheetToolbar } from '../../../../../components/spreadsheet-toolbar';
import { ValidationSummaryPanel } from '../../../../../components/validation-summary-panel';
import { ReviewQueuePanel } from '../../../../../components/review-queue-panel';
import { FormulaInspectorPanel } from '../../../../../components/formula-inspector-panel';
import { SpreadsheetGridV3 } from '../../../../../components/spreadsheet-grid-v3';

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

    const mapped = mapLiveResponsesToWorkbench(spreadId, spreadVersionId, spread as never, reviewTasks as never);
    return {
      mode: 'live' as const,
      spread: mapped,
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

export default async function CommandCenterPage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, spread, provenance } = await loadData(spreadId, spreadVersionId);

  const validationItems = buildValidationSummary(spread.rows, spread.reviewQueue);
  const formulaItems = buildFormulaHighlights(spread.formulaTrace);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Analyst command center</div>
        <h1>Command center for {spreadId}</h1>
        <p className="muted">
          This route bundles the spreadsheet surface, validation insights, review queue, and formula inspection into one larger analyst workbench instead of making you jump across isolated demo pages.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Rows</div><div className="kpi">{spread.rows.length}</div></div>
          <div className="cardStat"><div className="muted">Review items</div><div className="kpi">{spread.reviewQueue.length}</div></div>
          <div className="cardStat"><div className="muted">Validation findings</div><div className="kpi">{validationItems.length}</div></div>
        </div>
      </section>

      <SpreadsheetToolbar rows={spread.rows} />

      <section className="twoCol">
        <ValidationSummaryPanel items={validationItems} />
        <ReviewQueuePanel items={spread.reviewQueue} />
      </section>

      <SpreadsheetGridV3
        spreadId={spreadId}
        spreadVersionId={spreadVersionId}
        rows={spread.rows}
        formulaTrace={spread.formulaTrace}
        provenance={provenance}
      />

      <FormulaInspectorPanel items={formulaItems} />
    </main>
  );
}

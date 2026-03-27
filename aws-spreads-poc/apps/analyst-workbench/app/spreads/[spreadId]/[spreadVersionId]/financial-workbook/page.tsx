import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../lib/workbench-mappers';
import { buildFormulaHighlights, buildValidationSummary } from '../../../../../lib/workbench-insights';
import { buildKpis } from '../../../../../lib/workbench-kpis';
import { structureRows, buildStatementOutline } from '../../../../../lib/statement-layout';
import { FinancialWorkbookGrid } from '../../../../../components/financial-workbook-grid';
import { StatementPanel } from '../../../../../components/statement-panel';
import { ValidationSummaryPanel } from '../../../../../components/validation-summary-panel';
import { ReviewQueuePanel } from '../../../../../components/review-queue-panel';
import { FormulaInspectorPanel } from '../../../../../components/formula-inspector-panel';
import { WorkbenchNavTabs } from '../../../../../components/workbench-nav-tabs';

type PageProps = {
  params: Promise<{ spreadId: string; spreadVersionId: string }>;
};

async function loadData(spreadId: string, spreadVersionId: string) {
  try {
    const [spread, reviewTasks] = await Promise.all([
      fetchSpreadVersion(spreadId, spreadVersionId),
      fetchReviewTasks(spreadId)
    ]);
    return {
      mode: 'live' as const,
      spread: mapLiveResponsesToWorkbench(spreadId, spreadVersionId, spread as never, reviewTasks as never)
    };
  } catch {
    return {
      mode: 'mock' as const,
      spread: buildFallbackSpread(spreadId, spreadVersionId)
    };
  }
}

export default async function FinancialWorkbookPage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, spread } = await loadData(spreadId, spreadVersionId);
  const structured = structureRows(spread.rows);
  const outline = buildStatementOutline(structured);
  const validationItems = buildValidationSummary(spread.rows, spread.reviewQueue);
  const formulaItems = buildFormulaHighlights(spread.formulaTrace);
  const kpis = buildKpis(spread.rows, spread.reviewQueue, validationItems);
  const tabs = [
    { label: 'Financial Workbook', href: `/spreads/${spreadId}/${spreadVersionId}/financial-workbook`, active: true },
    { label: 'Command Center V2', href: `/spreads/${spreadId}/${spreadVersionId}/command-center-v2` },
    { label: 'Spreadsheet V3', href: `/spreads/${spreadId}/${spreadVersionId}/spreadsheet-v3` }
  ];

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Financial workbook</div>
        <h1>Workbook for {spreadId}</h1>
        <p className="muted">Excel-like workbook surface with statements, groups, and totals layered on top of the analyst workbench foundation.</p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Statements</div><div className="kpi">{outline.length}</div></div>
          <div className="cardStat"><div className="muted">Review items</div><div className="kpi">{kpis.reviewItems}</div></div>
          <div className="cardStat"><div className="muted">Low confidence</div><div className="kpi">{kpis.lowConfidence}</div></div>
        </div>
      </section>

      <WorkbenchNavTabs items={tabs} />

      <section className="twoCol">
        <StatementPanel items={outline} />
        <ValidationSummaryPanel items={validationItems} />
      </section>

      <FinancialWorkbookGrid rows={spread.rows} />

      <section className="twoCol">
        <ReviewQueuePanel items={spread.reviewQueue} />
        <FormulaInspectorPanel items={formulaItems} />
      </section>
    </main>
  );
}

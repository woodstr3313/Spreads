import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../lib/workbench-mappers';
import { extractProvenanceSummaries } from '../../../../../lib/live-provenance';
import { buildFormulaHighlights, buildValidationSummary } from '../../../../../lib/workbench-insights';
import { buildKpis } from '../../../../../lib/workbench-kpis';
import { CommandCenterClient } from '../../../../../components/command-center-client';

type PageProps = {
  params: Promise<{ spreadId: string; spreadVersionId: string }>;
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
      provenance: fallback.rows.map((row) => ({ rowId: row.rowId, documentId: 'borrower-package.pdf', page: 2, excerpt: row.label, origin: row.origin, confidence: row.confidence, value: row.fy2025 }))
    };
  }
}

export default async function CommandCenterV2Page({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, spread, provenance } = await loadData(spreadId, spreadVersionId);
  const validationItems = buildValidationSummary(spread.rows, spread.reviewQueue);
  const formulaItems = buildFormulaHighlights(spread.formulaTrace);
  const kpis = buildKpis(spread.rows, spread.reviewQueue, validationItems);
  const toasts = [
    { id: 'toast-1', tone: mode === 'live' ? 'success' as const : 'info' as const, title: mode === 'live' ? 'Live data connected' : 'Mock mode active', detail: mode === 'live' ? 'The command center is reading from live AppSync responses.' : 'The command center is using fallback demo data.' },
    { id: 'toast-2', tone: kpis.highValidations > 0 ? 'warning' as const : 'success' as const, title: 'Validation pulse', detail: `${kpis.highValidations} high finding(s), ${kpis.reviewItems} open review item(s), and ${kpis.lowConfidence} low-confidence row(s).` }
  ];

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Analyst command center v2</div>
        <h1>Command center v2 for {spreadId}</h1>
        <p className="muted">A larger bundled workbench with integrated filtering, validation signals, review actions, provenance visibility, and formula inspection around the spreadsheet surface.</p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Total value</div><div className="kpi">{kpis.totalValue}</div></div>
          <div className="cardStat"><div className="muted">Low confidence</div><div className="kpi">{kpis.lowConfidence}</div></div>
          <div className="cardStat"><div className="muted">AI rows</div><div className="kpi">{kpis.aiRows}</div></div>
        </div>
      </section>

      <CommandCenterClient
        spreadId={spreadId}
        spreadVersionId={spreadVersionId}
        rows={spread.rows}
        reviewQueue={spread.reviewQueue}
        validationItems={validationItems}
        formulaItems={formulaItems}
        provenance={provenance}
        toasts={toasts}
      />
    </main>
  );
}

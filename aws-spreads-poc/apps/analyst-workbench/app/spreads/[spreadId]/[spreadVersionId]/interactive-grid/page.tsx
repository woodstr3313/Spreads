import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../lib/workbench-mappers';
import { InteractiveSpreadGrid } from '../../../../../components/interactive-spread-grid';

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
      spread: mapLiveResponsesToWorkbench(spreadId, spreadVersionId, spread as never, reviewTasks as never)
    };
  } catch {
    return {
      mode: 'mock' as const,
      spread: buildFallbackSpread(spreadId, spreadVersionId)
    };
  }
}

export default async function InteractiveGridPage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, spread } = await loadData(spreadId, spreadVersionId);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Interactive grid route</div>
        <h1>Interactive spread grid for {spreadId}</h1>
        <p className="muted">
          This route adds row selection directly in the grid and shows a drill-in panel beside it. It is the next step toward a more realistic spread editing experience.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Rows</div><div className="kpi">{spread.rows.length}</div></div>
          <div className="cardStat"><div className="muted">Formula items</div><div className="kpi">{spread.formulaTrace.length}</div></div>
          <div className="cardStat"><div className="muted">Template</div><div className="kpi">{spread.templateName}</div></div>
        </div>
      </section>

      <InteractiveSpreadGrid rows={spread.rows} formulaTrace={spread.formulaTrace} />
    </main>
  );
}

import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../lib/workbench-mappers';
import { SpreadGrid } from '../../../../../components/spread-grid';

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

export default async function SpreadGridPage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, spread } = await loadData(spreadId, spreadVersionId);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Grid-style spread route</div>
        <h1>Spread grid for {spreadId}</h1>
        <p className="muted">
          This route moves the workbench closer to a spreadsheet-like experience by rendering spread rows in a reusable grid component instead of a simple table or stack of cards.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Rows</div><div className="kpi">{spread.rows.length}</div></div>
          <div className="cardStat"><div className="muted">Open exceptions</div><div className="kpi">{spread.openExceptions}</div></div>
          <div className="cardStat"><div className="muted">Template</div><div className="kpi">{spread.templateName}</div></div>
        </div>
      </section>

      <SpreadGrid rows={spread.rows} />
    </main>
  );
}

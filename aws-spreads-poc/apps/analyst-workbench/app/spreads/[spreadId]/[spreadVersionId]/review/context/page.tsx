import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../../lib/workbench-mappers';
import { ProvenanceWorkspace } from '../../../../../../components/provenance-workspace';

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

export default async function ReviewContextPage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, spread } = await loadData(spreadId, spreadVersionId);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Row-aware review context</div>
        <h1>Context workspace for {spreadId}</h1>
        <p className="muted">
          This route makes the side context follow the selected row instead of showing static cards. It is the first step toward a more realistic drill-in experience.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Rows</div><div className="kpi">{spread.rows.length}</div></div>
          <div className="cardStat"><div className="muted">Formula items</div><div className="kpi">{spread.formulaTrace.length}</div></div>
          <div className="cardStat"><div className="muted">Version</div><div className="kpi">{spreadVersionId}</div></div>
        </div>
      </section>

      <ProvenanceWorkspace rows={spread.rows} formulaTrace={spread.formulaTrace} />
    </main>
  );
}

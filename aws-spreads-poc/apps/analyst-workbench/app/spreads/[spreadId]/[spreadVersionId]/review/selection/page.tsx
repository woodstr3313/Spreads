import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../../lib/workbench-mappers';
import { ActionContextWorkspace } from '../../../../../../components/action-context-workspace';

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
      tasks: (reviewTasks as { listReviewTasks?: Array<{ id?: string; status?: string; reason?: string }> }).listReviewTasks?.map((item) => ({
        id: item.id || 'unknown-task',
        status: item.status,
        reason: item.reason
      })) || []
    };
  } catch {
    const fallback = buildFallbackSpread(spreadId, spreadVersionId);
    return {
      mode: 'mock' as const,
      spread: fallback,
      tasks: fallback.reviewQueue.map((item, index) => ({ id: `mock-review-${index + 1}`, status: item.status, reason: item.detail }))
    };
  }
}

export default async function ReviewSelectionPage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, spread, tasks } = await loadData(spreadId, spreadVersionId);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Selection-driven review</div>
        <h1>Action target follows selected row</h1>
        <p className="muted">
          This route ties the reviewer action target to the currently selected spread row so overwrite decisions are based on what the reviewer is actually examining.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Rows</div><div className="kpi">{spread.rows.length}</div></div>
          <div className="cardStat"><div className="muted">Tasks</div><div className="kpi">{tasks.length}</div></div>
          <div className="cardStat"><div className="muted">Version</div><div className="kpi">{spreadVersionId}</div></div>
        </div>
      </section>

      <ActionContextWorkspace
        spreadId={spreadId}
        spreadVersionId={spreadVersionId}
        rows={spread.rows}
        tasks={tasks}
        formulaTrace={spread.formulaTrace}
      />
    </main>
  );
}

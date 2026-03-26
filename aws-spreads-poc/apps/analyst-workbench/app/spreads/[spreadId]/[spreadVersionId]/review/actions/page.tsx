import { fetchReviewTasks } from '../../../../../../lib/appsync-client';
import { buildFallbackSpread } from '../../../../../../lib/workbench-mappers';
import { ReviewActionPanel } from '../../../../../../components/review-action-panel';

type PageProps = {
  params: Promise<{
    spreadId: string;
    spreadVersionId: string;
  }>;
};

async function loadTasks(spreadId: string, spreadVersionId: string) {
  try {
    const reviewTasks = await fetchReviewTasks(spreadId);
    return {
      mode: 'live' as const,
      items: (reviewTasks as { listReviewTasks?: Array<{ id?: string; status?: string; reason?: string }> }).listReviewTasks?.map((item) => ({
        id: item.id || 'unknown-task',
        status: item.status,
        reason: item.reason
      })) || []
    };
  } catch {
    return {
      mode: 'mock' as const,
      items: buildFallbackSpread(spreadId, spreadVersionId).reviewQueue.map((item, index) => ({
        id: `mock-review-${index + 1}`,
        status: item.status,
        reason: item.detail
      }))
    };
  }
}

export default async function ReviewActionsPage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, items } = await loadTasks(spreadId, spreadVersionId);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Interactive review actions</div>
        <h1>Approve, reject, or overwrite</h1>
        <p className="muted">
          This is the first clickable review-actions surface in the workbench. It is designed to call the backend mutation helpers already added to the repo.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Spread</div><div className="kpi">{spreadId}</div></div>
          <div className="cardStat"><div className="muted">Version</div><div className="kpi">{spreadVersionId}</div></div>
          <div className="cardStat"><div className="muted">Tasks</div><div className="kpi">{items.length}</div></div>
        </div>
      </section>

      <ReviewActionPanel spreadId={spreadId} spreadVersionId={spreadVersionId} items={items} />
    </main>
  );
}

import { fetchReviewTasks } from '../../../../../lib/appsync-client';
import { buildFallbackSpread } from '../../../../../lib/workbench-mappers';

type PageProps = {
  params: Promise<{
    spreadId: string;
    spreadVersionId: string;
  }>;
};

async function loadReviewItems(spreadId: string, spreadVersionId: string) {
  try {
    const reviewTasks = await fetchReviewTasks(spreadId);
    return {
      mode: 'live' as const,
      tasks: (reviewTasks as { listReviewTasks?: Array<{ id?: string; status?: string; reason?: string }> }).listReviewTasks ?? []
    };
  } catch {
    return {
      mode: 'mock' as const,
      tasks: buildFallbackSpread(spreadId, spreadVersionId).reviewQueue.map((item, index) => ({
        id: `mock-review-${index + 1}`,
        status: item.status,
        reason: item.detail
      }))
    };
  }
}

export default async function ReviewWorkspacePage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const review = await loadReviewItems(spreadId, spreadVersionId);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Review workspace</div>
        <h1>Resolve exceptions for {spreadId}</h1>
        <p className="muted">
          This route is the first dedicated reviewer workspace. It surfaces open review tasks and shows where approve, reject, and overwrite actions will connect into backend mutations.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{review.mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Spread version</div><div className="kpi">{spreadVersionId}</div></div>
          <div className="cardStat"><div className="muted">Open review items</div><div className="kpi">{review.tasks.length}</div></div>
          <div className="cardStat"><div className="muted">Action path</div><div className="kpi">Mutation Ready</div></div>
        </div>
      </section>

      <section className="panel">
        <h2>Exception queue</h2>
        {review.tasks.length ? review.tasks.map((task) => (
          <div className="listItem" key={task.id || task.reason}>
            <strong>{task.id || 'Review item'}</strong>
            <p className="muted">{task.reason || 'No review reason provided'}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <div className="badge good">Approve hook ready</div>
              <div className="badge bad">Reject hook ready</div>
              <div className="badge warn">Overwrite cell hook ready</div>
              <div className="badge accent">Status: {task.status || 'OPEN'}</div>
            </div>
          </div>
        )) : <div className="listItem">No review items found.</div>}
      </section>

      <section className="twoCol">
        <div className="panel">
          <h2>What this enables next</h2>
          <div className="listItem">Approve or reject exception tasks from the UI.</div>
          <div className="listItem">Inline overwrite of low-confidence cells before re-running formulas.</div>
          <div className="listItem">Routing back to the spread view after reviewer decisions.</div>
        </div>

        <div className="panel">
          <h2>Backend hooks already prepared</h2>
          <div className="listItem">`resolveReviewTask` mutation helper</div>
          <div className="listItem">`updateCell` mutation helper</div>
          <div className="listItem">Spread-specific route context for the review action workspace</div>
        </div>
      </section>
    </main>
  );
}

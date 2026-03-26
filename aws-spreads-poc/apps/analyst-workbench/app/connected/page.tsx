import { fetchReviewTasks, fetchSpreadVersion } from '../../lib/appsync-client';
import { demoSpread } from '../../lib/mock-spread';

async function getWorkbenchData() {
  const spreadId = 'spread-demo-001';
  const spreadVersionId = 'sv-demo-001';

  try {
    const [spread, reviewTasks] = await Promise.all([
      fetchSpreadVersion(spreadId, spreadVersionId),
      fetchReviewTasks(spreadId)
    ]);

    return {
      mode: 'live' as const,
      spread,
      reviewTasks
    };
  } catch {
    return {
      mode: 'mock' as const,
      spread: demoSpread,
      reviewTasks: demoSpread.reviewQueue
    };
  }
}

export default async function ConnectedPage() {
  const data = await getWorkbenchData();

  const workflowState = data.mode === 'mock' ? data.spread.workflowState : String((data.spread as { getSpreadVersion?: { workflowState?: string } }).getSpreadVersion?.workflowState || 'UNKNOWN');
  const rowCount = data.mode === 'mock' ? data.spread.rows.length : Number((data.spread as { getSpreadVersion?: { cells?: unknown[] } }).getSpreadVersion?.cells?.length || 0);
  const reviewCount = data.mode === 'mock' ? data.reviewTasks.length : Number((data.reviewTasks as { listReviewTasks?: unknown[] }).listReviewTasks?.length || 0);

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Connected analyst workbench</div>
        <h1>Live data shell for Spreads</h1>
        <p className="muted">
          This route is the bridge from the UI into AppSync. If AppSync is not configured yet, it gracefully falls back to mock data so development can keep moving.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{data.mode === 'live' ? 'Live AppSync' : 'Mock Fallback'}</div></div>
          <div className="cardStat"><div className="muted">Workflow state</div><div className="kpi">{workflowState}</div></div>
          <div className="cardStat"><div className="muted">Rows loaded</div><div className="kpi">{rowCount}</div></div>
          <div className="cardStat"><div className="muted">Review tasks</div><div className="kpi">{reviewCount}</div></div>
        </div>
      </section>

      <section className="twoCol">
        <div className="panel">
          <h2>What this route proves</h2>
          <div className="listItem">The workbench now has a clear path to AppSync queries for spread versions and review tasks.</div>
          <div className="listItem">Missing environment values no longer block UI development because the page can render against mock spread data.</div>
          <div className="listItem">This gives us the right seam to add auth, mutations, subscriptions, and a real spreadsheet grid next.</div>
        </div>

        <div className="panel">
          <h2>Next integration targets</h2>
          <div className="listItem">Hook Cognito auth into the app and sign AppSync requests.</div>
          <div className="listItem">Load a real spread ID and spread version ID from route params.</div>
          <div className="listItem">Replace summary cards with live template, period, and exception metrics.</div>
        </div>
      </section>
    </main>
  );
}

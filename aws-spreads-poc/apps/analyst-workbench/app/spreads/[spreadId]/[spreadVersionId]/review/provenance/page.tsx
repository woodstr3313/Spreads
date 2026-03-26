import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../../lib/workbench-mappers';
import { ReviewActionPanelV3 } from '../../../../../../components/review-action-panel-v3';

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

export default async function ReviewProvenancePage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const { mode, spread, tasks } = await loadData(spreadId, spreadVersionId);

  const targets = spread.rows.map((row) => ({
    rowId: row.rowId,
    label: row.label,
    periodId: '2025A',
    value: row.fy2025.replace(/[^0-9.-]/g, '') || '0'
  }));

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Reviewer provenance workspace</div>
        <h1>Provenance and action context for {spreadId}</h1>
        <p className="muted">
          This route pairs the redirect-aware action panel with nearby provenance-style context so a reviewer can see source clues and current values while making a decision.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Rows</div><div className="kpi">{spread.rows.length}</div></div>
          <div className="cardStat"><div className="muted">Tasks</div><div className="kpi">{tasks.length}</div></div>
          <div className="cardStat"><div className="muted">Version</div><div className="kpi">{spreadVersionId}</div></div>
        </div>
      </section>

      <section className="twoCol">
        <ReviewActionPanelV3 spreadId={spreadId} spreadVersionId={spreadVersionId} items={tasks} targets={targets} />

        <div className="panel">
          <h2>Provenance-style context</h2>
          {spread.rows.slice(0, 6).map((row) => (
            <div className="listItem" key={`${row.rowId}-${row.label}`}>
              <strong>{row.label}</strong>
              <p className="muted">Origin: {row.origin} · Confidence: {row.confidence}</p>
              <p className="muted">Sample source reference: borrower-package.pdf · Page 2 · Extracted statement row</p>
              <div className="badge accent">Current value: {row.fy2025}</div>
            </div>
          ))}

          <h2 style={{ marginTop: 18 }}>Formula follow-up</h2>
          {spread.formulaTrace.length ? spread.formulaTrace.map((item) => (
            <div className="listItem" key={item}>{item}</div>
          )) : <div className="listItem">No formula follow-up items found.</div>}
        </div>
      </section>
    </main>
  );
}

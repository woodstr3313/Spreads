import { fetchSpreadVersion, fetchReviewTasks } from '../../../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../../../lib/workbench-mappers';
import { ReviewActionPanelV2 } from '../../../../../../components/review-action-panel-v2';

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

export default async function ReviewDrillinsPage({ params }: PageProps) {
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
        <div className="badge accent">Reviewer drill-ins</div>
        <h1>Decisioning workspace for {spreadId}</h1>
        <p className="muted">
          This route brings together the action panel, formula context, and provenance-style row context so a reviewer can make a grounded decision faster.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Mode</div><div className="kpi">{mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Rows</div><div className="kpi">{spread.rows.length}</div></div>
          <div className="cardStat"><div className="muted">Tasks</div><div className="kpi">{tasks.length}</div></div>
          <div className="cardStat"><div className="muted">Formula rows</div><div className="kpi">{spread.formulaTrace.length}</div></div>
        </div>
      </section>

      <section className="twoCol">
        <ReviewActionPanelV2 spreadId={spreadId} spreadVersionId={spreadVersionId} items={tasks} targets={targets} />

        <div className="panel">
          <h2>Formula context</h2>
          {spread.formulaTrace.length ? spread.formulaTrace.map((item) => (
            <div className="listItem" key={item}>{item}</div>
          )) : <div className="listItem">No formula context found.</div>}

          <h2 style={{ marginTop: 18 }}>Row context</h2>
          {spread.rows.slice(0, 6).map((row) => (
            <div className="listItem" key={`${row.rowId}-${row.label}`}>
              <strong>{row.label}</strong>
              <p className="muted">Origin: {row.origin} · Confidence: {row.confidence}</p>
              <div className="badge accent">Value: {row.fy2025}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

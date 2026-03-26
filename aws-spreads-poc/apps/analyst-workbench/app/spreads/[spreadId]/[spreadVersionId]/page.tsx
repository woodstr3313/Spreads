import { fetchReviewTasks, fetchSpreadVersion } from '../../../../lib/appsync-client';
import { buildFallbackSpread, mapLiveResponsesToWorkbench } from '../../../../lib/workbench-mappers';

type PageProps = {
  params: Promise<{
    spreadId: string;
    spreadVersionId: string;
  }>;
};

async function getPageData(spreadId: string, spreadVersionId: string) {
  try {
    const [spread, reviewTasks] = await Promise.all([
      fetchSpreadVersion(spreadId, spreadVersionId),
      fetchReviewTasks(spreadId)
    ]);

    return {
      mode: 'live' as const,
      data: mapLiveResponsesToWorkbench(spreadId, spreadVersionId, spread as never, reviewTasks as never)
    };
  } catch {
    return {
      mode: 'mock' as const,
      data: buildFallbackSpread(spreadId, spreadVersionId)
    };
  }
}

export default async function SpreadVersionPage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const result = await getPageData(spreadId, spreadVersionId);
  const spread = result.data;

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Dynamic spread route</div>
        <h1>{spread.spreadId} / {spread.spreadVersionId}</h1>
        <p className="muted">
          This route gives each spread version its own URL so analysts, reviewers, and future agent workflows can target a specific work item.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Data mode</div><div className="kpi">{result.mode === 'live' ? 'Live' : 'Mock'}</div></div>
          <div className="cardStat"><div className="muted">Workflow state</div><div className="kpi">{spread.workflowState}</div></div>
          <div className="cardStat"><div className="muted">Template</div><div className="kpi">{spread.templateName}</div></div>
          <div className="cardStat"><div className="muted">Open exceptions</div><div className="kpi">{spread.openExceptions}</div></div>
        </div>
      </section>

      <section className="twoCol">
        <div className="panel">
          <h2>Spread rows</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Label</th>
                <th>Value</th>
                <th>Origin</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {spread.rows.map((row) => (
                <tr key={`${row.rowId}-${row.label}`}>
                  <td>{row.rowId}</td>
                  <td>{row.label}</td>
                  <td>{row.fy2025}</td>
                  <td>{row.origin}</td>
                  <td>{row.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h2>Review queue</h2>
          {spread.reviewQueue.length ? spread.reviewQueue.map((item) => (
            <div className="listItem" key={`${item.title}-${item.status}`}>
              <strong>{item.title}</strong>
              <p className="muted">{item.detail}</p>
              <div className="badge warn">{item.status}</div>
            </div>
          )) : <div className="listItem">No review tasks found.</div>}
        </div>
      </section>

      <section className="twoCol">
        <div className="panel">
          <h2>Formula-derived rows</h2>
          {spread.formulaTrace.length ? spread.formulaTrace.map((item) => (
            <div className="listItem" key={item}>{item}</div>
          )) : <div className="listItem">No formula rows returned yet.</div>}
        </div>

        <div className="panel">
          <h2>What comes next</h2>
          <div className="listItem">Replace the simple table with a proper spreadsheet grid.</div>
          <div className="listItem">Add row click actions for provenance and formula tracing.</div>
          <div className="listItem">Add reviewer actions to approve or reject exceptions from the UI.</div>
        </div>
      </section>
    </main>
  );
}

import { WorkbenchNavTabs } from '../../../../../components/workbench-nav-tabs';
import { MultiPeriodWorkbookGrid } from '../../../../../components/multi-period-workbook-grid';

type PageProps = {
  params: Promise<{ spreadId: string; spreadVersionId: string }>;
};

export default async function MultiPeriodWorkbookPage({ params }: PageProps) {
  const { spreadId, spreadVersionId } = await params;
  const tabs = [
    { label: 'Multi-Period Workbook', href: `/spreads/${spreadId}/${spreadVersionId}/multi-period-workbook`, active: true },
    { label: 'Financial Workbook', href: `/spreads/${spreadId}/${spreadVersionId}/financial-workbook` },
    { label: 'Command Center V2', href: `/spreads/${spreadId}/${spreadVersionId}/command-center-v2` },
    { label: 'Spreadsheet V3', href: `/spreads/${spreadId}/${spreadVersionId}/spreadsheet-v3` }
  ];

  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Multi-period workbook</div>
        <h1>Workbook for {spreadId}</h1>
        <p className="muted">Editable workbook surface with multiple periods, statement/group organization, computed totals, and stronger Excel-like cell navigation.</p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Surface</div><div className="kpi">Workbook</div></div>
          <div className="cardStat"><div className="muted">Periods</div><div className="kpi">4</div></div>
          <div className="cardStat"><div className="muted">Statements</div><div className="kpi">2</div></div>
          <div className="cardStat"><div className="muted">Editing</div><div className="kpi">Inline</div></div>
        </div>
      </section>

      <WorkbenchNavTabs items={tabs} />
      <MultiPeriodWorkbookGrid />
    </main>
  );
}

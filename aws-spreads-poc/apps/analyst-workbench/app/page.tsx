const spreadRows = [
  { row: 'NET_SALES', label: 'Net Sales', fy2025: '$1,250,000', origin: 'AI_SUGGESTED', confidence: '0.97' },
  { row: 'COGS', label: 'COGS', fy2025: '$700,000', origin: 'AI_SUGGESTED', confidence: '0.94' },
  { row: 'GROSS_PROFIT', label: 'Gross Profit', fy2025: '$550,000', origin: 'FORMULA', confidence: '1.00' },
  { row: 'OPERATING_EXPENSES', label: 'Operating Expenses', fy2025: '$300,000', origin: 'AI_SUGGESTED', confidence: '0.91' },
  { row: 'EBITDA', label: 'EBITDA', fy2025: '$250,000', origin: 'FORMULA', confidence: '1.00' },
  { row: 'ACCOUNTS_PAYABLE', label: 'Accounts Payable', fy2025: '$100,000', origin: 'AI_SUGGESTED', confidence: '0.71' }
];

const reviewQueue = [
  {
    title: 'Low-confidence mapping',
    detail: 'Accounts Payable mapped at 0.71 confidence from page 2 of borrower-package.pdf',
    status: 'Needs review'
  },
  {
    title: 'Balance check',
    detail: 'Total Assets and Total Liabilities + Equity should be reconciled before lock.',
    status: 'Open'
  }
];

const formulaTrace = [
  'GROSS_PROFIT = NET_SALES - COGS',
  'EBITDA = GROSS_PROFIT - OPERATING_EXPENSES',
  'TOTAL_CURRENT_ASSETS = CASH_AND_EQUIVALENTS + ACCOUNTS_RECEIVABLE'
];

export default function Page() {
  return (
    <main className="page">
      <section className="hero">
        <div className="badge accent">Spreads analyst workbench</div>
        <h1>Commercial banking spread review cockpit</h1>
        <p className="muted">
          This frontend POC is built to sit on top of the AWS backend and give analysts a single place to review extraction,
          formulas, provenance, and exception workflows.
        </p>
        <div className="cards">
          <div className="cardStat"><div className="muted">Workflow state</div><div className="kpi">Review Required</div></div>
          <div className="cardStat"><div className="muted">Template</div><div className="kpi">C&I Standard</div></div>
          <div className="cardStat"><div className="muted">AI suggestions</div><div className="kpi">6</div></div>
          <div className="cardStat"><div className="muted">Open exceptions</div><div className="kpi">2</div></div>
        </div>
      </section>

      <section className="twoCol">
        <div className="panel">
          <h2>Spread grid preview</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Label</th>
                <th>FY2025</th>
                <th>Origin</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {spreadRows.map((row) => (
                <tr key={row.row}>
                  <td>{row.row}</td>
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
          {reviewQueue.map((item) => (
            <div className="listItem" key={item.title}>
              <strong>{item.title}</strong>
              <p className="muted">{item.detail}</p>
              <div className="badge warn">{item.status}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="twoCol">
        <div className="panel">
          <h2>Formula trace</h2>
          {formulaTrace.map((item) => (
            <div className="listItem" key={item}>{item}</div>
          ))}
        </div>

        <div className="panel">
          <h2>Provenance panel</h2>
          <div className="listItem">
            <strong>Borrower package</strong>
            <p className="muted">Page 2, table extract, source label: Accounts payable</p>
            <div className="badge bad">Low confidence source</div>
          </div>
          <div className="listItem">
            <strong>Analyst action</strong>
            <p className="muted">Approve, remap, or overwrite the candidate before period lock.</p>
            <div className="badge good">Human in the loop</div>
          </div>
        </div>
      </section>
    </main>
  );
}

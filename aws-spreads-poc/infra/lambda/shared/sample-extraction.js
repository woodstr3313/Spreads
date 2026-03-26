function buildSampleExtraction() {
  return {
    periods: [{ id: '2025A', label: 'FY2025', periodType: 'ANNUAL', locked: false }],
    candidates: [
      { sourceLabel: 'Revenue', value: 1250000, statementType: 'INCOME_STATEMENT', confidence: 0.97, page: 1, periodLabel: 'FY2025' },
      { sourceLabel: 'COGS', value: 700000, statementType: 'INCOME_STATEMENT', confidence: 0.94, page: 1, periodLabel: 'FY2025' },
      { sourceLabel: 'Operating Expenses', value: 300000, statementType: 'INCOME_STATEMENT', confidence: 0.91, page: 1, periodLabel: 'FY2025' },
      { sourceLabel: 'Interest Expense', value: 50000, statementType: 'INCOME_STATEMENT', confidence: 0.82, page: 1, periodLabel: 'FY2025' },
      { sourceLabel: 'Cash and cash equivalents', value: 200000, statementType: 'BALANCE_SHEET', confidence: 0.95, page: 2, periodLabel: 'FY2025' },
      { sourceLabel: 'Accounts receivable', value: 150000, statementType: 'BALANCE_SHEET', confidence: 0.92, page: 2, periodLabel: 'FY2025' },
      { sourceLabel: 'Accounts payable', value: 100000, statementType: 'BALANCE_SHEET', confidence: 0.71, page: 2, periodLabel: 'FY2025' },
      { sourceLabel: 'Total equity', value: 250000, statementType: 'BALANCE_SHEET', confidence: 0.78, page: 2, periodLabel: 'FY2025' }
    ]
  };
}

module.exports = { buildSampleExtraction };

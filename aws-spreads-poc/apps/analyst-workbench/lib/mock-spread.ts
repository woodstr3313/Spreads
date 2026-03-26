export type WorkbenchCell = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: 'AI_SUGGESTED' | 'FORMULA' | 'MANUAL';
  confidence: string;
};

export type ReviewItem = {
  title: string;
  detail: string;
  status: string;
};

export type WorkbenchSpread = {
  spreadId: string;
  spreadVersionId: string;
  workflowState: string;
  templateName: string;
  openExceptions: number;
  aiSuggestions: number;
  rows: WorkbenchCell[];
  reviewQueue: ReviewItem[];
  formulaTrace: string[];
};

export const demoSpread: WorkbenchSpread = {
  spreadId: 'spread-demo-001',
  spreadVersionId: 'sv-demo-001',
  workflowState: 'REVIEW_REQUIRED',
  templateName: 'C&I Standard',
  openExceptions: 2,
  aiSuggestions: 6,
  rows: [
    { rowId: 'NET_SALES', label: 'Net Sales', fy2025: '$1,250,000', origin: 'AI_SUGGESTED', confidence: '0.97' },
    { rowId: 'COGS', label: 'COGS', fy2025: '$700,000', origin: 'AI_SUGGESTED', confidence: '0.94' },
    { rowId: 'GROSS_PROFIT', label: 'Gross Profit', fy2025: '$550,000', origin: 'FORMULA', confidence: '1.00' },
    { rowId: 'OPERATING_EXPENSES', label: 'Operating Expenses', fy2025: '$300,000', origin: 'AI_SUGGESTED', confidence: '0.91' },
    { rowId: 'EBITDA', label: 'EBITDA', fy2025: '$250,000', origin: 'FORMULA', confidence: '1.00' },
    { rowId: 'ACCOUNTS_PAYABLE', label: 'Accounts Payable', fy2025: '$100,000', origin: 'AI_SUGGESTED', confidence: '0.71' }
  ],
  reviewQueue: [
    {
      title: 'Low-confidence mapping',
      detail: 'Accounts Payable mapped at 0.71 confidence from page 2 of borrower-package.pdf',
      status: 'Needs review'
    },
    {
      title: 'Balance check',
      detail: 'Total Assets and Total Liabilities plus Equity should be reconciled before lock.',
      status: 'Open'
    }
  ],
  formulaTrace: [
    'GROSS_PROFIT = NET_SALES - COGS',
    'EBITDA = GROSS_PROFIT - OPERATING_EXPENSES',
    'TOTAL_CURRENT_ASSETS = CASH_AND_EQUIVALENTS + ACCOUNTS_RECEIVABLE'
  ]
};

export type BaseRow = {
  rowId: string;
  label: string;
  origin: string;
  confidence: string;
};

export type WorkbookPeriod = {
  id: string;
  label: string;
  isTotal?: boolean;
};

export type WorkbookRow = BaseRow & {
  statementId: string;
  statementLabel: string;
  groupId: string;
  groupLabel: string;
  rowKind: 'detail' | 'group_total' | 'statement_total';
  indent: number;
  values: Record<string, string>;
};

const periods: WorkbookPeriod[] = [
  { id: 'fy2023', label: 'FY2023' },
  { id: 'fy2024', label: 'FY2024' },
  { id: 'fy2025', label: 'FY2025' },
  { id: 'ttm', label: 'TTM' }
];

const templates: Omit<WorkbookRow, 'values'>[] = [
  { rowId: 'NET_SALES', label: 'Net Sales', origin: 'AI_SUGGESTED', confidence: '0.97', statementId: 'income_statement', statementLabel: 'Income Statement', groupId: 'revenue', groupLabel: 'Revenue', rowKind: 'detail', indent: 1 },
  { rowId: 'COGS', label: 'COGS', origin: 'AI_SUGGESTED', confidence: '0.94', statementId: 'income_statement', statementLabel: 'Income Statement', groupId: 'cost_of_sales', groupLabel: 'Cost of Sales', rowKind: 'detail', indent: 1 },
  { rowId: 'GROSS_PROFIT', label: 'Gross Profit', origin: 'FORMULA', confidence: '1.00', statementId: 'income_statement', statementLabel: 'Income Statement', groupId: 'revenue_margin', groupLabel: 'Revenue Margin', rowKind: 'group_total', indent: 1 },
  { rowId: 'OPERATING_EXPENSES', label: 'Operating Expenses', origin: 'AI_SUGGESTED', confidence: '0.91', statementId: 'income_statement', statementLabel: 'Income Statement', groupId: 'operating_expenses', groupLabel: 'Operating Expenses', rowKind: 'detail', indent: 1 },
  { rowId: 'EBITDA', label: 'EBITDA', origin: 'FORMULA', confidence: '1.00', statementId: 'income_statement', statementLabel: 'Income Statement', groupId: 'profitability', groupLabel: 'Profitability', rowKind: 'statement_total', indent: 0 },
  { rowId: 'ACCOUNTS_PAYABLE', label: 'Accounts Payable', origin: 'AI_SUGGESTED', confidence: '0.71', statementId: 'balance_sheet', statementLabel: 'Balance Sheet', groupId: 'current_liabilities', groupLabel: 'Current Liabilities', rowKind: 'detail', indent: 1 }
];

const seedValues: Record<string, Record<string, number>> = {
  NET_SALES: { fy2023: 980000, fy2024: 1125000, fy2025: 1250000, ttm: 1285000 },
  COGS: { fy2023: 540000, fy2024: 640000, fy2025: 700000, ttm: 715000 },
  OPERATING_EXPENSES: { fy2023: 240000, fy2024: 280000, fy2025: 300000, ttm: 315000 },
  ACCOUNTS_PAYABLE: { fy2023: 85000, fy2024: 92000, fy2025: 100000, ttm: 104000 }
};

function fmt(n: number) {
  return n.toLocaleString();
}

export function buildWorkbookPeriods() {
  return periods;
}

export function buildWorkbookRows(): WorkbookRow[] {
  const rows = templates.map((row) => ({
    ...row,
    values: Object.fromEntries(periods.map((p) => [p.id, fmt(seedValues[row.rowId]?.[p.id] ?? 0)]))
  }));

  const gp = rows.find((r) => r.rowId === 'GROSS_PROFIT');
  const sales = rows.find((r) => r.rowId === 'NET_SALES');
  const cogs = rows.find((r) => r.rowId === 'COGS');
  const ebitda = rows.find((r) => r.rowId === 'EBITDA');
  const opex = rows.find((r) => r.rowId === 'OPERATING_EXPENSES');

  periods.forEach((p) => {
    const gpVal = (seedValues.NET_SALES?.[p.id] ?? 0) - (seedValues.COGS?.[p.id] ?? 0);
    if (gp) gp.values[p.id] = fmt(gpVal);
    const ebitdaVal = gpVal - (seedValues.OPERATING_EXPENSES?.[p.id] ?? 0);
    if (ebitda) ebitda.values[p.id] = fmt(ebitdaVal);
  });

  return rows;
}

export function parseNumeric(value: string) {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function recalculateWorkbook(rows: WorkbookRow[]): WorkbookRow[] {
  const next = rows.map((row) => ({ ...row, values: { ...row.values } }));
  const sales = next.find((r) => r.rowId === 'NET_SALES');
  const cogs = next.find((r) => r.rowId === 'COGS');
  const gp = next.find((r) => r.rowId === 'GROSS_PROFIT');
  const opex = next.find((r) => r.rowId === 'OPERATING_EXPENSES');
  const ebitda = next.find((r) => r.rowId === 'EBITDA');

  periods.forEach((p) => {
    const gpVal = parseNumeric(sales?.values[p.id] || '0') - parseNumeric(cogs?.values[p.id] || '0');
    if (gp) gp.values[p.id] = fmt(gpVal);
    const ebitdaVal = gpVal - parseNumeric(opex?.values[p.id] || '0');
    if (ebitda) ebitda.values[p.id] = fmt(ebitdaVal);
  });

  return next;
}

export function buildWorkbookOutline(rows: WorkbookRow[]) {
  const map = new Map<string, { id: string; label: string; groups: Map<string, { id: string; label: string; count: number }> }>();
  rows.forEach((row) => {
    if (!map.has(row.statementId)) {
      map.set(row.statementId, { id: row.statementId, label: row.statementLabel, groups: new Map() });
    }
    const statement = map.get(row.statementId)!;
    if (!statement.groups.has(row.groupId)) {
      statement.groups.set(row.groupId, { id: row.groupId, label: row.groupLabel, count: 0 });
    }
    statement.groups.get(row.groupId)!.count += 1;
  });
  return Array.from(map.values()).map((s) => ({ id: s.id, label: s.label, groups: Array.from(s.groups.values()) }));
}

type RowLike = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: string;
  confidence: string;
};

export type StructuredRow = RowLike & {
  statementId: string;
  statementLabel: string;
  groupId: string;
  groupLabel: string;
  rowKind: 'detail' | 'group_total' | 'statement_total';
  indent: number;
};

const layoutByRowId: Record<string, Omit<StructuredRow, keyof RowLike | 'fy2025' | 'origin' | 'confidence'>> = {
  NET_SALES: {
    statementId: 'income_statement',
    statementLabel: 'Income Statement',
    groupId: 'revenue',
    groupLabel: 'Revenue',
    rowKind: 'detail',
    indent: 1
  },
  COGS: {
    statementId: 'income_statement',
    statementLabel: 'Income Statement',
    groupId: 'cost_of_sales',
    groupLabel: 'Cost of Sales',
    rowKind: 'detail',
    indent: 1
  },
  GROSS_PROFIT: {
    statementId: 'income_statement',
    statementLabel: 'Income Statement',
    groupId: 'revenue_margin',
    groupLabel: 'Revenue Margin',
    rowKind: 'group_total',
    indent: 1
  },
  OPERATING_EXPENSES: {
    statementId: 'income_statement',
    statementLabel: 'Income Statement',
    groupId: 'operating_expenses',
    groupLabel: 'Operating Expenses',
    rowKind: 'detail',
    indent: 1
  },
  EBITDA: {
    statementId: 'income_statement',
    statementLabel: 'Income Statement',
    groupId: 'profitability',
    groupLabel: 'Profitability',
    rowKind: 'statement_total',
    indent: 0
  },
  ACCOUNTS_PAYABLE: {
    statementId: 'balance_sheet',
    statementLabel: 'Balance Sheet',
    groupId: 'current_liabilities',
    groupLabel: 'Current Liabilities',
    rowKind: 'detail',
    indent: 1
  }
};

export function structureRows(rows: RowLike[]): StructuredRow[] {
  return rows.map((row) => {
    const layout = layoutByRowId[row.rowId] || {
      statementId: 'other',
      statementLabel: 'Other Statement',
      groupId: 'ungrouped',
      groupLabel: 'Ungrouped',
      rowKind: 'detail' as const,
      indent: 0
    };

    return {
      ...row,
      ...layout
    };
  });
}

export function buildStatementOutline(rows: StructuredRow[]) {
  const map = new Map<string, { id: string; label: string; groups: Map<string, { id: string; label: string; count: number }> }>();

  rows.forEach((row) => {
    if (!map.has(row.statementId)) {
      map.set(row.statementId, {
        id: row.statementId,
        label: row.statementLabel,
        groups: new Map()
      });
    }
    const statement = map.get(row.statementId)!;
    if (!statement.groups.has(row.groupId)) {
      statement.groups.set(row.groupId, {
        id: row.groupId,
        label: row.groupLabel,
        count: 0
      });
    }
    statement.groups.get(row.groupId)!.count += 1;
  });

  return Array.from(map.values()).map((statement) => ({
    id: statement.id,
    label: statement.label,
    groups: Array.from(statement.groups.values())
  }));
}

type RowLike = {
  rowId: string;
  label: string;
  fy2025: string;
  origin: string;
  confidence: string;
};

type ReviewLike = {
  title: string;
  detail: string;
  status: string;
};

export type ValidationItem = {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
};

function parseNumber(value: string) {
  const sanitized = value.replace(/[^0-9.-]/g, '');
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildValidationSummary(rows: RowLike[], reviewQueue: ReviewLike[]): ValidationItem[] {
  const items: ValidationItem[] = [];
  const rowMap = new Map(rows.map((row) => [row.rowId, row]));

  const ap = rowMap.get('ACCOUNTS_PAYABLE');
  if (ap && Number(ap.confidence) < 0.8) {
    items.push({
      severity: 'high',
      title: 'Low-confidence liability mapping',
      detail: `${ap.label} is below the preferred confidence threshold at ${ap.confidence}.`
    });
  }

  const grossProfit = rowMap.get('GROSS_PROFIT');
  const ebitda = rowMap.get('EBITDA');
  if (grossProfit && ebitda && parseNumber(ebitda.fy2025) > parseNumber(grossProfit.fy2025)) {
    items.push({
      severity: 'medium',
      title: 'EBITDA exceeds gross profit',
      detail: 'Derived profitability rows should be reviewed for sign convention or operating expense handling.'
    });
  }

  if (reviewQueue.length) {
    items.push({
      severity: 'medium',
      title: 'Open reviewer exceptions',
      detail: `${reviewQueue.length} review item(s) remain open in the exception queue.`
    });
  }

  if (!items.length) {
    items.push({
      severity: 'low',
      title: 'No major validation findings in demo data',
      detail: 'The current spread payload did not generate any major rule failures.'
    });
  }

  return items;
}

export function buildFormulaHighlights(formulaTrace: string[]) {
  return formulaTrace.map((formula, index) => ({
    id: `formula-${index + 1}`,
    title: formula.split('=')[0]?.trim() || `Formula ${index + 1}`,
    formula,
    explanation: formula.includes('EBITDA')
      ? 'Profitability derivation used for analyst commentary and credit view.'
      : formula.includes('GROSS_PROFIT')
        ? 'Core income statement derivation tying revenue and COGS.'
        : 'Derived row produced by the formula engine.'
  }));
}

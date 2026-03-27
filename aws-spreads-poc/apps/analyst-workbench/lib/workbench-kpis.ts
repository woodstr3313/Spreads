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

type ValidationLike = {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
};

function parseNumber(value: string) {
  const sanitized = value.replace(/[^0-9.-]/g, '');
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildKpis(rows: RowLike[], reviewQueue: ReviewLike[], validations: ValidationLike[]) {
  const totalValue = rows.reduce((sum, row) => sum + parseNumber(row.fy2025), 0);
  const lowConfidence = rows.filter((row) => Number(row.confidence) < 0.8).length;
  const aiRows = rows.filter((row) => row.origin === 'AI_SUGGESTED').length;
  const formulaRows = rows.filter((row) => row.origin === 'FORMULA').length;
  const highValidations = validations.filter((item) => item.severity === 'high').length;

  return {
    totalValue: totalValue.toLocaleString(),
    lowConfidence,
    aiRows,
    formulaRows,
    reviewItems: reviewQueue.length,
    highValidations
  };
}

export type LiveCell = {
  rowId?: string;
  periodId?: string;
  displayValue?: string;
  normalizedValue?: string | number | boolean | null;
  origin?: string;
  confidence?: number;
  provenance?: Array<{
    documentId?: string;
    page?: number;
    excerpt?: string;
  }>;
};

export type LiveSpreadWithCells = {
  getSpreadVersion?: {
    cells?: LiveCell[];
  };
};

export type ProvenanceSummary = {
  rowId: string;
  documentId: string;
  page: number | null;
  excerpt: string;
  origin: string;
  confidence: string;
  value: string;
};

function formatValue(value: string | number | boolean | null | undefined) {
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function extractProvenanceSummaries(spread: LiveSpreadWithCells): ProvenanceSummary[] {
  const cells = spread.getSpreadVersion?.cells ?? [];

  return cells
    .filter((cell) => cell.provenance?.length)
    .flatMap((cell) =>
      (cell.provenance ?? []).map((item) => ({
        rowId: cell.rowId || 'UNKNOWN_ROW',
        documentId: item.documentId || 'unknown-document',
        page: typeof item.page === 'number' ? item.page : null,
        excerpt: item.excerpt || 'No excerpt available',
        origin: cell.origin || 'UNKNOWN',
        confidence: typeof cell.confidence === 'number' ? cell.confidence.toFixed(2) : '1.00',
        value: formatValue(cell.displayValue ?? cell.normalizedValue)
      }))
    );
}

import { demoSpread, WorkbenchSpread } from './mock-spread';

export type LiveSpreadVersionResponse = {
  getSpreadVersion?: {
    id?: string;
    spreadId?: string;
    templateVersionId?: string;
    workflowState?: string;
    createdAt?: string;
    periods?: Array<{ id?: string; label?: string; periodType?: string; locked?: boolean }>;
    cells?: Array<{
      rowId?: string;
      periodId?: string;
      displayValue?: string;
      normalizedValue?: string | number | boolean | null;
      origin?: 'AI_SUGGESTED' | 'FORMULA' | 'MANUAL' | 'IMPORTED';
      confidence?: number;
      updatedAt?: string;
    }>;
  };
};

export type LiveReviewTasksResponse = {
  listReviewTasks?: Array<{
    id?: string;
    status?: string;
    reason?: string;
    assignedTo?: string | null;
    createdAt?: string;
  }>;
};

function formatValue(value: string | number | boolean | null | undefined) {
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function mapLiveResponsesToWorkbench(
  spreadId: string,
  spreadVersionId: string,
  spread: LiveSpreadVersionResponse,
  tasks: LiveReviewTasksResponse
): WorkbenchSpread {
  const cells = spread.getSpreadVersion?.cells ?? [];
  const reviewTasks = tasks.listReviewTasks ?? [];

  return {
    spreadId,
    spreadVersionId,
    workflowState: spread.getSpreadVersion?.workflowState || 'UNKNOWN',
    templateName: spread.getSpreadVersion?.templateVersionId || 'Unknown Template',
    openExceptions: reviewTasks.filter((item) => item.status !== 'APPROVED').length,
    aiSuggestions: cells.filter((cell) => cell.origin === 'AI_SUGGESTED').length,
    rows: cells.map((cell) => ({
      rowId: cell.rowId || 'UNKNOWN_ROW',
      label: cell.rowId || 'Unknown Row',
      fy2025: formatValue(cell.displayValue ?? cell.normalizedValue),
      origin: (cell.origin as 'AI_SUGGESTED' | 'FORMULA' | 'MANUAL') || 'MANUAL',
      confidence: typeof cell.confidence === 'number' ? cell.confidence.toFixed(2) : '1.00'
    })),
    reviewQueue: reviewTasks.map((item) => ({
      title: item.id || 'Review Task',
      detail: item.reason || 'No reason provided',
      status: item.status || 'OPEN'
    })),
    formulaTrace: cells.filter((cell) => cell.origin === 'FORMULA').map((cell) => `${cell.rowId} derived by formula engine`)
  };
}

export function buildFallbackSpread(spreadId: string, spreadVersionId: string): WorkbenchSpread {
  return {
    ...demoSpread,
    spreadId,
    spreadVersionId
  };
}

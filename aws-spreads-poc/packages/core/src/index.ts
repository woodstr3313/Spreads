import { WorkflowState } from '@aws-spreads-poc/contracts';

export type PeriodType = 'ANNUAL' | 'QUARTERLY' | 'TTM' | 'PRO_FORMA';
export type CellOrigin = 'MANUAL' | 'IMPORTED' | 'AI_SUGGESTED' | 'FORMULA';

export interface ProvenanceRef {
  documentId: string;
  page: number;
  excerpt?: string;
  bbox?: { left: number; top: number; width: number; height: number };
}

export interface TemplateRow {
  id: string;
  sectionId: string;
  label: string;
  normalizedTag?: string;
  dataType: 'NUMBER' | 'TEXT' | 'DATE' | 'BOOLEAN';
  formula?: string;
  required?: boolean;
  visibleWhen?: string;
  signConvention?: 'NATURAL' | 'ASSET_POSITIVE' | 'CREDIT_NEGATIVE';
}

export interface TemplateSection {
  id: string;
  label: string;
  statementType: string;
  order: number;
  rows: TemplateRow[];
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  institutionId: string;
  name: string;
  version: number;
  sections: TemplateSection[];
  createdAt: string;
}

export interface Period {
  id: string;
  label: string;
  startDate?: string;
  endDate?: string;
  periodType: PeriodType;
  locked: boolean;
}

export interface SpreadCell {
  rowId: string;
  periodId: string;
  rawValue: unknown;
  normalizedValue?: number | string | boolean | null;
  displayValue?: string;
  confidence?: number;
  origin: CellOrigin;
  provenance?: ProvenanceRef[];
  updatedAt: string;
}

export interface SpreadVersion {
  id: string;
  spreadId: string;
  templateVersionId: string;
  workflowState: WorkflowState;
  periods: Period[];
  cells: SpreadCell[];
  createdAt: string;
}

export function getCellKey(rowId: string, periodId: string): string {
  return `${rowId}::${periodId}`;
}

export function isEditable(spread: SpreadVersion, periodId: string): boolean {
  const period = spread.periods.find((p) => p.id === periodId);
  return Boolean(period && !period.locked && spread.workflowState !== 'LOCKED');
}

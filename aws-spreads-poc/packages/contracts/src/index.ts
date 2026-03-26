export type DocumentType =
  | 'BALANCE_SHEET'
  | 'INCOME_STATEMENT'
  | 'CASH_FLOW'
  | 'TAX_RETURN'
  | 'SUPPORTING_SCHEDULE'
  | 'UNKNOWN';

export type WorkflowState =
  | 'UPLOADED'
  | 'CLASSIFIED'
  | 'EXTRACTED'
  | 'MAPPED'
  | 'REVIEW_REQUIRED'
  | 'APPROVED'
  | 'LOCKED'
  | 'FAILED';

export interface S3DocumentUploadedEvent {
  bucket: string;
  key: string;
  institutionId: string;
  borrowerId: string;
  spreadId: string;
  uploadedBy: string;
}

export interface ExtractionCandidate {
  sourceLabel: string;
  value: number | string | null;
  statementType: DocumentType;
  periodLabel?: string;
  confidence: number;
  page: number;
  bbox?: { left: number; top: number; width: number; height: number };
}

export interface MappingSuggestion {
  normalizedTag: string;
  templateRowId: string;
  confidence: number;
  rationale: string;
}

export interface ReviewTaskCreatedEvent {
  reviewTaskId: string;
  spreadId: string;
  reason: string;
  createdAt: string;
}

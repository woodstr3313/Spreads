'use client';

import { useMemo, useState } from 'react';
import { SpreadsheetToolbar } from './spreadsheet-toolbar';
import { ValidationSummaryPanel } from './validation-summary-panel';
import { ReviewQueuePanel } from './review-queue-panel';
import { FormulaInspectorPanel } from './formula-inspector-panel';
import { SpreadsheetGridV3 } from './spreadsheet-grid-v3';
import { WorkbenchNavTabs } from './workbench-nav-tabs';
import { ToastCenter } from './toast-center';
import { ProvenanceTimelinePanel } from './provenance-timeline-panel';
import { RowDetailInspector } from './row-detail-inspector';
import { ReviewActionDock } from './review-action-dock';

type RowItem = { rowId: string; label: string; fy2025: string; origin: string; confidence: string };
type ReviewItem = { title: string; detail: string; status: string };
type ValidationItem = { severity: 'high' | 'medium' | 'low'; title: string; detail: string };
type FormulaItem = { id: string; title: string; formula: string; explanation: string };
type ProvenanceItem = { rowId: string; documentId: string; page: number | null; excerpt: string; origin: string; confidence: string; value: string };
type ToastItem = { id: string; tone: 'info' | 'success' | 'warning'; title: string; detail: string };

type Props = {
  spreadId: string;
  spreadVersionId: string;
  rows: RowItem[];
  reviewQueue: ReviewItem[];
  validationItems: ValidationItem[];
  formulaItems: FormulaItem[];
  provenance: ProvenanceItem[];
  toasts: ToastItem[];
};

export function CommandCenterClient({ spreadId, spreadVersionId, rows, reviewQueue, validationItems, formulaItems, provenance, toasts }: Props) {
  const [filter, setFilter] = useState('');

  const filteredRows = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) => row.rowId.toLowerCase().includes(normalized) || row.label.toLowerCase().includes(normalized));
  }, [rows, filter]);

  const selectedRow = filteredRows[0] || rows[0];
  const tabs = [
    { label: 'Command Center V2', href: `/spreads/${spreadId}/${spreadVersionId}/command-center-v2`, active: true },
    { label: 'Command Center', href: `/spreads/${spreadId}/${spreadVersionId}/command-center` },
    { label: 'Spreadsheet V3', href: `/spreads/${spreadId}/${spreadVersionId}/spreadsheet-v3` },
    { label: 'Live Provenance', href: `/spreads/${spreadId}/${spreadVersionId}/review/live-provenance` }
  ];

  return (
    <>
      <WorkbenchNavTabs items={tabs} />
      <ToastCenter items={toasts} />
      <SpreadsheetToolbar rows={rows} onFilterChange={setFilter} />
      <ReviewActionDock reviewCount={reviewQueue.length} highValidationCount={validationItems.filter((item) => item.severity === 'high').length} />
      <section className="twoCol">
        <div id="validation-summary"><ValidationSummaryPanel items={validationItems} /></div>
        <div id="review-queue"><ReviewQueuePanel items={reviewQueue} /></div>
      </section>
      <section id="spreadsheet-surface">
        <SpreadsheetGridV3 spreadId={spreadId} spreadVersionId={spreadVersionId} rows={filteredRows} formulaTrace={formulaItems.map((item) => item.formula)} provenance={provenance} />
      </section>
      <section className="twoCol">
        <RowDetailInspector row={selectedRow} />
        <ProvenanceTimelinePanel items={provenance} />
      </section>
      <section id="formula-inspector">
        <FormulaInspectorPanel items={formulaItems} />
      </section>
    </>
  );
}

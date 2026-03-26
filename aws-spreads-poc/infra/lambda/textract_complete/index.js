const { nowIso, getItem, putItem, updateItem } = require('../shared/db');
const { buildSampleExtraction } = require('../shared/sample-extraction');

const TAG_ALIASES = {
  'cash and cash equivalents': 'CASH_AND_EQUIVALENTS',
  'accounts receivable': 'ACCOUNTS_RECEIVABLE',
  'revenue': 'NET_SALES',
  'cogs': 'COST_OF_GOODS_SOLD',
  'operating expenses': 'OPERATING_EXPENSES',
  'interest expense': 'INTEREST_EXPENSE',
  'accounts payable': 'ACCOUNTS_PAYABLE',
  'total equity': 'TOTAL_EQUITY'
};

function normalizeLabel(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildRowLookup(template) {
  return Object.fromEntries(
    template.sections.flatMap((section) => section.rows.filter((row) => row.normalizedTag).map((row) => [row.normalizedTag, row.id]))
  );
}

function calculateFormulas(template, cells, periodId) {
  const values = Object.fromEntries(cells.filter((c) => c.periodId === periodId).map((c) => [c.rowId, Number(c.normalizedValue || 0)]));
  const out = [];
  for (const section of template.sections) {
    for (const row of section.rows) {
      if (!row.formula) continue;
      const expr = row.formula.replace(/[A-Z_][A-Z0-9_]*/g, (token) => String(values[token] ?? 0));
      try {
        const value = Function(`return (${expr});`)();
        values[row.id] = Number(value);
        out.push({
          rowId: row.id,
          periodId,
          rawValue: value,
          normalizedValue: Number(value),
          displayValue: Number(value).toLocaleString(),
          origin: 'FORMULA',
          updatedAt: nowIso()
        });
      } catch {
        // swallow for POC
      }
    }
  }
  return out;
}

exports.handler = async (event) => {
  const template = await getItem('TEMPLATE#tplv-ci-standard-v1', 'METADATA');
  const version = await getItem(`SPREAD#${event.spreadId}`, `VERSION#${event.spreadVersionId}`);
  const extraction = buildSampleExtraction();
  const rowLookup = buildRowLookup(template);
  const cells = [];
  const reviewReasons = [];

  for (const candidate of extraction.candidates) {
    const tag = TAG_ALIASES[normalizeLabel(candidate.sourceLabel)];
    const rowId = rowLookup[tag];
    if (!rowId) continue;
    const periodId = extraction.periods[0].id;
    cells.push({
      rowId,
      periodId,
      rawValue: candidate.value,
      normalizedValue: candidate.value,
      displayValue: Number(candidate.value).toLocaleString(),
      confidence: candidate.confidence,
      origin: 'AI_SUGGESTED',
      provenance: [{ documentId: event.s3Key, page: candidate.page, excerpt: candidate.sourceLabel }],
      updatedAt: nowIso()
    });
    if (candidate.confidence < 0.8) {
      reviewReasons.push(`Low confidence mapping for ${candidate.sourceLabel} (${candidate.confidence})`);
    }
  }

  cells.push(...calculateFormulas(template, cells, extraction.periods[0].id));

  const workflowState = reviewReasons.length ? 'REVIEW_REQUIRED' : 'EXTRACTED';
  const updated = await updateItem(
    { pk: version.pk, sk: version.sk },
    'SET #periods = :periods, #cells = :cells, #workflowState = :workflowState',
    { '#periods': 'periods', '#cells': 'cells', '#workflowState': 'workflowState' },
    { ':periods': extraction.periods, ':cells': cells, ':workflowState': workflowState }
  );

  let reviewTaskId = null;
  if (reviewReasons.length) {
    reviewTaskId = `review-${event.spreadVersionId}`;
    await putItem({
      pk: `SPREAD#${event.spreadId}`,
      sk: `REVIEW#${reviewTaskId}`,
      entityType: 'ReviewTask',
      id: reviewTaskId,
      spreadId: event.spreadId,
      spreadVersionId: event.spreadVersionId,
      status: 'OPEN',
      reason: reviewReasons.join('; '),
      taskToken: event.reviewToken,
      createdAt: nowIso(),
      gsi1pk: `SPREAD#${event.spreadId}`,
      gsi1sk: `REVIEW#${reviewTaskId}`
    });
  }

  return {
    spreadId: event.spreadId,
    spreadVersionId: event.spreadVersionId,
    workflowState: updated.workflowState,
    reviewRequired: reviewReasons.length > 0,
    reviewTaskId,
    reviewReasons,
    cellCount: cells.length
  };
};

const { randomUUID } = require('crypto');
const { StartExecutionCommand, SFNClient } = require('@aws-sdk/client-sfn');
const { nowIso, getItem, putItem, queryByPk, updateItem } = require('../shared/db');

const sfn = new SFNClient({});

async function startUpload(args) {
  const input = args.input;
  const spreadVersionId = `sv-${randomUUID()}`;
  await putItem({
    pk: `SPREAD#${input.spreadId}`,
    sk: `VERSION#${spreadVersionId}`,
    entityType: 'SpreadVersion',
    id: spreadVersionId,
    spreadId: input.spreadId,
    templateVersionId: 'tplv-ci-standard-v1',
    workflowState: 'UPLOADED',
    periods: [],
    cells: [],
    createdAt: nowIso(),
    gsi1pk: `SPREAD_VERSION#${spreadVersionId}`,
    gsi1sk: nowIso()
  });

  if (process.env.INGESTION_STATE_MACHINE_ARN) {
    await sfn.send(new StartExecutionCommand({
      stateMachineArn: process.env.INGESTION_STATE_MACHINE_ARN,
      input: JSON.stringify({ ...input, spreadVersionId })
    }));
  }

  return true;
}

async function updateCell(args) {
  const input = args.input;
  const version = await getItem(`SPREAD#${input.spreadId || 'unknown'}`, `VERSION#${input.spreadVersionId}`);
  const spreadVersion = version || (await queryByPk(`SPREAD#${input.spreadId}`, 'VERSION#')).find((i) => i.id === input.spreadVersionId);
  if (!spreadVersion) throw new Error('Spread version not found');

  const cells = [...(spreadVersion.cells || [])];
  const index = cells.findIndex((c) => c.rowId === input.rowId && c.periodId === input.periodId);
  const next = {
    rowId: input.rowId,
    periodId: input.periodId,
    rawValue: input.normalizedValue,
    normalizedValue: input.normalizedValue,
    displayValue: input.displayValue || String(input.normalizedValue),
    origin: 'MANUAL',
    updatedAt: nowIso()
  };

  if (index >= 0) cells[index] = next;
  else cells.push(next);

  await updateItem(
    { pk: spreadVersion.pk, sk: spreadVersion.sk },
    'SET #cells = :cells',
    { '#cells': 'cells' },
    { ':cells': cells }
  );

  return next;
}

async function resolveReviewTask(args) {
  const input = args.input;
  const task = await queryByPk(`SPREAD#${input.spreadId || ''}`, 'REVIEW#');
  const found = task.find((item) => item.id === input.reviewTaskId);
  if (!found) {
    return { id: input.reviewTaskId, status: input.approved ? 'APPROVED' : 'REJECTED', reason: 'Task not found in API path', createdAt: nowIso() };
  }
  await updateItem(
    { pk: found.pk, sk: found.sk },
    'SET #status = :status, #notes = :notes',
    { '#status': 'status', '#notes': 'notes' },
    { ':status': input.approved ? 'APPROVED' : 'REJECTED', ':notes': input.notes || null }
  );
  return { ...found, status: input.approved ? 'APPROVED' : 'REJECTED' };
}

exports.handler = async (event) => {
  const field = event.info?.fieldName;
  const args = event.arguments || {};

  switch (field) {
    case 'getSpreadVersion':
      return queryByPk(`SPREAD#${args.spreadId || ''}`, 'VERSION#').then((items) => items.find((i) => i.id === args.spreadVersionId) || null);
    case 'getTemplateVersion':
      return getItem(`TEMPLATE#${args.templateVersionId}`, 'METADATA');
    case 'listReviewTasks':
      return queryByPk(`SPREAD#${args.spreadId}`, 'REVIEW#');
    case 'uploadDocument':
      return startUpload(args);
    case 'updateCell':
      return updateCell(args);
    case 'resolveReviewTask':
      return resolveReviewTask(args);
    default:
      return { ok: true, field, args };
  }
};

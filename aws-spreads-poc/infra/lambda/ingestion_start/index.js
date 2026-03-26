const { randomUUID } = require('crypto');
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { StartExecutionCommand, SFNClient } = require('@aws-sdk/client-sfn');
const { nowIso, putItem } = require('../shared/db');

const s3 = new S3Client({});
const sfn = new SFNClient({});

async function seedUploadRecord(payload) {
  const uploadedAt = nowIso();
  const spreadVersionId = `sv-${randomUUID()}`;
  await putItem({
    pk: `SPREAD#${payload.spreadId}`,
    sk: `VERSION#${spreadVersionId}`,
    entityType: 'SpreadVersion',
    id: spreadVersionId,
    spreadId: payload.spreadId,
    templateVersionId: payload.templateVersionId || 'tplv-ci-standard-v1',
    workflowState: 'UPLOADED',
    periods: [],
    cells: [],
    createdAt: uploadedAt,
    gsi1pk: `SPREAD_VERSION#${spreadVersionId}`,
    gsi1sk: uploadedAt
  });
  return spreadVersionId;
}

async function persistTemplateIfMissing() {
  const template = require('../shared/sample-template.json');
  await putItem({
    pk: `TEMPLATE#${template.id}`,
    sk: 'METADATA',
    entityType: 'TemplateVersion',
    ...template,
    gsi1pk: `TEMPLATE#${template.templateId}`,
    gsi1sk: `VERSION#${template.version}`
  });
}

exports.handler = async (event) => {
  if (event?.Records?.[0]?.s3) {
    return { acknowledged: true, source: 's3-event' };
  }

  await persistTemplateIfMissing();
  const spreadVersionId = await seedUploadRecord(event);

  if (event.inlineSampleUpload) {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.DOCUMENTS_BUCKET_NAME,
      Key: event.s3Key,
      Body: Buffer.from('sample borrower package')
    }));
  }

  if (event.startWorkflow && process.env.STATE_MACHINE_ARN) {
    await sfn.send(new StartExecutionCommand({
      stateMachineArn: process.env.STATE_MACHINE_ARN,
      input: JSON.stringify({ ...event, spreadVersionId, chained: true })
    }));
  }

  return {
    ...event,
    spreadVersionId,
    workflowState: 'UPLOADED',
    uploadedAt: nowIso()
  };
};

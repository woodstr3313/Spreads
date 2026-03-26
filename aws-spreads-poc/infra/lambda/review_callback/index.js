const { SFNClient, SendTaskSuccessCommand, SendTaskFailureCommand } = require('@aws-sdk/client-sfn');
const { getItem, updateItem, nowIso } = require('../shared/db');

const sfn = new SFNClient({});

exports.handler = async (event) => {
  const reviewTask = await getItem(`SPREAD#${event.spreadId}`, `REVIEW#${event.reviewTaskId}`);
  if (!reviewTask) throw new Error(`Review task not found: ${event.reviewTaskId}`);

  const approved = Boolean(event.approved);

  await updateItem(
    { pk: reviewTask.pk, sk: reviewTask.sk },
    'SET #status = :status, #resolvedAt = :resolvedAt, #notes = :notes',
    { '#status': 'status', '#resolvedAt': 'resolvedAt', '#notes': 'notes' },
    { ':status': approved ? 'APPROVED' : 'REJECTED', ':resolvedAt': nowIso(), ':notes': event.notes || null }
  );

  await updateItem(
    { pk: `SPREAD#${event.spreadId}`, sk: `VERSION#${reviewTask.spreadVersionId}` },
    'SET #workflowState = :workflowState',
    { '#workflowState': 'workflowState' },
    { ':workflowState': approved ? 'APPROVED' : 'FAILED' }
  );

  if (reviewTask.taskToken) {
    if (approved) {
      await sfn.send(new SendTaskSuccessCommand({
        taskToken: reviewTask.taskToken,
        output: JSON.stringify({ approved: true, reviewTaskId: event.reviewTaskId })
      }));
    } else {
      await sfn.send(new SendTaskFailureCommand({
        taskToken: reviewTask.taskToken,
        error: 'ReviewRejected',
        cause: event.notes || 'Reviewer rejected spread extraction'
      }));
    }
  }

  return { reviewTaskId: event.reviewTaskId, status: approved ? 'APPROVED' : 'REJECTED' };
};

const query = async <T>(body: string, variables: Record<string, unknown>) => {
  const endpoint = process.env.NEXT_PUBLIC_APPSYNC_URL;

  if (!endpoint) {
    throw new Error('Missing NEXT_PUBLIC_APPSYNC_URL');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ query: body, variables }),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`AppSync request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message || 'Unknown AppSync error');
  }

  return payload.data as T;
};

export async function fetchSpreadVersion(spreadId: string, spreadVersionId: string) {
  return query<{ getSpreadVersion: unknown }>(
    `query GetSpreadVersion($spreadId: ID!, $spreadVersionId: ID!) {
      getSpreadVersion(spreadId: $spreadId, spreadVersionId: $spreadVersionId) {
        id
        spreadId
        templateVersionId
        workflowState
        createdAt
        periods { id label periodType locked }
        cells { rowId periodId displayValue normalizedValue origin confidence updatedAt }
      }
    }`,
    { spreadId, spreadVersionId }
  );
}

export async function fetchReviewTasks(spreadId: string) {
  return query<{ listReviewTasks: unknown[] }>(
    `query ListReviewTasks($spreadId: ID!) {
      listReviewTasks(spreadId: $spreadId) {
        id
        spreadId
        status
        reason
        assignedTo
        createdAt
      }
    }`,
    { spreadId }
  );
}

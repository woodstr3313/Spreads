const mutate = async <T>(body: string, variables: Record<string, unknown>) => {
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

export async function resolveReviewTask(input: {
  spreadId: string;
  reviewTaskId: string;
  approved: boolean;
  notes?: string;
}) {
  return mutate<{ resolveReviewTask: { id: string; status: string; reason: string } }>(
    `mutation ResolveReviewTask($input: ResolveReviewTaskInput!) {
      resolveReviewTask(input: $input) {
        id
        status
        reason
      }
    }`,
    { input }
  );
}

export async function updateCell(input: {
  spreadId: string;
  spreadVersionId: string;
  rowId: string;
  periodId: string;
  normalizedValue: string;
  displayValue?: string;
}) {
  return mutate<{ updateCell: { rowId: string; periodId: string; displayValue?: string; origin: string } }>(
    `mutation UpdateCell($input: UpdateCellInput!) {
      updateCell(input: $input) {
        rowId
        periodId
        displayValue
        origin
      }
    }`,
    { input }
  );
}

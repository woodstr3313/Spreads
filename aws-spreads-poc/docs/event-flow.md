# Event Flow

1. User uploads a borrower package to S3.
2. S3 event triggers ingestion start.
3. Step Functions orchestrates extraction and post-processing.
4. Textract returns candidate tables and form structures.
5. Normalization service proposes canonical tag mappings.
6. Low-confidence rows create review tasks.
7. Reviewer resolves exceptions.
8. Formula engine recalculates derived rows.
9. Spread moves to approved and then locked state.
10. Bedrock-powered copilot can generate commentary and explain variances after deterministic values are finalized.

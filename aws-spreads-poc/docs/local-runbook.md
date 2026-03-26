# Local runbook

## Goal
Exercise the backend flow without deploying the full UI.

## Path
1. Seed a spread upload payload
2. Run ingestion_start locally or through Lambda
3. Run textract_complete with the returned spreadVersionId
4. Inspect the spread version item in DynamoDB
5. Resolve the review task through review_callback

## Sample sequence
Use `examples/events/upload-document.json` as the starting payload.

Expected outcome:
- one template version seeded
- one spread version created
- extracted AI-suggested cells persisted
- formula cells calculated
- a review task opened if low-confidence candidates exist

# AWS Spreads AI POC

A starter monorepo for a commercial banking financial spreading platform on AWS with configurable templates, deterministic formulas, document ingestion, and agentic AI hooks.

## What this includes
- CDK stack for S3, DynamoDB, AppSync, Cognito, Lambda, and Step Functions
- End-to-end backend starter for upload -> extract -> review-required -> approval callback
- GraphQL schema for spreads, templates, periods, cells, and review workflow
- Core TypeScript domain model for templates, statements, spreads, cells, mappings, and provenance
- Formula engine with dependency extraction, DAG validation, selective recalculation scaffolding, and circular dependency detection
- Normalization layer with canonical tags and mapping suggestions
- Concrete Lambda handlers for ingestion start, extraction completion, review callback, and AppSync Lambda resolver handling
- Sample template, sample extraction payloads, and a local runbook

## Suggested stack
- Front end: Next.js + AG Grid
- API: AWS AppSync
- Auth: Amazon Cognito
- Workflow: AWS Step Functions Standard workflows
- File storage: Amazon S3
- Document extraction: Amazon Textract
- AI orchestration: Amazon Bedrock Agents
- Search/RAG: Amazon Bedrock Knowledge Bases + Amazon OpenSearch
- Transactional store: Amazon DynamoDB

AWS docs confirm:
- Bedrock Agents orchestrate models, data sources, APIs, and conversations. citeturn820799search0turn820799search4
- AppSync subscriptions support secure WebSocket-based real-time updates. citeturn820799search1turn820799search13
- Step Functions callback tasks can pause workflows for human approval. citeturn820799search2turn820799search6turn820799search18
- Textract AnalyzeDocument supports tables, forms, queries, and signatures. citeturn820799search3turn820799search11turn820799search15

## Repo layout
```text
apps/
  web/                         # placeholder for React/Next.js UI
infra/
  bin/                         # CDK entrypoint
  lib/                         # CDK stacks
  lambda/                      # Lambda handlers
packages/
  api-schema/                  # GraphQL schema
  contracts/                   # shared contracts and events
  core/                        # domain entities and helpers
  formula-engine/              # deterministic calculation engine
  normalization/               # tag registry and mapping logic
docs/
  architecture.md
  event-flow.md
```

## Quick start
```bash
npm install
npm run build
```

## What to build next
1. Hook AppSync resolvers to DynamoDB and Lambda
2. Replace the placeholder web app with Next.js + AG Grid
3. Add Step Functions service integrations for Textract and human approval callback
4. Add Bedrock Agent action groups against internal APIs
5. Expand the formula grammar and compiler

## Important design rule
AI suggests. Deterministic services decide. Human reviewers approve material changes.


## What is working now
- Seeds a demo C&I template into DynamoDB
- Creates a new spread version from an upload mutation or ingest event
- Simulates extraction candidates and writes AI-suggested cells
- Calculates formula rows like Gross Profit, EBITDA, Net Income, and balance sheet rollups
- Opens a review task when confidence drops below threshold
- Supports Step Functions task-token callback for human approval

## Known gaps
- Textract is stubbed with sample extraction data for the POC path
- AppSync resolvers are Lambda-backed but the field contracts still need hardening
- No front-end spread grid yet
- No Bedrock Agent action groups yet

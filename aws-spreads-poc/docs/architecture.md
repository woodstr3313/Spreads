# Architecture Notes

## Why AppSync
AppSync is a strong fit for spread grids because subscription support allows real-time updates and collaboration for reviewers and analysts. AWS documents that AppSync subscriptions use secure WebSocket connections and can distribute live changes to subscribers. citeturn820799search1turn820799search13

## Why Step Functions Standard
The review workflow needs long-running orchestration and pause/resume semantics. AWS documents that callback tasks can pause a workflow and wait for human approval or an external process to respond with a task token. citeturn820799search2turn820799search6turn820799search18

## Why Textract
Financial statements often arrive as PDFs or scanned images. AWS documents that Textract AnalyzeDocument supports extraction of tables, forms, queries, and signatures, which is important for lender packages and spread provenance. citeturn820799search3turn820799search7turn820799search11

## Why Bedrock Agents
The agent layer should orchestrate APIs, knowledge sources, and models rather than directly own spread state. AWS documents that Bedrock Agents can orchestrate interactions between models, software applications, data sources, and user conversations, and the user guide now also references AgentCore for scaling secure production-grade agents. citeturn820799search0turn820799search4

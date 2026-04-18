# True Runner Workflow for Biomedical IPO Research

This workflow is the reliable version of the orchestrator.

## What it does
1. Run the IPO scout agent
2. Extract company handoff blocks
3. Run one `research-agent` per company
4. Merge results into one report

## Files involved
- `biomed-ipo-scout-agent.md`
- `research-agent.md`
- `research-to-review-collector-agent.md`
- `paper-review-agent.md`
- `biomed-ipo-orchestrator-agent.md`
- `run-biomed-ipo-workflow.sh`
- `biomed-ipo-workflow-runner.js`

## Why this is better
A single markdown prompt can describe orchestration, but this workflow makes the handoff explicit and reusable.
It is more production-like because the steps are separated cleanly.

## Version 2 runner
Use:
- `node biomed-ipo-workflow-runner.js --dry-run`
- `node biomed-ipo-workflow-runner.js --companies-file companies.json --max-parallel 2 --output report.md`
- `node biomed-ipo-workflow-runner.js --quick --max-parallel 2 --output report.md`

What the Node runner does:
- in standard mode, prints a ready-to-use scout payload, reads handoff blocks, generates research payloads, and builds a merged report scaffold
- in quick mode, reads `staticData/ipo_list.txt`, takes the first 3 companies, skips scout entirely, generates research payloads, and builds a research-only scaffold

## Parallelism guidance
- Keep the scout step serial.
- Run research fan-out only after reviewing scout output.
- Use bounded parallelism, not unbounded parallelism.
- Default recommendation: `--max-parallel 2`

Why:
- finance-source matching can be noisy
- company-name disambiguation in PubMed can be noisy
- too much parallelism makes debugging harder without giving strong reliability benefits

## Important honesty note
This is a real runner artifact, but it still does not directly execute OpenClaw tool calls from the local script.
Instead, it generates robust orchestration payloads and report scaffolding.
That is the safe and truthful approach in this environment.

A fully automatic end-to-end executor would require a supported external API or SDK path for creating and monitoring subagent runs outside the in-chat tool runtime.

## How to use

### Standard mode
1. Run:
   - `node biomed-ipo-workflow-runner.js --dry-run`
2. Spawn the scout agent with the printed payload.
3. Convert the scout handoff blocks into a JSON array file like `companies.json`.
4. Run:
   - `node biomed-ipo-workflow-runner.js --companies-file companies.json --max-parallel 2 --output report.md`
5. Use the generated research payloads and final report scaffold to complete the run.

### Quick mode
1. Run:
   - `node biomed-ipo-workflow-runner.js --quick --max-parallel 2 --output quick-report.md`
2. The runner reads `staticData/ipo_list.txt`.
3. It takes the first 3 companies only.
4. It skips scout completely.
5. Use the generated research payloads to fetch all papers for those 3 companies.

## Review collection layer
After research-agent runs finish, you can add a collector stage:
1. Feed one or more research-agent outputs into `research-to-review-collector-agent.md`
2. Let it choose high-confidence company-linked papers only
3. Generate one handoff per selected paper for `paper-review-agent.md`
4. Run those paper reviews in bounded parallelism

This is a good place to parallelize, because paper reviews are independent once the paper-selection step is done.

## Recommended future improvement
If OpenClaw exposes a stable external API/SDK for subagent orchestration, the next step is to upgrade this runner so it:
- parses scout output automatically
- launches research subagents automatically
- waits for completion
- routes research outputs through the collector agent automatically
- launches paper-review subagents automatically
- assembles the final report automatically

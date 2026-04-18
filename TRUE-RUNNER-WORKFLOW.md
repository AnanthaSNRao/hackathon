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
- `biomed-ipo-orchestrator-agent.md`
- `run-biomed-ipo-workflow.sh`

## Why this is better
A single markdown prompt can describe orchestration, but this workflow makes the handoff explicit and reusable.
It is more production-like because the steps are separated cleanly.

## How to use

### Step 1
Run or inspect:
- `./run-biomed-ipo-workflow.sh`

This prints ready-to-use `sessions_spawn` payloads.

### Step 2
Spawn the scout agent with the printed payload.

### Step 3
Take each handoff block from the scout output and spawn a `research-agent` run.

### Step 4
Merge all outputs into a final report using the structure in `biomed-ipo-orchestrator-agent.md`.

## Recommended future improvement
If you want full automation, the next step is not another markdown prompt. It is a small program or OpenClaw-native workflow that:
- parses scout output automatically
- launches research subagents automatically
- waits for completion
- assembles the final report automatically

That would be the real end-to-end production runner.

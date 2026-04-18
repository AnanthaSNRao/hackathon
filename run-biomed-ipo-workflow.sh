#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="/Users/ananthasn/.openclaw/workspace"
SCOUT_PROMPT="$WORKSPACE/biomed-ipo-scout-agent.md"
RESEARCH_PROMPT="$WORKSPACE/research-agent.md"
ORCH_PROMPT="$WORKSPACE/biomed-ipo-orchestrator-agent.md"

cat <<EOF
Biomedical IPO workflow runner

This is a manual orchestration helper.
It does not directly call OpenClaw tools by itself.
Instead, use the generated task payloads below with sessions_spawn.

Files used:
- $SCOUT_PROMPT
- $RESEARCH_PROMPT
- $ORCH_PROMPT
EOF

cat <<'EOF'

=== STEP 1: Spawn the scout agent ===

{
  "task": "Read /Users/ananthasn/.openclaw/workspace/biomed-ipo-scout-agent.md and follow it exactly. Find upcoming biomedical IPOs and biomedical IPOs from the last 30 days. Use public finance sources such as Yahoo Finance, Seeking Alpha, Nasdaq, and company investor relations pages when useful. Return the output in the exact format requested by the file.",
  "label": "biomed-ipo-scout",
  "runtime": "subagent",
  "mode": "run",
  "cleanup": "delete",
  "lightContext": true
}

=== STEP 2: For each company handoff block, spawn research-agent ===

{
  "task": "Read /Users/ananthasn/.openclaw/workspace/research-agent.md and follow it exactly.\n\nHandoff input:\nCompany: <name>\nTicker: <ticker or unknown>\nIPO status: <upcoming/recent/tentative>\nIPO date context: <date details>\nBusiness summary: <short summary>\nPubMed search targets:\n- <official company name>\n- <common abbreviation if useful>\n- <subsidiary or platform names if useful>\nResearch task for research-agent:\n- Search PubMed for papers from the last 12 months associated with this company.\n- Look for author affiliations, corporate funding statements, and company names in affiliation fields.\n- List all likely company-linked papers.\n- Summarize the topic of each paper in 1 sentence.\n- Flag ambiguous matches.",
  "label": "research-agent-<company>",
  "runtime": "subagent",
  "mode": "run",
  "cleanup": "delete",
  "lightContext": true
}

=== STEP 3: Merge outputs ===

Use the orchestrator prompt as the final synthesis rubric, or manually merge scout + research outputs into one report.
EOF

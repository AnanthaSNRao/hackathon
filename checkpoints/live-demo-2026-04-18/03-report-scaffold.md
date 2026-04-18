# Biomedical IPO workflow run

Parallel research hint used: 2

## Scout phase
Run this payload first:
```json
{
  "task": "Read /Users/ananthasn/.openclaw/workspace/biomed-ipo-scout-agent.md and follow it exactly. Find upcoming biomedical IPOs and biomedical IPOs from the last 30 days. Use public finance sources such as Yahoo Finance, Seeking Alpha, Nasdaq, and company investor relations pages when useful. Return the output in the exact format requested by the file.",
  "label": "biomed-ipo-scout",
  "runtime": "subagent",
  "mode": "run",
  "cleanup": "delete",
  "lightContext": true
}
```

## Research fan-out phase
Recommended execution: up to 2 research-agent runs in parallel after scout output is reviewed.

### Company 1: Seaport Therapeutics
```json
{
  "task": "Read /Users/ananthasn/.openclaw/workspace/research-agent.md and follow it exactly.\n\nHandoff input:\nCompany: Seaport Therapeutics\nTicker: unknown\nIPO status: upcoming\nIPO date context: Mentioned in BioSpace IPO Tracker on 2026-04-13, exact pricing/listing date not confirmed from partial output\nBusiness summary: Therapeutics / biotech company, likely drug-development focused based on source context\nPubMed search targets:\n- Seaport Therapeutics\n- Seaport\nResearch task for research-agent:\n- Search PubMed for papers from the last 12 months associated with this company.\n- Look for author affiliations, corporate funding statements, and company names in affiliation fields.\n- List all likely company-linked papers.\n- Summarize the topic of each paper in 1 sentence.\n- Flag ambiguous matches.",
  "label": "research-agent-seaport-therapeutics",
  "runtime": "subagent",
  "mode": "run",
  "cleanup": "delete",
  "lightContext": true
}
```

### Company 2: Hemab
```json
{
  "task": "Read /Users/ananthasn/.openclaw/workspace/research-agent.md and follow it exactly.\n\nHandoff input:\nCompany: Hemab\nTicker: unknown\nIPO status: upcoming\nIPO date context: Mentioned in BioSpace IPO Tracker on 2026-04-13, exact pricing/listing date not confirmed from partial output\nBusiness summary: Biotech / biomedical company, likely therapeutics focused based on source context\nPubMed search targets:\n- Hemab\nResearch task for research-agent:\n- Search PubMed for papers from the last 12 months associated with this company.\n- Look for author affiliations, corporate funding statements, and company names in affiliation fields.\n- List all likely company-linked papers.\n- Summarize the topic of each paper in 1 sentence.\n- Flag ambiguous matches.",
  "label": "research-agent-hemab",
  "runtime": "subagent",
  "mode": "run",
  "cleanup": "delete",
  "lightContext": true
}
```

### Company 3: Kailera Therapeutics
```json
{
  "task": "Read /Users/ananthasn/.openclaw/workspace/research-agent.md and follow it exactly.\n\nHandoff input:\nCompany: Kailera Therapeutics\nTicker: unknown\nIPO status: recent\nIPO date context: IPO reported on 2026-04-17\nBusiness summary: Biotech / therapeutics company\nPubMed search targets:\n- Kailera Therapeutics\n- Kailera\nResearch task for research-agent:\n- Search PubMed for papers from the last 12 months associated with this company.\n- Look for author affiliations, corporate funding statements, and company names in affiliation fields.\n- List all likely company-linked papers.\n- Summarize the topic of each paper in 1 sentence.\n- Flag ambiguous matches.",
  "label": "research-agent-kailera-therapeutics",
  "runtime": "subagent",
  "mode": "run",
  "cleanup": "delete",
  "lightContext": true
}
```

## Final synthesis
Use /Users/ananthasn/.openclaw/workspace/biomed-ipo-orchestrator-agent.md as the merge rubric.

## Notes
- Keep the scout step serial.
- Only run research in parallel after the handoff blocks are checked.
- Bounded parallelism is safer than unbounded fan-out because finance and PubMed matching can be noisy.

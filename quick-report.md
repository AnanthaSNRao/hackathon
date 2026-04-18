# Biomedical IPO workflow run

Parallel research hint used: 2

## Quick mode
Source file used: /Users/ananthasn/.openclaw/workspace/staticData/ipo_list.txt
Scout step skipped.

## Quick-source companies
1. Alamar Biosciences (ALMR)
2. Kailera Therapeutics (KLRA)
3. Encore Medical (EMI)

## Research fan-out phase
Recommended execution: up to 2 research-agent runs in parallel after scout output is reviewed.

### Company 1: Alamar Biosciences
```json
{
  "task": "Read /Users/ananthasn/.openclaw/workspace/research-agent.md and follow it exactly.\n\nHandoff input:\nCompany: Alamar Biosciences\nTicker: ALMR\nIPO status: quick-list\nIPO date context: Loaded from staticData/ipo_list.txt quick mode\nBusiness summary: Loaded from static quick IPO list; business summary not enriched in quick mode\nPubMed search targets:\n- Alamar Biosciences\n- ALMR\nResearch task for research-agent:\n- Search PubMed for papers from the last 12 months associated with this company.\n- Look for author affiliations, corporate funding statements, and company names in affiliation fields.\n- List all likely company-linked papers.\n- Summarize the topic of each paper in 1 sentence.\n- Flag ambiguous matches.",
  "label": "research-agent-alamar-biosciences",
  "runtime": "subagent",
  "mode": "run",
  "cleanup": "delete",
  "lightContext": true
}
```

### Company 2: Kailera Therapeutics
```json
{
  "task": "Read /Users/ananthasn/.openclaw/workspace/research-agent.md and follow it exactly.\n\nHandoff input:\nCompany: Kailera Therapeutics\nTicker: KLRA\nIPO status: quick-list\nIPO date context: Loaded from staticData/ipo_list.txt quick mode\nBusiness summary: Loaded from static quick IPO list; business summary not enriched in quick mode\nPubMed search targets:\n- Kailera Therapeutics\n- KLRA\nResearch task for research-agent:\n- Search PubMed for papers from the last 12 months associated with this company.\n- Look for author affiliations, corporate funding statements, and company names in affiliation fields.\n- List all likely company-linked papers.\n- Summarize the topic of each paper in 1 sentence.\n- Flag ambiguous matches.",
  "label": "research-agent-kailera-therapeutics",
  "runtime": "subagent",
  "mode": "run",
  "cleanup": "delete",
  "lightContext": true
}
```

### Company 3: Encore Medical
```json
{
  "task": "Read /Users/ananthasn/.openclaw/workspace/research-agent.md and follow it exactly.\n\nHandoff input:\nCompany: Encore Medical\nTicker: EMI\nIPO status: quick-list\nIPO date context: Loaded from staticData/ipo_list.txt quick mode\nBusiness summary: Loaded from static quick IPO list; business summary not enriched in quick mode\nPubMed search targets:\n- Encore Medical\n- EMI\nResearch task for research-agent:\n- Search PubMed for papers from the last 12 months associated with this company.\n- Look for author affiliations, corporate funding statements, and company names in affiliation fields.\n- List all likely company-linked papers.\n- Summarize the topic of each paper in 1 sentence.\n- Flag ambiguous matches.",
  "label": "research-agent-encore-medical",
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

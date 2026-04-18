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
  "task": "Use the local paper files below instead of PubMed. Read each file and summarize the paper(s) for the target company.\n\nCompany: Alamar Biosciences\nTicker: ALMR\nLocal paper files:\n- /Users/ananthasn/.openclaw/workspace/staticData/ALMR 2026 tuenissen An acetylated Tau-174 CSF biomarker discriminates.pdf\n\nFor each file, extract the paper title, journal if visible, year/date if visible, and provide a short summary. Then give an overall assessment of the company's visible research footprint from these local files. Clearly note any limitations from using only local files.",
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
  "task": "Use the local paper files below instead of PubMed. Read each file and summarize the paper(s) for the target company.\n\nCompany: Kailera Therapeutics\nTicker: KLRA\nLocal paper files:\n- /Users/ananthasn/.openclaw/workspace/staticData/KLRA 2026 pop oral semaglutide.pdf\n\nFor each file, extract the paper title, journal if visible, year/date if visible, and provide a short summary. Then give an overall assessment of the company's visible research footprint from these local files. Clearly note any limitations from using only local files.",
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
  "task": "Use the local paper files below instead of PubMed. Read each file and summarize the paper(s) for the target company.\n\nCompany: Encore Medical\nTicker: EMI\nLocal paper files:\n- /Users/ananthasn/.openclaw/workspace/staticData/EMI 2026.pdf\n\nFor each file, extract the paper title, journal if visible, year/date if visible, and provide a short summary. Then give an overall assessment of the company's visible research footprint from these local files. Clearly note any limitations from using only local files.",
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

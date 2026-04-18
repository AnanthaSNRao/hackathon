# Biomedical IPO Agent Workflow

This workspace contains a multi-agent workflow for screening biomedical IPO companies, gathering paper evidence, selecting high-confidence company-linked papers, and reviewing those papers critically.

## Main entry points

### 1. Operational runner
- `biomed-ipo-workflow-runner.js`

Use this as the practical execution entry point.
It supports:
- standard mode
- quick mode

### 2. Conceptual orchestrator
- `biomed-ipo-orchestrator-agent.md`

Use this as the top-level orchestration prompt/spec.

## Agent roles

### `biomed-ipo-scout-agent.md`
Used in standard mode only.

Responsibilities:
- find upcoming biomedical IPOs
- find biomedical IPOs from the last 30 days
- prepare company handoff blocks for research

### `research-agent.md`
Collects paper evidence for a company.

Responsibilities:
- in standard mode, search PubMed
- in quick mode, summarize local paper files from `staticData/`
- list papers and summarize research footprint

### `research-to-review-collector-agent.md`
Filters research results before deep paper review.

Responsibilities:
- inspect research-agent outputs
- keep only high-confidence company-linked papers
- select the best paper per company by default
- prepare review handoffs

### `paper-review-agent.md`
Critically reviews selected papers.

Responsibilities:
- score journal quality
- score novelty
- score technical soundness
- score evidence and clarity
- score author credibility
- score financial and market impact
- produce a final weighted score

### `paper-review-fanout-agent.md`
Runs paper reviews in bounded parallelism.

Responsibilities:
- validate review handoffs
- accept or reject review tasks
- fan out paper reviews in parallel
- merge review results

## Workflow overview

## Standard mode
1. Start with `biomed-ipo-workflow-runner.js`
2. Use `biomed-ipo-scout-agent.md` to discover IPO companies
3. Pass companies to `research-agent.md`
4. Pass research outputs to `research-to-review-collector-agent.md`
5. Pass selected reviewable papers to `paper-review-fanout-agent.md`
6. Run `paper-review-agent.md` reviews in bounded parallelism
7. Merge everything into a final report

## Quick mode
1. Start with `biomed-ipo-workflow-runner.js --quick`
2. Read `staticData/ipo_list.txt`
3. Take the first 3 companies
4. Use matching local paper files in `staticData/`
5. Summarize those papers with the quick-mode research step
6. Pass the results to `research-to-review-collector-agent.md`
7. Pass selected papers to `paper-review-fanout-agent.md`
8. Run `paper-review-agent.md` reviews in bounded parallelism
9. Merge everything into a final report

## Parallelism guidance

### Keep serial
- IPO scouting
- company filtering
- paper selection in the collector step

### Safe to parallelize
- company-level research after company list is fixed
- paper reviews after selected papers are fixed

### Recommended bounds
- research fanout: 2
- paper review fanout: 2
- upper bound: 3 when needed

## Quick mode data source
Quick mode uses:
- `staticData/ipo_list.txt`

And currently maps to local files such as:
- `staticData/ALMR 2026 tuenissen An acetylated Tau-174 CSF biomarker discriminates.pdf`
- `staticData/KLRA 2026 pop oral semaglutide.pdf`
- `staticData/EMI 2026.pdf`

Quick mode prefers these local files over PubMed.

## Suggested quick demo prompt

```text
Run the biomedical IPO workflow in quick demo mode.

Instructions:
- Read /Users/ananthasn/.openclaw/workspace/staticData/ipo_list.txt
- Take the first 3 companies only
- Do not run IPO scouting
- For each of those 3 companies, use the matching local paper file(s) in /Users/ananthasn/.openclaw/workspace/staticData/
- Do not query PubMed in quick mode when local files exist
- Summarize the paper(s) for each company
- Then pass the research outputs to /Users/ananthasn/.openclaw/workspace/research-to-review-collector-agent.md
- Select the best high-confidence paper per company
- For selected papers, run /Users/ananthasn/.openclaw/workspace/paper-review-agent.md
- Run paper reviews in bounded parallelism only after paper selection is complete
- Return one final merged report
```

## Diagram

```text
biomed-ipo-workflow-runner.js
  -> standard mode: biomed-ipo-scout-agent.md
  -> quick mode: staticData/ipo_list.txt + local paper files
  -> research-agent.md
  -> research-to-review-collector-agent.md
  -> paper-review-fanout-agent.md
  -> paper-review-agent.md
  -> final merged report
```

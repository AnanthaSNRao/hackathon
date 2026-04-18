# Biomedical IPO to Research Handoff Workflow

## Purpose
Use this workflow when you want one agent to identify biomedical IPO companies and then hand those companies to `research-agent` for PubMed-based literature checks.

## Step 1: IPO scout agent
Spawn a sub-agent with instructions to read:
- /Users/ananthasn/.openclaw/workspace/biomed-ipo-scout-agent.md

Its job:
- identify upcoming biomedical IPOs
- identify biomedical IPOs from the last 30 days
- create structured handoff blocks for each company

## Step 2: Research follow-up
For each handoff block, spawn a `research-agent` sub-agent with instructions to read:
- /Users/ananthasn/.openclaw/workspace/research-agent.md

Pass the handoff block as the company-specific task input.

## Example sessions_spawn task for IPO scout
Read /Users/ananthasn/.openclaw/workspace/biomed-ipo-scout-agent.md and follow it exactly.

Find:
- upcoming biomedical IPOs
- biomedical IPOs completed in the last 30 days

Use public finance sources such as Yahoo Finance, Seeking Alpha, Nasdaq, and company investor relations pages when useful.
Return the output in the exact format requested by the file.

## Example sessions_spawn task for research-agent
Read /Users/ananthasn/.openclaw/workspace/research-agent.md and follow it exactly.

Handoff input:
Company: <name>
Ticker: <ticker or unknown>
IPO status: <upcoming/recent/tentative>
IPO date context: <date details>
Business summary: <short summary>
PubMed search targets:
- <official company name>
- <common abbreviation if useful>
- <subsidiary or platform names if useful>
Research task for research-agent:
- Search PubMed for papers from the last 12 months associated with this company.
- Look for author affiliations, corporate funding statements, and company names in affiliation fields.
- List all likely company-linked papers.
- Summarize the topic of each paper in 1 sentence.
- Flag ambiguous matches.

## Orchestration note
The scout agent should stay focused on company and IPO identification.
The research-agent should stay focused on PubMed and literature linkage.
Do not mix the two roles unless necessary.

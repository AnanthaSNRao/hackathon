#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const WORKSPACE = '/Users/ananthasn/.openclaw/workspace';
const SCOUT_PROMPT = path.join(WORKSPACE, 'biomed-ipo-scout-agent.md');
const RESEARCH_PROMPT = path.join(WORKSPACE, 'research-agent.md');
const SYNTHESIS_PROMPT = path.join(WORKSPACE, 'biomed-ipo-orchestrator-agent.md');
const QUICK_SOURCE = path.join(WORKSPACE, 'staticData', 'ipo_list.txt');
const STATIC_DATA_DIR = path.join(WORKSPACE, 'staticData');

function parseArgs(argv) {
  const args = {
    maxParallel: 2,
    companiesFile: null,
    dryRun: false,
    output: null,
    quick: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--max-parallel') {
      args.maxParallel = Number(argv[++i] || '2');
    } else if (arg === '--companies-file') {
      args.companiesFile = argv[++i] || null;
    } else if (arg === '--output') {
      args.output = argv[++i] || null;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--quick') {
      args.quick = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(args.maxParallel) || args.maxParallel < 1) {
    throw new Error('--max-parallel must be a positive integer');
  }

  return args;
}

function printHelp() {
  console.log(`Biomedical IPO workflow runner v2

Usage:
  node biomed-ipo-workflow-runner.js --companies-file companies.json [--max-parallel 2] [--output report.md]
  node biomed-ipo-workflow-runner.js --quick [--max-parallel 2] [--output report.md]
  node biomed-ipo-workflow-runner.js --dry-run

What it does:
  Standard mode:
    1. Prints a ready-to-use scout sessions_spawn payload
    2. Reads a JSON file of company handoff blocks after you obtain scout output
    3. Prints ready-to-use research sessions_spawn payloads
    4. Produces a merged markdown report scaffold

  Quick mode:
    1. Reads ${QUICK_SOURCE}
    2. Takes the first 3 companies from the current list
    3. Skips scout entirely
    4. Produces ready-to-use research sessions_spawn payloads and a report scaffold

Why this design:
  OpenClaw tool APIs are available inside agent runs, not directly from a local script.
  So this runner focuses on robust orchestration artifacts instead of pretending it can directly spawn tool sessions itself.

Arguments:
  --companies-file   JSON file containing an array of company handoff objects
  --quick            Skip scout and use the first 3 companies from staticData/ipo_list.txt
  --max-parallel     Bounded parallelism hint for research fan-out (default: 2)
  --output           Write merged report scaffold to this path
  --dry-run          Print the scout payload and an example companies file shape
`);
}

function buildScoutPayload() {
  return {
    task: `Read ${SCOUT_PROMPT} and follow it exactly. Find upcoming biomedical IPOs and biomedical IPOs from the last 30 days. Use public finance sources such as Yahoo Finance, Seeking Alpha, Nasdaq, and company investor relations pages when useful. Return the output in the exact format requested by the file.`,
    label: 'biomed-ipo-scout',
    runtime: 'subagent',
    mode: 'run',
    cleanup: 'delete',
    lightContext: true,
  };
}

function buildResearchPayload(company) {
  const nameSlug = String(company.company || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'company';

  const targets = Array.isArray(company.pubmedSearchTargets) && company.pubmedSearchTargets.length
    ? company.pubmedSearchTargets.map((x) => `- ${x}`).join('\n')
    : '- <provide search targets>';

  return {
    task: `Read ${RESEARCH_PROMPT} and follow it exactly.\n\nHandoff input:\nCompany: ${company.company || 'unknown'}\nTicker: ${company.ticker || 'unknown'}\nIPO status: ${company.ipoStatus || 'unknown'}\nIPO date context: ${company.ipoDateContext || 'unknown'}\nBusiness summary: ${company.businessSummary || 'unknown'}\nPubMed search targets:\n${targets}\nResearch task for research-agent:\n- Search PubMed for papers from the last 12 months associated with this company.\n- Look for author affiliations, corporate funding statements, and company names in affiliation fields.\n- List all likely company-linked papers.\n- Summarize the topic of each paper in 1 sentence.\n- Flag ambiguous matches.`,
    label: `research-agent-${nameSlug}`,
    runtime: 'subagent',
    mode: 'run',
    cleanup: 'delete',
    lightContext: true,
  };
}

function findStaticPaperFiles(companyName, ticker) {
  const normalizedName = String(companyName || '').toLowerCase();
  const normalizedTicker = String(ticker || '').toLowerCase();
  return [
    `${ticker}`,
    companyName,
  ].filter(Boolean);
}

async function buildQuickCompaniesFromText(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const entries = [];

  for (const line of lines) {
    if (/^IPO LIST/i.test(line) || /^OLDER/i.test(line)) continue;
    const match = line.match(/^([A-Z0-9]+)\s+(.+?)\s+-\s+/);
    if (!match) continue;
    const ticker = match[1].trim();
    const companyName = match[2].trim().replace(/[—–-]\s*$/, '');
    entries.push({ ticker, companyName });
    if (entries.length >= 3) break;
  }

  const staticFiles = await fs.readdir(STATIC_DATA_DIR);

  return entries.map(({ ticker, companyName }) => {
    const localPaperFiles = staticFiles
      .filter((file) => file !== 'ipo_list.txt')
      .filter((file) => file.toLowerCase().includes(ticker.toLowerCase()) || file.toLowerCase().includes(companyName.toLowerCase()))
      .map((file) => path.join(STATIC_DATA_DIR, file));

    return {
      company: companyName,
      ticker,
      ipoStatus: 'quick-list',
      ipoDateContext: 'Loaded from staticData/ipo_list.txt quick mode',
      businessSummary: 'Loaded from static quick IPO list; business summary not enriched in quick mode',
      pubmedSearchTargets: [companyName, ticker],
      localPaperFiles,
    };
  });
}

function buildQuickResearchPayload(company) {
  const nameSlug = String(company.company || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'company';

  const files = Array.isArray(company.localPaperFiles) && company.localPaperFiles.length
    ? company.localPaperFiles.map((x) => `- ${x}`).join('\n')
    : '- <no local paper files found>';

  return {
    task: `Use the local paper files below instead of PubMed. Read each file and summarize the paper(s) for the target company.\n\nCompany: ${company.company || 'unknown'}\nTicker: ${company.ticker || 'unknown'}\nLocal paper files:\n${files}\n\nFor each file, extract the paper title, journal if visible, year/date if visible, and provide a short summary. Then give an overall assessment of the company's visible research footprint from these local files. Clearly note any limitations from using only local files.`,
    label: `research-agent-${nameSlug}`,
    runtime: 'subagent',
    mode: 'run',
    cleanup: 'delete',
    lightContext: true,
  };
}

function buildReport(companies, maxParallel, options = {}) {
  const lines = [];
  lines.push('# Biomedical IPO workflow run');
  lines.push('');
  lines.push(`Parallel research hint used: ${maxParallel}`);
  lines.push('');

  if (options.quick) {
    lines.push('## Quick mode');
    lines.push(`Source file used: ${QUICK_SOURCE}`);
    lines.push('Scout step skipped.');
    lines.push('');
    lines.push('## Quick-source companies');
    companies.forEach((company, index) => {
      lines.push(`${index + 1}. ${company.company} (${company.ticker || 'unknown'})`);
    });
    lines.push('');
  } else {
    lines.push('## Scout phase');
    lines.push('Run this payload first:');
    lines.push('```json');
    lines.push(JSON.stringify(buildScoutPayload(), null, 2));
    lines.push('```');
    lines.push('');
  }

  lines.push('## Research fan-out phase');
  lines.push(`Recommended execution: up to ${maxParallel} research-agent runs in parallel after scout output is reviewed.`);
  lines.push('');

  companies.forEach((company, index) => {
    lines.push(`### Company ${index + 1}: ${company.company || 'unknown'}`);
    lines.push('```json');
    lines.push(JSON.stringify(options.quick ? buildQuickResearchPayload(company) : buildResearchPayload(company), null, 2));
    lines.push('```');
    lines.push('');
  });

  lines.push('## Final synthesis');
  lines.push(`Use ${SYNTHESIS_PROMPT} as the merge rubric.`);
  lines.push('');
  lines.push('## Notes');
  lines.push('- Keep the scout step serial.');
  lines.push('- Only run research in parallel after the handoff blocks are checked.');
  lines.push('- Bounded parallelism is safer than unbounded fan-out because finance and PubMed matching can be noisy.');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.dryRun) {
    console.log('Scout payload:');
    console.log(JSON.stringify(buildScoutPayload(), null, 2));
    console.log('');
    console.log('Example companies.json:');
    console.log(JSON.stringify([
      {
        company: 'Example Bio Inc',
        ticker: 'EXBIO',
        ipoStatus: 'upcoming',
        ipoDateContext: 'Expected pricing next week',
        businessSummary: 'Clinical-stage biotech developing RNA therapies',
        pubmedSearchTargets: ['Example Bio Inc', 'ExampleBio', 'EXBIO'],
      }
    ], null, 2));
    return;
  }

  let companies;

  if (args.quick) {
    const quickText = await fs.readFile(QUICK_SOURCE, 'utf8');
    companies = await buildQuickCompaniesFromText(quickText);
  } else {
    if (!args.companiesFile) {
      throw new Error('Missing required --companies-file (or use --quick or --dry-run)');
    }

    const raw = await fs.readFile(path.resolve(args.companiesFile), 'utf8');
    companies = JSON.parse(raw);

    if (!Array.isArray(companies)) {
      throw new Error('--companies-file must contain a JSON array');
    }
  }

  const report = buildReport(companies, args.maxParallel, { quick: args.quick });

  if (args.output) {
    await fs.writeFile(path.resolve(args.output), report, 'utf8');
    console.log(`Wrote report scaffold to ${path.resolve(args.output)}`);
  } else {
    process.stdout.write(report);
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

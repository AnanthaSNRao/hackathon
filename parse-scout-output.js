#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

function parseArgs(argv) {
  const args = {
    input: null,
    output: 'companies.json',
    checkpointDir: null,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input') {
      args.input = argv[++i] || null;
    } else if (arg === '--output') {
      args.output = argv[++i] || 'companies.json';
    } else if (arg === '--checkpoint-dir') {
      args.checkpointDir = argv[++i] || null;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.input) {
    throw new Error('Missing required --input');
  }

  return args;
}

function printHelp() {
  console.log(`Parse scout output into companies.json

Usage:
  node parse-scout-output.js --input scout-output.md --output companies.json [--checkpoint-dir checkpoints]
`);
}

function cleanValue(value) {
  return value.replace(/^[-*]\s*/, '').trim();
}

function extractSection(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`### ${escaped}\\n([\\s\\S]*?)(?=\\n### |$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function parseCompanyBlock(block) {
  const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
  const company = {
    company: null,
    ticker: 'unknown',
    ipoStatus: 'unknown',
    ipoDateContext: 'unknown',
    businessSummary: 'unknown',
    pubmedSearchTargets: [],
    sourceLinks: [],
    confidence: 'unknown',
  };

  let currentList = null;

  for (const line of lines) {
    if (/^- Company name:/i.test(line)) {
      company.company = cleanValue(line.split(/:/.test(line) ? ':' : line)[1] || line.replace(/^- Company name:/i, ''));
      currentList = null;
    } else if (/^- Ticker/i.test(line)) {
      company.ticker = cleanValue(line.replace(/^- Ticker \(if available\):/i, '').replace(/^- Ticker:/i, '')) || 'unknown';
      currentList = null;
    } else if (/^- IPO status:/i.test(line)) {
      company.ipoStatus = cleanValue(line.replace(/^- IPO status:/i, '')) || 'unknown';
      currentList = null;
    } else if (/^- Expected or actual date\(s\):/i.test(line)) {
      company.ipoDateContext = cleanValue(line.replace(/^- Expected or actual date\(s\):/i, '')) || company.ipoDateContext;
      currentList = null;
    } else if (/^- IPO date:/i.test(line)) {
      company.ipoDateContext = cleanValue(line.replace(/^- IPO date:/i, '')) || company.ipoDateContext;
      currentList = null;
    } else if (/^- What the company does:/i.test(line)) {
      company.businessSummary = cleanValue(line.replace(/^- What the company does:/i, '')) || 'unknown';
      currentList = null;
    } else if (/^- Key source links:/i.test(line)) {
      currentList = 'sourceLinks';
    } else if (/^- Confidence:/i.test(line)) {
      company.confidence = cleanValue(line.replace(/^- Confidence:/i, '')) || 'unknown';
      currentList = null;
    } else if (/^PubMed search targets:/i.test(line)) {
      currentList = 'pubmedSearchTargets';
    } else if (/^- /i.test(line) && currentList === 'sourceLinks') {
      company.sourceLinks.push(cleanValue(line));
    } else if (/^- /i.test(line) && currentList === 'pubmedSearchTargets') {
      company.pubmedSearchTargets.push(cleanValue(line));
    }
  }

  if (!company.pubmedSearchTargets.length && company.company) {
    company.pubmedSearchTargets = [company.company];
  }

  return company.company ? company : null;
}

function parseHandoffBlocks(text) {
  const blocks = [];
  const regex = /Company:\s*(.+?)\nTicker:\s*(.+?)\nIPO status:\s*(.+?)\nIPO date context:\s*(.+?)\nBusiness summary:\s*(.+?)\nPubMed search targets:\n([\s\S]*?)Research task for research-agent:/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const targets = match[6]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => cleanValue(line));

    blocks.push({
      company: match[1].trim(),
      ticker: match[2].trim(),
      ipoStatus: match[3].trim(),
      ipoDateContext: match[4].trim(),
      businessSummary: match[5].trim(),
      pubmedSearchTargets: targets,
    });
  }
  return blocks;
}

async function ensureDir(dir) {
  if (!dir) return;
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv);
  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);

  const raw = await fs.readFile(inputPath, 'utf8');

  await ensureDir(args.checkpointDir);
  if (args.checkpointDir) {
    await fs.writeFile(path.join(args.checkpointDir, '01-raw-scout-output.md'), raw, 'utf8');
  }

  let companies = parseHandoffBlocks(raw);

  if (!companies.length) {
    const upcoming = extractSection(raw, 'Upcoming biomedical IPOs');
    const recent = extractSection(raw, 'Biomedical IPOs from the last 30 days');
    const roughBlocks = `${upcoming}\n\n${recent}`
      .split(/\n(?=- Company name:)/g)
      .map((x) => x.trim())
      .filter((x) => x.startsWith('- Company name:'));
    companies = roughBlocks.map(parseCompanyBlock).filter(Boolean);
  }

  await fs.writeFile(outputPath, JSON.stringify(companies, null, 2), 'utf8');

  if (args.checkpointDir) {
    await fs.writeFile(path.join(args.checkpointDir, '02-companies.json'), JSON.stringify(companies, null, 2), 'utf8');
  }

  console.log(`Parsed ${companies.length} companies into ${outputPath}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const sourceSkill = path.join(packageRoot, 'skill', 'review-council');

function usage() {
  console.log(`review-council-skill

Usage:
  npx github:<owner>/review-council-skill install [--target claude,codex,agents,cursor|all] [--path DIR] [--force] [--dry-run]
  npx review-council-skill install [--target claude,codex,agents,cursor|all] [--path DIR] [--force] [--dry-run]

Targets:
  claude  ~/.claude/skills
  codex   \${CODEX_HOME:-~/.codex}/skills
  agents  ~/.agents/skills
  cursor  ~/.cursor/skills

Run without --target or --path to choose targets interactively.
Use --path to install into one explicit skills directory.`);
}

function expandHome(value) {
  if (!value) return value;
  if (value === '~') return os.homedir();
  if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
  return value;
}

function parseArgs(argv) {
  const args = {
    command: argv[2],
    target: null,
    path: null,
    force: false,
    dryRun: false
  };

  for (let i = 3; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--force') args.force = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--target') args.target = argv[++i];
    else if (arg.startsWith('--target=')) args.target = arg.slice('--target='.length);
    else if (arg === '--path') args.path = argv[++i];
    else if (arg.startsWith('--path=')) args.path = arg.slice('--path='.length);
    else if (arg === '--help' || arg === '-h') args.command = 'help';
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function supportedTargets() {
  return [
    { id: 'claude', label: 'Claude Code', dir: path.join(os.homedir(), '.claude', 'skills') },
    {
      id: 'codex',
      label: 'Codex',
      dir: path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills')
    },
    { id: 'agents', label: 'Agent Skills', dir: path.join(os.homedir(), '.agents', 'skills') },
    { id: 'cursor', label: 'Cursor-compatible skills', dir: path.join(os.homedir(), '.cursor', 'skills') }
  ];
}

function targetDir(target) {
  if (target === 'codex') {
    return path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills');
  }
  if (target === 'claude') return path.join(os.homedir(), '.claude', 'skills');
  if (target === 'agents') return path.join(os.homedir(), '.agents', 'skills');
  if (target === 'cursor') return path.join(os.homedir(), '.cursor', 'skills');
  throw new Error(`Unsupported target: ${target}`);
}

function parseTargets(value) {
  if (!value) return [];
  if (value === 'all') return supportedTargets().map((target) => target.id);
  return value
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean);
}

async function promptForTargets() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('No target provided and no interactive terminal is available. Re-run with --target claude,codex,agents,cursor or --path DIR.');
  }

  const targets = supportedTargets();
  console.log('Choose harnesses to install review-council for:');
  targets.forEach((target, index) => {
    console.log(`  ${index + 1}. ${target.label} (${target.dir})`);
  });
  console.log('  a. All harnesses');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question('Select one or more numbers, comma-separated [1]: ')).trim() || '1';
    if (answer.toLowerCase() === 'a' || answer.toLowerCase() === 'all') {
      return targets.map((target) => target.id);
    }

    const selected = new Set();
    for (const part of answer.split(',')) {
      const index = Number(part.trim());
      if (!Number.isInteger(index) || index < 1 || index > targets.length) {
        throw new Error(`Invalid selection: ${part.trim()}`);
      }
      selected.add(targets[index - 1].id);
    }
    return [...selected];
  } finally {
    rl.close();
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

function installInto(skillsDir, args) {
  const dest = path.join(skillsDir, 'review-council');
  if (fs.existsSync(dest) && !args.force && !args.dryRun) {
    throw new Error(`${dest} already exists. Re-run with --force to overwrite.`);
  }

  const existsNote = fs.existsSync(dest) && args.dryRun ? ' (already exists; use --force to overwrite)' : '';
  console.log(`${args.dryRun ? '[dry-run] Would install' : 'Installing'} review-council to ${dest}${existsNote}`);
  if (args.dryRun) return;
  fs.rmSync(dest, { recursive: true, force: true });
  copyDir(sourceSkill, dest);
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.command || args.command === 'help') {
    usage();
    return;
  }
  if (args.command !== 'install') throw new Error(`Unsupported command: ${args.command}`);
  if (!fs.existsSync(path.join(sourceSkill, 'SKILL.md'))) {
    throw new Error(`Package is missing skill/review-council/SKILL.md at ${sourceSkill}`);
  }

  if (args.path) {
    installInto(path.resolve(expandHome(args.path)), args);
    console.log(args.dryRun ? 'Dry run complete.' : 'Installed review-council skill.');
    return;
  }

  const selectedTargets = args.target ? parseTargets(args.target) : await promptForTargets();
  if (selectedTargets.length === 0) throw new Error('No targets selected.');

  for (const selectedTarget of selectedTargets) {
    installInto(targetDir(selectedTarget), args);
  }

  console.log(args.dryRun ? 'Dry run complete.' : 'Installed review-council skill.');
  if (selectedTargets.includes('claude')) {
    console.log('Claude Code should expose this as /review-council. Restart Claude Code if the command is not visible.');
  }
}

try {
  await main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

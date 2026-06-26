#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const sourceSkill = path.join(packageRoot, 'skill', 'review-council');

function usage() {
  console.log(`review-council-skill

Usage:
  npx github:<owner>/review-council-skill install [--target claude|codex|agents|cursor] [--path DIR] [--force] [--dry-run]
  npx review-council-skill install [--target claude|codex|agents|cursor] [--path DIR] [--force] [--dry-run]

Targets:
  claude  ~/.claude/skills
  codex   \${CODEX_HOME:-~/.codex}/skills
  agents  ~/.agents/skills
  cursor  ~/.cursor/skills

Default target: claude
Use --path to install into any explicit skills directory.`);
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
    target: 'claude',
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

function targetDir(args) {
  if (args.path) return path.resolve(expandHome(args.path));
  if (args.target === 'codex') {
    return path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills');
  }
  if (args.target === 'claude') return path.join(os.homedir(), '.claude', 'skills');
  if (args.target === 'agents') return path.join(os.homedir(), '.agents', 'skills');
  if (args.target === 'cursor') return path.join(os.homedir(), '.cursor', 'skills');
  throw new Error(`Unsupported target: ${args.target}`);
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

function main() {
  const args = parseArgs(process.argv);
  if (!args.command || args.command === 'help') {
    usage();
    return;
  }
  if (args.command !== 'install') throw new Error(`Unsupported command: ${args.command}`);
  if (!fs.existsSync(path.join(sourceSkill, 'SKILL.md'))) {
    throw new Error(`Package is missing skill/review-council/SKILL.md at ${sourceSkill}`);
  }

  const skillsDir = targetDir(args);
  const dest = path.join(skillsDir, 'review-council');
  if (fs.existsSync(dest) && !args.force) {
    throw new Error(`${dest} already exists. Re-run with --force to overwrite.`);
  }

  console.log(`${args.dryRun ? '[dry-run] Would install' : 'Installing'} review-council to ${dest}`);
  if (args.dryRun) return;
  fs.rmSync(dest, { recursive: true, force: true });
  copyDir(sourceSkill, dest);
  console.log('Installed review-council skill.');
  if (args.target === 'claude' || dest.includes(`${path.sep}.claude${path.sep}skills${path.sep}`)) {
    console.log('Claude Code should expose this as /review-council. Restart Claude Code if the command is not visible.');
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

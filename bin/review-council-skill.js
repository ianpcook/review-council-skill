#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const sourceSkill = path.join(packageRoot, 'skills', 'review-council');

function userHome() {
  return process.env.REVIEW_COUNCIL_SKILL_HOME || os.homedir();
}

const targetDefinitions = [
  {
    id: 'claude',
    label: 'Claude Code',
    dir: () => path.join(userHome(), '.claude', 'skills')
  },
  {
    id: 'codex',
    label: 'Codex / shared Agent Skills',
    dir: () => path.join(userHome(), '.agents', 'skills')
  },
  {
    id: 'cursor',
    label: 'Cursor via shared Agent Skills',
    dir: () => path.join(userHome(), '.agents', 'skills')
  }
];

const targetAliases = new Map([
  ['agents', 'codex']
]);

function usage() {
  console.log(`review-council-skill

Usage:
  npx --yes github:ianpcook/review-council-skill#v0.4.0 install [--target claude,codex,cursor|all] [--path DIR] [--force] [--dry-run]

Targets:
  claude  ~/.claude/skills
  codex   ~/.agents/skills (also accepted as "agents")
  cursor  ~/.agents/skills (shared with Codex to prevent duplicate discovery)

Run without --target or --path to choose targets interactively.
Use --path to install into one explicit skills directory.
When --force replaces an install, the previous directory is moved to a recoverable backup.`);
}

function expandHome(value) {
  if (!value) return value;
  if (value === '~') return userHome();
  if (value.startsWith('~/')) return path.join(userHome(), value.slice(2));
  return value;
}

function nextValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${option} requires a value.`);
  }
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

  if (args.command === '--help' || args.command === '-h') args.command = 'help';

  for (let i = 3; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--force') args.force = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--target') args.target = nextValue(argv, i++, '--target');
    else if (arg.startsWith('--target=')) args.target = arg.slice('--target='.length);
    else if (arg === '--path') args.path = nextValue(argv, i++, '--path');
    else if (arg.startsWith('--path=')) args.path = arg.slice('--path='.length);
    else if (arg === '--help' || arg === '-h') args.command = 'help';
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (args.path && args.target) {
    throw new Error('Use either --path or --target, not both.');
  }

  return args;
}

function normalizeTarget(target) {
  return targetAliases.get(target) || target;
}

function targetDefinition(target) {
  const normalized = normalizeTarget(target);
  const definition = targetDefinitions.find((candidate) => candidate.id === normalized);
  if (!definition) throw new Error(`Unsupported target: ${target}`);
  return definition;
}

function parseTargets(value) {
  if (!value) return [];
  if (value === 'all') return targetDefinitions.map((target) => target.id);

  const targets = value
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean)
    .map((target) => targetDefinition(target).id);

  return [...new Set(targets)];
}

async function promptForTargets() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('No target provided and no interactive terminal is available. Re-run with --target claude,codex,cursor or --path DIR.');
  }

  console.log('Choose harnesses to install review-council for:');
  targetDefinitions.forEach((target, index) => {
    console.log(`  ${index + 1}. ${target.label} (${target.dir()})`);
  });
  console.log('  a. All harnesses');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question('Select one or more numbers, comma-separated [1]: ')).trim() || '1';
    if (answer.toLowerCase() === 'a' || answer.toLowerCase() === 'all') {
      return targetDefinitions.map((target) => target.id);
    }

    const selected = new Set();
    for (const part of answer.split(',')) {
      const index = Number(part.trim());
      if (!Number.isInteger(index) || index < 1 || index > targetDefinitions.length) {
        throw new Error(`Invalid selection: ${part.trim()}`);
      }
      selected.add(targetDefinitions[index - 1].id);
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

function backupDestination(skillsDir) {
  const backupRoot = path.join(path.dirname(skillsDir), `${path.basename(skillsDir)}-backups`);
  fs.mkdirSync(backupRoot, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  let candidate = path.join(backupRoot, `review-council-${timestamp}`);
  let suffix = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(backupRoot, `review-council-${timestamp}-${suffix}`);
    suffix += 1;
  }
  return candidate;
}

function preflightInstall(skillsDirValue, args) {
  const skillsDir = path.resolve(skillsDirValue);
  const dest = path.join(skillsDir, 'review-council');
  const exists = fs.existsSync(dest);

  if (exists && !args.force) {
    const prefix = args.dryRun ? '[dry-run] Conflict:' : 'Installation blocked:';
    throw new Error(`${prefix} ${dest} already exists. Re-run with --force to replace it safely.`);
  }

  return { skillsDir, dest, exists };
}

function installInto(plan, args) {
  const { skillsDir, dest, exists } = plan;

  if (args.dryRun) {
    console.log(`[dry-run] Would install review-council to ${dest}${exists ? ' and back up the existing install' : ''}`);
    return;
  }

  fs.mkdirSync(skillsDir, { recursive: true });
  const stagingDir = fs.mkdtempSync(path.join(skillsDir, '.review-council-install-'));
  let backup = null;

  try {
    copyDir(sourceSkill, stagingDir);
    if (exists) {
      backup = backupDestination(skillsDir);
      fs.renameSync(dest, backup);
    }
    fs.renameSync(stagingDir, dest);
  } catch (error) {
    const recoveryNotes = [];

    if (backup && !fs.existsSync(dest) && fs.existsSync(backup)) {
      try {
        fs.renameSync(backup, dest);
      } catch (restoreError) {
        recoveryNotes.push(`Automatic restore failed: ${restoreError.message}`);
      }
    }

    if (fs.existsSync(stagingDir)) {
      try {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      } catch (cleanupError) {
        recoveryNotes.push(`Staging cleanup failed at ${stagingDir}: ${cleanupError.message}`);
      }
    }

    if (backup && fs.existsSync(backup)) {
      recoveryNotes.push(`The previous install remains recoverable at ${backup}.`);
    }

    const suffix = recoveryNotes.length > 0 ? ` ${recoveryNotes.join(' ')}` : '';
    throw new Error(`${error.message}${suffix}`, { cause: error });
  }

  console.log(`Installed review-council to ${dest}`);
  if (backup) console.log(`Previous install moved to ${backup}`);
}

function warnAboutDuplicateInstalls(selectedTargets) {
  const usesSharedInstall = selectedTargets.some((target) => target === 'codex' || target === 'cursor');
  if (!usesSharedInstall) return;

  const sharedInstall = path.resolve(targetDefinition('codex').dir(), 'review-council');
  const candidates = [];

  const legacyCodexRoot = process.env.CODEX_HOME || path.join(userHome(), '.codex');
  candidates.push({
    label: 'legacy Codex',
    install: path.resolve(legacyCodexRoot, 'skills', 'review-council')
  });

  candidates.push({
    label: 'Cursor-specific',
    install: path.resolve(userHome(), '.cursor', 'skills', 'review-council')
  });

  for (const candidate of candidates) {
    if (candidate.install !== sharedInstall && fs.existsSync(candidate.install)) {
      console.warn(`Warning: ${candidate.label} install detected at ${candidate.install}; it is not modified. After verifying ${sharedInstall}, remove that copy to prevent duplicate discovery, or update it explicitly with --path ${path.dirname(candidate.install)} --force.`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.command || args.command === 'help') {
    usage();
    return;
  }
  if (args.command !== 'install') throw new Error(`Unsupported command: ${args.command}`);
  if (!fs.existsSync(path.join(sourceSkill, 'SKILL.md'))) {
    throw new Error(`Package is missing skills/review-council/SKILL.md at ${sourceSkill}`);
  }

  if (args.path) {
    const plan = preflightInstall(path.resolve(expandHome(args.path)), args);
    installInto(plan, args);
    return;
  }

  const selectedTargets = args.target ? parseTargets(args.target) : await promptForTargets();
  if (selectedTargets.length === 0) throw new Error('No targets selected.');

  const destinations = new Map();
  for (const target of selectedTargets) {
    const definition = targetDefinition(target);
    destinations.set(definition.dir(), definition.label);
  }

  const plans = [...destinations.keys()].map((skillsDir) => preflightInstall(skillsDir, args));
  warnAboutDuplicateInstalls(selectedTargets);
  for (const plan of plans) installInto(plan, args);

  console.log(args.dryRun ? 'Dry run complete.' : 'Installation complete. Restart the harness if the skill is not detected automatically.');
}

try {
  await main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

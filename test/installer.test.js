import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const installer = path.join(repoRoot, 'bin', 'review-council-skill.js');

function run(args, options = {}) {
  return spawnSync(process.execPath, [installer, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options
  });
}

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-council-skill-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function isolatedEnv(dir, extra = {}) {
  return {
    ...process.env,
    REVIEW_COUNCIL_SKILL_HOME: dir,
    CODEX_HOME: path.join(dir, '.codex-home'),
    ...extra
  };
}

test('help documents the portable install targets', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /claude\s+~\/\.claude\/skills/);
  assert.match(result.stdout, /codex\s+~\/\.agents\/skills/);
  assert.match(result.stdout, /cursor\s+~\/\.agents\/skills/);
});

test('installs only the skill package into an explicit path', () => withTempDir((dir) => {
  const skillsDir = path.join(dir, 'skills');
  const result = run(['install', '--path', skillsDir]);
  assert.equal(result.status, 0, result.stderr);

  const installed = path.join(skillsDir, 'review-council');
  assert.equal(fs.existsSync(path.join(installed, 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(installed, 'LICENSE')), true);
  assert.equal(fs.existsSync(path.join(installed, 'NOTICE')), true);
  assert.equal(fs.existsSync(path.join(installed, 'references', 'output-schema.md')), true);
  assert.equal(fs.existsSync(path.join(installed, 'package.json')), false);
  assert.equal(fs.existsSync(path.join(installed, 'bin')), false);
}));

test('refuses to overwrite an existing install without --force', () => withTempDir((dir) => {
  const skillsDir = path.join(dir, 'skills');
  assert.equal(run(['install', '--path', skillsDir]).status, 0);

  const result = run(['install', '--path', skillsDir]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /already exists/);
}));

test('--force replaces the install and preserves a recoverable backup', () => withTempDir((dir) => {
  const skillsDir = path.join(dir, 'skills');
  assert.equal(run(['install', '--path', skillsDir]).status, 0);

  const installedSkill = path.join(skillsDir, 'review-council', 'SKILL.md');
  fs.appendFileSync(installedSkill, '\nlocal marker\n');

  const result = run(['install', '--path', skillsDir, '--force']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Previous install moved to/);
  assert.doesNotMatch(fs.readFileSync(installedSkill, 'utf8'), /local marker/);

  const backupRoot = path.join(dir, 'skills-backups');
  const backups = fs.readdirSync(backupRoot);
  assert.equal(backups.length, 1);
  const backupSkill = path.join(backupRoot, backups[0], 'SKILL.md');
  assert.match(fs.readFileSync(backupSkill, 'utf8'), /local marker/);
}));

test('codex uses the shared ~/.agents/skills location and deduplicates its alias', () => withTempDir((dir) => {
  const result = run(['install', '--target', 'codex,agents'], {
    env: isolatedEnv(dir)
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(dir, '.agents', 'skills', 'review-council', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(dir, '.codex', 'skills', 'review-council')), false);
  assert.equal(result.stdout.match(/Installed review-council/g)?.length, 1);
}));

test('cursor uses the shared location and deduplicates with codex', () => withTempDir((dir) => {
  const result = run(['install', '--target', 'codex,cursor'], {
    env: isolatedEnv(dir)
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(dir, '.agents', 'skills', 'review-council', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(dir, '.cursor', 'skills', 'review-council')), false);
  assert.equal(result.stdout.match(/Installed review-council/g)?.length, 1);
}));

test('preflights every target before mutating any destination', () => withTempDir((dir) => {
  const existingSharedInstall = path.join(dir, '.agents', 'skills', 'review-council');
  fs.mkdirSync(existingSharedInstall, { recursive: true });

  const result = run(['install', '--target', 'all'], { env: isolatedEnv(dir) });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /already exists/);
  assert.equal(fs.existsSync(path.join(dir, '.claude', 'skills', 'review-council')), false);
  assert.equal(fs.existsSync(existingSharedInstall), true);
  assert.equal(fs.existsSync(path.join(dir, '.cursor', 'skills', 'review-council')), false);
}));

test('warns when the legacy Codex skill path would remain installed', () => withTempDir((dir) => {
  const codexHome = path.join(dir, 'legacy-codex-home');
  const legacyInstall = path.join(codexHome, 'skills', 'review-council');
  fs.mkdirSync(legacyInstall, { recursive: true });
  fs.writeFileSync(path.join(legacyInstall, 'marker'), 'legacy');

  const result = run(['install', '--target', 'codex'], {
    env: isolatedEnv(dir, { CODEX_HOME: codexHome })
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /legacy Codex install detected/);
  assert.equal(fs.readFileSync(path.join(legacyInstall, 'marker'), 'utf8'), 'legacy');
  assert.equal(fs.existsSync(path.join(dir, '.agents', 'skills', 'review-council', 'SKILL.md')), true);
}));

test('warns when a Cursor-specific copy would remain installed', () => withTempDir((dir) => {
  const cursorInstall = path.join(dir, '.cursor', 'skills', 'review-council');
  fs.mkdirSync(cursorInstall, { recursive: true });

  const result = run(['install', '--target', 'cursor'], { env: isolatedEnv(dir) });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /Cursor-specific install detected/);
  assert.equal(fs.existsSync(cursorInstall), true);
  assert.equal(fs.existsSync(path.join(dir, '.agents', 'skills', 'review-council', 'SKILL.md')), true);
}));

test('cursor-only install warns about a legacy Codex copy Cursor can discover', () => withTempDir((dir) => {
  const codexHome = path.join(dir, 'legacy-codex-home');
  fs.mkdirSync(path.join(codexHome, 'skills', 'review-council'), { recursive: true });

  const result = run(['install', '--target', 'cursor'], {
    env: isolatedEnv(dir, { CODEX_HOME: codexHome })
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /legacy Codex install detected/);
  assert.equal(fs.existsSync(path.join(dir, '.agents', 'skills', 'review-council', 'SKILL.md')), true);
}));

test('dry-run does not create directories', () => withTempDir((dir) => {
  const skillsDir = path.join(dir, 'skills');
  const result = run(['install', '--path', skillsDir, '--dry-run']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(skillsDir), false);
}));

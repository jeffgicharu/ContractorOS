#!/usr/bin/env node
// Runs Stryker only on packages whose source files have changed compared to
// origin/main. Used by CI to keep PR-time mutation runs fast when only one
// package was touched, and locally as a faster alternative to test:mutation:all.

import { execSync, spawnSync } from 'node:child_process';

const PACKAGES = [
  { name: '@contractor-os/shared', path: 'packages/shared/' },
  { name: '@contractor-os/api', path: 'apps/api/' },
  { name: '@contractor-os/web', path: 'apps/web/' },
];

function getChangedFiles() {
  // Prefer comparing against the merge-base with origin/main; fall back to a
  // diff against the working tree if origin/main is not fetched (local hack).
  try {
    execSync('git fetch --quiet origin main', { stdio: 'ignore' });
    const base = execSync('git merge-base HEAD origin/main').toString().trim();
    return execSync(`git diff --name-only ${base}..HEAD`).toString().trim().split('\n').filter(Boolean);
  } catch {
    return execSync('git diff --name-only').toString().trim().split('\n').filter(Boolean);
  }
}

const changed = getChangedFiles();
const affected = PACKAGES.filter((pkg) => changed.some((f) => f.startsWith(pkg.path)));

if (affected.length === 0) {
  console.log('No package source changes detected — skipping mutation tests.');
  process.exit(0);
}

console.log(`Running mutation tests on ${affected.length} affected package(s):`);
for (const pkg of affected) console.log(`  - ${pkg.name}`);

let exitCode = 0;
for (const pkg of affected) {
  console.log(`\n=== ${pkg.name} ===`);
  const result = spawnSync('pnpm', ['--filter', pkg.name, 'test:mutation'], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    exitCode = result.status ?? 1;
  }
}

process.exit(exitCode);

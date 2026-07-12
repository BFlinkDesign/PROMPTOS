import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildPages } from '../tools/build-pages.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
const SOURCE_PATH = 'console/promptos-console.html';
const GITHUB_SHA = '0123456789abcdef0123456789abcdef01234567';

async function withTemporaryDirectory(run) {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'promptos-pages-'));
  try {
    await run(temporaryDirectory);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

test('builds an exact, deterministic Pages artifact in an isolated output directory', async () => {
  await withTemporaryDirectory(async (temporaryDirectory) => {
    const outputDirectory = path.join(temporaryDirectory, '_site');
    const sourceBytes = await fs.readFile(path.join(REPOSITORY_ROOT, ...SOURCE_PATH.split('/')));
    const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex');
    const expectedDeployment = {
      schemaVersion: 1,
      sourcePath: SOURCE_PATH,
      sourceSha256,
      gitSha: GITHUB_SHA,
    };

    const deployment = await buildPages({
      repositoryRoot: REPOSITORY_ROOT,
      outputDirectory,
      environment: { GITHUB_SHA },
    });

    assert.deepEqual(deployment, expectedDeployment);
    assert.deepEqual(await fs.readFile(path.join(outputDirectory, 'index.html')), sourceBytes);
    assert.equal((await fs.readFile(path.join(outputDirectory, '.nojekyll'))).length, 0);
    assert.equal(
      await fs.readFile(path.join(outputDirectory, 'deployment.json'), 'utf8'),
      `${JSON.stringify(expectedDeployment, null, 2)}\n`,
    );
    assert.deepEqual(
      (await fs.readdir(outputDirectory)).sort(),
      ['.nojekyll', 'deployment.json', 'index.html'],
    );
  });
});

test('resolves git HEAD when GITHUB_SHA is unavailable', async () => {
  await withTemporaryDirectory(async (temporaryDirectory) => {
    const expectedGitSha = execFileSync(
      'git',
      ['-C', REPOSITORY_ROOT, 'rev-parse', '--verify', 'HEAD'],
      { encoding: 'utf8' },
    ).trim();

    const deployment = await buildPages({
      repositoryRoot: REPOSITORY_ROOT,
      outputDirectory: path.join(temporaryDirectory, '_site'),
      environment: {},
    });

    assert.equal(deployment.gitSha, expectedGitSha);
  });
});

test('fails closed without modifying output when the source is missing', async () => {
  await withTemporaryDirectory(async (temporaryDirectory) => {
    const repositoryRoot = path.join(temporaryDirectory, 'missing-source-repository');
    const outputDirectory = path.join(temporaryDirectory, '_site');
    await fs.mkdir(repositoryRoot, { recursive: true });
    await fs.mkdir(outputDirectory, { recursive: true });
    await fs.writeFile(path.join(outputDirectory, 'sentinel.txt'), 'preserve me', 'utf8');

    await assert.rejects(
      buildPages({
        repositoryRoot,
        outputDirectory,
        environment: { GITHUB_SHA },
      }),
      /Pages source is unavailable: console\/promptos-console\.html/,
    );

    assert.equal(await fs.readFile(path.join(outputDirectory, 'sentinel.txt'), 'utf8'), 'preserve me');
    assert.deepEqual(await fs.readdir(outputDirectory), ['sentinel.txt']);
  });
});

test('rejects an invalid GITHUB_SHA without modifying source or output', async () => {
  await withTemporaryDirectory(async (temporaryDirectory) => {
    const outputDirectory = path.join(temporaryDirectory, '_site');
    const sourceFile = path.join(REPOSITORY_ROOT, ...SOURCE_PATH.split('/'));
    const sourceBefore = await fs.readFile(sourceFile);
    await fs.mkdir(outputDirectory, { recursive: true });
    await fs.writeFile(path.join(outputDirectory, 'sentinel.txt'), 'preserve me', 'utf8');

    await assert.rejects(
      buildPages({
        repositoryRoot: REPOSITORY_ROOT,
        outputDirectory,
        environment: { GITHUB_SHA: 'not-a-commit' },
      }),
      /GITHUB_SHA must be a 40-character hexadecimal commit SHA/,
    );

    assert.deepEqual(await fs.readFile(sourceFile), sourceBefore);
    assert.equal(await fs.readFile(path.join(outputDirectory, 'sentinel.txt'), 'utf8'), 'preserve me');
    assert.deepEqual(await fs.readdir(outputDirectory), ['sentinel.txt']);
  });
});

test('refuses an output directory containing the source without modifying either', async () => {
  await withTemporaryDirectory(async (repositoryRoot) => {
    const sourceFile = path.join(repositoryRoot, ...SOURCE_PATH.split('/'));
    const sentinelFile = path.join(repositoryRoot, 'sentinel.txt');
    const sourceBytes = Buffer.from('<!doctype html><title>preserve me</title>\n');
    await fs.mkdir(path.dirname(sourceFile), { recursive: true });
    await fs.writeFile(sourceFile, sourceBytes);
    await fs.writeFile(sentinelFile, 'preserve output', 'utf8');

    await assert.rejects(
      buildPages({
        repositoryRoot,
        outputDirectory: repositoryRoot,
        environment: { GITHUB_SHA },
      }),
      /Refusing unsafe Pages output directory/,
    );

    assert.deepEqual(await fs.readFile(sourceFile), sourceBytes);
    assert.equal(await fs.readFile(sentinelFile, 'utf8'), 'preserve output');
  });
});

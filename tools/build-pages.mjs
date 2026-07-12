import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const SOURCE_PATH = 'console/promptos-console.html';
const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
const DEFAULT_OUTPUT_DIRECTORY = path.join(REPOSITORY_ROOT, '_site');
const GIT_SHA_PATTERN = /^[0-9a-f]{40}$/i;

async function resolveGitSha(repositoryRoot, environment) {
  const githubSha = environment.GITHUB_SHA?.trim();
  if (githubSha) {
    if (!GIT_SHA_PATTERN.test(githubSha)) {
      throw new Error('GITHUB_SHA must be a 40-character hexadecimal commit SHA');
    }
    return githubSha;
  }

  let stdout;
  try {
    ({ stdout } = await execFileAsync(
      'git',
      ['-C', repositoryRoot, 'rev-parse', '--verify', 'HEAD'],
      { encoding: 'utf8' },
    ));
  } catch (error) {
    throw new Error('Unable to resolve git HEAD for the Pages deployment receipt', { cause: error });
  }

  const gitSha = stdout.trim();
  if (!GIT_SHA_PATTERN.test(gitSha)) {
    throw new Error('Resolved git HEAD is not a 40-character hexadecimal commit SHA');
  }
  return gitSha;
}

function assertSafeOutputDirectory(outputDirectory, sourceFile) {
  const root = path.parse(outputDirectory).root;
  const sourceRelativeToOutput = path.relative(outputDirectory, sourceFile);
  const outputContainsSource = sourceRelativeToOutput === ''
    || (!sourceRelativeToOutput.startsWith('..') && !path.isAbsolute(sourceRelativeToOutput));

  if (outputDirectory === root || outputContainsSource) {
    throw new Error(`Refusing unsafe Pages output directory: ${outputDirectory}`);
  }
}

export async function buildPages({
  repositoryRoot = REPOSITORY_ROOT,
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
  environment = process.env,
} = {}) {
  const resolvedRepositoryRoot = path.resolve(repositoryRoot);
  const resolvedOutputDirectory = path.resolve(outputDirectory);
  const sourceFile = path.join(resolvedRepositoryRoot, ...SOURCE_PATH.split('/'));

  let sourceBytes;
  try {
    sourceBytes = await fs.readFile(sourceFile);
  } catch (error) {
    throw new Error(`Pages source is unavailable: ${SOURCE_PATH}`, { cause: error });
  }

  const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex');
  const gitSha = await resolveGitSha(resolvedRepositoryRoot, environment);
  assertSafeOutputDirectory(resolvedOutputDirectory, sourceFile);

  const deployment = {
    schemaVersion: 1,
    sourcePath: SOURCE_PATH,
    sourceSha256,
    gitSha,
  };

  await fs.rm(resolvedOutputDirectory, { recursive: true, force: true });
  await fs.mkdir(resolvedOutputDirectory, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(resolvedOutputDirectory, 'index.html'), sourceBytes),
    fs.writeFile(path.join(resolvedOutputDirectory, '.nojekyll'), ''),
    fs.writeFile(
      path.join(resolvedOutputDirectory, 'deployment.json'),
      `${JSON.stringify(deployment, null, 2)}\n`,
      'utf8',
    ),
  ]);

  return deployment;
}

function parseOutputDirectory(arguments_) {
  if (arguments_.length === 0) return DEFAULT_OUTPUT_DIRECTORY;
  if (arguments_.length === 2 && ['--out-dir', '--output'].includes(arguments_[0])) {
    return path.resolve(process.cwd(), arguments_[1]);
  }
  throw new Error('Usage: node tools/build-pages.mjs [--out-dir <directory>]');
}

const invokedAsScript = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsScript) {
  try {
    const outputDirectory = parseOutputDirectory(process.argv.slice(2));
    await buildPages({ outputDirectory });
    console.log(`Built GitHub Pages artifact at ${outputDirectory}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

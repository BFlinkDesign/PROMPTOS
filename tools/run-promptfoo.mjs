import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function runPromptfoo(args, { cwd = process.cwd(), env = {} } = {}) {
  const entrypoint = path.join(cwd, 'node_modules', 'promptfoo', 'dist', 'src', 'entrypoint.js');
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd,
    env: { ...process.env, PROMPTFOO_DISABLE_TELEMETRY: '1', ...env },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) process.exitCode = runPromptfoo(process.argv.slice(2));

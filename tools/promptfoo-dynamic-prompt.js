const fs = require('node:fs');
const path = require('node:path');

module.exports = async function ({ vars }) {
  const rootDir = process.cwd();
  const promptPath = String(vars && vars.prompt_path ? vars.prompt_path : '').trim();
  if (!promptPath) {
    throw new Error('prompt_path var is required');
  }

  const resolved = path.resolve(rootDir, promptPath);
  const root = path.resolve(rootDir);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`prompt_path escapes repository: ${promptPath}`);
  }
  if (!fs.existsSync(resolved)) {
    throw new Error(`prompt_path not found: ${promptPath}`);
  }

  return fs.readFileSync(resolved, 'utf8');
};

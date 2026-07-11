#!/usr/bin/env node
import fs from 'node:fs/promises';
import process from 'node:process';
import { optimizePrompt } from './orchestrator.mjs';
import { evaluateIndependentCampaign } from './campaign.mjs';
import { HeuristicProvider, OpenAICompatibleProvider } from './providers.mjs';
import { startServer } from './server.mjs';

const [command = 'help', ...args] = process.argv.slice(2);

try {
  if (command === 'optimize') {
    const inputPath = args.find((arg) => !arg.startsWith('--'));
    if (!inputPath) throw new Error('usage: optimize <request.json> [--provider heuristic|openai-compatible] [--out report.json]');
    const outPath = option(args, '--out');
    const providerName = option(args, '--provider') ?? process.env.PROMPTOS_PROVIDER ?? 'heuristic';
    const request = JSON.parse(await fs.readFile(inputPath, 'utf8'));
    const provider = createProvider(providerName);
    const report = await optimizePrompt(request, {
      builder: provider,
      critic: provider,
      target: provider,
      judge: provider,
    });
    const serialized = `${JSON.stringify(report, null, 2)}\n`;
    if (outPath) await fs.writeFile(outPath, serialized, 'utf8');
    else process.stdout.write(serialized);
    process.exitCode = report.winner ? 0 : 2;
  } else if (command === 'campaign') {
    const paths = positional(args);
    if (!paths.length) throw new Error('usage: campaign <report.json>... [--policy policy.json] [--out campaign.json]');
    const policyPath = option(args, '--policy');
    const outPath = option(args, '--out');
    const reports = await Promise.all(paths.map(async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'))));
    const policy = policyPath ? JSON.parse(await fs.readFile(policyPath, 'utf8')) : {};
    const campaign = evaluateIndependentCampaign(reports, policy);
    const serialized = `${JSON.stringify(campaign, null, 2)}\n`;
    if (outPath) await fs.writeFile(outPath, serialized, 'utf8');
    else process.stdout.write(serialized);
    process.exitCode = campaign.pass ? 0 : 3;
  } else if (command === 'serve') {
    const providerName = option(args, '--provider') ?? process.env.PROMPTOS_PROVIDER ?? 'heuristic';
    const port = Number(option(args, '--port') ?? process.env.PORT ?? 8787);
    const provider = createProvider(providerName);
    await startServer({
      port,
      providers: { builder: provider, critic: provider, target: provider, judge: provider },
    });
  } else {
    process.stdout.write([
      'PromptOS Prompt Engine',
      '',
      'Commands:',
      '  optimize <request.json> [--provider heuristic|openai-compatible] [--out report.json]',
      '  campaign <report.json>... [--policy policy.json] [--out campaign.json]',
      '  serve [--provider heuristic|openai-compatible] [--port 8787]',
      '',
      'OpenAI-compatible environment:',
      '  PROMPTOS_MODEL_BASE_URL, PROMPTOS_MODEL_NAME, PROMPTOS_MODEL_API_KEY',
      '',
    ].join('\n'));
  }
} catch (error) {
  process.stderr.write(`${error.name ?? 'Error'}: ${error.message}\n`);
  process.exitCode = 1;
}

export function createProvider(name) {
  if (name === 'heuristic') return new HeuristicProvider();
  if (name === 'openai-compatible') {
    return new OpenAICompatibleProvider({
      baseUrl: requiredEnv('PROMPTOS_MODEL_BASE_URL'),
      apiKey: process.env.PROMPTOS_MODEL_API_KEY,
      model: requiredEnv('PROMPTOS_MODEL_NAME'),
      timeoutMs: Number(process.env.PROMPTOS_MODEL_TIMEOUT_MS ?? 120000),
      temperature: Number(process.env.PROMPTOS_MODEL_TEMPERATURE ?? 0.2),
    });
  }
  throw new Error(`unsupported provider ${name}`);
}

function positional(args) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index].startsWith('--')) {
      index += 1;
      continue;
    }
    values.push(args[index]);
  }
  return values;
}

function option(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

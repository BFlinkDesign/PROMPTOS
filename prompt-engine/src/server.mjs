import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimizePrompt } from './orchestrator.mjs';
import { evaluateIndependentCampaign } from './campaign.mjs';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(moduleDir, '..', 'public');
const fixtureDir = path.resolve(moduleDir, '..', 'fixtures');

export async function startServer({ port = 8787, host = '127.0.0.1', providers, maxBodyBytes = 2_000_000 }) {
  const server = http.createServer(async (request, response) => {
    const requestId = crypto.randomUUID();
    response.setHeader('x-request-id', requestId);
    response.setHeader('cache-control', 'no-store');
    try {
      if (request.method === 'GET' && request.url === '/') {
        return file(response, path.join(publicDir, 'index.html'), 'text/html; charset=utf-8');
      }
      if (request.method === 'GET' && request.url === '/app.js') {
        return file(response, path.join(publicDir, 'app.js'), 'text/javascript; charset=utf-8');
      }
      if (request.method === 'GET' && request.url === '/styles.css') {
        return file(response, path.join(publicDir, 'styles.css'), 'text/css; charset=utf-8');
      }
      if (request.method === 'GET' && request.url === '/examples/support-routing.json') {
        return file(response, path.join(fixtureDir, 'request.json'), 'application/json; charset=utf-8');
      }
      if (request.method === 'GET' && request.url === '/health') {
        return json(response, 200, { status: 'ok', service: 'promptos-prompt-engine', requestId });
      }
      if (request.method === 'POST' && request.url === '/v1/optimize') {
        const body = await readJson(request, maxBodyBytes);
        const report = await optimizePrompt(body, providers);
        return json(response, 200, report);
      }
      if (request.method === 'POST' && request.url === '/v1/campaign/evaluate') {
        const body = await readJson(request, maxBodyBytes);
        const campaign = evaluateIndependentCampaign(body.reports, body.policy ?? {});
        return json(response, 200, campaign);
      }
      return json(response, 404, { error: 'not_found', requestId });
    } catch (error) {
      const status = error.name === 'ContractError' ? 400 : error.name === 'BudgetExceededError' ? 422 : 500;
      return json(response, status, {
        error: status === 500 ? 'internal_error' : error.name,
        message: error.message,
        requestId,
      });
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  process.stdout.write(`PromptOS Prompt Engine listening on http://${host}:${port}\n`);
  return server;
}

async function readJson(request, maxBodyBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      request.destroy();
      throw Object.assign(new Error(`request body exceeds ${maxBodyBytes} bytes`), { name: 'ContractError' });
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw Object.assign(new Error('request body must be valid JSON'), { name: 'ContractError' });
  }
}

async function file(response, filePath, contentType) {
  const body = await fs.readFile(filePath);
  response.statusCode = 200;
  response.setHeader('content-type', contentType);
  response.setHeader('content-length', body.length);
  response.end(body);
}

function json(response, status, payload) {
  const body = JSON.stringify(payload);
  response.statusCode = status;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('content-length', Buffer.byteLength(body));
  response.end(body);
}

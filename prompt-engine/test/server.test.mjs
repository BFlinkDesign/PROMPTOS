import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { startServer } from '../src/server.mjs';
import { HeuristicProvider } from '../src/providers.mjs';

test('health endpoint reports readiness', async (t) => {
  const provider = new HeuristicProvider();
  const server = await startServer({
    port: 0,
    providers: { builder: provider, critic: provider, target: provider, judge: provider },
  });
  t.after(async () => {
    server.close();
    await once(server, 'close');
  });
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  const page = await fetch(`http://127.0.0.1:${address.port}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /PromptOS Prompt Engine/);
});

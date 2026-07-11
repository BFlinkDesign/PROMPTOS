import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { OpenAICompatibleProvider } from '../src/providers.mjs';

test('OpenAI-compatible adapter sends bounded structured requests', async (t) => {
  let observed;
  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    observed = {
      url: request.url,
      authorization: request.headers.authorization,
      body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
    };
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({
      id: 'response-1',
      choices: [{ message: { content: '{"task":"ok"}' } }],
      usage: { prompt_tokens: 12, completion_tokens: 4 },
    }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.close();
    await once(server, 'close');
  });
  const { port } = server.address();
  const provider = new OpenAICompatibleProvider({
    baseUrl: `http://127.0.0.1:${port}`,
    apiKey: 'test-key',
    model: 'test-model',
  });
  const result = await provider.invokeRole({
    role: 'architect',
    instructions: 'Return a task.',
    input: { objective: 'test' },
    seed: 7,
    maxTokens: 100,
  });
  assert.deepEqual(result.output, { task: 'ok' });
  assert.equal(observed.url, '/chat/completions');
  assert.equal(observed.authorization, 'Bearer test-key');
  assert.equal(observed.body.seed, 7);
  assert.equal(observed.body.response_format.type, 'json_object');
});

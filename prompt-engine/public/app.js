const $ = (id) => document.getElementById(id);
const defaultPolicy = {
  baselineId: 'anthropic-prompt-improver',
  minimumReports: 9,
  minimumProviders: 2,
  minimumModels: 3,
  minimumSuites: 3,
  minimumSeeds: 3,
  minimumPairedCases: 300,
  minimumRunWinRate: 0.75,
  minimumAbsoluteGain: 0,
  minimumRobustnessGain: 0,
  confidenceLevel: 0.95,
  maxCostRatio: 1.25,
  maxLatencyRatio: 1.25,
  requireAnthropicProvenance: true,
};

$('campaignPolicy').value = JSON.stringify(defaultPolicy, null, 2);
void checkHealth();
$('loadExample').addEventListener('click', loadExample);
$('optimizeForm').addEventListener('submit', runOptimize);
$('campaignForm').addEventListener('submit', runCampaign);

async function checkHealth() {
  try {
    const response = await fetch('/health');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    $('health').textContent = 'Service ready';
    $('health').className = 'status ok';
  } catch (error) {
    $('health').textContent = `Service unavailable: ${error.message}`;
    $('health').className = 'status error';
  }
}

async function loadExample() {
  setState('runState', 'Loading example…');
  try {
    const response = await fetch('/examples/support-routing.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const request = await response.json();
    $('mode').value = request.mode;
    $('objective').value = request.objective;
    $('baseline').value = request.baselinePrompt ?? '';
    $('requestJson').value = JSON.stringify(request, null, 2);
    setState('runState', 'Example loaded.');
  } catch (error) {
    setState('runState', error.message, true);
  }
}

async function runOptimize(event) {
  event.preventDefault();
  const button = $('runOptimize');
  button.disabled = true;
  setState('runState', 'Running bounded search…');
  try {
    const request = JSON.parse($('requestJson').value || '{}');
    request.mode = $('mode').value;
    request.objective = $('objective').value;
    if ($('mode').value === 'improve') request.baselinePrompt = $('baseline').value;
    else delete request.baselinePrompt;
    const response = await fetch('/v1/optimize', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });
    const report = await response.json();
    if (!response.ok) throw new Error(report.message ?? `HTTP ${response.status}`);
    renderRun(report);
    setState('runState', `Completed with ${report.budget.calls} bounded model calls.`);
  } catch (error) {
    setState('runState', error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function runCampaign(event) {
  event.preventDefault();
  setState('campaignState', 'Evaluating campaign…');
  try {
    const reports = JSON.parse($('campaignReports').value);
    const policy = JSON.parse($('campaignPolicy').value);
    const response = await fetch('/v1/campaign/evaluate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reports, policy }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message ?? `HTTP ${response.status}`);
    $('campaignResult').textContent = JSON.stringify(result, null, 2);
    setState('campaignState', result.status, !result.pass);
  } catch (error) {
    setState('campaignState', error.message, true);
  }
}

function renderRun(report) {
  const winner = report.winner;
  const metrics = winner?.metrics;
  const cards = [
    ['Trust', report.trust],
    ['Strategy', winner?.strategy ?? 'none'],
    ['Holdout quality', percent(metrics?.quality)],
    ['Robustness', percent(metrics?.robustness)],
    ['Structural', percent(metrics?.structural)],
    ['Claim', report.superiority?.status ?? 'unproven'],
  ];
  $('metrics').innerHTML = cards.map(([label, value]) => `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  $('winningPrompt').textContent = winner?.prompt ?? 'No candidate selected.';
  $('fullReport').textContent = JSON.stringify(report, null, 2);
}

function percent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 1000) / 10}%` : 'n/a';
}

function setState(id, message, error = false) {
  const element = $(id);
  element.textContent = message;
  element.style.color = error ? 'var(--danger)' : '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

import fs from 'node:fs';
import path from 'node:path';
import { stringify as stringifyYaml } from 'yaml';
import { hashFile, hashJson } from './engine-acceptance-core.mjs';

export const DEFAULT_BEHAVIORAL_MANIFEST = 'evals/behavioral/outcome-intake.v1.json';

export function loadBehavioralSuite(rootDir = process.cwd(), manifestPath = DEFAULT_BEHAVIORAL_MANIFEST) {
  const absoluteManifest = path.resolve(rootDir, manifestPath);
  const manifest = JSON.parse(fs.readFileSync(absoluteManifest, 'utf8'));
  validateManifestShape(manifest);
  const baselinePath = path.resolve(rootDir, manifest.baseline_path);
  const candidatePath = path.resolve(rootDir, manifest.candidate_path);
  const baselinePromptHash = hashFile(baselinePath);
  const candidatePromptHash = hashFile(candidatePath);
  if (baselinePromptHash !== manifest.accepted_prompt_sha256) throw new Error(`accepted prompt hash mismatch: expected ${manifest.accepted_prompt_sha256}, got ${baselinePromptHash}`);
  if (candidatePromptHash !== manifest.candidate_prompt_sha256) throw new Error(`candidate prompt hash mismatch: expected ${manifest.candidate_prompt_sha256}, got ${candidatePromptHash}`);
  return {
    manifest,
    manifestPath: absoluteManifest,
    baselinePath,
    candidatePath,
    baselineSource: fs.readFileSync(baselinePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'),
    candidateSource: fs.readFileSync(candidatePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'),
    manifestSha256: hashJson(manifest),
    baselinePromptHash,
    candidatePromptHash,
  };
}

export function buildPromptfooBehavioralConfig(suite) {
  const { manifest, baselineSource, candidateSource } = suite;
  const caseSuffix = '\n\n## Evaluation case\n\nUser request:\n{{request}}\n';
  return {
    description: `${manifest.suite_id} - ${manifest.claim_limit}`,
    prompts: [
      { label: `baseline@${manifest.accepted_prompt_sha256.slice(0, 12)}`, raw: `${baselineSource.trim()}${caseSuffix}` },
      { label: `candidate@${manifest.candidate_prompt_sha256.slice(0, 12)}`, raw: `${candidateSource.trim()}${caseSuffix}` },
    ],
    providers: manifest.providers,
    defaultTest: {
      assert: manifest.required_sections.map((section) => ({ type: 'icontains', value: section })),
    },
    tests: manifest.cases.map((testCase) => ({
      description: testCase.id,
      vars: { request: testCase.request },
      assert: testCase.assertions,
      metadata: { case_id: testCase.id, suite_id: manifest.suite_id },
    })),
  };
}

export function writePromptfooBehavioralConfig(outputPath, suite) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, stringifyYaml(buildPromptfooBehavioralConfig(suite)), 'utf8');
}

function validateManifestShape(manifest) {
  const requiredStrings = ['schema_version', 'suite_id', 'description', 'baseline_path', 'candidate_path', 'accepted_prompt_sha256', 'candidate_prompt_sha256', 'claim_limit'];
  for (const field of requiredStrings) {
    if (typeof manifest[field] !== 'string' || !manifest[field].trim()) throw new Error(`behavioral manifest missing ${field}`);
  }
  if (!/^[a-f0-9]{64}$/.test(manifest.accepted_prompt_sha256)) throw new Error('accepted_prompt_sha256 must be lowercase SHA-256');
  if (!/^[a-f0-9]{64}$/.test(manifest.candidate_prompt_sha256)) throw new Error('candidate_prompt_sha256 must be lowercase SHA-256');
  if (manifest.candidate_prompt_sha256 === manifest.accepted_prompt_sha256) throw new Error('candidate must differ from the accepted baseline');
  if (manifest.claim_limit !== 'PUBLIC-EVAL-PROBE') throw new Error('public local suite cannot grant a stronger claim');
  if (!Array.isArray(manifest.providers) || manifest.providers.length < 2) throw new Error('behavioral suite requires at least two subject providers');
  if (!Array.isArray(manifest.required_sections) || manifest.required_sections.length < 6) throw new Error('behavioral suite requires the complete outcome contract');
  if (!Array.isArray(manifest.cases) || manifest.cases.length < 4) throw new Error('behavioral suite requires at least four public cases');
  const caseIds = new Set();
  for (const testCase of manifest.cases) {
    if (!testCase.id || caseIds.has(testCase.id)) throw new Error(`invalid or duplicate behavioral case ${testCase.id || ''}`);
    caseIds.add(testCase.id);
    if (!testCase.request || !Array.isArray(testCase.assertions) || !testCase.assertions.length) throw new Error(`${testCase.id}: request and assertions are required`);
  }
}

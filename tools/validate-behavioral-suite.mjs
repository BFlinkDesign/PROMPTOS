import path from 'node:path';
import { buildPromptfooBehavioralConfig, loadBehavioralSuite } from './behavioral-suite.mjs';

const suite = loadBehavioralSuite();
const config = buildPromptfooBehavioralConfig(suite);
if (config.tests.length !== suite.manifest.cases.length) throw new Error('behavioral config lost cases');
if (config.providers.length !== suite.manifest.providers.length) throw new Error('behavioral config lost providers');
if (config.prompts.length !== 2 || config.prompts.some((prompt) => !prompt.raw.includes('{{request}}'))) throw new Error('behavioral comparison must bind both prompts to the case request');

console.log(`PromptOS behavioral suite valid: ${suite.manifest.cases.length} public cases, ${suite.manifest.providers.length} local providers, baseline ${path.relative(process.cwd(), suite.baselinePath)}@${suite.baselinePromptHash.slice(0, 12)}, candidate ${path.relative(process.cwd(), suite.candidatePath)}@${suite.candidatePromptHash.slice(0, 12)}, claim limited to ${suite.manifest.claim_limit}`);

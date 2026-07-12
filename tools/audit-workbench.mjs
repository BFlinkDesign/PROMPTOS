import { loadArtifactEntries } from './catalog.mjs';
import { improvePrompt } from './scoring-core.mjs';

const entries = loadArtifactEntries(process.cwd());
const rows = entries.map((entry) => {
  const proposal = improvePrompt(entry.body);
  if (proposal.sourceText !== entry.body) {
    throw new Error(`${entry.markdownPath}: improver did not preserve the normalized source`);
  }
  if (proposal.candidateScore.total < proposal.originalScore.total) {
    throw new Error(`${entry.markdownPath}: improver regressed structural score`);
  }
  return {
    id: entry.id,
    type: entry.artifactType,
    source_path: entry.markdownPath,
    original_score: proposal.originalScore.total,
    candidate_score: proposal.candidateScore.total,
    proposed_changes: proposal.changes.map((change) => change.factor),
    unresolved: proposal.unresolved,
    effectiveness: 'not-evaluated',
    auto_apply: false,
  };
});

const proposals = rows.filter((row) => row.proposed_changes.length > 0);
console.log(JSON.stringify({
  artifact_count: rows.length,
  proposal_count: proposals.length,
  unchanged_count: rows.length - proposals.length,
  release_authority: false,
  rows,
}, null, 2));

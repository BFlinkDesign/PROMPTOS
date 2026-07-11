export function paretoFront(items, objectives = DEFAULT_OBJECTIVES) {
  return items.filter((candidate, index) =>
    !items.some((other, otherIndex) => otherIndex !== index && dominates(other, candidate, objectives)),
  );
}

export function rankCandidates(items, objectives = DEFAULT_OBJECTIVES) {
  const remaining = [...items];
  const ranked = [];
  let rank = 0;
  while (remaining.length) {
    const front = paretoFront(remaining, objectives)
      .sort((a, b) => tieBreak(b, a));
    for (const item of front) ranked.push({ ...item, paretoRank: rank });
    const frontIds = new Set(front.map((item) => item.candidateId));
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (frontIds.has(remaining[index].candidateId)) remaining.splice(index, 1);
    }
    rank += 1;
  }
  return ranked;
}

export function dominates(left, right, objectives = DEFAULT_OBJECTIVES) {
  let strictlyBetter = false;
  for (const objective of objectives) {
    const leftValue = Number(objective.get(left));
    const rightValue = Number(objective.get(right));
    if (objective.direction === 'max') {
      if (leftValue < rightValue) return false;
      if (leftValue > rightValue) strictlyBetter = true;
    } else {
      if (leftValue > rightValue) return false;
      if (leftValue < rightValue) strictlyBetter = true;
    }
  }
  return strictlyBetter;
}

const DEFAULT_OBJECTIVES = [
  { id: 'quality', direction: 'max', get: (item) => item.metrics.quality },
  { id: 'structural', direction: 'max', get: (item) => item.metrics.structural },
  { id: 'criticalFailures', direction: 'min', get: (item) => item.metrics.criticalFailures },
  { id: 'cost', direction: 'min', get: (item) => item.usage.costUsd },
  { id: 'latency', direction: 'min', get: (item) => item.usage.latencyMs },
  { id: 'promptChars', direction: 'min', get: (item) => item.metrics.promptChars },
];

function tieBreak(left, right) {
  return (
    left.metrics.quality - right.metrics.quality ||
    left.metrics.structural - right.metrics.structural ||
    right.metrics.criticalFailures - left.metrics.criticalFailures ||
    right.usage.costUsd - left.usage.costUsd ||
    right.metrics.promptChars - left.metrics.promptChars ||
    String(right.candidateId).localeCompare(String(left.candidateId))
  );
}

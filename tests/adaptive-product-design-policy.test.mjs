import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const prompt = readFileSync(
  new URL("../prompts/adaptive-product-design.md", import.meta.url),
  "utf8",
);
const catalog = readFileSync(new URL("../PROMPTS.md", import.meta.url), "utf8");

const section = (start, end) => {
  const startIndex = prompt.indexOf(start);
  const endIndex = prompt.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `missing section: ${start}`);
  assert.notEqual(endIndex, -1, `missing section boundary: ${end}`);
  return prompt.slice(startIndex, endIndex);
};

assert.match(prompt, /Express mode/i);
assert.match(prompt, /Standard mode/i);
assert.match(prompt, /Assurance mode/i);

const express = section("### Express mode", "### Standard mode");
assert.match(express, /one direction/i);
assert.match(express, /do not require.*weighted scorecard/is);
assert.match(express, /do not require.*concept alternatives/is);
assert.match(express, /do not require.*diversity matrix/is);

const standard = section("### Standard mode", "### Assurance mode");
assert.match(standard, /two structurally distinct directions/i);
assert.match(standard, /compare them against pre-registered criteria/i);
assert.match(standard, /feasibility check/i);

const assurance = section("### Assurance mode", "## Evidence model");
assert.match(assurance, /three structurally distinct directions/i);
assert.match(assurance, /pairwise diversity matrix/i);
assert.match(assurance, /weighted scoring/i);
assert.match(assurance, /independent adversarial review/i);
assert.match(assurance, /feasibility spike/i);

assert.match(prompt, /Claim basis/i);
assert.match(prompt, /Artifact trust/i);
assert.match(prompt, /VERIFIED.*ASSERTED.*DRAFT.*UNTRUSTED/is);
assert.match(prompt, /Vetoes are evaluated before weighted scoring/i);
assert.match(prompt, /assumption budget/i);
assert.match(prompt, /stop conditions/i);
assert.match(prompt, /decision rights/i);
assert.match(prompt, /traceability/i);
assert.match(prompt, /mode-specific output/i);
assert.match(prompt, /Markdown is the canonical protocol/i);
assert.match(catalog, /prompts\/adaptive-product-design\.md/i);

assert.doesNotMatch(
  prompt,
  /(?:must|required to|shall) use (?:Linear|Jira|Figma|Notion|OpenAI|Anthropic|Codex|Claude|Cursor)/i,
);

console.log("adaptive product design policy: PASS");

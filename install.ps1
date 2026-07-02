# PROMPTOS pointer installer — writes a thin pointer, never copies content.
# Usage: .\install.ps1 -Target "C:\path\to\repo"
param(
    [Parameter(Mandatory = $true)][string]$Target
)
$ErrorActionPreference = "Stop"
$promptos = $PSScriptRoot
$dst = Join-Path $Target "agent\PROMPTS.md"

if (-not (Test-Path $Target)) { throw "Target not found: $Target" }
New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null

$pointer = @"
# Prompt blocks (pointer)

Canonical library lives in **PROMPTOS**, not in this repo.

- GitHub: https://github.com/BFlinkDesign/PROMPTOS
- Local: ``$promptos``
- Catalog: ``$promptos\PROMPTS.md``

Read the prompt you need from ``prompts/`` in that repo. Do not duplicate
prompt content here — edit PROMPTOS once, all projects benefit.

Quick blocks:
1. Scope pipeline — ``prompts/scope-pipeline.md``
2. Decision matrix — ``prompts/decision-matrix.md``
3. Design direction first — ``prompts/design-direction-first.md``
4. Adversarial self-review — ``prompts/adversarial-self-review.md``
5. Retrospective — ``prompts/retrospective.md``
"@

[System.IO.File]::WriteAllText($dst, $pointer)
Write-Host "installed pointer: agent/PROMPTS.md -> PROMPTOS" -ForegroundColor Green

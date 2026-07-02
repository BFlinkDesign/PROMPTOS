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

Full catalog (19 blocks + locked modules + behaviors): ``PROMPTS.md`` in that repo.
"@

[System.IO.File]::WriteAllText($dst, $pointer)
Write-Host "installed pointer: agent/PROMPTS.md -> PROMPTOS" -ForegroundColor Green

#requires -Version 5.1
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ExtensionRoot = $PSScriptRoot
$WorkspaceRoot = (Resolve-Path (Join-Path $ExtensionRoot '..\..\..')).Path
$OutputPath = Join-Path $WorkspaceRoot 'logseq-native.mcpb'

Push-Location $ExtensionRoot
try {
  npm install --omit=dev --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) {
    throw "npm install failed with exit code $LASTEXITCODE."
  }

  npx --yes @anthropic-ai/mcpb validate manifest.json
  if ($LASTEXITCODE -ne 0) {
    throw "MCPB manifest validation failed with exit code $LASTEXITCODE."
  }

  npx --yes @anthropic-ai/mcpb pack . $OutputPath
  if ($LASTEXITCODE -ne 0) {
    throw "MCPB packaging failed with exit code $LASTEXITCODE."
  }

  if (-not (Test-Path $OutputPath)) {
    throw "MCPB package was not created at $OutputPath."
  }

  Write-Host "Created $OutputPath"
} finally {
  Pop-Location
}
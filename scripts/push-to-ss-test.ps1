<#
  One-shot: set origin to smbehm/SS-TEST and push current branch to GitHub.
  Requires: Git for Windows (https://git-scm.com/download/win) and your GitHub credentials (browser / credential manager).
#>

$ErrorActionPreference = "Stop"
$RemoteUrl = "https://github.com/smbehm/SS-TEST.git"

function Find-Git {
  $cmd = Get-Command git -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($p in @(
      "${env:ProgramFiles}\Git\bin\git.exe",
      "${env:ProgramFiles(x86)}\Git\bin\git.exe",
      "${env:LocalAppData}\Programs\Git\bin\git.exe"
    )) {
    if (Test-Path $p) { return $p }
  }
  return $null
}

$git = Find-Git
if (-not $git) {
  Write-Host "Git not found. Install from https://git-scm.com/download/win then reopen this terminal." -ForegroundColor Red
  exit 1
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

& $git remote remove origin 2>$null
& $git remote add origin $RemoteUrl

$branch = (& $git branch --show-current).Trim()
if (-not $branch) {
  & $git branch -M main
  $branch = "main"
}

$status = & $git status --porcelain
if ($status) {
  & $git add -A
  & $git commit -m "Initial push to SS-TEST"
}

Write-Host "Pushing branch '$branch' to origin..." -ForegroundColor Cyan
& $git push -u origin $branch

Write-Host "Done. Repo: https://github.com/smbehm/SS-TEST" -ForegroundColor Green

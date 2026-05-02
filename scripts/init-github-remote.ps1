<#
.SYNOPSIS
  Prepare this folder for GitHub (Option 1): find Git, ensure repo + commit, print push instructions.

.NOTES
  Install Git for Windows first: https://git-scm.com/download/win
  Then create an empty repo on GitHub (no README/license if this project already has files).
#>

$ErrorActionPreference = "Stop"

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
  Write-Host "Git was not found. Install Git for Windows, then re-run this script:" -ForegroundColor Yellow
  Write-Host "  https://git-scm.com/download/win" -ForegroundColor Cyan
  Write-Host "Restart the terminal after install so 'git' is on PATH." -ForegroundColor Yellow
  exit 1
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Using: $git" -ForegroundColor Gray

if (-not (Test-Path ".git")) {
  & $git init
  Write-Host "Initialized new git repository." -ForegroundColor Green
}

$status = & $git status --porcelain 2>$null
if ($status) {
  & $git add -A
  & $git commit -m "chore: snapshot before GitHub remote"
  Write-Host "Created commit with current changes." -ForegroundColor Green
} else {
  Write-Host "Working tree clean — nothing to commit." -ForegroundColor Gray
}

$branch = (& $git branch --show-current 2>$null).Trim()
if (-not $branch) {
  & $git branch -M main
  $branch = "main"
}

Write-Host ""
Write-Host "=== Next steps (run in this folder in Git Bash or PowerShell) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. On github.com → New repository → name it (e.g. sourcesculptures-web)." -ForegroundColor White
Write-Host "   Do NOT add README, .gitignore, or license if this repo already has files." -ForegroundColor DarkGray
Write-Host ""
Write-Host "2. Add the remote (replace YOUR_USER and REPO):" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR_USER/REPO.git" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Push:" -ForegroundColor White
Write-Host "   git push -u origin $branch" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Clone elsewhere (another PC or AI workspace):" -ForegroundColor White
Write-Host "   git clone https://github.com/YOUR_USER/REPO.git" -ForegroundColor Yellow
Write-Host ""
Write-Host "Optional — GitHub CLI (after: winget install GitHub.cli + gh auth login):" -ForegroundColor DarkGray
Write-Host "   gh repo create REPO --private --source=. --remote=origin --push" -ForegroundColor DarkGray

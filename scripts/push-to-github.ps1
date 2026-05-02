# Pushes this project to https://github.com/smbehm/sourcesculptures
# Prerequisites: Git for Windows installed; GitHub repo created (empty is fine); auth via HTTPS or SSH.
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error @"
Git was not found on PATH.
Install Git for Windows from https://git-scm.com/download/win ,
open a new terminal, and run this script again.
"@
}

$remoteUrl = "https://github.com/smbehm/sourcesculptures.git"

if (-not (Test-Path ".git")) {
  git init
}

git add -A
$status = git status --porcelain
if ($status) {
  git commit -m "Initial commit: SOURCEsculptures website"
} else {
  Write-Host "No new changes to commit (tree clean)." -ForegroundColor DarkGray
}

git branch -M main 2>$null

$hasOrigin = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  git remote add origin $remoteUrl
} else {
  git remote set-url origin $remoteUrl
}

Write-Host "Pushing to origin (main)..." -ForegroundColor Cyan
git push -u origin main

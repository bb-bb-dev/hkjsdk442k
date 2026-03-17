param(
  [Parameter(Mandatory = $true)]
  [string]$RepoUrl,
  [string]$Branch = 'main'
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path '.git')) {
  git init -b $Branch
}

$userName = (git config user.name)
$userEmail = (git config user.email)
if ([string]::IsNullOrWhiteSpace($userName) -or [string]::IsNullOrWhiteSpace($userEmail)) {
  throw 'Set git identity first: git config user.name "<YOUR_NAME>" and git config user.email "<YOUR_EMAIL>" (GitHub users.noreply.github.com is recommended for public repos).'
}

$hasOrigin = (git remote 2>$null) -contains 'origin'
if ($hasOrigin) {
  git remote set-url origin $RepoUrl
} else {
  git remote add origin $RepoUrl
}

git add .
$pending = git diff --cached --name-only
if ($pending) {
  $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  git commit -m "Deploy TubeWitch site ($stamp)"
}

git push -u origin $Branch
Write-Host "Published to $RepoUrl on branch $Branch"

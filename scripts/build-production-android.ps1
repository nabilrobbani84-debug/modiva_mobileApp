$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$androidDir = Join-Path $projectRoot 'android'
$envFile = Join-Path $projectRoot '.env'
$envProductionFile = Join-Path $projectRoot '.env.production'
$envBackupFile = Join-Path $projectRoot '.env.backup'

Write-Host '[build-production-android] Validating production environment...'
node (Join-Path $scriptDir 'validate-production-env.js')
if ($LASTEXITCODE -ne 0) {
  throw 'Production environment validation failed.'
}

# Swap .env with .env.production for the duration of the build
$hasBackup = $false
if (Test-Path $envFile) {
  Write-Host '[build-production-android] Backing up development .env...'
  Copy-Item $envFile $envBackupFile -Force
  $hasBackup = $true
}

try {
  Write-Host '[build-production-android] Applying production environment configuration...'
  Copy-Item $envProductionFile $envFile -Force

  Write-Host '[build-production-android] Building Android release APK...'
  Push-Location $androidDir
  try {
    .\gradlew.bat assembleRelease
    if ($LASTEXITCODE -ne 0) {
      throw 'Android release build failed.'
    }
  } finally {
    Pop-Location
  }
} finally {
  # Restore development .env
  if ($hasBackup) {
    Write-Host '[build-production-android] Restoring development .env...'
    Move-Item $envBackupFile $envFile -Force
  } else {
    if (Test-Path $envFile) {
      Remove-Item $envFile -Force
    }
  }
}

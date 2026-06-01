$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$androidDir = Join-Path $projectRoot 'android'

Write-Host '[build-production-android] Validating production environment...'
node (Join-Path $scriptDir 'validate-production-env.js')
if ($LASTEXITCODE -ne 0) {
  throw 'Production environment validation failed.'
}

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

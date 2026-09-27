$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$androidDir = Join-Path $projectRoot 'android'
$envFile = Join-Path $projectRoot '.env'
$envProductionFile = Join-Path $projectRoot '.env.production'
$envBackupFile = Join-Path $projectRoot '.env.backup'

if (-not $env:ANDROID_HOME -and (Test-Path "$env:LOCALAPPDATA\Android\Sdk")) {
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}

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

  Write-Host '[build-production-android] Cleaning stale CMake/CXX and app build caches...'
  if (Test-Path (Join-Path $androidDir 'app\build')) {
    Remove-Item (Join-Path $androidDir 'app\build') -Recurse -Force -ErrorAction SilentlyContinue
  }
  Get-ChildItem -Path $projectRoot -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
  }

  Write-Host '[build-production-android] Building Android release APK...'
  Push-Location $androidDir
  try {
    .\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a --no-parallel
    if ($LASTEXITCODE -ne 0) {
      throw 'Android release build failed.'
    }
    $apkPath = Join-Path $androidDir 'app\build\outputs\apk\release\Modiva-release.apk'
    if (Test-Path $apkPath) {
      $apkItem = Get-Item $apkPath
      $sizeMb = [math]::Round($apkItem.Length / 1MB, 2)
      Write-Host "[build-production-android] APK Release berhasil dibuat!"
      Write-Host "Path: $($apkItem.FullName)"
      Write-Host "Ukuran: $sizeMb MB"
    }
  } finally {
    Pop-Location
  }
} finally {
  # Restore development .env
  if ($hasBackup -and (Test-Path $envBackupFile)) {
    Write-Host '[build-production-android] Restoring development .env...'
    Move-Item $envBackupFile $envFile -Force
  } elseif (-not $hasBackup -and (Test-Path $envFile)) {
    Remove-Item $envFile -Force
  }
}

[CmdletBinding()]
param([string]$Repo = "useforlogin92-netizen/real-estate-caller-system", [string]$Branch = "main")
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path $ProjectRoot "offline-backups"
$CodeRoot = Join-Path $ProjectRoot "github-packages"
$DataFile = Join-Path $ProjectRoot "server\data\database.json"
New-Item -ItemType Directory -Force -Path $BackupRoot, $CodeRoot | Out-Null
Write-Host "Real Estate Caller Desk - Offline Backup + GitHub Package" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot"
if (Test-Path $DataFile) {
  $DataBackup = Join-Path $BackupRoot "database-$Stamp.json"
  Copy-Item -LiteralPath $DataFile -Destination $DataBackup
  Write-Host "Local database backup saved: $DataBackup" -ForegroundColor Green
} else { Write-Warning "server\data\database.json not found. Database backup skipped." }
$CodeBackup = Join-Path $BackupRoot "project-source-$Stamp.zip"
$TempStage = Join-Path $env:TEMP "real-estate-caller-stage-$Stamp"
New-Item -ItemType Directory -Force -Path $TempStage | Out-Null
try {
  Get-ChildItem -LiteralPath $ProjectRoot -Force | Where-Object { $_.Name -notin @(".git", "node_modules", "offline-backups", "github-packages") } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $TempStage -Recurse -Force }
  if (Get-ChildItem -LiteralPath $TempStage -Force | Select-Object -First 1) { Compress-Archive -Path (Join-Path $TempStage "*") -DestinationPath $CodeBackup -CompressionLevel Optimal -Force; Write-Host "Local source backup saved: $CodeBackup" -ForegroundColor Green }
} catch { Write-Warning "Could not create full source ZIP: $($_.Exception.Message)" }
finally { Remove-Item -LiteralPath $TempStage -Recurse -Force -ErrorAction SilentlyContinue }
$ZipUrl = "https://codeload.github.com/$Repo/zip/refs/heads/$Branch"
$LatestZip = Join-Path $CodeRoot "real-estate-caller-$Branch-latest.zip"
$TempZip = "$LatestZip.download"
try {
  Write-Host "Checking GitHub connectivity and downloading latest branch package..."
  Invoke-WebRequest -Uri $ZipUrl -OutFile $TempZip -TimeoutSec 45
  if ((Get-Item $TempZip).Length -lt 1024) { throw "Downloaded archive is unexpectedly small." }
  Move-Item -LiteralPath $TempZip -Destination $LatestZip -Force
  $Hash = (Get-FileHash -LiteralPath $LatestZip -Algorithm SHA256).Hash
  $Meta = @("$Hash  $(Split-Path $LatestZip -Leaf)", "Downloaded: $(Get-Date -Format o)", "Repository: https://github.com/$Repo", "Branch: $Branch")
  Set-Content -LiteralPath (Join-Path $CodeRoot "latest-package.sha256.txt") -Value $Meta -Encoding UTF8
  Write-Host "GitHub package saved: $LatestZip" -ForegroundColor Green
  Write-Host "SHA256: $Hash"
  Write-Host "Downloaded package only; live code was NOT overwritten." -ForegroundColor Yellow
} catch { Remove-Item -LiteralPath $TempZip -Force -ErrorAction SilentlyContinue; Write-Warning "GitHub download failed or internet is unavailable. Local backups are preserved."; Write-Warning $_.Exception.Message }
Write-Host "Finished. Do not upload customer data or database backups to public GitHub." -ForegroundColor Cyan
# Resets local PostgreSQL 16 "postgres" password and creates reschool/reschool.
# MUST run as Administrator (right-click PowerShell -> Run as administrator).
#
#   powershell -ExecutionPolicy Bypass -File .\scripts\reset-pg-password.ps1

#Requires -RunAsAdministrator
$ErrorActionPreference = "Stop"

$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$hba = "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
$service = "postgresql-x64-16"
$newPass = "postgres"

if (-not (Test-Path $psql)) { throw "psql not found: $psql" }
if (-not (Test-Path $hba)) { throw "pg_hba.conf not found: $hba" }

$backup = "$hba.bak-reschool"
Copy-Item -LiteralPath $hba -Destination $backup -Force
Write-Host "Backup: $backup"

Write-Host "Switching localhost auth to trust..."
$content = Get-Content -LiteralPath $hba -Raw
$trusted = $content -replace 'scram-sha-256', 'trust'
Set-Content -LiteralPath $hba -Value $trusted -Encoding ASCII -NoNewline

Write-Host "Restarting $service..."
Restart-Service -Name $service -Force
Start-Sleep -Seconds 2

Write-Host "Setting postgres password to '$newPass' and creating reschool..."
$tmp = Join-Path $env:TEMP "reschool-reset.sql"
@'
ALTER USER postgres WITH PASSWORD 'postgres';

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'reschool') THEN
    CREATE ROLE reschool LOGIN PASSWORD 'reschool';
  ELSE
    ALTER ROLE reschool WITH LOGIN PASSWORD 'reschool';
  END IF;
END
$$;

SELECT 'CREATE DATABASE reschool OWNER reschool'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reschool')\gexec

GRANT ALL PRIVILEGES ON DATABASE reschool TO reschool;
'@ | Set-Content -Path $tmp -Encoding ASCII

& $psql -U postgres -h 127.0.0.1 -p 5432 -d postgres -v ON_ERROR_STOP=1 -f $tmp
if ($LASTEXITCODE -ne 0) {
  Copy-Item -LiteralPath $backup -Destination $hba -Force
  Restart-Service -Name $service -Force
  throw "SQL failed; pg_hba restored."
}

$tmp2 = Join-Path $env:TEMP "reschool-grants.sql"
@'
ALTER SCHEMA public OWNER TO reschool;
GRANT ALL ON SCHEMA public TO reschool;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO reschool;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO reschool;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO reschool;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO reschool;
'@ | Set-Content -Path $tmp2 -Encoding ASCII
& $psql -U postgres -h 127.0.0.1 -p 5432 -d reschool -v ON_ERROR_STOP=1 -f $tmp2

Write-Host "Restoring pg_hba.conf..."
Copy-Item -LiteralPath $backup -Destination $hba -Force
Restart-Service -Name $service -Force
Start-Sleep -Seconds 2

Remove-Item $tmp, $tmp2 -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "OK. postgres password is now: postgres"
Write-Host "Role/DB reschool / reschool created."
Write-Host "Next (normal cmd, no admin):"
Write-Host "  npm run db:migrate"
Write-Host "  npm run db:seed"
Write-Host "  npm run dev"

# Creates role/db "reschool" in local PostgreSQL 16 (Windows).
# Usage from repo root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-local-pg.ps1
# Needs the postgres superuser password from PostgreSQL install.

$ErrorActionPreference = "Stop"
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

if (-not (Test-Path $psql)) {
  throw "psql not found: $psql. Install PostgreSQL 16 or Docker Desktop."
}

$secure = Read-Host -AsSecureString "postgres password"
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

Write-Host "Checking connection..."
& $psql -U postgres -h localhost -p 5432 -d postgres -v ON_ERROR_STOP=1 -c "SELECT version();"
if ($LASTEXITCODE -ne 0) {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  throw "Auth failed. Wrong postgres password."
}

$tmp = Join-Path $env:TEMP "reschool-setup.sql"
@'
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

Write-Host "Creating role and database..."
& $psql -U postgres -h localhost -p 5432 -d postgres -v ON_ERROR_STOP=1 -f $tmp
if ($LASTEXITCODE -ne 0) {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item $tmp -ErrorAction SilentlyContinue
  throw "Failed to create role/database."
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

Write-Host "Granting schema privileges..."
& $psql -U postgres -h localhost -p 5432 -d reschool -v ON_ERROR_STOP=1 -f $tmp2

Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Remove-Item $tmp, $tmp2 -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Done. Next:"
Write-Host "  npm run db:migrate"
Write-Host "  npm run db:seed"
Write-Host "  npm run dev"

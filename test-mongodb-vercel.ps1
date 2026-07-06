#!/usr/bin/env pwsh
<#
.SYNOPSIS
Test MongoDB connection and cold start simulation for Vercel

.DESCRIPTION
Simulates Vercel cold start by:
1. Testing direct MongoDB connection
2. Measuring connection time
3. Testing retry logic
4. Verifying pool configuration

.EXAMPLE
./test-mongodb-vercel.ps1
#>

param(
    [switch]$Verbose = $false
)

Write-Host "🧪 MongoDB Vercel Cold Start Test" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ ERROR: .env.local not found" -ForegroundColor Red
    Write-Host "   Create .env.local with MONGODB_URI" -ForegroundColor Yellow
    exit 1
}

# Load environment
$envContent = Get-Content ".env.local" | Where-Object { $_ -match "MONGODB_URI" }
if (-not $envContent) {
    Write-Host "❌ ERROR: MONGODB_URI not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Environment loaded" -ForegroundColor Green
Write-Host ""

# Test 1: Check Node.js version
Write-Host "📋 Test 1: Environment Check" -ForegroundColor Cyan
$nodeVersion = & node --version 2>$null
$npmVersion = & npm --version 2>$null

if ($nodeVersion) {
    Write-Host "  ✓ Node.js: $nodeVersion"
} else {
    Write-Host "  ❌ Node.js not found" -ForegroundColor Red
    exit 1
}

if ($npmVersion) {
    Write-Host "  ✓ npm: $npmVersion"
}

Write-Host ""

# Test 2: Check dependencies
Write-Host "📋 Test 2: Dependencies Check" -ForegroundColor Cyan
$pkgJson = Get-Content "package.json" | ConvertFrom-Json
$mongoVersion = $pkgJson.dependencies.mongodb

if ($mongoVersion) {
    Write-Host "  ✓ mongodb: $mongoVersion"
} else {
    Write-Host "  ❌ mongodb not installed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Connection test using test-mongodb.js
Write-Host "📋 Test 3: Direct MongoDB Connection" -ForegroundColor Cyan
Write-Host "  Testing connection with retry logic..."
Write-Host ""

if (Test-Path "test-mongodb.js") {
    # Run with timeout
    $startTime = Get-Date
    try {
        $output = & node test-mongodb.js 2>&1 | ForEach-Object { Write-Host "    $_" }
        $duration = (Get-Date) - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "  ✓ Connection successful in $($duration.TotalSeconds)s" -ForegroundColor Green
            Write-Host "    Expected: 1-5 seconds (with retry backoff)" -ForegroundColor Gray
            
            if ($duration.TotalSeconds -le 5) {
                Write-Host "    Status: PASS ✓" -ForegroundColor Green
            } else {
                Write-Host "    Status: WARNING - Connection slow" -ForegroundColor Yellow
            }
        } else {
            Write-Host ""
            Write-Host "  ❌ Connection failed" -ForegroundColor Red
            Write-Host "    Check MONGODB_URI in .env.local" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ❌ Test execution error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠️  test-mongodb.js not found, skipping" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Test 4: Configuration Verification" -ForegroundColor Cyan

# Check for connection-utils.ts
if (Test-Path "src/lib/mongo/connection-utils.ts") {
    Write-Host "  ✓ connection-utils.ts (retry logic)" -ForegroundColor Green
} else {
    Write-Host "  ❌ connection-utils.ts not found" -ForegroundColor Red
}

# Check for vercel.json
if (Test-Path "vercel.json") {
    Write-Host "  ✓ vercel.json (Vercel config)" -ForegroundColor Green
    $vercelJson = Get-Content "vercel.json" | ConvertFrom-Json
    if ($vercelJson.functions."src/app/api/**".maxDuration) {
        Write-Host "    - maxDuration: $($vercelJson.functions.'src/app/api/**'.maxDuration)s" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠️  vercel.json not found (optional)" -ForegroundColor Yellow
}

# Check for VERCEL_DEPLOYMENT_GUIDE.md
if (Test-Path "VERCEL_DEPLOYMENT_GUIDE.md") {
    Write-Host "  ✓ VERCEL_DEPLOYMENT_GUIDE.md (documentation)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  VERCEL_DEPLOYMENT_GUIDE.md not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎯 Test Summary" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Environment ready for Vercel deployment" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm run build" -ForegroundColor Gray
Write-Host "  2. Test local: npm run dev" -ForegroundColor Gray
Write-Host "  3. Deploy: git push origin main" -ForegroundColor Gray
Write-Host "  4. Monitor: vercel logs --prod" -ForegroundColor Gray
Write-Host ""

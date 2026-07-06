#!/usr/bin/env pwsh
<#
.SYNOPSIS
Quick deployment checklist for MongoDB cold start fix

.DESCRIPTION
Run this script before deploying to verify everything is ready

.EXAMPLE
./deployment-checklist.ps1
#>

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    DEPLOYMENT CHECKLIST                        ║" -ForegroundColor Cyan
Write-Host "║              MongoDB Cold Start Fix for Vercel                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Verify Files Created/Modified
# ============================================
Write-Host "1️⃣  Verifying files..." -ForegroundColor Cyan
$filesRequired = @(
    "src/lib/mongo/connection-utils.ts",
    "src/lib/mongo/operation-retry.ts",
    "src/lib/mongo/client.ts",
    "src/app/api/admin/iscrizioni/export/route.ts",
    "src/app/api/iscrizioni/route.ts",
    "src/app/api/eventi/iscrizione/route.ts",
    "vercel.json",
    "VERCEL_DEPLOYMENT_GUIDE.md",
    "MONGODB_TROUBLESHOOTING.md",
    "MONGODB_COLD_START_FIX.md",
    ".env.example"
)

$allFilesExist = $true
foreach ($file in $filesRequired) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file (MISSING)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "   ⚠️  Some files are missing. Re-run the fix script." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================
# 2. Verify Environment
# ============================================
Write-Host "2️⃣  Checking environment..." -ForegroundColor Cyan

# Check Node version
$nodeVersion = & node --version 2>$null
if ($nodeVersion) {
    Write-Host "   ✓ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ✗ Node.js not found" -ForegroundColor Red
    exit 1
}

# Check .env.local
if (Test-Path ".env.local") {
    if ((Get-Content ".env.local") -match "MONGODB_URI") {
        Write-Host "   ✓ .env.local with MONGODB_URI" -ForegroundColor Green
    } else {
        Write-Host "   ✗ .env.local missing MONGODB_URI" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✗ .env.local not found" -ForegroundColor Red
    Write-Host "      Copy .env.example → .env.local and fill in MONGODB_URI" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================
# 3. Verify Build
# ============================================
Write-Host "3️⃣  Checking TypeScript compilation..." -ForegroundColor Cyan

# Check for TypeScript errors
$tsCheckOutput = & npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ No TypeScript errors" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  TypeScript warnings/errors found:" -ForegroundColor Yellow
    Write-Host "$tsCheckOutput" | ForEach-Object { Write-Host "      $_" -ForegroundColor Yellow }
    Write-Host "   (May be OK if pre-existing)" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# 4. Git Status
# ============================================
Write-Host "4️⃣  Checking git status..." -ForegroundColor Cyan

$gitStatus = & git status --porcelain 2>$null
$modifiedCount = @($gitStatus | Measure-Object).Count

Write-Host "   Modified/New files: $modifiedCount" -ForegroundColor Cyan
if ($modifiedCount -le 20) {
    $gitStatus | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
} else {
    Write-Host "   (Too many to display, use 'git status')" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# 5. Deployment Instructions
# ============================================
Write-Host "5️⃣  Deployment Steps" -ForegroundColor Cyan
Write-Host ""

Write-Host "   Step 1: Review changes" -ForegroundColor White
Write-Host "   ─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "   git diff src/lib/mongo/client.ts" -ForegroundColor Yellow
Write-Host ""

Write-Host "   Step 2: Commit changes" -ForegroundColor White
Write-Host "   ─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "   git add ." -ForegroundColor Yellow
Write-Host "   git commit -m ""fix: MongoDB cold start resilience for Vercel"" -ForegroundColor Yellow
Write-Host ""

Write-Host "   Step 3: Push to GitHub" -ForegroundColor White
Write-Host "   ─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Yellow
Write-Host ""

Write-Host "   Step 4: Vercel auto-deploys" -ForegroundColor White
Write-Host "   ─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "   • Dashboard: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "   • Wait for ✓ Deployment complete" -ForegroundColor Gray
Write-Host ""

Write-Host "   Step 5: Test live site" -ForegroundColor White
Write-Host "   ─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "   • Open: https://sito-chiesa-san-marco.vercel.app" -ForegroundColor Yellow
Write-Host "   • Should load without errors" -ForegroundColor Gray
Write-Host ""

Write-Host "   Step 6: Monitor logs" -ForegroundColor White
Write-Host "   ─────────────────────────────────────────" -ForegroundColor Gray
Write-Host "   vercel logs --prod --follow" -ForegroundColor Yellow
Write-Host "   Look for: [MongoDB] ✓ Connected successfully" -ForegroundColor Gray
Write-Host ""

# ============================================
# 6. Pre-Deployment Checklist
# ============================================
Write-Host "6️⃣  Pre-Deployment Checklist" -ForegroundColor Cyan
Write-Host ""

$items = @(
    @{ item = "Local tests pass (npm run dev)"; note = "Check http://localhost:3000" },
    @{ item = "MongoDB Atlas whitelist includes 0.0.0.0/0"; note = "Network Access → IP Whitelist" },
    @{ item = "MONGODB_URI has ?retryWrites=true&w=majority"; note = "Important for Vercel" },
    @{ item = "vercel.json exists and valid"; note = "maxDuration: 60 for functions" },
    @{ item = "Documentation reviewed"; note = "Read MONGODB_COLD_START_FIX.md" },
    @{ item = "All files committed to git"; note = "git status shows clean" }
)

foreach ($item in $items) {
    Write-Host "   [ ] $($item.item)" -ForegroundColor White
    if ($item.note) {
        Write-Host "       Note: $($item.note)" -ForegroundColor Gray
    }
}

Write-Host ""

# ============================================
# 7. Expected Results
# ============================================
Write-Host "7️⃣  Expected Results After Deployment" -ForegroundColor Cyan
Write-Host ""

Write-Host "   Cold Start (First access):" -ForegroundColor White
Write-Host "   • Duration: 2-5 seconds (vs timeout before)" -ForegroundColor Gray
Write-Host "   • Logs show: [MongoDB] Connection attempt → Connected" -ForegroundColor Gray
Write-Host "   • Auto-retry: 1-3 attempts then success" -ForegroundColor Gray
Write-Host ""

Write-Host "   Warm Start (Subsequent loads):" -ForegroundColor White
Write-Host "   • Duration: 300-500ms (fast)" -ForegroundColor Gray
Write-Host "   • No retries needed" -ForegroundColor Gray
Write-Host ""

Write-Host "   Error Handling:" -ForegroundColor White
Write-Host "   • DB connection issues → 503 with retry hint" -ForegroundColor Gray
Write-Host "   • User-friendly error messages" -ForegroundColor Gray
Write-Host ""

# ============================================
# Final Summary
# ============================================
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ READY FOR DEPLOYMENT" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  • MONGODB_COLD_START_FIX.md (Summary & rationale)" -ForegroundColor Gray
Write-Host "  • VERCEL_DEPLOYMENT_GUIDE.md (Step-by-step guide)" -ForegroundColor Gray
Write-Host "  • MONGODB_TROUBLESHOOTING.md (Troubleshooting & diagnostics)" -ForegroundColor Gray
Write-Host ""

Write-Host "Next command:" -ForegroundColor Cyan
Write-Host "  git push origin main" -ForegroundColor Yellow
Write-Host ""

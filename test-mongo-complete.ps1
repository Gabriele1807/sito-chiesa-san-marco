Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TEST DIAGNOSI MONGODB" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 1. Verifica .env
Write-Host "1️⃣  Lettura .env..." -ForegroundColor Green
if (Test-Path ".env") {
    $env_lines = Get-Content .env | Where-Object { $_ -match "MONGODB" }
    $env_lines | ForEach-Object { 
        if ($_ -match "MONGODB_URI") {
            Write-Host "   ✓ MONGODB_URI trovato (password mascherata)"
        } else {
            Write-Host "   ✓ $_"
        }
    }
} else {
    Write-Host "   ✗ File .env NON trovato!" -ForegroundColor Red
}
Write-Host ""

# 2. Test DNS
Write-Host "2️⃣  Test DNS per cluster0.mv32tie.mongodb.net..." -ForegroundColor Green
try {
    $dns_result = Resolve-DnsName cluster0.mv32tie.mongodb.net -Type SRV -ErrorAction Stop
    Write-Host "   ✓ DNS risolto correttamente" -ForegroundColor Green
    $dns_result | ForEach-Object { Write-Host "     - $($_.NameTarget)" }
}
catch {
    Write-Host "   ✗ ERRORE DNS: $_" -ForegroundColor Red
}
Write-Host ""

# 3. Test Connessione Rete
Write-Host "3️⃣  Test connessione di rete (porta 27017)..." -ForegroundColor Green
$connection = Test-NetConnection cluster0.mv32tie.mongodb.net -Port 27017
if ($connection.TcpTestSucceeded) {
    Write-Host "   ✓ Connessione riuscita" -ForegroundColor Green
}
else {
    Write-Host "   ✗ Connessione fallita" -ForegroundColor Red
}
Write-Host ""

# 4. Controlla Node.js
Write-Host "4️⃣  Verifica Node.js e MongoDB Driver..." -ForegroundColor Green
try {
    $node_version = node --version
    Write-Host "   ✓ Node.js: $node_version" -ForegroundColor Green
    
    if (Test-Path "node_modules\mongodb") {
        Write-Host "   ✓ MongoDB Driver installato" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠ MongoDB Driver NON trovato" -ForegroundColor Yellow
        Write-Host "     Esegui: npm install mongodb" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   ✗ Node.js non trovato" -ForegroundColor Red
}
Write-Host ""

Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Test completato. Esegui 'node test-mongodb.js' per il test di connessione." -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
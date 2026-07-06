# MongoDB Cold Start - Troubleshooting Guide

## 🔴 Sintomi di Cold Start Failure

### Errore nel Browser
```
Application error: a server-side exception has occurred (see the server logs for more information).
Digest: 3951205851
```

### Errore in Vercel Logs
```
MongoServerSelectionError: Server selection timed out after 30000 ms
```

### Comportamento
- ❌ Primo accesso fallisce
- ✓ Refresh (F5) funziona temporaneamente
- ❌ Nuovo deployment: problema ricorre

---

## ✅ Fix Applicati

### 1. Timeout Estesi per Cold Start

**Prima:**
```typescript
// Default MongoDB: 30s timeout
const client = new MongoClient(uri);
```

**Dopo:**
```typescript
// Vercel serverless: 60s timeout + retry logic
serverSelectionTimeoutMS: 60000, // 60 secondi
connectTimeoutMS: 30000,
retryWrites: true,
```

### 2. Retry Logic con Backoff Esponenziale

**Prima:**
```typescript
await client.connect(); // Fallisce se Vercel freddo
```

**Dopo:**
```typescript
// 3 tentativi con delay: 1s → 2s → 4s
await connectWithRetry(uri, {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
});
```

### 3. Connection Pool Ottimizzato

```typescript
maxPoolSize: 5,    // Vercel limit
minPoolSize: 1,
keepAlive: true,   // Mantiene connessione viva
maxIdleTimeMS: 60000,
```

### 4. Health Check Periodico

```typescript
// Ogni 30 secondi
await db.admin().command({ ping: 1 });
```

### 5. Vercel Configuration

```json
{
  "functions": {
    "src/app/api/**": {
      "maxDuration": 60  // API timeout 60s (vs 30)
    }
  }
}
```

---

## 🧪 Come Testare

### Test Locale (Simula Cold Start)

```bash
# 1. Ferma il server locale
# Ctrl+C in terminal

# 2. Riavvia da zero (simula cold start)
npm run dev

# 3. Accedi al sito
# http://localhost:3000

# 4. Controlla logs
# Dovresti vedere: "[MongoDB] ✓ Connected successfully"
```

### Test Vercel Deploy

```bash
# 1. Deploy
git push origin main

# 2. Attendi build completamento
# In Vercel dashboard → Deployments

# 3. Test live
# Apri https://sito-chiesa-san-marco.vercel.app
# Dovrebbe caricare senza errori

# 4. Verifica logs
vercel logs --prod | grep MongoDB

# Output atteso:
# [MongoDB] Connection attempt 1/3...
# [MongoDB] ✓ Connected successfully in ~2000ms (attempt 1)
```

---

## 🔍 Diagnostica

### Controllare MongoDB Atlas Config

1. Accedi a MongoDB Atlas
2. Network Access → IP Whitelist
3. **DEVE contenere:** `0.0.0.0/0` (Vercel usa IP dinamici)

```
❌ SBAGLIATO: Whitelist specifico per IP
✓ CORRETTO: 0.0.0.0/0 (Vercel serverless)
```

### Verificare Connection String

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority
                                                    ↑
                                        IMPORTANTE: w=majority
```

### Controllare Logs Vercel Dettagli

```bash
# Verifica logs deployment completo
vercel logs --prod --tail

# Cerca pattern:
✓ "[MongoDB] Connection attempt 1/3..."
✓ "[MongoDB] ✓ Connected successfully"
✓ "Production connection established"

✗ "[MongoDB] ✗ Connection attempt" (errore)
✗ "MongoServerSelectionError" (timeout)
```

---

## ⚠️ Problemi Comuni

### Problema: "Still timeout dopo fix"

**Causa 1: IP non whitelisted**
```
Soluzione: MongoDB Atlas → Network Access → Add 0.0.0.0/0
```

**Causa 2: Connection string non corretta**
```
Verifica MONGODB_URI in Vercel → Settings → Environment Variables
Non deve avere spazi o caratteri speciali non-escaped
```

**Causa 3: Credenziali wrong**
```
Test locale: npm run dev
Se funziona localmente, il problema è su Vercel
```

### Problema: "API slow anche dopo fix"

**Normale:** 
- Cold start: 3-5 secondi (primo accesso dopo deploy/inattività)
- Warm start: 200-500ms (accessi successivi)

**Anormale:**
- Tutte le richieste > 10 secondi
- → Controllare rete Vercel o pool database saturo

### Problema: "Health check fail nel log"

```
[MongoDB] Health check failed, but continuing with existing connection
```

**È OK!** Il sistema continua comunque. Non è errore critico.

---

## 📊 Metriche di Successo

Dopo fix, dovresti vedere:

| Metrica | Valore |
|---------|--------|
| First load (cold) | ~2-5s ✓ |
| Subsequent loads | ~300-500ms ✓ |
| Connection retry attempts | 1 (di solito) ✓ |
| DB timeout errors | 0 ✓ |
| Success rate | 100% ✓ |

---

## 🚀 Post-Fix Checklist

Dopo deployment, verifica:

- [ ] Primo accesso al sito funziona
- [ ] API `/api/iscrizioni` ritorna dati
- [ ] Export PDF funziona
- [ ] Logs Vercel mostrano "Connected successfully"
- [ ] Refresh pagina non causa ulteriori errori
- [ ] Admin dashboard carica correttamente

---

## 🆘 Se Ancora Non Funziona

### Step 1: Verifica MONGODB_URI Localmente

```bash
# Copia MONGODB_URI da Vercel environment
# Metti in .env.local
# Esegui:
node test-mongodb.js

# Dovrebbe dire: "Connected to MongoDB"
```

### Step 2: Controlla Vercel Logs Completi

```bash
vercel logs --prod

# Copia l'ID digest dall'errore (es: 3951205851)
# Condividi con support se sconosciuto
```

### Step 3: Testa Connection Direttamente

```bash
# Script di test (PowerShell)
./test-mongodb-vercel.ps1

# Dovrebbe dirti status e versioni
```

### Step 4: Contatta Support

Se ancora non risolto, prepara:
1. ✓ Vercel logs (ultime 50 linee)
2. ✓ MONGODB_URI (senza password!)
3. ✓ Output di `./test-mongodb-vercel.ps1`
4. ✓ Network whitelist MongoDB Atlas

---

## 📚 Risorse Esterne

- [MongoDB Atlas Connection Troubleshooting](https://docs.mongodb.com/atlas/troubleshoot-connection/)
- [Vercel Serverless Functions Limits](https://vercel.com/docs/functions/serverless-functions#max-duration)
- [Node.js MongoDB Driver - Retry Logic](https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/connection-options/)

---

**Ultimo aggiornamento:** 2026-07-06
**Versione Guide:** 1.0

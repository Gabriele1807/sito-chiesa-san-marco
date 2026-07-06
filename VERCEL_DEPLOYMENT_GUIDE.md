# MongoDB Cold Start Fix - Guida Vercel Deployment

## ❌ Problema Riscontrato

**Errore in Vercel al primo accesso:**
```
MongoServerSelectionError: Server selection timed out after 30000 ms
```

**Root Cause:**
- Timeout di 30 secondi insufficiente per Vercel cold start
- Connessione MongoDB non riutilizzata tra richieste
- Mancanza di retry logic con backoff esponenziale
- Pool size non ottimizzato per ambiente serverless

---

## ✅ Soluzione Implementata

### 1. **Configurazione Ottimizzata MongoDB** (`src/lib/mongo/connection-utils.ts`)

- ✓ `serverSelectionTimeoutMS: 60000` (doppio il default)
- ✓ `connectTimeoutMS: 30000`
- ✓ `socketTimeoutMS: 45000`
- ✓ `maxPoolSize: 5` (ottimale per serverless)
- ✓ `retryWrites: true` e `retryReads: true`
- ✓ `keepAlive: true` (mantiene connessione viva)

### 2. **Retry Logic con Backoff Esponenziale** (`src/lib/mongo/connection-utils.ts`)

```
Tentativo 1: immediatamente
Tentativo 2: dopo 1 secondo
Tentativo 3: dopo 2 secondi
Max ritardo: 5 secondi (evita timeouts)
```

### 3. **Health Check Periodico** (`src/lib/mongo/client.ts`)

- Verifica connessione ogni 30 secondi
- Utilizza `db.admin().command({ ping: 1 })`
- Continua operazioni anche se health check fallisce

### 4. **Configurazione Vercel** (`vercel.json`)

```json
{
  "functions": {
    "src/app/api/**": {
      "maxDuration": 60
    }
  }
}
```

- API route timeout: 60 secondi (vs default 30)
- Consente connessione completarsi durante cold start

---

## 🚀 Come Deployare

### Prerequisites

1. **MongoDB Atlas** con IP whitelist:
   - Dashboard → Network Access
   - Aggiungi `0.0.0.0/0` (Vercel usa IP dinamici)
   - Oppure: aggiorna ogni volta che Vercel cambia IP

2. **Vercel Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=chiesa_san_marco
   ```

### Deploy Steps

```bash
# 1. Testa localmente
npm run dev
# Verifica che la connessione funzioni

# 2. Commit changes
git add .
git commit -m "fix: optimize MongoDB cold start for Vercel"

# 3. Push
git push origin main

# 4. Vercel auto-deploy
# ✓ Attendi build e deployment

# 5. Test sul sito live
# Apri: https://sito-chiesa-san-marco.vercel.app
# Refresh pagina più volte (verifica non fallisce più)
```

---

## 🔍 Debugging

### Verificare Logs Vercel

```bash
# Visualizza deployment logs
vercel logs --prod

# Cerca pattern:
# ✓ "[MongoDB] Connection attempt" → tentava connessione
# ✓ "[MongoDB] ✓ Connected successfully" → riuscito
# ✗ "[MongoDB] ✗ Connection attempt" → fallito
```

### Test Locale

```bash
# Test connessione MongoDB
node test-mongodb.js

# Dovrebbe stampare:
# Connected to MongoDB
# Database: chiesa_san_marco
# Collections: [...]
```

### Verificare connection pool

```bash
# Nel browser console (dopo reload):
# Apri DevTools → Network → Preview della richiesta API
# Verifica response time durante primo accesso vs. successivi
```

---

## 📊 Metriche Attese

| Scenario | Prima | Dopo | Miglioramento |
|----------|-------|------|--------------|
| First load (cold) | ❌ Timeout | ✓ ~2-5s | Fixed |
| Subsequent loads | ✓ ~500ms | ✓ ~300ms | +40% |
| Health check | - | Every 30s | Proattivo |
| Max retry delay | - | 5s | Boundsato |

---

## ⚠️ Configurazioni Critiche

### ❌ NÃO fare:

```typescript
// ✗ SBAGLIATO: Timeout di default
const client = new MongoClient(uri);

// ✗ SBAGLIATO: Nessun retry
await client.connect();

// ✗ SBAGLIATO: Connessione nuova ogni richiesta
new MongoClient(uri).connect();
```

### ✅ CORRETTO:

```typescript
// ✓ Con timeout ottimizzato e retry
await connectWithRetry(uri, {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
});
```

---

## 🔗 Risorse

- [MongoDB Connection String Options](https://www.mongodb.com/docs/manual/reference/connection-string/#connection-string-options)
- [Vercel Functions Configuration](https://vercel.com/docs/functions/serverless-functions/edge-middleware)
- [Serverless MongoDB Best Practices](https://www.mongodb.com/docs/atlas/manage-connections/)

---

## 📝 Checklist Post-Deploy

- [ ] Deployment completato su Vercel
- [ ] Logs mostrano "✓ Connected successfully"
- [ ] Primo accesso al sito non fallisce
- [ ] API `/api/admin/iscrizioni/export` funziona
- [ ] Refresh non cambia comportamento
- [ ] Monitorare Vercel Analytics per 24h

---

## 🆘 Se Ancora Fallisce

### 1. Controlla IPv4/IPv6 in MongoDB Atlas

```
Network Access → add IP → 0.0.0.0/0
```

### 2. Aumenta timeout in vercel.json

```json
{
  "functions": {
    "src/app/api/**": {
      "maxDuration": 120
    }
  }
}
```

### 3. Verifica MONGODB_URI

```bash
# Non deve contenere spazi extra
# Format: mongodb+srv://username:password@cluster.mongodb.net/database?options
```

### 4. Contatta MongoDB Support

Se problema persiste, fornire:
- Connection logs from Vercel
- MONGODB_URI (senza password!)
- Vercel logs digest

---

**Ultimo aggiornamento:** 2026-07-06
**Versione:** 1.0 (Retry Logic v1)

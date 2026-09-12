# Setup Redis – Rate Limiting e Revoca Token Admin

Guida passo-passo per collegare un'istanza Redis (Upstash) al sito, così che
rate limiting login e revoca dei token admin diventino condivisi tra tutte
le istanze serverless di Vercel invece che "per istanza".

> ℹ️ **Questo step è opzionale.** Se non colleghi Redis, il sito continua a
> funzionare esattamente come prima: `src/lib/redis/client.ts` ritorna
> `null` quando le variabili d'ambiente non sono impostate, e
> `src/lib/auth/rate-limit.ts` / `src/lib/auth/session.ts` ricadono
> automaticamente su un fallback in memoria di processo. Vedi
> `PROJECT_CONTEXT.md` §6.4.3 per il dettaglio tecnico di cosa cambia con e
> senza Redis.

---

## 1. A cosa serve

Due cose, entrambe attualmente "per istanza" senza Redis:

- **Rate limiting login** (`src/lib/auth/rate-limit.ts`): blocca un IP dopo
  5 tentativi di login falliti in 15 minuti, e limita le richieste
  pubbliche generiche a 60/minuto per IP.
- **Revoca token admin** (`src/lib/auth/session.ts`): quando un admin fa
  logout, il suo token JWT deve smettere di funzionare immediatamente, non
  solo alla scadenza naturale.

Su Vercel (funzioni serverless) ogni richiesta può finire su un'istanza di
processo diversa. Senza uno stato condiviso esterno, un contatore o un
token revocato in memoria "esiste" solo su quell'istanza — un attaccante
distribuito su più richieste concorrenti può aggirare il limite nominale, e
un token disconnesso può restare valido su un'altra istanza. Redis risolve
questo perché è uno stato esterno a cui tutte le istanze accedono.

---

## 2. Creare un'istanza Upstash Redis

Puoi farlo in due modi equivalenti: direttamente da Upstash, o dal
Marketplace di Vercel (consigliato se il progetto è già collegato a
Vercel, perché imposta le env var in automatico).

### Opzione A — Da Vercel Marketplace (consigliata)

1. Vai sulla dashboard del progetto su [vercel.com](https://vercel.com)
2. Apri la tab **Storage** (o **Integrations → Marketplace** a seconda
   della versione dell'interfaccia)
3. Cerca **Upstash** e scegli **Redis**
4. Segui il flusso guidato: scegli un nome (es. `chiesa-san-marco-redis`) e
   la region più vicina agli utenti (es. Francoforte/`eu-central-1` per
   l'Italia — Upstash mostra le region disponibili nel flusso)
5. Al termine, Vercel collega automaticamente l'istanza al progetto e
   aggiunge le variabili d'ambiente necessarie a tutti gli ambienti
   (Production/Preview/Development) — salta al punto 4 di questa guida
   per verificarle

### Opzione B — Direttamente da Upstash

1. Vai su [upstash.com](https://upstash.com) e accedi (o crea un account
   gratuito — il piano free è più che sufficiente per questo uso)
2. Clicca **Create Database**
3. Scegli un nome, il tipo **Regional** (non serve Global per questo caso
   d'uso) e una region vicina agli utenti
4. Attendi che il database sia pronto (pochi secondi)

---

## 3. Copiare le credenziali

Se hai usato l'**Opzione B** (Upstash diretto), dal dashboard del database:

1. Vai sulla tab **REST API** (non "Connect" — quella è per client TCP
   tradizionali come `redis-cli`/`ioredis`, che qui non servono)
2. Copia i due valori:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

Se hai usato l'**Opzione A** (Vercel Marketplace), queste due variabili
sono già state aggiunte automaticamente al progetto Vercel — puoi comunque
copiarle da **Project Settings → Environment Variables** su Vercel per
usarle anche in locale.

---

## 4. Configurare le variabili d'ambiente

### In locale

Modifica (o crea) il file `.env.local` nella root del progetto:

```env
UPSTASH_REDIS_REST_URL=https://TUO-DATABASE.upstash.io
UPSTASH_REDIS_REST_TOKEN=IL_TUO_TOKEN
```

> ⚠️ **NON committare mai `.env.local`** — è già nel `.gitignore`.

### Su Vercel (produzione)

Se hai usato l'Opzione A queste sono già presenti. Se hai usato l'Opzione B
o vuoi verificarle:

1. Vai su **Project Settings → Environment Variables**
2. Aggiungi (se assenti):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Assicurati che siano applicate agli ambienti che ti servono
   (tipicamente **Production** e **Preview**; **Development** solo se usi
   `vercel dev` invece di `.env.local`)
4. Fai un nuovo deploy (o un redeploy dell'ultimo) perché le funzioni
   serverless leggano le nuove variabili

---

## 5. Nessuno schema da inizializzare

A differenza di MongoDB o Supabase, **non c'è nessuno schema, tabella o
collezione da creare**: Redis qui è usato solo come contatore/cache con
scadenza automatica (`INCR` + `EXPIRE`). Le chiavi vengono create al volo
dal codice la prima volta che servono:

| Chiave | Scopo | Scadenza |
|---|---|---|
| `ratelimit:login:{ip}` | Tentativi di login falliti per IP | 15 minuti |
| `ratelimit:request:{ip}` | Richieste pubbliche generiche per IP | 1 minuto |
| `admin_revoked:{token}` | Token admin invalidato al logout | fino alla scadenza naturale del JWT |

Non serve alcuna azione manuale: le chiavi scompaiono da sole quando
scadono.

---

## 6. Verificare che funzioni

### In locale

1. Assicurati che `.env.local` contenga le due variabili (punto 4)
2. Riavvia il server di sviluppo (`npm run dev`) — le env var vengono
   lette all'avvio
3. Prova a fare login con credenziali sbagliate un paio di volte
   sull'endpoint `/api/auth/login` o dalla pagina di login
4. Dal dashboard Upstash (tab **Data Browser** o **CLI**), verifica che sia
   comparsa una chiave `ratelimit:login:...` con un TTL impostato

Se non hai ancora configurato le variabili, il sito continua a funzionare
lo stesso (fallback in memoria) — non vedrai errori, semplicemente non
vedrai nessuna chiave comparire su Upstash.

### In produzione

Dopo il deploy, ripeti la stessa verifica dal dashboard Upstash: qualche
tentativo di login fallito da un IP reale dovrebbe far comparire la
relativa chiave `ratelimit:login:{ip}`.

---

## 7. Troubleshooting

- **Le chiavi non compaiono su Upstash, ma il sito funziona normalmente**:
  probabile che `UPSTASH_REDIS_REST_URL`/`_TOKEN` non siano impostate
  nell'ambiente che stai testando (locale vs. produzione vs. preview) —
  ricontrolla il punto 4. Il codice non genera errori in questo caso,
  ricade silenziosamente sul fallback in memoria.
- **Errore di connessione/401 da Upstash**: il token copiato non
  corrisponde all'URL (es. hai rigenerato il token dopo averlo copiato) —
  ricopia entrambi i valori insieme dalla stessa schermata REST API.
- **Vuoi tornare al solo fallback in memoria** (es. per test): basta
  rimuovere o svuotare le due variabili d'ambiente, nessun'altra modifica
  necessaria.

---

## Riferimenti

- Dettaglio implementativo: `src/lib/redis/client.ts`,
  `src/lib/auth/rate-limit.ts`, `src/lib/auth/session.ts`
- Contesto e decisioni progettuali: `PROJECT_CONTEXT.md` §6.4.3
- Documentazione Upstash REST API: <https://upstash.com/docs/redis/features/restapi>

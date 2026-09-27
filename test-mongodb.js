// Script manuale di verifica connessione: legge SOLO da variabili d'ambiente.
// Uso: MONGODB_URI="..." MONGODB_DB="..." node test-mongodb.js
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI non impostata: esporta la variabile prima di eseguire lo script.");
  process.exit(1);
}
const dbName = process.env.MONGODB_DB || 'chiesa_san_marco';


async function testConnection() {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    retryWrites: false,
  });

  try {
    await client.connect();

    // Test lettura DB
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    // Test ping
    const pingResult = await db.admin().ping();

  } catch (err) {
    console.error('❌ Errore di connessione:');
    console.error('Tipo:', err.name);
    console.error('Messaggio:', err.message);
    console.error('Codice:', err.code);
    if (err.reason) console.error('Reason:', err.reason);
  } finally {
    await client.close();
  }
}

testConnection();
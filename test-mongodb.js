// Script manuale di verifica connessione.
// Carica .env.local se presente; le variabili d'ambiente già esportate hanno
// comunque precedenza.
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI non impostata: configurala in .env.local o nelle variabili d'ambiente.");
  process.exit(1);
}
if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) {
  console.error("MONGODB_URI non valida: deve iniziare con mongodb:// o mongodb+srv://.");
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
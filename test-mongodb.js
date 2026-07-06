const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://admin:GabriWasef@cluster0.mv32tie.mongodb.net/?appName=Cluster0';
const dbName = process.env.MONGODB_DB || 'chiesa-san-marco';


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
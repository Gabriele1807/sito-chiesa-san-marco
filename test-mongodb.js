const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://admin:GabriWasef@cluster0.mv32tie.mongodb.net/?appName=Cluster0';
const dbName = process.env.MONGODB_DB || 'chiesa-san-marco';

console.log('🔍 Test Connessione MongoDB');
console.log('URI:', mongoUri.replace(/:[^:]*@/, ':***@')); // Maschere password
console.log('DB:', dbName);
console.log('');

async function testConnection() {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    retryWrites: false,
  });

  try {
    console.log('⏳ Connessione in corso...');
    await client.connect();
    console.log('✅ Connessione riuscita!');

    // Test lettura DB
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`✅ Collezioni trovate (${collections.length}):`);
    collections.forEach(c => console.log(`   - ${c.name}`));

    // Test ping
    const pingResult = await db.admin().ping();
    console.log('✅ Ping riuscito:', pingResult);

  } catch (err) {
    console.error('❌ Errore di connessione:');
    console.error('Tipo:', err.name);
    console.error('Messaggio:', err.message);
    console.error('Codice:', err.code);
    if (err.reason) console.error('Reason:', err.reason);
  } finally {
    await client.close();
    console.log('');
    console.log('Connessione chiusa.');
  }
}

testConnection();
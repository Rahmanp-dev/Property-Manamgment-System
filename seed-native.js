
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'lpm_rental';

async function main() {
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('User'); // Prisma uses "User" (or model name mapping)

    const email = 'admin@lpm.com';
    const password = await bcrypt.hash('password123', 10);

    // Check if user exists
    const existingUser = await collection.findOne({ email });

    if (existingUser) {
        console.log('User already exists');
    } else {
        const insertResult = await collection.insertOne({
            email,
            name: 'Admin User',
            password,
            role: 'SUPER_ADMIN',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('Inserted user:', insertResult);
    }

    return 'done.';
}

main()
    .then(console.log)
    .catch(console.error)
    .finally(() => client.close());

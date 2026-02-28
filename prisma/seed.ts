import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/lpm_rental"

async function main() {
    const client = new MongoClient(DATABASE_URL)
    await client.connect()
    const db = client.db("lpm_rental")

    // Hardcoded admin credentials
    const email = "admin@propmanager.com"
    const password = "admin123"
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if user already exists
    const existingUser = await db.collection("User").findOne({ email })

    if (existingUser) {
        console.log(`Admin user already exists: ${email}`)
    } else {
        await db.collection("User").insertOne({
            name: "Admin",
            email,
            password: hashedPassword,
            role: "SUPER_ADMIN",
            createdAt: new Date(),
            updatedAt: new Date()
        })
        console.log(`✅ Admin user created!`)
        console.log(`   Email:    ${email}`)
        console.log(`   Password: ${password}`)
    }

    await client.close()
}

main().catch(console.error)

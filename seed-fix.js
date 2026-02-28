
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    try {
        const email = 'admin@lpm.com'
        const password = await bcrypt.hash('password123', 10)

        const existingUser = await prisma.user.findFirst({
            where: { email }
        })

        if (existingUser) {
            console.log('Admin user already exists.')
        } else {
            // Using createMany as a workaround for P2031 on standalone mongo
            const result = await prisma.user.createMany({
                data: [{
                    email,
                    name: 'Admin User',
                    password,
                    role: 'SUPER_ADMIN',
                }],
            })
            console.log('Admin user created:', result)
        }
    } catch (e) {
        console.error(e)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

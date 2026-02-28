
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    try {
        const email = 'admin@lpm.com'
        const password = await bcrypt.hash('password123', 10)

        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            console.log('Admin user already exists.')
        } else {
            const user = await prisma.user.create({
                data: {
                    email,
                    name: 'Admin User',
                    password,
                    role: 'SUPER_ADMIN',
                },
            })
            console.log('Admin user created:', user)
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

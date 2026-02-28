import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    let url = process.env.DATABASE_URL
    if (url && !url.includes("lpm_rental")) {
        url = url.replace("mongodb.net/?", "mongodb.net/lpm_rental?")
    }

    return new PrismaClient({
        datasources: {
            db: { url }
        }
    })
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

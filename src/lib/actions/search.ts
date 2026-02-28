'use server'

import prisma from "@/lib/prisma"

export async function searchGlobal(query: string) {
    if (!query || query.length < 2) return { results: [] }

    try {
        const [tenants, buildings, flats] = await Promise.all([
            prisma.tenant.findMany({
                where: {
                    OR: [
                        { fullName: { contains: query, mode: 'insensitive' } },
                        { phone: { contains: query, mode: 'insensitive' } }
                    ],
                    isActive: true
                },
                include: { flat: { include: { building: true } } },
                take: 5
            }),
            prisma.building.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { address: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5
            }),
            prisma.flat.findMany({
                where: {
                    flatNumber: { contains: query, mode: 'insensitive' }
                },
                include: { building: true },
                take: 5
            })
        ])

        return {
            results: {
                tenants,
                buildings,
                flats
            }
        }
    } catch (error) {
        console.error("Search failed:", error)
        return { results: [] }
    }
}

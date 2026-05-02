'use server'

import prisma from "@/lib/prisma"

export async function getFlatDetails(id: string) {
    try {
        const flat = await prisma.flat.findUnique({
            where: { id },
            include: {
                building: true,
                Tenant: {
                    where: { isActive: true },
                    take: 1
                },
                payments: {
                    orderBy: { month: 'desc' },
                    take: 12 // Last year history
                }
            }
        })
        return { success: true, data: flat }
    } catch (error: any) {
        console.error("Failed to fetch flat details:", error)
        return { error: `Failed to fetch flat details: ${error.message || String(error)}` }
    }
}

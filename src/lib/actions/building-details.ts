'use server'

import prisma from "@/lib/prisma"

export async function getBuildingDetails(id: string) {
    try {
        const building = await prisma.building.findUnique({
            where: { id },
            include: {
                floors: {
                    include: {
                        flats: {
                            include: {
                                Tenant: {
                                    where: { isActive: true },
                                    take: 1
                                },
                                payments: {
                                    take: 1,
                                    orderBy: { createdAt: 'desc' }
                                }
                            },
                            orderBy: { flatNumber: 'asc' }
                        }
                    },
                    orderBy: { number: 'asc' }
                }
            }
        })
        return { success: true, data: building }
    } catch (error: any) {
        console.error("Failed to fetch building details:", error)
        return { error: `Failed to fetch building details: ${error.message || String(error)}` }
    }
}

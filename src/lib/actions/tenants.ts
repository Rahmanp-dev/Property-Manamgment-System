'use server'

import prisma from "@/lib/prisma"

export async function getTenants() {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                flat: {
                    include: {
                        building: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, data: tenants }
    } catch (error) {
        console.error("Failed to fetch tenants:", error)
        return { error: "Failed to fetch tenants" }
    }
}

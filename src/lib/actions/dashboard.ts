'use server'

import prisma from "@/lib/prisma"

export async function getDashboardStats() {
    try {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)

        // Parallel data fetching
        const [buildings, overduePayments, expiringLeases, totalTenants] = await Promise.all([
            // 1. Building Stats (Revenue)
            prisma.building.findMany({
                include: {
                    flats: {
                        include: {
                            payments: {
                                where: {
                                    month: { gte: startOfMonth }
                                }
                            }
                        }
                    }
                }
            }),
            // 2. Overdue Payments (Pending from previous months or current month unpaid)
            // Determining "Overdue" purely by Payment status logic is complex without a cron job
            // For now, let's look for Payments marked OVERDUE or PENDING with due date passed
            prisma.payment.findMany({
                where: {
                    status: { in: ['OVERDUE', 'PENDING'] }
                },
                include: {
                    tenant: true,
                    flat: { include: { building: true } }
                },
                take: 5
            }),
            // 3. Expiring Leases
            prisma.tenant.findMany({
                where: {
                    leaseEndDate: {
                        gte: today,
                        lte: thirtyDaysFromNow
                    },
                    isActive: true
                },
                include: {
                    flat: { include: { building: true } }
                },
                take: 5
            }),
            // 4. Total Tenants
            prisma.tenant.count({ where: { isActive: true } })
        ])

        // Calculate aggregated revenue
        let expectedRevenue = 0
        let collectedRevenue = 0

        buildings.forEach(b => {
            b.flats.forEach(f => {
                expectedRevenue += f.rentAmount + f.maintenanceAmount
                // Check if paid this month
                const payment = f.payments[0] // Since we filtered by month gte startOfMonth
                if (payment) {
                    collectedRevenue += payment.amountPaid
                }
            })
        })

        return {
            success: true,
            data: {
                revenue: {
                    expected: expectedRevenue,
                    collected: collectedRevenue,
                    outstanding: expectedRevenue - collectedRevenue
                },
                alerts: {
                    overdue: overduePayments,
                    expiring: expiringLeases
                },
                counts: {
                    tenants: totalTenants,
                    buildings: buildings.length
                }
            }
        }

    } catch (error: any) {
        console.error("Failed to fetch dashboard stats:", error)
        return { error: `Failed to fetch dashboard stats: ${error.message || String(error)}` }
    }
}

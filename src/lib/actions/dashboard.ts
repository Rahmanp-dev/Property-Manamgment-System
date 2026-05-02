'use server'

import prisma from "@/lib/prisma"

export async function getDashboardStats() {
    try {
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(today.getDate() + 30)

        // Parallel data fetching
        const [buildings, overduePayments, expiringLeases, totalTenants, currentMonthPayments] = await Promise.all([
            // 1. Building Stats
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
            // 2. Overdue/Pending Payments
            prisma.payment.findMany({
                where: {
                    status: { in: ['OVERDUE', 'PENDING', 'PARTIAL'] },
                    balance: { gt: 0 }
                },
                include: {
                    tenant: true,
                    flat: { include: { building: true } }
                },
                orderBy: { month: 'desc' },
                take: 10
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
            prisma.tenant.count({ where: { isActive: true } }),
            // 5. Current month payment aggregation
            prisma.payment.aggregate({
                where: { month: { gte: startOfMonth } },
                _sum: {
                    totalDue: true,
                    amountPaid: true,
                    balance: true,
                }
            })
        ])

        // Use actual payment data for revenue, not flat amounts
        const expectedRevenue = currentMonthPayments._sum.totalDue || 0
        const collectedRevenue = currentMonthPayments._sum.amountPaid || 0
        const outstandingRevenue = currentMonthPayments._sum.balance || 0

        return {
            success: true,
            data: {
                revenue: {
                    expected: expectedRevenue,
                    collected: collectedRevenue,
                    outstanding: outstandingRevenue
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

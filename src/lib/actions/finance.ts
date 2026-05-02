'use server'

import prisma from "@/lib/prisma"

export async function getFinanceStats() {
    try {
        const today = new Date()
        const startOfYear = new Date(today.getFullYear(), 0, 1)
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        // 1. Overall aggregation
        const paymentStats = await prisma.payment.aggregate({
            _sum: {
                totalDue: true,
                amountPaid: true,
                balance: true,
                rentDue: true,
                maintenanceDue: true,
                electricityDue: true,
            },
            _count: true
        })

        // 2. Current month stats
        const currentMonthStats = await prisma.payment.aggregate({
            where: {
                month: { gte: startOfMonth }
            },
            _sum: {
                totalDue: true,
                amountPaid: true,
                balance: true,
            },
            _count: true
        })

        // 3. Payment status breakdown
        const statusBreakdown = await prisma.payment.groupBy({
            by: ['status'],
            _count: true,
            where: {
                month: { gte: startOfMonth }
            }
        })

        // 4. Monthly chart data
        const yearlyPayments = await prisma.payment.findMany({
            where: {
                month: { gte: startOfYear }
            },
            select: {
                month: true,
                amountPaid: true,
                totalDue: true,
            }
        })

        const monthlyData = Array.from({ length: 12 }).map((_, i) => {
            const monthDate = new Date(today.getFullYear(), i, 1)
            const monthName = monthDate.toLocaleString('default', { month: 'short' })

            const monthPayments = yearlyPayments.filter(p => new Date(p.month).getMonth() === i)
            const collected = monthPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0)
            const expected = monthPayments.reduce((sum, p) => sum + (p.totalDue || 0), 0)

            return {
                name: monthName,
                collected,
                expected,
            }
        })

        // 5. Building-wise collection summary
        const buildingStats = await prisma.building.findMany({
            select: {
                id: true,
                name: true,
                flats: {
                    select: {
                        payments: {
                            where: { month: { gte: startOfMonth } },
                            select: {
                                totalDue: true,
                                amountPaid: true,
                                status: true,
                            }
                        }
                    }
                }
            }
        })

        const buildingBreakdown = buildingStats.map(b => {
            let totalDue = 0
            let totalCollected = 0
            let paidCount = 0
            let pendingCount = 0

            b.flats.forEach(f => {
                f.payments.forEach(p => {
                    totalDue += p.totalDue
                    totalCollected += p.amountPaid
                    if (p.status === 'PAID') paidCount++
                    else pendingCount++
                })
            })

            return {
                id: b.id,
                name: b.name,
                totalDue,
                totalCollected,
                paidCount,
                pendingCount,
                collectionRate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0
            }
        })

        // 6. Recent Transactions
        const recentTransactions = await prisma.payment.findMany({
            take: 10,
            orderBy: { updatedAt: 'desc' },
            where: {
                amountPaid: { gt: 0 }
            },
            include: {
                tenant: { select: { fullName: true } },
                flat: { select: { flatNumber: true, flatType: true, building: { select: { name: true } } } }
            }
        })

        const totalRevenue = paymentStats._sum.amountPaid || 0
        const totalOutstanding = paymentStats._sum.balance || 0
        const totalExpected = paymentStats._sum.totalDue || 0
        const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 0

        const currentExpected = currentMonthStats._sum.totalDue || 0
        const currentCollected = currentMonthStats._sum.amountPaid || 0
        const currentOutstanding = currentMonthStats._sum.balance || 0

        return {
            success: true,
            data: {
                totalRevenue,
                totalOutstanding,
                totalExpected,
                collectionRate,
                currentMonth: {
                    expected: currentExpected,
                    collected: currentCollected,
                    outstanding: currentOutstanding,
                    collectionRate: currentExpected > 0 ? Math.round((currentCollected / currentExpected) * 100) : 0,
                },
                statusBreakdown,
                chartData: monthlyData,
                buildingBreakdown,
                recentTransactions,
                breakdownTotals: {
                    rent: paymentStats._sum.rentDue || 0,
                    maintenance: paymentStats._sum.maintenanceDue || 0,
                    electricity: paymentStats._sum.electricityDue || 0,
                }
            }
        }

    } catch (error: any) {
        console.error("Failed to fetch finance stats:", error)
        return { error: `Failed to fetch finance stats: ${error.message || String(error)}` }
    }
}

'use server'

import prisma from "@/lib/prisma"

export async function getFinanceStats() {
    try {
        const today = new Date()
        const startOfYear = new Date(today.getFullYear(), 0, 1)

        // 1. Fetch all payments to calculate totals (Prisma Aggregate)
        const paymentStats = await prisma.payment.aggregate({
            _sum: {
                totalDue: true,
                amountPaid: true,
                balance: true
            }
        })

        // 2. Fetch monthly data for the chart (Group By Month)
        // Prisma groupBy is supported on MongoDB.
        // However, grouping by 'month' (DateTime) might return too many groups if dates are exact.
        // We need to fetch and process in JS for safety or use rawAggregate if needed.
        // Let's fetch payments for this year and aggregate in JS to be safe and simple.
        const yearlyPayments = await prisma.payment.findMany({
            where: {
                month: { gte: startOfYear }
            },
            select: {
                month: true,
                amountPaid: true
            }
        })

        // Process monthly data for chart
        const monthlyData = Array.from({ length: 12 }).map((_, i) => {
            const monthDate = new Date(today.getFullYear(), i, 1)
            const monthName = monthDate.toLocaleString('default', { month: 'short' })

            const totalForMonth = yearlyPayments
                .filter(p => new Date(p.month).getMonth() === i)
                .reduce((sum, p) => sum + (p.amountPaid || 0), 0)

            return {
                name: monthName,
                total: totalForMonth
            }
        })

        // 3. Recent Transactions
        const recentTransactions = await prisma.payment.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: {
                amountPaid: { gt: 0 } // Only show actual payments
            },
            include: {
                tenant: { select: { fullName: true } },
                flat: { select: { flatNumber: true, building: { select: { name: true } } } }
            }
        })

        return {
            success: true,
            data: {
                totalRevenue: paymentStats._sum.amountPaid || 0,
                outstanding: paymentStats._sum.balance || 0,
                chartData: monthlyData,
                recentTransactions
            }
        }

    } catch (error) {
        console.error("Failed to fetch finance stats:", error)
        return { error: "Failed to fetch finance stats" }
    }
}

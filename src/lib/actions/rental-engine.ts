'use server'

import prisma from "@/lib/prisma"
import clientPromise from "@/lib/mongo"
import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"

export async function generateMonthlyDues() {
    try {
        const client = await clientPromise
        const db = client.db("lpm_rental")

        const today = new Date()
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1) // First day of current month

        // 0-indexed month/year for meter readings
        const readingMonth = today.getMonth()
        const readingYear = today.getFullYear()
        // Determine previous reading period
        const prevMonthIndex = readingMonth === 0 ? 11 : readingMonth - 1
        const prevYearIndex = readingMonth === 0 ? readingYear - 1 : readingYear

        // 1. Get all active tenants with Flat AND Building details (for rate)
        const activeTenants = await prisma.tenant.findMany({
            where: {
                isActive: true,
                leaseStartDate: { lte: today },
                OR: [
                    { leaseEndDate: null },
                    { leaseEndDate: { gte: today } }
                ]
            },
            include: {
                flat: {
                    include: {
                        building: true
                    }
                }
            }
        })

        let generatedCount = 0

        // 2. For each tenant, check/generate payment
        for (const tenant of activeTenants) {
            if (!tenant.flat || !tenant.assignedFlatId) continue

            // Check if already generated
            const existingPayment = await db.collection("Payment").findOne({
                tenantId: new ObjectId(tenant.id),
                month: currentMonth
            })

            if (existingPayment) {
                continue
            }

            // 3. Get Arrears (Balance from LAST month's payment)
            // We need the absolute last payment record before this month
            const lastPaymentCursor = db.collection("Payment").find({
                tenantId: new ObjectId(tenant.id),
                month: { $lt: currentMonth }
            }).sort({ month: -1 }).limit(1)

            const lastPayment = await lastPaymentCursor.next()
            const arrears = lastPayment ? (lastPayment as any).balance : 0

            // 4. Calculate Electricity Bill
            let electricityDue = 0.0

            // Fetch current month's reading
            const currentReading = await db.collection("MeterReading").findOne({
                flatId: new ObjectId(tenant.assignedFlatId),
                month: readingMonth,
                year: readingYear
            })

            if (currentReading) {
                // Fetch previous month's reading
                const prevReading = await db.collection("MeterReading").findOne({
                    flatId: new ObjectId(tenant.assignedFlatId),
                    month: prevMonthIndex,
                    year: prevYearIndex
                })

                if (prevReading) {
                    const unitsConsumed = (currentReading as any).reading - (prevReading as any).reading
                    if (unitsConsumed > 0) {
                        const rate = tenant.flat.building.ratePerUnit || 10 // Default to 10 if not set
                        electricityDue = unitsConsumed * rate
                    }
                }
            }

            // 5. Calculate Total Dues
            const rentDue = tenant.flat.rentAmount
            const maintenanceDue = tenant.flat.maintenanceAmount
            const totalDue = rentDue + maintenanceDue + electricityDue + arrears

            // 6. Create Payment Record
            const now = new Date()
            await db.collection("Payment").insertOne({
                tenantId: new ObjectId(tenant.id),
                flatId: new ObjectId(tenant.assignedFlatId),
                month: currentMonth,
                rentDue,
                maintenanceDue,
                electricityDue,
                arrears,
                totalDue,
                balance: totalDue,
                status: 'PENDING',
                amountPaid: 0.0,
                createdAt: now,
                updatedAt: now
            })

            generatedCount++
        }

        revalidatePath('/')
        return { success: true, count: generatedCount }

    } catch (error) {
        console.error("Failed to generate monthly dues:", error)
        return { error: "Failed to generate monthly dues" }
    }
}

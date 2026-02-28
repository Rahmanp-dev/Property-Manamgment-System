'use server'

import clientPromise from "@/lib/mongo"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjectId } from "mongodb"

const logPaymentSchema = z.object({
    paymentId: z.string(),
    amount: z.coerce.number().min(1),
    method: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"]),
    notes: z.string().optional()
})

export type LogPaymentInput = z.infer<typeof logPaymentSchema>

export async function logPayment(data: LogPaymentInput) {
    const result = logPaymentSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { paymentId, amount, method, notes } = result.data

    try {
        // Use Prisma for read (works on standalone)
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        })

        if (!payment) return { error: "Payment record not found" }

        const newAmountPaid = payment.amountPaid + amount
        const newBalance = payment.totalDue - newAmountPaid

        let newStatus = payment.status
        if (newBalance <= 0) {
            newStatus = "PAID"
        } else if (newAmountPaid > 0) {
            newStatus = "PARTIAL"
        }

        // Use Native MongoDB for write (avoids transaction requirement)
        const client = await clientPromise
        const db = client.db("lpm_rental")

        const updateNotes = notes
            ? (payment.notes ? `${payment.notes}\n${notes}` : notes)
            : payment.notes

        await db.collection("Payment").updateOne(
            { _id: new ObjectId(paymentId) },
            {
                $set: {
                    amountPaid: newAmountPaid,
                    balance: newBalance,
                    status: newStatus,
                    paymentMethod: method,
                    paymentDate: new Date(),
                    notes: updateNotes,
                    updatedAt: new Date()
                }
            }
        )

        revalidatePath('/')

        // Trigger background update for future months (cascading arrears)
        // We don't await this to keep UI responsive, or we await if consistency is critical.
        // Given the user complaint, let's await it to ensure immediate consistency.
        await updateFutureBalances(payment.tenantId, payment.month, newBalance)

        return { success: true }
    } catch (error) {
        console.error("Failed to log payment:", error)
        return { error: "Failed to log payment" }
    }
}

async function updateFutureBalances(tenantId: string, currentPaymentMonth: Date, newBalanceFromCurrent: number) {
    try {
        const client = await clientPromise
        const db = client.db("lpm_rental")

        // Find all future payments sorted by month
        const futurePayments = await db.collection("Payment").find({
            tenantId: new ObjectId(tenantId),
            month: { $gt: currentPaymentMonth }
        }).sort({ month: 1 }).toArray()

        let carriedBalance = newBalanceFromCurrent

        for (const payment of futurePayments) {
            const newArrears = carriedBalance
            const newTotalDue = (payment.rentDue || 0) + (payment.maintenanceDue || 0) + (payment.electricityDue || 0) + newArrears
            const newBalance = newTotalDue - (payment.amountPaid || 0)

            let newStatus = payment.status
            if (newBalance <= 0) {
                newStatus = "PAID"
            } else if ((payment.amountPaid || 0) > 0) {
                newStatus = "PARTIAL"
            } else {
                newStatus = "PENDING"
            }

            await db.collection("Payment").updateOne(
                { _id: payment._id },
                {
                    $set: {
                        arrears: newArrears,
                        totalDue: newTotalDue,
                        balance: newBalance,
                        status: newStatus,
                        updatedAt: new Date()
                    }
                }
            )

            carriedBalance = newBalance
        }
    } catch (error) {
        console.error("Failed to cascade balance updates:", error)
    }
}


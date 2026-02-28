'use server'

import clientPromise from "@/lib/mongo"
import { onboardTenantSchema, OnboardTenantInput } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function onboardTenant(data: OnboardTenantInput) {
    const result = onboardTenantSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { flatId, fullName, phone, aadhaarNumber, occupantsCount, leaseStartDate, leaseEndDate, rentAmount, depositAmount, initialMeterReading } = result.data

    try {
        const client = await clientPromise
        const db = client.db("lpm_rental")

        // 0. Record Initial Meter Reading if provided
        if (initialMeterReading !== undefined && initialMeterReading !== null) {
            const readingDate = new Date(leaseStartDate)
            // Determine month/year of lease start
            const rMonth = readingDate.getMonth()
            const rYear = readingDate.getFullYear()

            // We record it as the reading for the month of move-in (or maybe previous month?)
            // If move in is Jan 15, and we generate bill for Feb 1 (covering Jan), we need a Jan reading?
            // Usually, "Previous Reading" is the reading at start of period.
            // Let's store it with exact date, but indexed by month/year of the *start* date.

            await db.collection("MeterReading").updateOne(
                {
                    flatId: new (require('mongodb').ObjectId)(flatId),
                    month: rMonth,
                    year: rYear
                },
                {
                    $set: {
                        reading: initialMeterReading,
                        readingDate: readingDate,
                        updatedAt: new Date()
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            )
        }

        // 1. Native Insert Tenant
        const now = new Date()
        const tenantDoc = {
            fullName,
            phone,
            aadhaarNumber,
            occupantsCount,
            leaseStartDate,
            leaseEndDate,
            assignedFlatId: new (require('mongodb').ObjectId)(flatId), // Cast to ObjectId
            isActive: true,
            createdAt: now,
            updatedAt: now
        }

        await db.collection("Tenant").insertOne(tenantDoc)

        // 2. Native Update Flat
        await db.collection("Flat").updateOne(
            { _id: new (require('mongodb').ObjectId)(flatId) },
            {
                $set: {
                    status: "OCCUPIED",
                    rentAmount,
                    depositAmount,
                    updatedAt: now
                }
            }
        )

        revalidatePath(`/flats/${flatId}`)
        revalidatePath('/') // Updates dashboard stats
        return { success: true }
    } catch (error) {
        console.error("Failed to onboard tenant:", error)
        return { error: "Failed to onboard tenant" }
    }
}

export async function offboardTenant(flatId: string) {
    try {
        const client = await clientPromise
        const db = client.db("lpm_rental")
        const fId = new (require('mongodb').ObjectId)(flatId)

        // 1. Find the active tenant for this flat
        const tenant = await db.collection("Tenant").findOne({
            assignedFlatId: fId,
            isActive: true
        })

        if (!tenant) {
            return { error: "No active tenant found for this flat" }
        }

        const now = new Date()

        // 2. Update Tenant: Deactivate and set end date
        await db.collection("Tenant").updateOne(
            { _id: tenant._id },
            {
                $set: {
                    isActive: false,
                    leaseEndDate: now,
                    updatedAt: now
                }
            }
        )

        // 3. Update Flat: Mark as Vacant
        await db.collection("Flat").updateOne(
            { _id: fId },
            {
                $set: {
                    status: "VACANT",
                    updatedAt: now
                }
            }
        )

        revalidatePath(`/flats/${flatId}`)
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error("Failed to offboard tenant:", error)
        return { error: "Failed to offboard tenant" }
    }
}

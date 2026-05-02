'use server'

import clientPromise from "@/lib/mongo"
import { onboardTenantSchema, OnboardTenantInput } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"

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
            const rMonth = readingDate.getMonth()
            const rYear = readingDate.getFullYear()

            await db.collection("MeterReading").updateOne(
                {
                    flatId: new ObjectId(flatId),
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

        // 1. Get the flat to find its building
        const flat = await db.collection("Flat").findOne({ _id: new ObjectId(flatId) })

        // 2. Native Insert Tenant
        const now = new Date()
        const tenantDoc = {
            fullName,
            phone,
            aadhaarNumber,
            occupantsCount,
            leaseStartDate,
            leaseEndDate,
            assignedFlatId: new ObjectId(flatId),
            isActive: true,
            createdAt: now,
            updatedAt: now
        }

        await db.collection("Tenant").insertOne(tenantDoc)

        // 3. Native Update Flat
        await db.collection("Flat").updateOne(
            { _id: new ObjectId(flatId) },
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
        if (flat) revalidatePath(`/buildings/${flat.buildingId.toString()}`)
        revalidatePath('/dashboard')
        revalidatePath('/tenants')
        revalidatePath('/finance')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error("Failed to onboard tenant:", error)
        return { error: `Failed to onboard tenant: ${error.message || String(error)}` }
    }
}

export async function offboardTenant(flatId: string) {
    try {
        const client = await clientPromise
        const db = client.db("lpm_rental")
        const fId = new ObjectId(flatId)

        const tenant = await db.collection("Tenant").findOne({
            assignedFlatId: fId,
            isActive: true
        })

        if (!tenant) {
            return { error: "No active tenant found for this flat" }
        }

        const flat = await db.collection("Flat").findOne({ _id: fId })
        const now = new Date()

        // Deactivate tenant
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

        // Mark flat as Vacant
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
        if (flat) revalidatePath(`/buildings/${flat.buildingId.toString()}`)
        revalidatePath('/dashboard')
        revalidatePath('/tenants')
        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error("Failed to offboard tenant:", error)
        return { error: `Failed to offboard tenant: ${error.message || String(error)}` }
    }
}

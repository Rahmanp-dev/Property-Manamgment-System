'use server'

import clientPromise from "@/lib/mongo"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjectId } from "mongodb"

const createFlatSchema = z.object({
    buildingId: z.string(),
    floorId: z.string(),
    flatNumber: z.string().min(1),
    rentAmount: z.coerce.number().min(0),
    maintenanceAmount: z.coerce.number().min(0),
    depositAmount: z.coerce.number().min(0).optional()
})

export type CreateFlatInput = z.infer<typeof createFlatSchema>

export async function createFlat(data: CreateFlatInput) {
    const result = createFlatSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { buildingId, floorId, flatNumber, rentAmount, maintenanceAmount, depositAmount } = result.data

    try {
        const client = await clientPromise
        const db = client.db("lpm_rental")

        const now = new Date()
        const flatDoc = {
            buildingId: new ObjectId(buildingId),
            floorId: new ObjectId(floorId),
            flatNumber,
            rentAmount,
            maintenanceAmount,
            depositAmount: depositAmount || rentAmount * 2,
            status: "VACANT",
            createdAt: now,
            updatedAt: now
        }

        await db.collection("Flat").insertOne(flatDoc)

        // Update Building totalFlats count
        await db.collection("Building").updateOne(
            { _id: new ObjectId(buildingId) },
            { $inc: { totalFlats: 1 }, $set: { updatedAt: now } }
        )

        // Update Floor flatsCount
        await db.collection("Floor").updateOne(
            { _id: new ObjectId(floorId) },
            { $inc: { flatsCount: 1 } }
        )

        revalidatePath(`/buildings/${buildingId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to create flat:", error)
        return { error: "Failed to create flat" }
    }
}

'use server'

import clientPromise from "@/lib/mongo"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ObjectId } from "mongodb"

const updateBuildingSchema = z.object({
    buildingId: z.string(),
    ratePerUnit: z.coerce.number().min(0),
    totalFloors: z.coerce.number().min(1).optional()
})

export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>

export async function updateBuildingSettings(data: UpdateBuildingInput) {
    const result = updateBuildingSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { buildingId, ratePerUnit, totalFloors } = result.data

    try {
        const client = await clientPromise
        const db = client.db("lpm_rental")
        const bId = new ObjectId(buildingId)

        const building = await db.collection("Building").findOne({ _id: bId })
        if (!building) return { error: "Building not found" }

        const currentFloors = building.totalFloors || 0

        // Handle Floor Updates if provided
        if (totalFloors !== undefined && totalFloors !== currentFloors) {
            if (totalFloors > currentFloors) {
                // Add Floors
                const newFloorsData = Array.from({ length: totalFloors - currentFloors }).map((_, i) => ({
                    buildingId: bId,
                    number: currentFloors + i,
                    flatsCount: 0
                }))

                if (newFloorsData.length > 0) {
                    await db.collection("Floor").insertMany(newFloorsData)
                }
            } else {
                // Reduce Floors - Safety Check
                // Find floors that would be deleted
                const floorsToDelete = await db.collection("Floor").find({
                    buildingId: bId,
                    number: { $gte: totalFloors }
                }).toArray()

                // Check for flats
                for (const floor of floorsToDelete) {
                    const flatCount = await db.collection("Flat").countDocuments({ floorId: floor._id })
                    if (flatCount > 0) {
                        return { error: `Cannot delete Floor ${floor.number} because it has flats. Is deleting last.` }
                    }
                }

                // Safe to delete
                await db.collection("Floor").deleteMany({
                    buildingId: bId,
                    number: { $gte: totalFloors }
                })
            }
        }

        await db.collection("Building").updateOne(
            { _id: bId },
            {
                $set: {
                    ratePerUnit: ratePerUnit,
                    totalFloors: totalFloors ?? currentFloors,
                    updatedAt: new Date()
                }
            }
        )

        revalidatePath(`/buildings/${buildingId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update building:", error)
        return { error: `Failed to update building: ${error instanceof Error ? error.message : "Unknown error"}` }
    }
}

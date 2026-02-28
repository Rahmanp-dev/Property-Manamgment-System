'use server'

import prisma from "@/lib/prisma"
import clientPromise from "@/lib/mongo"
import { createBuildingSchema, CreateBuildingInput } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function createBuilding(data: CreateBuildingInput) {
    const result = createBuildingSchema.safeParse(data)

    if (!result.success) {
        return { error: "Invalid input" }
    }

    const { name, address, totalFloors } = result.data

    try {
        const client = await clientPromise
        const db = client.db("lpm_rental")

        // 1. Native insert for Building
        const now = new Date()
        const buildingDoc = {
            name,
            address,
            totalFloors,
            totalFlats: 0,
            occupancyRate: 0.0,
            createdAt: now,
            updatedAt: now
        }

        const insertResult = await db.collection("Building").insertOne(buildingDoc)
        const buildingId = insertResult.insertedId.toString()

        // 2. Native insertMany for Floors
        const floorsData = Array.from({ length: totalFloors }).map((_, i) => ({
            buildingId: insertResult.insertedId, // exact objectId
            number: i,
            flatsCount: 0,
        }))

        if (floorsData.length > 0) {
            await db.collection("Floor").insertMany(floorsData)
        }

        revalidatePath('/')
        return { success: true, data: { ...buildingDoc, id: buildingId } }
    } catch (error) {
        console.error("Failed to create building:", error)
        return { error: "Failed to create building" }
    }
}

export async function getBuildings() {
    try {
        const buildings = await prisma.building.findMany({
            include: {
                floors: true,
                flats: true // Need stats
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        return { success: true, data: buildings }
    } catch (error: any) {
        console.error("Failed to fetch buildings:", error)
        return { error: `Failed to fetch buildings: ${error.message || String(error)}` }
    }
}
